import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, Wand2, Loader2, AlertCircle, RotateCcw, Image, Check } from "lucide-react";
import { aiService } from "../services/api";

const SUGGESTION_CHIPS = [
    "Doraemon", "Mario", "Pikachu", "Heart", "Star",
    "Flower", "House", "Rocket", "Cat", "Robot",
    "Sunset", "Tree", "Diamond", "Crown", "Butterfly"
];

const AiDrawingModal = ({ isOpen, onClose, onDrawingGenerated }) => {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [preview, setPreview] = useState(null); // { imageUrl, source, title }
    const [phase, setPhase] = useState("input"); // 'input' | 'preview'
    const inputRef = useRef(null);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
        if (!isOpen) {
            setPrompt("");
            setError("");
            setPreview(null);
            setPhase("input");
        }
    }, [isOpen]);


    function minSize(a, b) { return a < b ? a : b; }

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError("");

        try {
            const res = await aiService.generateImage(prompt.trim());
            setPreview({ imageUrl: res.data.imageUrl, source: res.data.source, title: prompt.trim() });
            setPhase("preview");
            setCooldown(5);
        } catch (err) {
            const serverError = err.response?.data;
            const mainMsg = serverError?.error || "Generation failed.";
            const subMsg = serverError?.details ? ` (${typeof serverError.details === 'string' ? serverError.details : JSON.stringify(serverError.details)})` : "";
            setError(`${mainMsg}${subMsg}`);

            if (err.response?.status === 429) {
                setError("AI Quota reached. Please try again after a few moments.");
                setCooldown(30);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOnCanvas = () => {
        if (!preview) return;

        // HD Image
        onDrawingGenerated({
            src: preview.imageUrl,
            width: 512, // Default HD scale on board
            height: 512,
            title: preview.title || prompt
        });
        onClose();
    };

    const handleRetry = () => {
        setPreview(null);
        setPhase("input");
        setError("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey && !loading) {
            e.preventDefault();
            handleGenerate();
        }
    };

    if (!isOpen) return null;

    // Body
    return (
        <>
            {/* Backdrop */}
            <div className="ai-modal-backdrop" onClick={onClose} />

            {/* Modal */}
            <div className="ai-modal">
                {/* Header */}
                <div className="ai-modal-header">
                    <div className="ai-modal-title">
                        <div className="ai-modal-icon">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h2>AI Creative Agent</h2>
                            <p>Powered by OpenAI — Bring your ideas to life instantly</p>
                        </div>
                    </div>
                    <button className="ai-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="ai-modal-body">
                    {phase === "input" ? (
                        <>
                            {/* Input Area */}
                            <div className="ai-input-group">
                                <label className="ai-input-label">Describe your vision</label>
                                <div className="ai-input-wrapper">
                                    <Wand2 size={18} className="ai-input-icon" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="ai-input"
                                        placeholder='e.g. "a futuristic city in the style of cyberpunk"'
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={loading}
                                        maxLength={300}
                                    />
                                </div>
                                <span className="ai-input-hint">{prompt.length}/300 characters</span>
                            </div>

                            {/* Suggestion Chips */}
                            {!loading && (
                                <div className="ai-suggestions">
                                    <span className="ai-suggestions-label">Ideas:</span>
                                    <div className="ai-chip-grid">
                                        {SUGGESTION_CHIPS.map((chip) => (
                                            <button
                                                key={chip}
                                                className="ai-chip"
                                                onClick={() => setPrompt(chip)}
                                                disabled={loading}
                                            >
                                                {chip}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="ai-error">
                                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Loading Animation */}
                            {loading && (
                                <div className="ai-loading">
                                    <div className="ai-loading-spinner">
                                        <Loader2 size={32} className="ai-spin" />
                                    </div>
                                    <div className="ai-loading-text">
                                        <span className="ai-loading-title">Agent is materializing your request...</span>
                                        <span className="ai-loading-sub">DALL-E 3 takes about 10-15 seconds</span>
                                    </div>
                                    <div className="ai-loading-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Preview Phase */
                        <div className="ai-preview-section">
                            <div className="ai-preview-header">
                                <span className="ai-preview-label">✨ Ready to place: {preview?.title || prompt}</span>
                            </div>
                            <div className="ai-preview-canvas-wrapper">
                                <div className="ai-hd-preview">
                                    <img
                                        src={preview.imageUrl}
                                        alt="AI Generated"
                                        className="ai-hd-img"
                                        onLoad={() => console.log("HD Image Loaded")}
                                    />
                                    <div className="ai-hd-badge">{preview.source || "GPT-IMAGE-1"}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="ai-modal-footer">
                    {phase === "input" ? (
                        <button
                            className="ai-btn-generate hd-theme"
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim() || cooldown > 0}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="ai-spin" />
                                    Generating...
                                </>
                            ) : cooldown > 0 ? (
                                <>
                                    <RotateCcw size={16} />
                                    Wait {cooldown}s
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Materialize HD Image
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="ai-preview-actions">
                            <button className="ai-btn-retry" onClick={handleRetry}>
                                <RotateCcw size={14} />
                                Start Over
                            </button>
                            <button className="ai-btn-place hd-theme" onClick={handlePlaceOnCanvas}>
                                <Sparkles size={16} />
                                Place on Board
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AiDrawingModal;
