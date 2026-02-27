import React from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';

const VideoControls = ({ onLeave }) => {
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();

    const toggleMic = () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    const toggleCamera = () => localParticipant.setCameraEnabled(!isCameraEnabled);
    const toggleScreen = () => localParticipant.setScreenShareEnabled(!isScreenShareEnabled);

    return (
        <div className="wb-video-controls-bar">
            <button
                className={`wb-v-btn ${!isMicrophoneEnabled ? 'muted' : ''}`}
                onClick={toggleMic}
                title={isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}
            >
                {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
                className={`wb-v-btn ${!isCameraEnabled ? 'muted' : ''}`}
                onClick={toggleCamera}
                title={isCameraEnabled ? "Stop Video" : "Start Video"}
            >
                {isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            <button
                className={`wb-v-btn ${isScreenShareEnabled ? 'active' : ''}`}
                onClick={toggleScreen}
                title={isScreenShareEnabled ? "Stop Sharing" : "Share Screen"}
            >
                {isScreenShareEnabled ? <MonitorOff size={18} /> : <Monitor size={18} />}
            </button>

            <button
                className="wb-v-btn leave"
                onClick={onLeave}
                title="Leave Call"
            >
                <PhoneOff size={18} />
            </button>
        </div>
    );
};

export default VideoControls;
