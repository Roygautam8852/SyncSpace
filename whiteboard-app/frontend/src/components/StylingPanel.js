import React from "react";

const StylingPanel = ({ tool, visible, strokeStyle, setStrokeStyle, fill, setFill }) => {
    // Only show for tools that need secondary styling (Shapes)
    const shapeTools = ["rect", "circle", "line", "arrow"];
    if (!shapeTools.includes(tool) || !visible) return null;

    return (
        <div className="styling-panel left-20 top-[180px]">
            <div className="flex flex-col items-center gap-4 w-full">
                {/* Stroke Style Toggle */}
                <div className="flex flex-col gap-3 py-2 border-b border-slate-100 w-full items-center">
                    <button
                        onClick={() => setStrokeStyle('solid')}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${strokeStyle === 'solid' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-400'}`}
                        title="Solid Line"
                    >
                        <div className="w-4 h-0.5 bg-current" />
                    </button>
                    <button
                        onClick={() => setStrokeStyle('dashed')}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${strokeStyle === 'dashed' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-400'}`}
                        title="Dashed Line"
                    >
                        <div className="w-4 h-0.5 border-b border-dashed border-current" />
                    </button>
                </div>

                {/* Fill Toggle for Shapes */}
                {["rect", "circle"].includes(tool) && (
                    <div className="pt-2 w-full flex justify-center">
                        <button
                            onClick={() => setFill(!fill)}
                            className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-black transition-all ${fill ? 'bg-violet-600 text-white shadow-lg shadow-violet-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            title="Toggle Fill"
                        >
                            {fill ? "F" : "F"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StylingPanel;
