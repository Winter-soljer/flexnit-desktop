import React, { useEffect, useState } from "react";
import { Minus, Square, Copy, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useUIStore } from "../../stores/useUIStore";

export const TitleBar: React.FC = () => {
  const { isWindowMaximized, setIsWindowMaximized } = useUIStore();
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if running inside Tauri
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      setIsTauri(true);
      invoke<boolean>("is_window_maximized")
        .then((max) => setIsWindowMaximized(max))
        .catch(() => {});
    }
  }, [setIsWindowMaximized]);

  const handleMinimize = () => {
    if (isTauri) invoke("minimize_window").catch(console.error);
  };

  const handleToggleMaximize = () => {
    if (isTauri) {
      invoke("toggle_maximize_window")
        .then(() => {
          setIsWindowMaximized(!isWindowMaximized);
        })
        .catch(console.error);
    }
  };

  const handleClose = () => {
    if (isTauri) invoke("close_window").catch(console.error);
  };

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-8 z-50 flex items-center justify-between px-3 bg-gradient-to-b from-black/90 to-transparent select-none text-white text-xs"
    >
      <div
        data-tauri-drag-region
        className="flex items-center space-x-2 text-zinc-400 font-medium tracking-wider"
      >
        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
        <span className="text-[11px] font-semibold text-zinc-300">FLEXNIT DESKTOP</span>
      </div>

      {/* Draggable center bridge */}
      <div data-tauri-drag-region className="flex-1 h-full" />

      {/* Window Controls */}
      <div className="flex items-center space-x-1 -mr-1">
        <button
          onClick={handleMinimize}
          title="Minimize"
          className="w-8 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleToggleMaximize}
          title={isWindowMaximized ? "Restore" : "Maximize"}
          className="w-8 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          {isWindowMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={handleClose}
          title="Close"
          className="w-8 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
