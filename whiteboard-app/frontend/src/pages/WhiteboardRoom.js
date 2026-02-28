import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { roomService, aiService } from "../services/api";
import Toolbar from "../components/Toolbar";
import Chat from "../components/Chat";
import StylingPanel from "../components/StylingPanel";
import AiDrawingModal from "../components/AiDrawingModal";
import toast from "react-hot-toast";
import { Plus, Minus, Save, FilePlus, ChevronRight, MessageCircle, Users, X, Share2, Download, Palette, Type, Sliders, ChevronDown, Edit2, Check, Video, Monitor, Copy, Sun, Moon, StickyNote, ImagePlus, LogOut, Sparkles } from "lucide-react";
import WebRTCMeeting from "../components/video/WebRTCMeeting";


const WhiteboardRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();

    const canvasRef = useRef(null);
    const viewportRef = useRef(null);
    const contextRef = useRef(null);

    // Tools & Styling
    const [tool, setTool] = useState("pencil");
    const [showStyling, setShowStyling] = useState(true);
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(4);
    const [opacity, setOpacity] = useState(1);
    const [strokeStyle, setStrokeStyle] = useState('solid');
    const [fill, setFill] = useState(false);
    const [canvasBackground, setCanvasBackground] = useState('dots');
    const [darkMode, setDarkMode] = useState(false);

    // Sync dark mode to <body> (for portalled flyouts) + auto-switch pen color
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('wb-dark-active');
            // Auto switch black → white so strokes are visible on dark canvas
            if (color === '#000000') setColor('#ffffff');
        } else {
            document.body.classList.remove('wb-dark-active');
            // Auto switch white → black for light canvas
            if (color === '#ffffff') setColor('#000000');
        }
        return () => document.body.classList.remove('wb-dark-active');
    }, [darkMode]);

    // Camera / Infinite Canvas
    const [cameraScale, setCameraScale] = useState(1);
    const [cameraOffset, setCameraOffset] = useState({ x: -4000 + window.innerWidth / 2, y: -4000 + window.innerHeight / 2 });

    const cameraScaleRef = useRef(1);
    const cameraOffsetRef = useRef({ x: -4000 + window.innerWidth / 2, y: -4000 + window.innerHeight / 2 });
    const isPanningRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    // ─── STROKE-BASED ARCHITECTURE (Source of Truth) ───
    const strokesRef = useRef([]);  // Performance ref — authoritative source
    const [strokesVersion, setStrokesVersion] = useState(0); // Trigger re-render when needed

    // Performance Refs for Drawing
    const isDrawingRef = useRef(false);
    const currentPointsRef = useRef([]);
    const startPosRef = useRef({ x: 0, y: 0 });
    const lastPosRef = useRef({ x: 0, y: 0 });
    const snapshotCanvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastCursorEmitRef = useRef(0);
    const imageFileRef = useRef(null);
    const importImageRef = useRef(null);
    const imagePlacePosRef = useRef({ x: 0, y: 0 });
    const imageCache = useRef(new Map());

    // Undo/Redo history (stroke snapshots)
    const historyRef = useRef([]);
    const historyIndexRef = useRef(-1);

    // Room State
    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [activeTab, setActiveTab] = useState("chat");
    const [loadingFileUpload, setLoadingFileUpload] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Hidden by default
    const [remoteCursors, setRemoteCursors] = useState({});
    const [typingUsers, setTypingUsers] = useState([]);
    // Zoom-like group call state
    const [inCall, setInCall] = useState(false);  // Am I currently in the call?
    const [activeCallInfo, setActiveCallInfo] = useState({ active: false, participants: [] }); // Room-level call status

    const handleJoinCall = useCallback(() => {
        setInCall(true);
    }, []);

    const handleLeaveCall = useCallback(() => {
        setInCall(false);
    }, []);

    // Multi-page state
    const [pages, setPages] = useState([]);
    const [activePageId, setActivePageId] = useState("");

    // Dropdown states
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempBoardName, setTempBoardName] = useState("");
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);


    const colors = [
        "#000000", "#374151", "#6b7280", "#9ca3af", "#ffffff",
        "#dc2626", "#ea580c", "#d97706", "#ca8a04", "#65a30d",
        "#16a34a", "#0d9488", "#0891b2", "#0284c7", "#2563eb",
        "#4f46e5", "#7c3aed", "#9333ea", "#c026d3", "#db2777"
    ];

    const isDrawingTool = ["pencil", "highlighter", "soft-brush", "marker", "smooth-pencil", "precision-eraser",
        "rect", "circle", "line", "arrow", "double-arrow", "rounded-rect", "ellipse",
        "triangle", "diamond", "sticky", "speech-bubble", "parallelogram",
        "cylinder", "document", "cloud", "text", "select", "eraser"
    ].includes(tool);

    const canvasCursor = {
        select: 'default', pan: 'grab', eraser: 'cell',
        'precision-eraser': 'cell', text: 'text', upload: 'copy',
    }[tool] || 'crosshair';

    const handleToolChange = (newTool) => {
        if (tool === newTool) { setShowStyling(!showStyling); }
        else { setTool(newTool); setShowStyling(true); }
    };

    const interactionRef = useRef({
        type: null, // 'move' or 'resize'
        strokeId: null,
        startPos: { x: 0, y: 0 },
        originalPoints: [],
        originalImgW: 0,
        originalImgH: 0
    });

    // ─── STROKE HELPERS ───
    const setStrokes = useCallback((newStrokes) => {
        if (typeof newStrokes === 'function') {
            strokesRef.current = newStrokes(strokesRef.current);
        } else {
            strokesRef.current = newStrokes;
        }
        setStrokesVersion(v => v + 1);
    }, []);

    const pushToHistory = useCallback(() => {
        const snapshot = JSON.parse(JSON.stringify(strokesRef.current));
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(snapshot);
        historyIndexRef.current = historyRef.current.length - 1;
    }, []);

    // ─── SOCKET SETUP ───
    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const res = await roomService.getRoom(roomId);
                setRoom(res.data.room);
                setTempBoardName(res.data.room.roomName || "Untitled Board");
                setSharedFiles(res.data.room.sharedFiles || []);
            } catch (err) {
                toast.error("Failed to load workspace");
                navigate("/dashboard");
            }
        };

        fetchRoomDetails();

        if (socket) {
            socket.emit("join-room", { roomId, userId: user._id, userName: user.name });

            socket.on("user-joined", (data) => toast.success(`${data.userName} joined`));
            socket.on("error-message", (msg) => {
                toast.dismiss("new-page-toast");
                toast.error(msg);
            });
            socket.on("online-users", (users) => setParticipants(users));
            socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));
            socket.on("chat-history", (h) => setMessages(h));
            socket.on("drawing", (data) => drawRemote(data));
            socket.on("erase", (data) => eraseRemote(data));

            socket.on("board-cleared", () => {
                strokesRef.current = [];
                historyRef.current = [[]];
                historyIndexRef.current = 0;
                setStrokesVersion(v => v + 1);
                redrawCanvas();
            });

            // ─── CANVAS STATE (strokes are the ONLY source of truth) ───
            socket.on("canvas-state", (data) => {
                if (data) {
                    const loadedStrokes = (data.strokes && data.strokes.length > 0) ? data.strokes : [];
                    strokesRef.current = loadedStrokes;
                    setStrokesVersion(v => v + 1);

                    historyRef.current = [JSON.parse(JSON.stringify(loadedStrokes))];
                    historyIndexRef.current = 0;

                    // Pages
                    if (data.pages) setPages(data.pages);
                    if (data.pageId) setActivePageId(data.pageId);

                    requestAnimationFrame(() => redrawCanvas());
                }
            });

            socket.on("new-stroke", (stroke) => {
                strokesRef.current = [...strokesRef.current, stroke];
                setStrokesVersion(v => v + 1);
                redrawCanvas();
            });

            socket.on("update-stroke", (updatedStroke) => {
                strokesRef.current = strokesRef.current.map(s => s.id === updatedStroke.id ? updatedStroke : s);
                setStrokesVersion(v => v + 1);
                redrawCanvas();
            });

            socket.on("erase-stroke", ({ strokeId }) => {
                strokesRef.current = strokesRef.current.filter(s => s.id !== strokeId);
                setStrokesVersion(v => v + 1);
                redrawCanvas();
            });

            socket.on("board-state-updated", (updatedStrokes) => {
                strokesRef.current = updatedStrokes;
                setStrokesVersion(v => v + 1);
                redrawCanvas();
            });

            socket.on("new-file", (file) => setSharedFiles(prev => [...prev, file]));
            socket.on("user-left", (data) => toast(`👋 ${data.userName} left`));

            socket.on("cursor-move", (data) => {
                setRemoteCursors(prev => ({ ...prev, [data.socketId]: data }));
                setTimeout(() => setRemoteCursors(prev => { const n = { ...prev }; delete n[data.socketId]; return n; }), 3000);
            });

            // Typing indicators
            socket.on("typing-start", ({ userName, socketId }) => {
                setTypingUsers(prev => {
                    if (prev.find(u => u.socketId === socketId)) return prev;
                    return [...prev, { userName, socketId }];
                });
            });
            socket.on("typing-stop", ({ socketId }) => {
                setTypingUsers(prev => prev.filter(u => u.socketId !== socketId));
            });

            // Room-level active call status
            socket.on("call:active", (data) => {
                setActiveCallInfo(data);
            });

            // Page events
            socket.on("page-added", (data) => {
                toast.dismiss("new-page-toast");
                setPages(data.pages);
                setActivePageId(data.pageId);
                strokesRef.current = [];
                setStrokesVersion(v => v + 1);
                historyRef.current = [[]];
                historyIndexRef.current = 0;
                redrawCanvas();
                toast.success(`Page "${data.pageName}" added`);
            });

            socket.on("page-switched", (data) => {
                setActivePageId(data.pageId);
                strokesRef.current = data.strokes || [];
                setStrokesVersion(v => v + 1);
                historyRef.current = [JSON.parse(JSON.stringify(data.strokes || []))];
                historyIndexRef.current = 0;
                redrawCanvas();
            });

            socket.on("page-deleted", (data) => {
                setPages(data.pages);
                if (data.activePageId !== activePageId) {
                    setActivePageId(data.activePageId);
                    strokesRef.current = data.strokes || [];
                    setStrokesVersion(v => v + 1);
                    historyRef.current = [JSON.parse(JSON.stringify(data.strokes || []))];
                    historyIndexRef.current = 0;
                    redrawCanvas();
                }
                toast.success("Page deleted");
            });

            socket.on("board-saved", ({ pageId }) => {
                toast.success("Board saved!");
            });

            // Undo/Redo from remote
            socket.on("undo", () => { /* Remote undo handled via board-state-updated */ });
            socket.on("redo", () => { /* Remote redo handled via board-state-updated */ });
        }

        return () => {
            if (socket) {
                socket.emit("leave-room", { roomId, userId: user._id, userName: user.name });
                ["user-joined", "online-users", "chat-message", "chat-history", "drawing", "erase",
                    "board-cleared", "canvas-state", "undo", "redo", "user-left", "new-stroke",
                    "board-state-updated", "new-file", "cursor-move", "typing-start", "typing-stop",
                    "page-added", "page-switched", "board-saved", "page-deleted", "call:active", "error-message"].forEach(ev => socket.off(ev));
            }
        };
    }, [roomId, socket, user, navigate]);

    // ─── CANVAS SETUP ───
    useEffect(() => {
        const viewport = viewportRef.current;
        const canvas = canvasRef.current;
        if (!viewport || !canvas) return;

        const updateCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = viewport.clientWidth * dpr;
            canvas.height = viewport.clientHeight * dpr;

            const context = canvas.getContext("2d", { alpha: true });
            if (context) {
                context.lineCap = "round";
                context.lineJoin = "round";
                contextRef.current = context;
            }

            if (!snapshotCanvasRef.current) {
                snapshotCanvasRef.current = document.createElement('canvas');
            }
            snapshotCanvasRef.current.width = canvas.width;
            snapshotCanvasRef.current.height = canvas.height;
            redrawCanvas();
        };

        const ro = new ResizeObserver(() => updateCanvasSize());
        ro.observe(viewport);
        return () => ro.disconnect();
    }, []);

    // Redraw when strokes change
    useEffect(() => { redrawCanvas(); }, [strokesVersion]);

    // ─── ZOOM ───
    useEffect(() => {
        const handleZoomIn = () => updateZoom(1.1);
        const handleZoomOut = () => updateZoom(1 / 1.1);
        const handleResetZoom = () => {
            cameraScaleRef.current = 1;
            cameraOffsetRef.current = { x: -4000 + window.innerWidth / 2, y: -4000 + window.innerHeight / 2 };
            setCameraScale(1);
            setCameraOffset(cameraOffsetRef.current);
            syncViewDOM();
        };

        window.addEventListener('wb-zoom-in', handleZoomIn);
        window.addEventListener('wb-zoom-out', handleZoomOut);
        window.addEventListener('wb-reset-view', handleResetZoom);
        return () => {
            window.removeEventListener('wb-zoom-in', handleZoomIn);
            window.removeEventListener('wb-zoom-out', handleZoomOut);
            window.removeEventListener('wb-reset-view', handleResetZoom);
        };
    }, []);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const handleWheel = (e) => {
            e.preventDefault();
            if (e.ctrlKey) {
                const zoomSpeed = 0.0012;
                const delta = -e.deltaY * zoomSpeed * cameraScaleRef.current;
                const newScale = Math.max(0.05, Math.min(10, cameraScaleRef.current + delta));
                const rect = viewport.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const worldX = (mouseX - cameraOffsetRef.current.x) / cameraScaleRef.current;
                const worldY = (mouseY - cameraOffsetRef.current.y) / cameraScaleRef.current;
                cameraScaleRef.current = newScale;
                cameraOffsetRef.current = { x: mouseX - worldX * newScale, y: mouseY - worldY * newScale };
                setCameraScale(newScale);
                setCameraOffset(cameraOffsetRef.current);
                syncViewDOM();
            } else {
                cameraOffsetRef.current = {
                    x: cameraOffsetRef.current.x - e.deltaX,
                    y: cameraOffsetRef.current.y - e.deltaY
                };
                syncViewDOM();
                setCameraOffset(cameraOffsetRef.current);
            }
        };

        viewport.addEventListener('wheel', handleWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', handleWheel);
    }, []);

    const updateZoom = (factor) => {
        const newScale = Math.max(0.05, Math.min(10, cameraScaleRef.current * factor));
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const worldX = (centerX - cameraOffsetRef.current.x) / cameraScaleRef.current;
        const worldY = (centerY - cameraOffsetRef.current.y) / cameraScaleRef.current;
        cameraScaleRef.current = newScale;
        cameraOffsetRef.current = { x: centerX - worldX * newScale, y: centerY - worldY * newScale };
        setCameraScale(newScale);
        setCameraOffset(cameraOffsetRef.current);
        syncViewDOM();
    };

    const syncViewDOM = () => {
        if (viewportRef.current) {
            const ox = cameraOffsetRef.current.x;
            const oy = cameraOffsetRef.current.y;
            // Only update position — React handles backgroundImage & backgroundSize via inline styles
            viewportRef.current.style.backgroundPosition = `${ox}px ${oy}px`;
        }
        redrawCanvas();
    };

    // ─── CANVAS RENDERING (Pure stroke-based, no bitmap ghosts) ───
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply Camera Transform
        ctx.setTransform(
            cameraScaleRef.current * dpr, 0,
            0, cameraScaleRef.current * dpr,
            cameraOffsetRef.current.x * dpr, cameraOffsetRef.current.y * dpr
        );

        // Render all strokes — strokes are the ONLY source of truth
        strokesRef.current.forEach(stroke => renderStroke(ctx, stroke));
    }, []);

    const renderStroke = (ctx, stroke) => {
        const { type, points, color, size, opacity, strokeStyle, fill } = stroke;

        if (type === 'text') {
            ctx.save();
            ctx.font = `bold ${size}px Inter, sans-serif`;
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            ctx.globalCompositeOperation = "source-over";
            ctx.shadowBlur = 0;
            ctx.fillText(stroke.text || '', points[0].x, points[0].y);
            ctx.restore();
            return;
        }

        if (type === 'image') {
            const cached = imageCache.current.get(stroke.src);
            if (cached) {
                ctx.save();
                ctx.globalAlpha = stroke.opacity || 1;
                ctx.drawImage(cached, points[0].x, points[0].y, stroke.imgW || 300, stroke.imgH || 200);
                ctx.restore();
            } else {
                const img = new window.Image();
                img.onload = () => { imageCache.current.set(stroke.src, img); redrawCanvas(); };
                img.src = stroke.src;
            }
            return;
        }

        ctx.save();

        if (type === 'eraser-precision' || type === 'mask') {
            ctx.globalCompositeOperation = "destination-out";
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = size;
            ctx.setLineDash(strokeStyle === 'dashed' ? [10, 10] : []);
            if (type === 'soft-brush') { ctx.shadowBlur = size / 2; ctx.shadowColor = color; }
            if (type === 'marker') { ctx.globalAlpha = opacity * 0.6; }
        }

        if (['pencil', 'highlighter', 'soft-brush', 'marker', 'smooth-pencil', 'eraser-precision'].includes(type)) {
            if (points.length < 2) { ctx.restore(); return; }
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
            ctx.stroke();
        } else {
            drawShape(ctx, type, points, { color, size, opacity, strokeStyle, fill });
        }
        ctx.restore();
    };

    const drawShape = (ctx, type, points, style) => {
        const start = points[0];
        const end = points[points.length - 1];
        const w = end.x - start.x;
        const h = end.y - start.y;

        if (type === 'rect') {
            if (style.fill) ctx.fillRect(start.x, start.y, w, h);
            ctx.strokeRect(start.x, start.y, w, h);
        } else if (type === 'rounded-rect') {
            ctx.beginPath();
            ctx.roundRect(start.x, start.y, w, h, Math.min(Math.abs(w), Math.abs(h)) * 0.2);
            if (style.fill) ctx.fill();
            ctx.stroke();
        } else if (type === 'circle' || type === 'ellipse') {
            ctx.beginPath();
            if (type === 'circle') {
                const radius = Math.sqrt(w * w + h * h);
                ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
            } else {
                ctx.ellipse(start.x + w / 2, start.y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, 2 * Math.PI);
            }
            if (style.fill) ctx.fill();
            ctx.stroke();
        } else if (type === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(start.x + w / 2, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.lineTo(start.x, end.y);
            ctx.closePath();
            if (style.fill) ctx.fill();
            ctx.stroke();
        } else if (type === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(start.x + w / 2, start.y);
            ctx.lineTo(end.x, start.y + h / 2);
            ctx.lineTo(start.x + w / 2, end.y);
            ctx.lineTo(start.x, start.y + h / 2);
            ctx.closePath();
            if (style.fill) ctx.fill();
            ctx.stroke();
        } else if (type === 'line' || type === 'arrow' || type === 'double-arrow') {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            if (type === 'arrow' || type === 'double-arrow') drawArrowHead(ctx, start.x, start.y, end.x, end.y, style.size);
            if (type === 'double-arrow') drawArrowHead(ctx, end.x, end.y, start.x, start.y, style.size);
        } else if (type === 'sticky') {
            ctx.save();
            ctx.fillStyle = style.fill ? style.color : "#fef08a";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(0,0,0,0.1)";
            ctx.fillRect(start.x, start.y, w, h);
            ctx.strokeStyle = "rgba(0,0,0,0.05)";
            ctx.strokeRect(start.x, start.y, w, h);
            ctx.restore();
        } else if (type === 'speech-bubble') {
            ctx.beginPath();
            ctx.roundRect(start.x, start.y, w, h * 0.8, 10);
            ctx.moveTo(start.x + w * 0.2, start.y + h * 0.8);
            ctx.lineTo(start.x + w * 0.1, end.y);
            ctx.lineTo(start.x + w * 0.4, start.y + h * 0.8);
            if (style.fill) ctx.fill();
            ctx.stroke();
        } else if (type === 'parallelogram') {
            const shift = w * 0.2;
            ctx.beginPath();
            ctx.moveTo(start.x + shift, start.y);
            ctx.lineTo(end.x, start.y);
            ctx.lineTo(end.x - shift, end.y);
            ctx.lineTo(start.x, end.y);
            ctx.closePath();
            if (style.fill) ctx.fill();
            ctx.stroke();
        } else if (type === 'cylinder') {
            const ry = Math.abs(h * 0.1);
            ctx.beginPath();
            ctx.ellipse(start.x + w / 2, end.y - ry, Math.abs(w / 2), ry, 0, 0, Math.PI, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(start.x, start.y + ry);
            ctx.lineTo(start.x, end.y - ry);
            ctx.moveTo(end.x, start.y + ry);
            ctx.lineTo(end.x, end.y - ry);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(start.x + w / 2, start.y + ry, Math.abs(w / 2), ry, 0, 0, 2 * Math.PI);
            if (style.fill) ctx.fill();
            ctx.stroke();
        } else if (type === 'document') {
            const fold = Math.min(w, h) * 0.2;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x - fold, start.y);
            ctx.lineTo(end.x, start.y + fold);
            ctx.lineTo(end.x, end.y);
            ctx.lineTo(start.x, end.y);
            ctx.closePath();
            if (style.fill) ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(end.x - fold, start.y);
            ctx.lineTo(end.x - fold, start.y + fold);
            ctx.lineTo(end.x, start.y + fold);
            ctx.stroke();
        } else if (type === 'cloud') {
            ctx.beginPath();
            const mw = start.x + w / 2;
            const mh = start.y + h / 2;
            ctx.arc(mw - w * 0.2, mh, Math.abs(h * 0.3), 0, 2 * Math.PI);
            ctx.arc(mw + w * 0.2, mh, Math.abs(h * 0.3), 0, 2 * Math.PI);
            ctx.arc(mw, mh - h * 0.2, Math.abs(h * 0.3), 0, 2 * Math.PI);
            ctx.arc(mw, mh + h * 0.2, Math.abs(h * 0.3), 0, 2 * Math.PI);
            if (style.fill) ctx.fill();
            ctx.stroke();
        }
    };

    const drawArrowHead = (ctx, fromx, fromy, tox, toy, weight) => {
        const headlen = weight * 4;
        const angle = Math.atan2(toy - fromy, tox - fromx);
        ctx.save();
        ctx.translate(tox, toy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headlen, -headlen / 2);
        ctx.lineTo(-headlen, headlen / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    const getMousePos = (e) => {
        const viewport = viewportRef.current;
        if (!viewport) return { x: 0, y: 0 };
        const rect = viewport.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - cameraOffsetRef.current.x) / cameraScaleRef.current,
            y: (e.clientY - rect.top - cameraOffsetRef.current.y) / cameraScaleRef.current
        };
    };

    // ─── ERASER: Stroke removal (no ghost rendering) ───
    const eraseObjectAt = (pos) => {
        const threshold = 15;
        const newStrokes = strokesRef.current.filter(stroke => {
            return !stroke.points.some(p => {
                const dist = Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.y - pos.y, 2));
                return dist < threshold;
            });
        });

        if (newStrokes.length !== strokesRef.current.length) {
            strokesRef.current = newStrokes;
            setStrokesVersion(v => v + 1);
            redrawCanvas();
            // Sync erased state to all clients and DB
            socket.emit("update-board-state", { roomId, strokes: newStrokes, pageId: activePageId });
        }
    };

    // ─── DRAWING ───
    const startDrawing = (e) => {
        if (e.button === 1 || tool === 'pan') {
            isPanningRef.current = true;
            panStartRef.current = { x: e.clientX - cameraOffsetRef.current.x, y: e.clientY - cameraOffsetRef.current.y };
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas || !contextRef.current) return;
        const pos = getMousePos(e);

        if (tool === 'select') return;

        if (tool === 'upload') {
            imagePlacePosRef.current = pos;
            imageFileRef.current?.click();
            return;
        }

        if (tool === 'eraser') {
            eraseObjectAt(pos);
            return;
        }

        if (tool === 'text') {
            const textInput = prompt('Enter text:');
            if (!textInput) return;
            const textStroke = {
                id: Date.now() + Math.random(), type: 'text', text: textInput,
                points: [pos], color, size: size * 4, opacity, strokeStyle, fill
            };
            strokesRef.current = [...strokesRef.current, textStroke];
            setStrokesVersion(v => v + 1);
            pushToHistory();
            socket.emit('new-stroke', { roomId, stroke: textStroke, pageId: activePageId });
            redrawCanvas();
            return;
        }

        isDrawingRef.current = true;
        currentPointsRef.current = [pos];
        startPosRef.current = pos;
        lastPosRef.current = pos;

        // Take snapshot for shape preview
        const snapCtx = snapshotCanvasRef.current.getContext('2d');
        snapCtx.setTransform(1, 0, 0, 1, 0, 0);
        snapCtx.clearRect(0, 0, canvas.width, canvas.height);
        snapCtx.drawImage(canvas, 0, 0);

        if (isDrawingTool) {
            const ctx = contextRef.current;
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(
                cameraScaleRef.current * dpr, 0,
                0, cameraScaleRef.current * dpr,
                cameraOffsetRef.current.x * dpr, cameraOffsetRef.current.y * dpr
            );
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineWidth = size;
            ctx.strokeStyle = color;
            ctx.globalAlpha = tool === "highlighter" ? (opacity * 0.4) :
                tool === "marker" ? (opacity * 0.6) : opacity;
            ctx.setLineDash(strokeStyle === 'dashed' ? [10, 10] : []);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.globalCompositeOperation = (tool === "precision-eraser") ? "destination-out" : "source-over";
            ctx.shadowBlur = 0;
        }
    };

    const handleMouseMove = (e) => {
        const now = Date.now();
        // Use pointer coords for consistency
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (socket && now - lastCursorEmitRef.current > 50) {
            lastCursorEmitRef.current = now;
            socket.emit('cursor-move', { roomId, cursorData: { x: clientX, y: clientY, userName: user.name, color } });
        }

        if (isPanningRef.current) {
            cameraOffsetRef.current = {
                x: clientX - panStartRef.current.x,
                y: clientY - panStartRef.current.y
            };
            syncViewDOM();
            return;
        }

        if (isDrawingRef.current) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            const shiftKey = e.shiftKey;
            animationFrameRef.current = requestAnimationFrame(() => draw({ clientX, clientY, shiftKey }));
            return;
        }

        // ─── OBJECT INTERACTION (Drag / Resize) ───
        if (interactionRef.current.type) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

            animationFrameRef.current = requestAnimationFrame(() => {
                const pos = getMousePos(e);
                const dx = pos.x - interactionRef.current.startPos.x;
                const dy = pos.y - interactionRef.current.startPos.y;
                const strokeId = interactionRef.current.strokeId;

                // Directly find and update DOM for 60fps fluidity
                const overlayEl = document.getElementById(`obj-overlay-${strokeId}`);

                const newStrokes = strokesRef.current.map(s => {
                    if (s.id !== strokeId) return s;

                    let updated = { ...s };
                    if (interactionRef.current.type === 'move') {
                        updated.points = interactionRef.current.originalPoints.map(p => ({
                            x: p.x + dx,
                            y: p.y + dy
                        }));
                    } else if (interactionRef.current.type === 'resize') {
                        if (s.type === 'image') {
                            updated.imgW = Math.max(50, interactionRef.current.originalImgW + dx);
                            updated.imgH = Math.max(50, interactionRef.current.originalImgH + dy);
                        } else if (s.type === 'sticky') {
                            const start = interactionRef.current.originalPoints[0];
                            const newEnd = {
                                x: Math.max(start.x + 50, interactionRef.current.originalPoints[1].x + dx),
                                y: Math.max(start.y + 50, interactionRef.current.originalPoints[1].y + dy)
                            };
                            updated.points = [start, newEnd];
                        }
                    }

                    // Update DOM style directly so it's smooth
                    if (overlayEl) {
                        const cScale = cameraScaleRef.current;
                        const cOffset = cameraOffsetRef.current;

                        // Use screen-space delta for "exact follow" of the cursor
                        const screenDx = clientX - interactionRef.current.startScreenPos.x;
                        const screenDy = clientY - interactionRef.current.startScreenPos.y;

                        const startPoint = interactionRef.current.originalPoints[0];
                        const x = Math.min(startPoint.x, updated.type === 'sticky' ? updated.points[1].x : startPoint.x);
                        const y = Math.min(startPoint.y, updated.type === 'sticky' ? updated.points[1].y : startPoint.y);

                        // Calculate original screen position
                        const origScreenX = x * cScale + cOffset.x;
                        const origScreenY = y * cScale + cOffset.y;

                        // Final screen position is original + exact mouse delta
                        const finalX = origScreenX + screenDx;
                        const finalY = origScreenY + screenDy;

                        const sW = (updated.type === 'image' ? updated.imgW : Math.abs(updated.points[1].x - updated.points[0].x)) * cScale;
                        const sH = (updated.type === 'image' ? updated.imgH : Math.abs(updated.points[1].y - updated.points[0].y)) * cScale;

                        overlayEl.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`;
                        overlayEl.style.width = `${sW}px`;
                        overlayEl.style.height = `${sH}px`;
                        overlayEl.classList.add('is-interacting');
                    }

                    return updated;
                });

                strokesRef.current = newStrokes;
                // Only redraw canvas if we must (during live move, it's better to NOT trigger React full render)
                // We'll update main state later on PointerUp
                redrawCanvas();
            });
            return;
        }

        if (tool === 'eraser' && e.buttons === 1) {
            eraseObjectAt(getMousePos(e));
        }
    };

    const draw = (e) => {
        if (!isDrawingRef.current || !contextRef.current) return;
        const pos = getMousePos(e);
        let currentPos = pos;

        if (tool === 'smooth-pencil' && currentPointsRef.current.length > 0) {
            const lastPoint = currentPointsRef.current[currentPointsRef.current.length - 1];
            currentPos = {
                x: lastPoint.x * 0.8 + pos.x * 0.2,
                y: lastPoint.y * 0.8 + pos.y * 0.2,
                shiftKey: e.shiftKey
            };
        } else {
            currentPos = { ...pos, shiftKey: e.shiftKey };
        }

        currentPointsRef.current.push(currentPos);
        const ctx = contextRef.current;

        if (["pencil", "highlighter", "soft-brush", "marker", "smooth-pencil", "precision-eraser"].includes(tool)) {
            if (e.shiftKey) {
                redrawCanvas();
                ctx.beginPath();
                ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
                ctx.lineTo(currentPos.x, currentPos.y);
                ctx.stroke();
                return;
            }
            ctx.lineTo(currentPos.x, currentPos.y);
            ctx.stroke();

            // Throttled emit for real-time collab
            socket.emit("drawing", {
                roomId,
                drawingData: {
                    x: currentPos.x, y: currentPos.y,
                    prevX: lastPosRef.current.x, prevY: lastPosRef.current.y,
                    color, size, opacity: ctx.globalAlpha, tool
                }
            });
            lastPosRef.current = currentPos;
        } else if (["rect", "circle", "line", "arrow", "double-arrow", "rounded-rect", "ellipse", "triangle", "diamond", "sticky", "speech-bubble", "parallelogram", "cylinder", "document", "cloud"].includes(tool)) {
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(snapshotCanvasRef.current, 0, 0);
            ctx.setTransform(
                cameraScaleRef.current * dpr, 0,
                0, cameraScaleRef.current * dpr,
                cameraOffsetRef.current.x * dpr, cameraOffsetRef.current.y * dpr
            );
            drawShape(ctx, tool, [startPosRef.current, currentPos], { color, size, opacity, strokeStyle, fill });
        }
    };

    const stopDrawing = () => {
        if (interactionRef.current.type) {
            const strokeId = interactionRef.current.strokeId;
            const overlayEl = document.getElementById(`obj-overlay-${strokeId}`);
            if (overlayEl) overlayEl.classList.remove('is-interacting');

            interactionRef.current = { type: null, strokeId: null, startPos: { x: 0, y: 0 }, originalPoints: [], originalImgW: 0, originalImgH: 0 };

            // Finalize React state ONLY on release
            setStrokesVersion(v => v + 1);
            pushToHistory();

            // Final broadcast
            const finalStroke = strokesRef.current.find(s => s.id === strokeId);
            if (socket && finalStroke) {
                socket.emit('update-stroke', { roomId, stroke: finalStroke, pageId: activePageId });
            }
            return;
        }

        if (isPanningRef.current) {
            isPanningRef.current = false;
            setCameraOffset(cameraOffsetRef.current);
            return;
        }

        const canvas = canvasRef.current;
        if (!isDrawingRef.current || !canvas) return;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        isDrawingRef.current = false;
        let points = [...currentPointsRef.current];

        if (["pencil", "highlighter", "soft-brush", "marker", "smooth-pencil"].includes(tool) && points.length > 1 && points[points.length - 1].shiftKey) {
            points = [points[0], points[points.length - 1]];
        }

        if (tool === 'sticky' && points.length < 2) {
            isDrawingRef.current = false;
            redrawCanvas();
            return;
        }

        const newStroke = {
            id: Date.now() + Math.random(),
            type: tool === 'precision-eraser' ? 'eraser-precision' : tool,
            points,
            color,
            size: tool === 'precision-eraser' ? 10 : size,
            opacity: tool === 'highlighter' ? 0.4 : tool === 'marker' ? 0.6 : opacity,
            strokeStyle,
            fill
        };

        if (tool !== 'eraser') {
            strokesRef.current = [...strokesRef.current, newStroke];
            setStrokesVersion(v => v + 1);
            pushToHistory();
            socket.emit("new-stroke", { roomId, stroke: newStroke, pageId: activePageId });
        }

        currentPointsRef.current = [];
        // NO bitmap save — strokes are the source of truth
    };

    // ─── UNDO / REDO (stroke-based) ───
    const handleUndo = () => {
        if (historyIndexRef.current > 0) {
            historyIndexRef.current -= 1;
            const snapshot = historyRef.current[historyIndexRef.current];
            strokesRef.current = JSON.parse(JSON.stringify(snapshot));
            setStrokesVersion(v => v + 1);
            redrawCanvas();
            socket.emit("update-board-state", { roomId, strokes: strokesRef.current, pageId: activePageId });
        }
    };

    const handleRedo = () => {
        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyIndexRef.current += 1;
            const snapshot = historyRef.current[historyIndexRef.current];
            strokesRef.current = JSON.parse(JSON.stringify(snapshot));
            setStrokesVersion(v => v + 1);
            redrawCanvas();
            socket.emit("update-board-state", { roomId, strokes: strokesRef.current, pageId: activePageId });
        }
    };

    const drawRemote = (data) => {
        const { x, y, prevX, prevY, color, size, opacity, tool } = data;
        const ctx = contextRef.current;
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.setTransform(
            cameraScaleRef.current * dpr, 0,
            0, cameraScaleRef.current * dpr,
            cameraOffsetRef.current.x * dpr, cameraOffsetRef.current.y * dpr
        );
        ctx.globalAlpha = opacity || 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = (tool === "precision-eraser") ? "destination-out" : "source-over";
        ctx.beginPath();
        if (prevX && prevY) ctx.moveTo(prevX, prevY);
        else ctx.moveTo(x, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
    };

    const eraseRemote = (data) => {
        // Remote erase is now handled via board-state-updated
    };

    const handleClearBoard = () => {
        if (window.confirm('Clear all drawings for everyone?'))
            socket.emit('clear-board', { roomId, userId: user._id, pageId: activePageId });
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `${room?.roomName || 'whiteboard'}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Board exported as PNG!');
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const src = ev.target.result;
            const img = new window.Image();
            img.onload = () => {
                const maxW = 400;
                const scale = Math.min(1, maxW / img.width);
                const imgW = Math.round(img.width * scale);
                const imgH = Math.round(img.height * scale);
                const pos = imagePlacePosRef.current;
                imageCache.current.set(src, img);
                const imageStroke = {
                    id: Date.now() + Math.random(),
                    type: 'image', src,
                    points: [pos], imgW, imgH,
                    color, size, opacity, strokeStyle, fill
                };
                strokesRef.current = [...strokesRef.current, imageStroke];
                setStrokesVersion(v => v + 1);
                pushToHistory();
                if (socket) socket.emit('new-stroke', { roomId, stroke: imageStroke, pageId: activePageId });
                redrawCanvas();
            };
            img.src = src;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Import image directly to center of current viewport
    const handleImportImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const src = ev.target.result;
            const img = new window.Image();
            img.onload = () => {
                const maxW = 250; // Card-sized import
                const scale = Math.min(1, maxW / img.width);
                const imgW = Math.round(img.width * scale);
                const imgH = Math.round(img.height * scale);
                // Place at center of current viewport
                const viewportW = viewportRef.current?.clientWidth || window.innerWidth;
                const viewportH = viewportRef.current?.clientHeight || window.innerHeight;
                const centerX = (viewportW / 2 - cameraOffsetRef.current.x) / cameraScaleRef.current;
                const centerY = (viewportH / 2 - cameraOffsetRef.current.y) / cameraScaleRef.current;
                const pos = { x: centerX - imgW / 2, y: centerY - imgH / 2 };
                imageCache.current.set(src, img);
                const imageStroke = {
                    id: Date.now() + Math.random(),
                    type: 'image', src,
                    points: [pos], imgW, imgH,
                    color, size, opacity, strokeStyle, fill
                };
                strokesRef.current = [...strokesRef.current, imageStroke];
                setStrokesVersion(v => v + 1);
                pushToHistory();
                if (socket) socket.emit('new-stroke', { roomId, stroke: imageStroke, pageId: activePageId });
                redrawCanvas();
                toast.success('Image imported!');
            };
            img.src = src;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // ─── PAGE MANAGEMENT ───
    const handleSaveBoard = () => {
        socket.emit("save-board", { roomId, pageId: activePageId });
    };

    const handleNewPage = () => {
        if (!socket || !isConnected) return toast.error("Socket not connected");
        if (!user) return toast.error("User not found");

        toast.loading("Creating new page...", { id: "new-page-toast" });
        socket.emit("new-page", { roomId, userId: user._id });
    };

    const handleSwitchPage = (pageId) => {
        if (pageId === activePageId) return;
        socket.emit("switch-page", { roomId, pageId });
    };

    const handleUpdateRoomName = async () => {
        if (!tempBoardName.trim()) return setIsEditingName(false);
        try {
            // Simplified: only local update for now as we don't have the API yet
            // But we update the room state
            setRoom(prev => ({ ...prev, roomName: tempBoardName }));
            setIsEditingName(false);
            toast.success("Board renamed");
        } catch (err) {
            toast.error("Rename failed");
        }
    };


    const handleDeletePage = (e, pageId) => {
        e.stopPropagation(); // Prevent switching to page while deleting
        if (pages.length <= 1) {
            toast.error("Cannot delete the last page");
            return;
        }
        if (window.confirm("Are you sure you want to delete this page? All drawings on it will be lost.")) {
            socket.emit("delete-page", { roomId, pageId, userId: user._id });
        }
    };

    const handleAiMessage = async (text) => {
        const userMsg = {
            sender: user._id,
            senderName: user.name,
            text: text,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);

        const loadingId = "ai-" + Date.now();
        const loadingMsg = {
            sender: "ai-agent",
            senderName: "AI Agent",
            text: "Thinking...",
            timestamp: new Date().toISOString(),
            id: loadingId
        };
        setMessages(prev => [...prev, loadingMsg]);

        try {
            const context = `Board: ${tempBoardName}. Active Tool: ${tool}. Participants: ${participants.length}.`;
            const res = await aiService.agentAction(text, context);

            setMessages(prev => prev.map(m => m.id === loadingId ? {
                ...m,
                text: res.data.reply
            } : m));
        } catch (err) {
            console.error("AI Error:", err);
            setMessages(prev => prev.map(m => m.id === loadingId ? {
                ...m,
                text: "I'm sorry, I encountered an error while processing your request."
            } : m));
        }
    };

    // ─── KEYBOARD SHORTCUTS ───
    React.useEffect(() => {
        const onKey = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); handleUndo(); }
                if (e.key === 'y') { e.preventDefault(); handleRedo(); }
                return;
            }
            const map = { v: 'select', h: 'pan', p: 'pencil', e: 'eraser', t: 'text' };
            if (map[e.key.toLowerCase()]) setTool(map[e.key.toLowerCase()]);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleUndo, handleRedo]);

    // ─── AI DRAWING HANDLER ───
    const handleAiDrawingGenerated = useCallback(({ src, width, height, title }) => {
        // Place image at center of current viewport
        const viewport = viewportRef.current;
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();

        // Use Refs for correct current values during callback
        const currentScale = cameraScaleRef.current;
        const currentOffset = cameraOffsetRef.current;

        const centerX = (rect.width / 2 - currentOffset.x) / currentScale;
        const centerY = (rect.height / 2 - currentOffset.y) / currentScale;

        // Scale logic: pixel art needs scaling, HD images (512+) don't
        const isHd = width >= 512;
        const scaleFactor = isHd ? 0.8 : 2; // For HD, slightly smaller than 512. For pixel, double it.
        const imgW = width * scaleFactor;
        const imgH = height * scaleFactor;

        const imageStroke = {
            id: Date.now() + Math.random(),
            type: 'image',
            src: src,
            points: [{ x: centerX - imgW / 2, y: centerY - imgH / 2 }],
            imgW: imgW,
            imgH: imgH,
            color: '#000',
            size: 1,
            opacity: 1,
            strokeStyle: 'solid',
            fill: false
        };

        // Pre-cache the image
        const img = new window.Image();
        img.onload = () => {
            imageCache.current.set(src, img);
            strokesRef.current = [...strokesRef.current, imageStroke];
            setStrokesVersion(v => v + 1);
            pushToHistory();

            // AUTO-SWITCH TO SELECT TOOL: This allows immediate drag/resize/delete
            setTool('select');

            if (socket) {
                socket.emit('new-stroke', { roomId, stroke: imageStroke, pageId: activePageId });
            }
            redrawCanvas();
            toast.success(`AI Drawing "${title}" placed! Switch to Select tool to move it.`, { icon: '✨' });
        };
        img.src = src;
    }, [socket, roomId, activePageId, pushToHistory, redrawCanvas, setStrokesVersion, setTool]);


    // Unread messages badge
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        if (!isSidebarOpen && messages.length > 0) {
            setUnreadCount(prev => prev + 1);
        }
    }, [messages.length]);
    useEffect(() => {
        if (isSidebarOpen) setUnreadCount(0);
    }, [isSidebarOpen]);

    return (
        <div className={`wb-layout-container ${darkMode ? 'wb-dark' : ''}`} data-sidebar={isSidebarOpen ? "open" : "closed"}>
            <header className="wb-header-modern">
                {/* LEFT: Identity */}
                <div className="wb-header-left">
                    <div className="wb-logo-box" onClick={() => navigate('/dashboard')}>
                        <span>S</span>
                    </div>
                    {isEditingName ? (
                        <div className="wb-name-edit">
                            <input
                                autoFocus
                                value={tempBoardName}
                                onChange={(e) => setTempBoardName(e.target.value)}
                                onBlur={handleUpdateRoomName}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateRoomName()}
                            />
                            <Check size={14} className="text-emerald-500" />
                        </div>
                    ) : (
                        <div className="wb-name-display" onClick={() => setIsEditingName(true)}>
                            <h1>{room?.roomName || 'Untitled Board'}</h1>
                            <Edit2 size={12} className="wb-edit-icon" />
                        </div>
                    )}
                    <span className="wb-id-badge">
                        ID: {roomId}
                        <button
                            className="wb-id-copy-btn"
                            title="Copy Room ID"
                            onClick={() => {
                                navigator.clipboard.writeText(roomId);
                                toast.success('Room ID copied!', { duration: 1500, style: { fontSize: '12px' } });
                            }}
                        >
                            <Copy size={11} />
                        </button>
                    </span>
                    <div className="wb-online-pill">
                        <span className="wb-status-dot"></span>
                        {participants.length}
                    </div>
                </div>

                {/* CENTER: Drawing Controls */}
                <div className="wb-header-center">
                    {isDrawingTool && (
                        <div className="wb-toolbar-controls-modern">
                            {/* Color */}
                            <div className="wb-dropdown-container">
                                <button
                                    className={`wb-dropdown-trigger ${activeDropdown === 'color' ? 'active' : ''}`}
                                    onClick={() => setActiveDropdown(activeDropdown === 'color' ? null : 'color')}
                                    title="Color"
                                >
                                    <div className="wb-color-preview" style={{ backgroundColor: color }}></div>
                                    <ChevronDown size={12} />
                                </button>
                                {activeDropdown === 'color' && (
                                    <div className="wb-dropdown-menu wb-color-menu">
                                        <div className="wb-color-grid-modern">
                                            {colors.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => { setColor(c); setActiveDropdown(null); }}
                                                    className={`wb-color-box ${color === c ? 'selected' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="wb-header-divider-mini"></div>

                            {/* Size */}
                            <div className="wb-dropdown-container">
                                <button
                                    className={`wb-dropdown-trigger ${activeDropdown === 'size' ? 'active' : ''}`}
                                    onClick={() => setActiveDropdown(activeDropdown === 'size' ? null : 'size')}
                                    title="Line Width"
                                >
                                    <span className="text-[10px] font-bold">{size}px</span>
                                    <ChevronDown size={12} />
                                </button>
                                {activeDropdown === 'size' && (
                                    <div className="wb-dropdown-menu">
                                        {[1, 2, 4, 8, 12, 16, 24, 32].map(s => (
                                            <button
                                                key={s}
                                                className={`wb-menu-item ${size === s ? 'active' : ''}`}
                                                onClick={() => { setSize(s); setActiveDropdown(null); }}
                                            >
                                                <div className="wb-size-preview" style={{ height: `${Math.min(s / 2, 12)}px`, width: '16px' }}></div>
                                                <span>{s}px</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="wb-header-divider-mini"></div>

                            {/* Opacity */}
                            <div className="wb-dropdown-container">
                                <button
                                    className={`wb-dropdown-trigger ${activeDropdown === 'opacity' ? 'active' : ''}`}
                                    onClick={() => setActiveDropdown(activeDropdown === 'opacity' ? null : 'opacity')}
                                    title="Opacity"
                                >
                                    <span className="text-[10px] font-bold">{Math.round(opacity * 100)}%</span>
                                    <ChevronDown size={12} />
                                </button>
                                {activeDropdown === 'opacity' && (
                                    <div className="wb-dropdown-menu">
                                        {[0.1, 0.2, 0.4, 0.6, 0.8, 1].map(o => (
                                            <button
                                                key={o}
                                                className={`wb-menu-item ${opacity === o ? 'active' : ''}`}
                                                onClick={() => { setOpacity(o); setActiveDropdown(null); }}
                                            >
                                                <div className="wb-opacity-preview" style={{ opacity: o, height: '8px', width: '16px' }}></div>
                                                <span>{Math.round(o * 100)}%</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="wb-header-divider-mini"></div>

                            {/* Style */}
                            <div className="wb-dropdown-container">
                                <button
                                    className={`wb-dropdown-trigger ${activeDropdown === 'style' ? 'active' : ''}`}
                                    onClick={() => setActiveDropdown(activeDropdown === 'style' ? null : 'style')}
                                    title="Line Type"
                                >
                                    {strokeStyle === 'solid' ? <Minus size={14} /> : <Sliders size={14} />}
                                    <ChevronDown size={12} />
                                </button>
                                {activeDropdown === 'style' && (
                                    <div className="wb-dropdown-menu">
                                        <button
                                            className={`wb-menu-item ${strokeStyle === 'solid' ? 'active' : ''}`}
                                            onClick={() => { setStrokeStyle('solid'); setActiveDropdown(null); }}
                                        >
                                            <Minus size={14} /> <span>Solid</span>
                                        </button>
                                        <button
                                            className={`wb-menu-item ${strokeStyle === 'dashed' ? 'active' : ''}`}
                                            onClick={() => { setStrokeStyle('dashed'); setActiveDropdown(null); }}
                                        >
                                            <Sliders size={14} /> <span>Dashed</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Actions */}
                <div className="wb-header-right">
                    <div className="wb-action-group">
                        <button
                            className="wb-btn-ai-draw"
                            onClick={() => setIsAiModalOpen(true)}
                            title="AI Drawing Agent — Draw anything with AI"
                            id="ai-drawing-btn"
                        >
                            <Sparkles size={16} />
                        </button>
                        <div className="wb-header-divider-mini"></div>
                        <button
                            className={`wb-btn-icon-modern ${tool === 'sticky' ? 'wb-btn-active' : ''}`}
                            onClick={() => { setTool('sticky'); toast('Click & drag on canvas to place a sticky note', { icon: '📝' }); }}
                            title="Sticky Note"
                        >
                            <StickyNote size={18} />
                        </button>
                        <button
                            className="wb-btn-icon-modern"
                            onClick={() => importImageRef.current?.click()}
                            title="Import Image to Board"
                        >
                            <ImagePlus size={18} />
                        </button>
                        <input type="file" accept="image/*" className="hidden" ref={importImageRef} onChange={handleImportImage} />
                        <div className="wb-header-divider-mini"></div>
                        <button
                            className="wb-btn-icon-modern"
                            onClick={() => setDarkMode(!darkMode)}
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button className="wb-btn-icon-modern" onClick={handleSaveBoard} title="Save Board">
                            <Save size={18} />
                        </button>
                        <button className="wb-btn-icon-modern" onClick={downloadCanvas} title="Export PNG">
                            <Download size={18} />
                        </button>
                        <button className="wb-btn-icon-modern" onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Link copied!');
                        }} title="Invite Members">
                            <Share2 size={18} />
                        </button>
                    </div>
                    <div className="wb-header-divider"></div>
                    <button
                        className={`wb-btn-chat-modern ${isSidebarOpen ? 'active' : ''}`}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        title="Toggle Chat"
                    >
                        <MessageCircle size={18} />
                        {unreadCount > 0 && !isSidebarOpen && (
                            <span className="wb-badge-modern">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>
                    <div className="wb-header-divider"></div>
                    <button
                        className="wb-btn-icon-modern wb-btn-leave"
                        onClick={() => navigate('/dashboard')}
                        title="Leave Room"
                    >
                        <LogOut size={16} />
                        <span className="wb-btn-label">Leave</span>
                    </button>
                </div>
            </header>

            <div className="wb-workspace">
                <aside className="wb-left-panel">
                    <Toolbar
                        activeTool={tool}
                        setTool={handleToolChange}
                        isHost={room?.host?.toString() === user._id || room?.host?._id === user._id}
                        onClear={handleClearBoard}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        onDelete={() => { }}
                        canvasBackground={canvasBackground}
                        setCanvasBackground={setCanvasBackground}
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                    />
                </aside>

                {/* Canvas Viewport */}
                {(() => {
                    const s = 24 * cameraScale;
                    const ox = cameraOffset.x;
                    const oy = cameraOffset.y;
                    const dm = darkMode;
                    const dotColor = dm ? 'rgba(255,255,255,0.12)' : '#e2e8f0';
                    const lineColor = dm ? 'rgba(255,255,255,0.07)' : '#e2e8f0';
                    const fineColor = dm ? 'rgba(255,255,255,0.04)' : '#eef2f7';
                    const bgColor = dm ? '#0f172a' : '#ffffff';

                    const bgMap = {
                        dots: {
                            backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
                            backgroundSize: `${s}px ${s}px`,
                        },
                        grid: {
                            backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
                            backgroundSize: `${s}px ${s}px`,
                        },
                        lines: {
                            backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px)`,
                            backgroundSize: `${s}px ${s}px`,
                        },
                        cross: {
                            backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px), linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
                            backgroundSize: `${s}px ${s}px`,
                        },
                        isometric: {
                            backgroundImage: `linear-gradient(30deg, ${lineColor} 1px, transparent 1px), linear-gradient(150deg, ${lineColor} 1px, transparent 1px), linear-gradient(270deg, ${lineColor} 1px, transparent 1px)`,
                            backgroundSize: `${s}px ${s * 0.866}px`,
                        },
                        'graph-paper': {
                            backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px), linear-gradient(${fineColor} 1px, transparent 1px), linear-gradient(90deg, ${fineColor} 1px, transparent 1px)`,
                            backgroundSize: `${s * 4}px ${s * 4}px, ${s * 4}px ${s * 4}px, ${s}px ${s}px, ${s}px ${s}px`,
                        },
                        blank: {
                            backgroundImage: 'none',
                            backgroundSize: 'auto',
                        },
                    };

                    const bg = bgMap[canvasBackground] || bgMap.dots;

                    return (
                        <main
                            ref={viewportRef}
                            className="wb-viewport"
                            style={{
                                ...bg,
                                backgroundPosition: `${ox}px ${oy}px`,
                                backgroundColor: bgColor,
                            }}
                        >

                            <canvas
                                ref={canvasRef}
                                className="wb-canvas"
                                style={{ cursor: canvasCursor }}
                                onPointerDown={startDrawing}
                                onPointerMove={handleMouseMove}
                                onPointerUp={stopDrawing}
                                onPointerOut={stopDrawing}
                            />

                            {/* Object Overlays (Image, Sticky & Text) UI */}
                            {strokesRef.current.filter(s => s.type === 'image' || s.type === 'sticky' || s.type === 'text').map(stroke => {
                                if (!stroke.points || stroke.points.length === 0) return null;
                                const start = stroke.points[0];
                                const end = stroke.type === 'sticky' && stroke.points.length > 1 ? stroke.points[1] : null;

                                if (!start) return null;

                                const x = Math.min(start.x, end ? end.x : start.x);
                                const y = Math.min(start.y, end ? end.y : start.y);

                                // Bounding box for drag area
                                let w = 100, h = 40;
                                if (stroke.type === 'sticky' && end) {
                                    w = Math.abs(end.x - start.x);
                                    h = Math.abs(end.y - start.y);
                                } else if (stroke.type === 'image') {
                                    w = stroke.imgW || 250;
                                    h = stroke.imgH || 180;
                                } else if (stroke.type === 'text') {
                                    w = (stroke.text.length * (stroke.size * 0.5)) || 100;
                                    h = stroke.size || 40;
                                }

                                const screenX = x * cameraScale + cameraOffset.x;
                                const screenY = y * cameraScale + cameraOffset.y;
                                const screenW = w * cameraScale;
                                const screenH = h * cameraScale;

                                return (
                                    <div
                                        key={stroke.id}
                                        id={`obj-overlay-${stroke.id}`}
                                        className={`wb-obj-overlay ${interactionRef.current.strokeId === stroke.id ? 'is-interacting' : ''}`}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            transform: `translate3d(${screenX}px, ${screenY}px, 0)`,
                                            width: screenW,
                                            height: screenH,
                                            zIndex: 10,
                                            pointerEvents: ['pencil', 'eraser', 'highlighter', 'text'].includes(tool) ? 'none' : 'all',
                                        }}
                                        onPointerDown={(e) => {
                                            if (e.button !== 0) return;
                                            e.stopPropagation();
                                            e.currentTarget.setPointerCapture(e.pointerId);
                                            const pos = getMousePos(e);
                                            interactionRef.current = {
                                                type: 'move',
                                                strokeId: stroke.id,
                                                startPos: pos, // World space for logic
                                                startScreenPos: { x: e.clientX, y: e.clientY }, // Screen space for exact follow
                                                originalPoints: JSON.parse(JSON.stringify(stroke.points)),
                                                originalImgW: stroke.imgW,
                                                originalImgH: stroke.imgH
                                            };
                                        }}
                                    >
                                        <button
                                            className="wb-obj-delete-btn"
                                            title="Remove"
                                            onPointerDown={(e) => e.stopPropagation()} // Prevent parent drag start
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                strokesRef.current = strokesRef.current.filter(s => s.id !== stroke.id);
                                                setStrokesVersion(v => v + 1);
                                                pushToHistory();
                                                if (socket) socket.emit('erase-stroke', { roomId, strokeId: stroke.id, pageId: activePageId });
                                                redrawCanvas();
                                                toast.success('Removed');
                                            }}
                                        >
                                            <X size={14} />
                                        </button>

                                        <div
                                            className="wb-resize-handle"
                                            onPointerDown={(e) => {
                                                e.stopPropagation(); // Prevent parent drag start
                                                e.currentTarget.setPointerCapture(e.pointerId);
                                                const pos = getMousePos(e);
                                                interactionRef.current = {
                                                    type: 'resize',
                                                    strokeId: stroke.id,
                                                    startPos: pos,
                                                    startScreenPos: { x: e.clientX, y: e.clientY },
                                                    originalPoints: JSON.parse(JSON.stringify(stroke.points)),
                                                    originalImgW: stroke.imgW,
                                                    originalImgH: stroke.imgH
                                                };
                                            }}
                                        />
                                    </div>
                                );
                            })}

                            <input type="file" accept="image/*" className="hidden" ref={imageFileRef} onChange={handleImageUpload} />


                            <StylingPanel tool={tool} visible={showStyling} strokeStyle={strokeStyle} setStrokeStyle={setStrokeStyle} fill={fill} setFill={setFill} />

                            {/* Bottom Bar: Consolidated Pages + Zoom */}
                            <div className="wb-bottom-bar">
                                {/* Page Selector Section */}
                                <div className="wb-bar-section-pages">
                                    <button className="wb-bar-btn-add" onClick={handleNewPage} title="New Page">
                                        <Plus size={16} />
                                    </button>
                                    <div className="wb-bar-divider-mini"></div>
                                    <div className="wb-page-tabs-scrollable">
                                        {(() => {
                                            const totalPages = pages.length;
                                            if (totalPages === 0) return null;

                                            const activeIndex = pages.findIndex(p => p.pageId === activePageId);
                                            const visibleItems = [];

                                            // Constants for pagination
                                            const neighbors = 2; // Show 2 pages before and after active

                                            // Always include first page
                                            visibleItems.push(pages[0]);

                                            let start = Math.max(1, activeIndex - neighbors);
                                            let end = Math.min(totalPages - 2, activeIndex + neighbors);

                                            // Add ellipsis after first if needed
                                            if (start > 1) {
                                                visibleItems.push({ type: 'ellipsis', id: 'ellipsis-start' });
                                            }

                                            // Add pages in dynamic range
                                            for (let i = start; i <= end; i++) {
                                                visibleItems.push(pages[i]);
                                            }

                                            // Add ellipsis before last if needed
                                            if (end < totalPages - 2) {
                                                visibleItems.push({ type: 'ellipsis', id: 'ellipsis-end' });
                                            }

                                            // Always include last page if there's more than one
                                            if (totalPages > 1) {
                                                visibleItems.push(pages[totalPages - 1]);
                                            }

                                            return visibleItems.map((item) => {
                                                if (item.type === 'ellipsis') {
                                                    return <div key={item.id} className="wb-page-tab-ellipsis">...</div>;
                                                }
                                                return (
                                                    <div
                                                        key={item.pageId}
                                                        className={`wb-page-tab-container ${item.pageId === activePageId ? 'active' : ''}`}
                                                    >
                                                        <button
                                                            className="wb-page-tab"
                                                            onClick={() => handleSwitchPage(item.pageId)}
                                                        >
                                                            {item.pageName.replace('Page ', '')}
                                                        </button>
                                                        {pages.length > 1 && (
                                                            <button
                                                                className="wb-page-tab-delete"
                                                                onClick={(e) => handleDeletePage(e, item.pageId)}
                                                                title="Delete Page"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                                <div className="wb-bar-divider"></div>

                                {/* Zoom Controls Section - Fixed width */}
                                <div className="wb-bar-section-zoom">
                                    <div className="wb-zoom-controls">
                                        <button
                                            onClick={() => {
                                                cameraScaleRef.current = 1;
                                                cameraOffsetRef.current = { x: -4000 + window.innerWidth / 2, y: -4000 + window.innerHeight / 2 };
                                                setCameraScale(1); setCameraOffset(cameraOffsetRef.current); syncViewDOM();
                                            }}
                                            className="wb-zoom-btn wb-zoom-label"
                                        >
                                            {Math.round(cameraScale * 100)}%
                                        </button>
                                        <div className="wb-zoom-divider"></div>
                                        <button onClick={() => updateZoom(1.1)} className="wb-zoom-btn"><Plus size={14} /></button>
                                        <button onClick={() => updateZoom(1 / 1.1)} className="wb-zoom-btn"><Minus size={14} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Remote Cursors */}
                            {Object.values(remoteCursors).map(cursor => (
                                <div
                                    key={cursor.socketId}
                                    className="wb-remote-cursor"
                                    style={{ left: cursor.x, top: cursor.y }}
                                >
                                    <svg width="12" height="16" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 0 L0 14 L4 10 L6.5 14.5 L8 13.5 L5.5 9 L10 9 Z"
                                            fill={cursor.color || '#06b6d4'} stroke="white" strokeWidth="1" />
                                    </svg>
                                    <span className="wb-cursor-label" style={{ backgroundColor: cursor.color || '#06b6d4' }}>
                                        {cursor.userName}
                                    </span>
                                </div>
                            ))}
                        </main>
                    );
                })()}

                {/* Right Sidebar (Chat) — slides in/out */}
                <aside className={`wb-right-panel ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="wb-sidebar-inner">
                        <div className="wb-sidebar-header">
                            <div className="wb-sidebar-tabs">
                                {['chat', 'files', 'users'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`wb-sidebar-tab ${activeTab === tab ? "active" : ""}`}
                                    >
                                        {tab === 'chat' && <MessageCircle size={13} />}
                                        {tab === 'users' && <Users size={13} />}
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <button className="wb-sidebar-close" onClick={() => setIsSidebarOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="wb-sidebar-content">
                            {activeTab === "chat" ? (
                                <Chat
                                    messages={messages}
                                    onSendMessage={(txt) => socket.emit("chat-message", { roomId, message: txt, userId: user._id, userName: user.name })}
                                    onSendAiMessage={handleAiMessage}
                                    currentUser={user}
                                    socket={socket}
                                    roomId={roomId}
                                    typingUsers={typingUsers}
                                    participants={participants}
                                    inCall={inCall}
                                    activeCallInfo={activeCallInfo}
                                    onJoinCall={handleJoinCall}
                                />
                            ) : activeTab === "files" ? (
                                <div className="wb-files-panel">
                                    <label className={`wb-file-upload-btn ${loadingFileUpload ? 'disabled' : ''}`}>
                                        <span>{loadingFileUpload ? 'Uploading...' : '📎 Share Asset'}</span>
                                        <input
                                            type="file" className="hidden" disabled={loadingFileUpload}
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                setLoadingFileUpload(true);
                                                try {
                                                    const fd = new FormData();
                                                    fd.append('file', file);
                                                    const res = await roomService.uploadFile(roomId, fd);
                                                    setSharedFiles(prev => [...prev, res.data.file]);
                                                    socket.emit('file-shared', { roomId, file: res.data.file });
                                                    toast.success(`${file.name} shared!`);
                                                } catch { toast.error('Upload failed'); }
                                                finally { setLoadingFileUpload(false); e.target.value = ''; }
                                            }}
                                        />
                                    </label>
                                    <div className="wb-files-list">
                                        {sharedFiles.length === 0 ? (
                                            <div className="wb-files-empty">No files shared yet</div>
                                        ) : (
                                            sharedFiles.map((f, i) => {
                                                const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
                                                const fullUrl = `${backendUrl}${f.fileUrl}`;
                                                const sizeKB = f.fileSize ? `${(f.fileSize / 1024).toFixed(1)} KB` : '';
                                                return (
                                                    <div key={i} className="wb-file-item">
                                                        <div className="wb-file-info">
                                                            <span className="wb-file-name" title={f.fileName}>{f.fileName}</span>
                                                            <span className="wb-file-meta">
                                                                {f.senderName && <span>{f.senderName}</span>}
                                                                {sizeKB && <span> · {sizeKB}</span>}
                                                            </span>
                                                        </div>
                                                        <a
                                                            href={fullUrl}
                                                            download={f.fileName}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="wb-file-download-btn"
                                                            title="Download file"
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="wb-users-panel">
                                    <div className="wb-users-count">{participants.length} Online</div>
                                    {participants.map((p, i) => (
                                        <div key={i} className="wb-user-item">
                                            <div className="wb-user-avatar">{p.userName[0]}</div>
                                            <span className="wb-user-name">{p.userName}</span>
                                            <div className="wb-user-status"></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Floating Video Call (Zoom-like — not fullscreen) */}
            {
                inCall && (
                    <WebRTCMeeting
                        socket={socket}
                        roomId={roomId}
                        username={user.name}
                        onLeave={handleLeaveCall}
                    />
                )
            }

            {/* AI Drawing Modal */}
            <AiDrawingModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onDrawingGenerated={handleAiDrawingGenerated}
            />
        </div >
    );
};

export default WhiteboardRoom;
