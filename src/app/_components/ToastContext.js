"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children, theme = "dark" }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showConfirm = useCallback((message, onConfirm, onCancel = () => {}) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          if (onCancel) onCancel();
          resolve(false);
        }
      });
    });
  }, []);

  const getToastStyles = (type) => {
    switch (type) {
      case "success":
        return {
          bg: theme === "dark" ? "bg-[#060b13] border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-800",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        };
      case "warning":
        return {
          bg: theme === "dark" ? "bg-[#0c0d10] border-amber-500/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-800",
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        };
      case "error":
        return {
          bg: theme === "dark" ? "bg-[#0d0910] border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-800",
          icon: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        };
      case "info":
      default:
        return {
          bg: theme === "dark" ? "bg-[#050912] border-cyan-500/30 text-cyan-400" : "bg-cyan-50 border-cyan-200 text-cyan-800",
          icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast, showConfirm }}>
      {children}

      {/* Floating Toasts container */}
      <div className="fixed bottom-5 right-5 z-55 space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.3)] pointer-events-auto animate-slideIn transition-all font-mono text-xs ${styles.bg}`}
            >
              {styles.icon}
              <div className="flex-1 leading-normal break-words">{toast.message}</div>
              <button
                onClick={() => hideToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors text-[10px] uppercase font-bold shrink-0 ml-1"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl transition-all duration-300 font-mono text-xs ${
              theme === "dark"
                ? "bg-[#0a0d16] border-[#1b2336] text-slate-200 shadow-cyan-900/10"
                : "bg-white border-slate-200 text-slate-700 shadow-slate-300/40"
            }`}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-[#1b2336]' : 'bg-slate-100'}`}>
                <HelpCircle className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 space-y-1">
                <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Confirmation Requested
                </span>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-500/10">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className={`px-4 py-2 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all border ${
                  theme === "dark"
                    ? "border-slate-750 bg-transparent text-slate-400 hover:bg-slate-900"
                    : "border-slate-300 bg-transparent text-slate-650 hover:bg-slate-100"
                }`}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all border ${
                  theme === "dark"
                    ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30"
                    : "bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 hover:border-cyan-700 shadow-sm"
                }`}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
