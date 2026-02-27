import React, { useState } from "react";
import ReactDOM from "react-dom";
import {
    MousePointer2, Hand, Pencil, Highlighter, Eraser, Type, Upload,
    Square, Circle, Minus, ArrowUpRight, Undo2, Redo2, Trash2,
    RotateCcw, ChevronRight, Settings, Brush, Sparkles,
    ArrowLeftRight, Triangle, Database, FileText, MessageSquare,
    Cloud, Diamond, StickyNote
} from 'lucide-react';

const Toolbar = ({ activeTool, setTool, isHost, onClear, onUndo, onRedo, canvasBackground, setCanvasBackground, darkMode, setDarkMode }) => {
    const [openFlyout, setOpenFlyout] = useState(null); // 'brush' | 'shape' | 'util'
    const [flyoutPos, setFlyoutPos] = useState({ top: 0 });

    // ─── Tool Definitions ───────────────────────────────────────────────────────
    const brushVariants = [
        { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
        { id: 'soft-brush', icon: Brush, label: 'Soft Brush' },
        { id: 'marker', icon: Brush, label: 'Marker Brush' },
        { id: 'smooth-pencil', icon: Sparkles, label: 'Smooth Stroke' },
    ];

    const shapes = [
        { id: 'line', icon: Minus, label: 'Line' },
        { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
        { id: 'double-arrow', icon: ArrowLeftRight, label: 'Double Arrow' },
        { id: 'rect', icon: Square, label: 'Rectangle' },
        { id: 'rounded-rect', icon: Square, label: 'Rounded Rect' },
        { id: 'circle', icon: Circle, label: 'Circle' },
        { id: 'ellipse', icon: Circle, label: 'Ellipse' },
        { id: 'triangle', icon: Triangle, label: 'Triangle' },
        { id: 'diamond', icon: Diamond, label: 'Diamond' },
        { id: 'sticky', icon: StickyNote, label: 'Sticky Note' },
        { id: 'speech-bubble', icon: MessageSquare, label: 'Speech Bubble' },
        { id: 'parallelogram', icon: Square, label: 'Parallelogram' },
        { id: 'cylinder', icon: Database, label: 'Cylinder (DB)' },
        { id: 'document', icon: FileText, label: 'Document' },
        { id: 'cloud', icon: Cloud, label: 'Cloud' },
    ];

    const pageTypes = [
        { id: 'dots', label: 'Dots', preview: 'radial-gradient(#94a3b8 1.2px, transparent 1.2px)' },
        { id: 'grid', label: 'Grid', preview: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)' },
        { id: 'lines', label: 'Lines', preview: 'linear-gradient(#94a3b8 1px, transparent 1px)' },
        { id: 'cross', label: 'Cross', preview: 'radial-gradient(#94a3b8 1.2px, transparent 1.2px), linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)' },
        { id: 'isometric', label: 'Isometric', preview: 'linear-gradient(30deg, #94a3b8 1px, transparent 1px), linear-gradient(150deg, #94a3b8 1px, transparent 1px)' },
        { id: 'graph-paper', label: 'Graph Paper', preview: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px), linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)' },
        { id: 'blank', label: 'Blank', preview: 'none' },
    ];

    const shapeIds = shapes.map(s => s.id);
    const brushIds = brushVariants.map(b => b.id);

    // find active shape/brush for icon display in flyout trigger
    const activeShape = shapes.find(s => s.id === activeTool);
    const activeBrush = brushVariants.find(b => b.id === activeTool);

    // ─── Helpers ────────────────────────────────────────────────────────────────


    const toggleFlyout = (name, e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setFlyoutPos({ top: r.top });
        setOpenFlyout(prev => (prev === name ? null : name));
    };
    const closeAll = () => setOpenFlyout(null);

    const selectTool = (id) => { setTool(id); closeAll(); };

    // ─── Sub-components ──────────────────────────────────────────────────────────
    const ToolBtn = ({ id, icon: Icon, label, small = false }) => (
        <button
            onClick={() => selectTool(id)}
            className={`tool-button ${activeTool === id ? 'tool-button-active' : ''}`}
        >
            <Icon size={small ? 15 : 20} strokeWidth={2.5} />
        </button>
    );

    const Divider = () => <div className="w-8 h-px bg-slate-100 my-1" />;

    const FlyoutList = ({ items }) => (
        <div className="flex flex-col gap-1 w-full px-1">
            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => selectTool(item.id)}
                    className={`tool-button w-full justify-start px-3 gap-3 ${activeTool === item.id ? 'tool-button-active' : ''}`}
                >
                    <item.icon size={17} strokeWidth={2.5} />
                    <span className="text-[11px] font-semibold leading-none">{item.label}</span>
                </button>
            ))}
        </div>
    );

    const FlyoutPanel = ({ label, children, maxH = 400 }) => {
        const [panelStyle, setPanelStyle] = useState({ top: flyoutPos.top, opacity: 0 });
        const panelRef = React.useRef(null);

        React.useEffect(() => {
            if (panelRef.current) {
                const rect = panelRef.current.getBoundingClientRect();
                const viewportH = window.innerHeight;
                let top = flyoutPos.top;

                // Adjust if overflowing bottom
                if (top + rect.height > viewportH - 20) {
                    top = Math.max(70, viewportH - rect.height - 20);
                }

                setPanelStyle({ top, opacity: 1 });
            }
        }, []);

        return ReactDOM.createPortal(
            <>
                <div
                    className="fixed inset-0 z-[9998]"
                    onClick={closeAll}
                />
                <div
                    ref={panelRef}
                    className="category-flyout"
                    style={{
                        top: `${panelStyle.top}px`,
                        zIndex: 9999,
                        maxHeight: maxH,
                        overflowY: 'auto',
                        opacity: panelStyle.opacity,
                        transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
                        transform: panelStyle.opacity ? 'translateX(0)' : 'translateX(-5px)'
                    }}
                >
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 pb-1 border-b border-slate-50 w-full text-center">
                        {label}
                    </div>
                    {children}
                </div>
            </>,
            document.body
        );
    };

    return (
        <div className="flex flex-col gap-1 items-center relative h-full pb-2">


            {/* ── Selection ── */}
            <ToolBtn id="select" icon={MousePointer2} label="Select (V)" />
            <ToolBtn id="pan" icon={Hand} label="Pan / Move (H)" />

            <Divider />

            {/* ── Pencil (direct) ── */}
            <ToolBtn id="pencil" icon={Pencil} label="Pencil (P)" />

            <div className="relative">
                <button
                    onClick={(e) => toggleFlyout('brush', e)}
                    className={`tool-button relative ${openFlyout === 'brush' || brushIds.includes(activeTool) ? 'tool-button-active' : ''}`}
                >
                    {activeBrush
                        ? <activeBrush.icon size={20} strokeWidth={2.5} />
                        : <Brush size={20} strokeWidth={2.5} />
                    }
                    <ChevronRight
                        size={10}
                        className={`absolute right-0.5 text-slate-300 transition-transform duration-200 ${openFlyout === 'brush' ? '-rotate-90' : 'rotate-90'}`}
                    />
                </button>
                {openFlyout === 'brush' && (
                    <FlyoutPanel label="Brush Variants">
                        <FlyoutList items={brushVariants} />
                    </FlyoutPanel>
                )}
            </div>

            {/* ── Erasers ── */}
            <button
                onClick={() => selectTool('eraser')}
                className={`tool-button ${activeTool === 'eraser' ? 'tool-button-active' : ''}`}
            >
                <Eraser size={20} strokeWidth={2.5} />
            </button>
            <button
                onClick={() => selectTool('precision-eraser')}
                className={`tool-button relative ${activeTool === 'precision-eraser' ? 'tool-button-active' : ''}`}
            >
                <Eraser size={15} strokeWidth={2.5} />
                {/* small dot to distinguish from regular eraser */}
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-current" />
            </button>

            <Divider />

            {/* ── Shapes (flyout, shows active shape icon) ── */}
            <div className="relative">
                <button
                    onClick={(e) => toggleFlyout('shape', e)}
                    className={`tool-button relative ${openFlyout === 'shape' || shapeIds.includes(activeTool) ? 'tool-button-active' : ''}`}
                >
                    {activeShape
                        ? <activeShape.icon size={20} strokeWidth={2.5} />
                        : <Square size={20} strokeWidth={2.5} />
                    }
                    <ChevronRight
                        size={10}
                        className={`absolute right-0.5 text-slate-300 transition-transform duration-200 ${openFlyout === 'shape' ? '-rotate-90' : 'rotate-90'}`}
                    />
                </button>
                {openFlyout === 'shape' && (
                    <FlyoutPanel label="Shapes & Diagrams" maxH={420}>
                        <FlyoutList items={shapes} />
                    </FlyoutPanel>
                )}
            </div>

            <Divider />

            {/* ── Content Tools (direct) ── */}
            <ToolBtn id="text" icon={Type} label="Text Tool (T) — click canvas to type" />
            <ToolBtn id="upload" icon={Upload} label="Image Upload — click canvas to place" />

            <Divider />

            {/* ── History ── */}
            <button
                onClick={onUndo}
                className="tool-button"
            >
                <Undo2 size={20} strokeWidth={2} />
            </button>
            <button
                onClick={onRedo}
                className="tool-button"
            >
                <Redo2 size={20} strokeWidth={2} />
            </button>

            <Divider />

            {/* ── Utilities (flyout) ── */}
            <div className="relative">
                <button
                    onClick={(e) => toggleFlyout('util', e)}
                    className={`tool-button relative ${openFlyout === 'util' ? 'tool-button-active' : ''}`}
                >
                    <Settings size={20} strokeWidth={2} />
                    <ChevronRight
                        size={10}
                        className={`absolute right-0.5 text-slate-300 transition-transform duration-200 ${openFlyout === 'util' ? '-rotate-90' : 'rotate-90'}`}
                    />
                </button>
                {openFlyout === 'util' && (
                    <FlyoutPanel label="Settings" maxH={520}>
                        <div className="flex flex-col gap-1 w-full px-1">
                            {/* ── Page Background ── */}
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 mt-1 mb-1">Page Type</div>
                            <div className="tb-page-grid">
                                {pageTypes.map(pt => (
                                    <button
                                        key={pt.id}
                                        onClick={() => setCanvasBackground(pt.id)}
                                        className={`tb-page-option ${canvasBackground === pt.id ? 'tb-page-active' : ''}`}
                                        title={pt.label}
                                    >
                                        <div
                                            className="tb-page-preview"
                                            style={{
                                                backgroundImage: pt.preview,
                                                backgroundSize: pt.id === 'graph-paper' ? '16px 16px, 16px 16px, 4px 4px, 4px 4px' : '8px 8px',
                                            }}
                                        />
                                        <span className="tb-page-label">{pt.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="w-full h-px bg-slate-100 my-1" />

                            {/* ── Dark / Light mode ── */}
                            <button
                                onClick={() => { setDarkMode(!darkMode); }}
                                className="tool-button w-full justify-start px-3 gap-3"
                            >
                                {darkMode
                                    ? <><span style={{ fontSize: 17 }}>☀️</span> <span className="text-[11px] font-semibold">Light Mode</span></>
                                    : <><span style={{ fontSize: 17 }}>🌙</span> <span className="text-[11px] font-semibold">Dark Mode</span></>
                                }
                            </button>

                            <div className="w-full h-px bg-slate-100 my-1" />

                            {/* ── Reset View ── */}
                            <button
                                onClick={() => { window.dispatchEvent(new CustomEvent('wb-reset-view')); closeAll(); }}
                                className="tool-button w-full justify-start px-3 gap-3"
                            >
                                <RotateCcw size={17} />
                                <span className="text-[11px] font-semibold">Reset View</span>
                            </button>
                            {isHost && (
                                <button
                                    onClick={() => { onClear(); closeAll(); }}
                                    className="tool-button w-full justify-start px-3 gap-3 !text-red-500 hover:!bg-red-50"
                                >
                                    <Trash2 size={17} />
                                    <span className="text-[11px] font-semibold">Clear Board</span>
                                </button>
                            )}
                        </div>
                    </FlyoutPanel>
                )}
            </div>
        </div>
    );
};

export default Toolbar;
