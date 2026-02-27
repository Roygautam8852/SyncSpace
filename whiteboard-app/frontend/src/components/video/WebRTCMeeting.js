import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff, Minimize2, Maximize2, GripHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * WebRTCMeeting — Zoom-like group call via P2P mesh.
 *
 * Key guarantees:
 * - NEVER creates a peer connection to self (filters own socketId)
 * - Only one mesh:join emission per mount (joinedRef guard)
 * - ICE candidates are queued until remoteDescription is set
 * - Local <video> always has `muted` to prevent echo
 * - Mute uses track.enabled (not track.stop) so unmute works
 * - Only one RTCPeerConnection per remote socketId
 * - Broadcasts mic/cam state to all peers via socket so remote tiles
 *   can show avatar (cam off) and mute icon (mic off)
 */
const WebRTCMeeting = ({ socket, roomId, username, onLeave }) => {
    const [localStream, setLocalStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isCamEnabled, setIsCamEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Track remote peer media states:  { [socketId]: { mic: bool, cam: bool } }
    const [remotePeerStates, setRemotePeerStates] = useState({});

    const localVideoRef = useRef(null);
    const streamRef = useRef(null);
    const screenRef = useRef(null);
    const peersRef = useRef({});
    const componentMounted = useRef(true);
    const joinedRef = useRef(false);  // Prevent duplicate mesh:join
    const onLeaveRef = useRef(onLeave);
    useEffect(() => { onLeaveRef.current = onLeave; }, [onLeave]);

    // Drag
    const containerRef = useRef(null);
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: 16, y: 70 });

    const rtcConfig = useRef({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    }).current;

    // ── Flush queued ICE candidates ───────────────────────────────────────────
    const flushCandidates = useCallback(async (socketId) => {
        const peer = peersRef.current[socketId];
        if (!peer?.pc || !peer.pc.remoteDescription?.type) return;
        while (peer.candidateQueue?.length > 0) {
            const c = peer.candidateQueue.shift();
            try { await peer.pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) { }
        }
    }, []);

    // ── Push ref state → React state ──────────────────────────────────────────
    const syncPeersState = useCallback(() => {
        const snap = {};
        Object.entries(peersRef.current).forEach(([id, p]) => {
            snap[id] = { stream: p.stream, username: p.username };
        });
        setPeers(snap);
    }, []);

    // ── Remove a peer cleanly ─────────────────────────────────────────────────
    const removePeer = useCallback((socketId) => {
        const peer = peersRef.current[socketId];
        if (peer) {
            try { peer.pc?.close(); } catch (_) { }
            delete peersRef.current[socketId];
            syncPeersState();
            // Also remove their media state
            setRemotePeerStates(prev => {
                const n = { ...prev };
                delete n[socketId];
                return n;
            });
        }
    }, [syncPeersState]);

    // ── Create ONE PeerConnection per remote socketId ─────────────────────────
    const createPeer = useCallback((targetSocketId, targetUsername, stream, isInitiator) => {
        // NEVER connect to self
        if (targetSocketId === socket?.id) return null;

        // If we already have a live PC for this peer, return it
        const existing = peersRef.current[targetSocketId];
        if (existing?.pc) {
            const state = existing.pc.connectionState || existing.pc.iceConnectionState;
            if (state !== 'closed' && state !== 'failed') {
                return existing.pc;
            }
            // Dead connection — clean up
            try { existing.pc.close(); } catch (_) { }
        }

        const pc = new RTCPeerConnection(rtcConfig);

        // Add every local track
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Store immediately with candidate queue
        peersRef.current[targetSocketId] = {
            pc,
            stream: null,
            username: targetUsername,
            candidateQueue: [],
        };

        // ── Remote tracks ──
        pc.ontrack = (event) => {
            const rStream = event.streams?.[0];
            if (!rStream) return;
            const entry = peersRef.current[targetSocketId];
            if (entry) entry.stream = rStream;
            syncPeersState();
        };

        // ── ICE candidates → remote ──
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('mesh:candidate', {
                    roomId,
                    to: targetSocketId,
                    candidate: event.candidate,
                });
            }
        };

        // ── Connection state changes ──
        pc.oniceconnectionstatechange = () => {
            const s = pc.iceConnectionState;
            if (s === 'connected' || s === 'completed') syncPeersState();
            if (s === 'failed') removePeer(targetSocketId);
        };

        syncPeersState();

        // Initiator sends offer
        if (isInitiator) {
            (async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('mesh:offer', {
                        roomId,
                        to: targetSocketId,
                        offer: pc.localDescription,
                    });
                } catch (err) {
                    console.error('[Mesh] Offer error:', err);
                }
            })();
        }

        return pc;
    }, [socket, roomId, rtcConfig, removePeer, syncPeersState]);

    // ══════════════════════════════════════════════════════════════════════════
    //  1. Get media → join call (runs ONCE per mount)
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        componentMounted.current = true;
        joinedRef.current = false;

        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: { echoCancellation: true, noiseSuppression: true },
                });
                if (!componentMounted.current) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = stream;
                setLocalStream(stream);

                // Attach to <video> — always muted to prevent echo
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.muted = true;
                }

                // Emit mesh:join exactly once
                if (!joinedRef.current) {
                    joinedRef.current = true;
                    socket.emit('mesh:join', { roomId, username });
                }
            } catch (err) {
                console.error('[WebRTC] Media error:', err);
                toast.error('Could not access camera or microphone.');
            }
        };

        start();

        return () => {
            componentMounted.current = false;
            joinedRef.current = false;

            // Close every peer connection
            Object.keys(peersRef.current).forEach(id => {
                try { peersRef.current[id]?.pc?.close(); } catch (_) { }
            });
            peersRef.current = {};

            // Stop local tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (screenRef.current) {
                screenRef.current.getTracks().forEach(t => t.stop());
                screenRef.current = null;
            }
        };
        // eslint-disable-next-line
    }, []);  // Empty deps — run once on mount, clean up on unmount

    // ── Re-attach local video srcObject when un-minimizing ────────────────────
    useEffect(() => {
        if (!isMinimized && localVideoRef.current) {
            const activeStream = screenRef.current || streamRef.current;
            if (activeStream) {
                localVideoRef.current.srcObject = activeStream;
                localVideoRef.current.muted = true;
                localVideoRef.current.play().catch(() => { });
            }
        }
    }, [isMinimized]);

    // ══════════════════════════════════════════════════════════════════════════
    //  2. Socket signaling (mesh topology)
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!socket) return;
        const myId = socket.id;

        // Server sends existing call participants
        const onExistingPeers = ({ peers: existingPeers }) => {
            if (!streamRef.current) return;
            existingPeers.forEach(p => {
                // Never connect to self
                if (p.socketId === myId) return;
                createPeer(p.socketId, p.username, streamRef.current, true);
            });

            // Send our current media state to all existing peers
            socket.emit('mesh:media-state', { roomId, mic: true, cam: true });
        };

        // A new peer joined — pre-create PC (they will send us an offer)
        const onNewPeer = ({ socketId, username: peerName }) => {
            if (!streamRef.current || socketId === myId) return;
            createPeer(socketId, peerName, streamRef.current, false);

            // Send our current media state to the new peer
            const audioTrack = streamRef.current?.getAudioTracks()[0];
            const videoTrack = streamRef.current?.getVideoTracks()[0];
            socket.emit('mesh:media-state', {
                roomId,
                mic: audioTrack?.enabled ?? true,
                cam: videoTrack?.enabled ?? true
            });
        };

        // Receive offer
        const onOffer = async ({ from, offer, username: peerName }) => {
            if (!streamRef.current || from === myId) return;

            let peer = peersRef.current[from];
            let pc;

            if (!peer?.pc || peer.pc.signalingState === 'closed') {
                pc = createPeer(from, peerName, streamRef.current, false);
            } else {
                pc = peer.pc;
                if (peerName) peersRef.current[from].username = peerName;
            }
            if (!pc) return;

            try {
                // Glare: both sides sent offers — higher ID yields
                if (pc.signalingState === 'have-local-offer') {
                    if (myId > from) {
                        await pc.setLocalDescription({ type: 'rollback' });
                    } else {
                        return;
                    }
                }

                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                await flushCandidates(from);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('mesh:answer', { roomId, to: from, answer: pc.localDescription });
            } catch (e) {
                console.error('[Mesh] Offer handling error:', e);
            }
        };

        // Receive answer
        const onAnswer = async ({ from, answer }) => {
            const peer = peersRef.current[from];
            if (!peer?.pc || peer.pc.signalingState !== 'have-local-offer') return;
            try {
                await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
                await flushCandidates(from);
            } catch (e) {
                console.error('[Mesh] Answer error:', e);
            }
        };

        // Receive ICE candidate — queue if remote description not ready
        const onCandidate = async ({ from, candidate }) => {
            const peer = peersRef.current[from];
            if (!peer?.pc) return;

            if (peer.pc.remoteDescription?.type) {
                try { await peer.pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) { }
            } else {
                peer.candidateQueue = peer.candidateQueue || [];
                peer.candidateQueue.push(candidate);
            }
        };

        // A peer left
        const onPeerLeft = ({ socketId }) => removePeer(socketId);

        // Call creator ended the call — everyone must leave
        const onCallEnded = () => {
            console.log('[Mesh] Call ended by creator — cleaning up');
            // Close all peer connections
            Object.keys(peersRef.current).forEach(id => {
                try { peersRef.current[id]?.pc?.close(); } catch (_) { }
            });
            peersRef.current = {};
            // Stop local media tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (screenRef.current) {
                screenRef.current.getTracks().forEach(t => t.stop());
                screenRef.current = null;
            }
            toast('📞 Call ended by the host', { icon: '📞' });
            onLeaveRef.current();
        };

        // Remote peer toggled mic/cam — update UI state
        const onMediaState = ({ from, mic, cam }) => {
            setRemotePeerStates(prev => ({
                ...prev,
                [from]: { mic, cam }
            }));
        };

        socket.on('mesh:existing-peers', onExistingPeers);
        socket.on('mesh:new-peer', onNewPeer);
        socket.on('mesh:offer', onOffer);
        socket.on('mesh:answer', onAnswer);
        socket.on('mesh:candidate', onCandidate);
        socket.on('mesh:peer-left', onPeerLeft);
        socket.on('mesh:call-ended', onCallEnded);
        socket.on('mesh:media-state', onMediaState);

        return () => {
            socket.off('mesh:existing-peers', onExistingPeers);
            socket.off('mesh:new-peer', onNewPeer);
            socket.off('mesh:offer', onOffer);
            socket.off('mesh:answer', onAnswer);
            socket.off('mesh:candidate', onCandidate);
            socket.off('mesh:peer-left', onPeerLeft);
            socket.off('mesh:call-ended', onCallEnded);
            socket.off('mesh:media-state', onMediaState);
        };
    }, [socket, roomId, createPeer, removePeer, flushCandidates]);

    // ══════════════════════════════════════════════════════════════════════════
    //  Controls
    // ══════════════════════════════════════════════════════════════════════════
    const toggleMic = () => {
        const audioTrack = streamRef.current?.getAudioTracks()[0];
        if (!audioTrack) return;
        const newEnabled = !audioTrack.enabled;

        // 1. Toggle on the local stream track
        audioTrack.enabled = newEnabled;

        // 2. Also propagate to every peer connection's audio sender
        Object.values(peersRef.current).forEach(({ pc }) => {
            if (!pc) return;
            const senders = pc.getSenders?.() || [];
            senders.forEach(sender => {
                if (sender.track && sender.track.kind === 'audio') {
                    sender.track.enabled = newEnabled;
                }
            });
        });

        setIsMicEnabled(newEnabled);

        // 3. Broadcast state to all peers via socket
        const videoTrack = streamRef.current?.getVideoTracks()[0];
        socket.emit('mesh:media-state', {
            roomId,
            mic: newEnabled,
            cam: videoTrack?.enabled ?? isCamEnabled
        });
    };

    const toggleCam = () => {
        const videoTrack = streamRef.current?.getVideoTracks()[0];
        if (!videoTrack) return;
        const newEnabled = !videoTrack.enabled;
        videoTrack.enabled = newEnabled;

        // Also propagate to every peer connection's video sender
        Object.values(peersRef.current).forEach(({ pc }) => {
            if (!pc) return;
            const senders = pc.getSenders?.() || [];
            senders.forEach(sender => {
                if (sender.track && sender.track.kind === 'video') {
                    sender.track.enabled = newEnabled;
                }
            });
        });

        setIsCamEnabled(newEnabled);

        // Broadcast state to all peers via socket
        const audioTrack = streamRef.current?.getAudioTracks()[0];
        socket.emit('mesh:media-state', {
            roomId,
            mic: audioTrack?.enabled ?? isMicEnabled,
            cam: newEnabled
        });
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenRef.current) { screenRef.current.getTracks().forEach(t => t.stop()); screenRef.current = null; }
            const camTrack = streamRef.current?.getVideoTracks()[0];
            Object.values(peersRef.current).forEach(({ pc }) => {
                const sender = pc?.getSenders?.()?.find(s => s.track?.kind === 'video');
                if (sender && camTrack) sender.replaceTrack(camTrack);
            });
            if (localVideoRef.current && streamRef.current) localVideoRef.current.srcObject = streamRef.current;
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];
                Object.values(peersRef.current).forEach(({ pc }) => {
                    const sender = pc?.getSenders?.()?.find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });
                if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
                screenTrack.onended = () => toggleScreenShare();
                setIsScreenSharing(true);
            } catch (_) { }
        }
    };

    const handleLeave = () => {
        socket.emit('mesh:leave', { roomId });
        Object.keys(peersRef.current).forEach(id => {
            try { peersRef.current[id]?.pc?.close(); } catch (_) { }
        });
        peersRef.current = {};
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (screenRef.current) { screenRef.current.getTracks().forEach(t => t.stop()); screenRef.current = null; }
        onLeaveRef.current();
    };

    // ── Drag ──────────────────────────────────────────────────────────────────
    const onDragStart = (e) => {
        isDragging.current = true;
        const rect = containerRef.current.getBoundingClientRect();
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const move = (ev) => {
            if (!isDragging.current) return;
            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 120, ev.clientX - dragOffset.current.x)),
                y: Math.max(0, Math.min(window.innerHeight - 80, ev.clientY - dragOffset.current.y)),
            });
        };
        const up = () => {
            isDragging.current = false;
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    // ── Only render remote peers that are alive ───────────────────────────────
    const peerEntries = Object.entries(peers).filter(
        ([id]) => id !== socket?.id  // Extra safety: never render self as remote
    );
    const participantCount = 1 + peerEntries.length;

    // ── Minimized ─────────────────────────────────────────────────────────────
    if (isMinimized) {
        return (
            <div ref={containerRef} className="wbrtc-floating wbrtc-minimized" style={{ left: position.x, top: position.y }}>
                <div className="wbrtc-mini-bar" onMouseDown={onDragStart}>
                    <GripHorizontal size={14} className="wbrtc-grip" />
                    <div className="wbrtc-mini-info">
                        <span className="wbrtc-mini-dot" />
                        <span>{participantCount} in call</span>
                    </div>
                    <button className="wbrtc-mini-btn" onClick={() => setIsMinimized(false)} title="Expand"><Maximize2 size={13} /></button>
                    <button className="wbrtc-mini-btn wbrtc-mini-leave" onClick={handleLeave} title="Leave"><PhoneOff size={13} /></button>
                </div>
            </div>
        );
    }

    // ── Full floating window ──────────────────────────────────────────────────
    return (
        <div ref={containerRef} className="wbrtc-floating" style={{ left: position.x, top: position.y }}>
            {/* Drag handle */}
            <div className="wbrtc-drag-bar" onMouseDown={onDragStart}>
                <GripHorizontal size={14} className="wbrtc-grip" />
                <span className="wbrtc-drag-title">{participantCount} in call</span>
                <div className="wbrtc-drag-actions">
                    <button className="wbrtc-mini-btn" onClick={() => setIsMinimized(true)} title="Minimize"><Minimize2 size={13} /></button>
                </div>
            </div>

            {/* Video grid */}
            <div className="wbrtc-grid">
                {/* ── LOCAL tile (always first, always muted) ── */}
                <div className="wbrtc-tile">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted          /* ← ALWAYS muted to prevent echo */
                        playsInline
                        className="wbrtc-tile-video wbrtc-tile-mirror"
                        style={{ display: (!isCamEnabled && !isScreenSharing) ? 'none' : 'block' }}
                    />
                    {!isCamEnabled && !isScreenSharing && (
                        <div className="wbrtc-tile-avatar">{username?.[0]?.toUpperCase()}</div>
                    )}
                    <div className="wbrtc-tile-name">
                        {username} (You)
                        {!isMicEnabled && <MicOff size={10} className="wbrtc-tile-muted" />}
                    </div>
                </div>

                {/* ── REMOTE tiles (one per unique socketId, self excluded) ── */}
                {peerEntries.map(([socketId, peer]) => {
                    const remoteState = remotePeerStates[socketId];
                    const remoteCamOff = remoteState ? !remoteState.cam : false;
                    const remoteMicOff = remoteState ? !remoteState.mic : false;

                    return (
                        <div className="wbrtc-tile" key={socketId}>
                            {peer.stream && !remoteCamOff ? (
                                <RemoteVideo stream={peer.stream} />
                            ) : (
                                <div className="wbrtc-tile-avatar">
                                    {(peer.username || '?')[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="wbrtc-tile-name">
                                {peer.username || 'Participant'}
                                {remoteMicOff && <MicOff size={10} className="wbrtc-tile-muted" />}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="wbrtc-controls">
                <button onClick={toggleMic} className={`wbrtc-btn ${!isMicEnabled ? 'wbrtc-btn--danger' : ''}`} title={isMicEnabled ? 'Mute' : 'Unmute'}>
                    {isMicEnabled ? <Mic size={15} /> : <MicOff size={15} />}
                </button>
                <button onClick={toggleCam} className={`wbrtc-btn ${!isCamEnabled ? 'wbrtc-btn--danger' : ''}`} title={isCamEnabled ? 'Stop Video' : 'Start Video'}>
                    {isCamEnabled ? <Video size={15} /> : <VideoOff size={15} />}
                </button>
                <button onClick={toggleScreenShare} className={`wbrtc-btn ${isScreenSharing ? 'wbrtc-btn--active' : ''}`} title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
                    {isScreenSharing ? <MonitorOff size={15} /> : <Monitor size={15} />}
                </button>
                <div className="wbrtc-divider" />
                <button onClick={handleLeave} className="wbrtc-btn wbrtc-btn--leave" title="Leave call">
                    <PhoneOff size={15} />
                </button>
            </div>
        </div>
    );
};

// ── Remote video renderer (memoized, never muted) ─────────────────────────────
const RemoteVideo = React.memo(({ stream }) => {
    const ref = useRef(null);

    useEffect(() => {
        const vid = ref.current;
        if (!vid || !stream) return;

        vid.srcObject = stream;
        vid.muted = false;  // Remote audio MUST be audible

        const tryPlay = () => vid.play().catch(() => { });

        if (stream.active) tryPlay();
        stream.addEventListener('addtrack', tryPlay);
        return () => stream.removeEventListener('addtrack', tryPlay);
    }, [stream]);

    return <video ref={ref} autoPlay playsInline className="wbrtc-tile-video" />;
});

export default WebRTCMeeting;
