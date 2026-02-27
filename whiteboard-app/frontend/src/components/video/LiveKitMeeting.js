import React, { useEffect, useState, useRef } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import MeetingConference from './MeetingConference';
import toast from 'react-hot-toast';
import api from "../../services/api";

const LiveKitMeeting = ({ roomId, username, onLeave }) => {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Use a ref to store the latest onLeave to avoid re-triggering effects
    const onLeaveRef = useRef(onLeave);
    useEffect(() => {
        onLeaveRef.current = onLeave;
    }, [onLeave]);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                // Use the configured api instance which handles baseURL and tokens correctly
                const response = await api.get('/livekit/token', {
                    params: { room: roomId, username }
                });
                setToken(response.data.token);
            } catch (error) {
                console.error('Failed to get LiveKit token:', error);
                toast.error('Could not join video call');
                onLeaveRef.current();
            } finally {
                setLoading(false);
            }
        };

        fetchToken();
    }, [roomId, username]);

    if (loading) return (
        <div className="wb-meeting-loading">
            <div className="spinner"></div>
            <span>Connecting to SFU...</span>
        </div>
    );

    if (!token) return null;

    return (
        <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={process.env.REACT_APP_LIVEKIT_URL || 'ws://localhost:7800'}
            connectOptions={{ autoSubscribe: true }}
            onDisconnected={onLeave}
            data-lk-theme="default"
            style={{ height: '100vh' }}
        >
            <MeetingConference onLeave={onLeave} />
        </LiveKitRoom>
    );
};

export default LiveKitMeeting;
