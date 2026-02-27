import React from 'react';
import { VideoTrack, AudioTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { MicOff } from 'lucide-react';

const ParticipantTile = ({ participant }) => {
    if (!participant) return null;

    // Determine if we have a camera track using the correct LiveKit API
    const cameraTrack = participant.getTrackPublication(Track.Source.Camera);
    const micTrack = participant.getTrackPublication(Track.Source.Microphone);

    const videoTrackRef = {
        participant,
        source: Track.Source.Camera,
        publication: cameraTrack,
    };

    const audioTrackRef = {
        participant,
        source: Track.Source.Microphone,
        publication: micTrack,
    };

    return (
        <div
            className={`wb-video-tile ${participant.isSpeaking ? 'active-speaker' : ''}`}
            data-lk-participant-id={participant.sid}
        >
            {cameraTrack?.isSubscribed ? (
                <VideoTrack trackRef={videoTrackRef} />
            ) : (
                <div className="wb-video-placeholder">
                    <div className="wb-v-avatar">
                        {participant.identity ? participant.identity[0].toUpperCase() : '?'}
                    </div>
                </div>
            )}

            {audioTrackRef.publication?.isSubscribed && (
                <AudioTrack trackRef={audioTrackRef} />
            )}

            <div className="wb-video-info">
                <span className="wb-video-name">
                    {participant.identity} {participant.isLocal && '(You)'}
                </span>
                {!participant.isMicrophoneEnabled && (
                    <MicOff size={10} className="text-red-500" />
                )}
            </div>
        </div>
    );
};

export default ParticipantTile;
