import React, { useState } from 'react';
import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import ParticipantTile from './ParticipantTile';
import VideoControls from './VideoControls';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MeetingConference = ({ onLeave }) => {
    const participants = useParticipants();
    const [page, setPage] = useState(0);
    const pageSize = 9;

    const totalPages = Math.ceil(participants.length / pageSize);
    const visibleParticipants = participants.slice(page * pageSize, (page + 1) * pageSize);

    return (
        <>
            <div className="wb-meeting-container">
                <div className="wb-v-grid-main">
                    {visibleParticipants.map((p) => (
                        <ParticipantTile key={p.sid} participant={p} />
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="wb-v-pagination">
                        <button
                            className="wb-v-btn"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="wb-v-btn"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                    <VideoControls onLeave={onLeave} />
                </div>

                <div className="wb-call-status-pill">
                    <div className="wb-status-dot"></div>
                    {participants.length} connected
                </div>
            </div>
        </>
    );
};

export default MeetingConference;
