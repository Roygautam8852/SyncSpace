import React, { useState, useEffect, useRef } from "react";
import { Video, PhoneIncoming } from "lucide-react";

const Chat = ({ messages, onSendMessage, currentUser, socket, roomId, typingUsers = [], participants = [], inCall, activeCallInfo, onJoinCall, onToggleVideo }) => {
    const [input, setInput] = useState("");
    const chatEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleInputChange = (e) => {
        setInput(e.target.value);
        // Typing indicator
        if (socket && roomId) {
            if (!isTyping) {
                setIsTyping(true);
                socket.emit("typing-start", { roomId, userName: currentUser.name });
            }
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                socket.emit("typing-stop", { roomId });
            }, 1500);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput("");
            setIsTyping(false);
            if (socket && roomId) socket.emit("typing-stop", { roomId });
        }
    };

    useEffect(() => {
        return () => clearTimeout(typingTimeoutRef.current);
    }, []);

    const formatTime = (ts) => {
        try {
            return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    const callIsActive = activeCallInfo?.active;
    const callParticipantCount = activeCallInfo?.participants?.length || 0;

    const getNameColor = (name) => {
        if (!name) return "#64748b";
        const colors = [
            "#f87171", "#fb923c", "#fbbf24", "#34d399",
            "#22d3ee", "#60a5fa", "#818cf8", "#c084fc", "#f472b6"
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="wb-chat-container">
            {/* Online Users & Call Bar */}
            <div className="wb-chat-online-bar">
                <div className="wb-online-avatars">
                    {participants.slice(0, 5).map((p, i) => (
                        <div
                            key={i}
                            className="wb-online-dot"
                            title={p.userName}
                            style={{ backgroundColor: getNameColor(p.userName), color: '#fff' }}
                        >
                            {p.userName[0]?.toUpperCase()}
                        </div>
                    ))}
                    {participants.length > 5 && (
                        <div className="wb-online-more">+{participants.length - 5}</div>
                    )}
                </div>
                <div className="wb-video-call-action">
                    {inCall ? (
                        /* Already in call — show a subtle "In Call" indicator */
                        <div className="wb-call-btn active" style={{ cursor: 'default' }}>
                            <Video size={14} />
                            <span>In Call</span>
                        </div>
                    ) : callIsActive ? (
                        /* A call is active in the room — show "Join" with participant count */
                        <button
                            className="wb-call-btn wb-call-join-active"
                            onClick={onJoinCall}
                            title={`${callParticipantCount} in call — click to join`}
                        >
                            <PhoneIncoming size={14} />
                            <span>Join ({callParticipantCount})</span>
                        </button>
                    ) : (
                        /* No active call — show "Start Call" */
                        <button
                            className="wb-call-btn"
                            onClick={onJoinCall}
                            title="Start a video call"
                        >
                            <Video size={14} />
                            <span>Start Call</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="wb-chat-messages">
                {messages.length === 0 ? (
                    <div className="wb-chat-empty">
                        <div className="wb-chat-empty-icon">💬</div>
                        <h4>Collaborative Chat</h4>
                        <p>Messages are synced with everyone in the room.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.sender === currentUser._id;
                        const senderColor = getNameColor(msg.senderName);
                        return (
                            <div key={index} className={`wb-chat-msg ${isOwn ? "own" : "other"}`}>
                                <div className="wb-msg-header">
                                    <span className="wb-msg-name" style={{ color: isOwn ? 'inherit' : senderColor }}>
                                        {msg.senderName}
                                    </span>
                                    <span className="wb-msg-time">{formatTime(msg.timestamp)}</span>
                                </div>
                                <div className="wb-msg-content-wrapper">
                                    {!isOwn && (
                                        <div className="wb-msg-avatar" style={{ backgroundColor: senderColor }}>
                                            {msg.senderName[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <div className="wb-msg-bubble">
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="wb-typing-indicator">
                        <div className="wb-typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span>
                            {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="wb-chat-input-area">
                <form className="wb-chat-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="wb-chat-input"
                        value={input}
                        onChange={handleInputChange}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="wb-chat-send"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="transform rotate-45 -mt-0.5">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
