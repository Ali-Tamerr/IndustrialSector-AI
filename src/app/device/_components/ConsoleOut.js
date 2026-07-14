"use client";

import { useState, useRef, useEffect } from "react";
import { Activity, Cpu, Terminal } from "lucide-react";

export default function ConsoleOut({ thoughts = [], localLogs = [], theme = "dark" }) {
  const [activeTab, setActiveTab] = useState("orchestrator");
  const containerRef = useRef(null);

  // Auto scroll console terminal scroll container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [thoughts, localLogs, activeTab]);

  return (
    <div className="bg-[#080a0f] border border-[#182030] rounded-2xl flex flex-col overflow-hidden relative shadow-[inset_0_4px_24px_rgba(0,0,0,0.9)] min-h-[360px] max-h-[360px] font-mono">
      {/* Console Header Tabs */}
      <div className="border-b border-[#182030]/80 px-4 py-2 bg-[#0c0f17] flex items-center justify-between text-[9px] text-slate-500">
        <div className="flex items-center space-x-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500/20"></span>
          <span className="h-2 w-2 rounded-full bg-yellow-500/20"></span>
          <span className="h-2 w-2 rounded-full bg-green-500/20"></span>
          <span className="ml-2 text-slate-400 font-bold uppercase tracking-widest text-[9px]">IoT_CONSOLE_OUT</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-[#182030]/50 bg-[#070a0e] text-[10px] font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("orchestrator")}
          className={`flex-1 py-2 text-center transition-all duration-300 border-b-2 ${
            activeTab === "orchestrator"
              ? "border-cyan-500 text-cyan-400 bg-cyan-950/10"
              : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>Orchestrator Log ({thoughts.length})</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab("client")}
          className={`flex-1 py-2 text-center transition-all duration-300 border-b-2 ${
            activeTab === "client"
              ? "border-emerald-500 text-emerald-400 bg-emerald-950/10"
              : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>IoT Client Log ({localLogs.length})</span>
          </span>
        </button>
      </div>
      
      {/* Terminal Body */}
      <div 
        ref={containerRef} 
        className="p-4 flex-1 overflow-y-auto font-mono text-[11px] space-y-3 scroll-smooth leading-relaxed bg-[#05070a]"
      >
        {activeTab === "orchestrator" ? (
          thoughts.length === 0 ? (
            <div className="text-slate-600 text-center py-12 italic">
              No orchestrator execution history. Run a simulation in dashboard.
            </div>
          ) : (
            thoughts.map((log) => {
              let tagColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";
              if (log.agent.includes("Anomaly")) tagColor = "text-amber-400 bg-amber-400/10 border-amber-400/20";
              else if (log.agent.includes("Diagnostic")) tagColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
              else if (log.agent.includes("Planning") || log.agent.includes("Tool")) tagColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
              else if (log.agent.includes("Sourcing") || log.agent.includes("Graph")) tagColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
              else if (log.agent.includes("Simulator")) tagColor = "text-red-400 bg-red-400/10 border-red-400/20";

              return (
                <div key={log.id} className="border-l border-slate-800 pl-3 py-0.5 hover:bg-slate-900/40 rounded transition-colors duration-150 text-left">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${tagColor} mr-2 uppercase tracking-wide`}>
                    {log.agent}
                  </span>
                  <span className="text-slate-350">{log.text}</span>
                </div>
              );
            })
          )
        ) : (
          localLogs.length === 0 ? (
            <div className="text-slate-600 text-center py-12 italic">
              No local client logs recorded.
            </div>
          ) : (
            [...localLogs].reverse().map((log) => {
              let tagColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";
              if (log.type === "warning") tagColor = "text-amber-400 bg-amber-400/10 border-amber-400/20";
              else if (log.type === "planning") tagColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
              
              return (
                <div key={log.id} className="border-l border-slate-800 pl-3 py-0.5 hover:bg-slate-900/40 rounded transition-colors duration-150 text-left">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${tagColor} mr-2 uppercase tracking-wide`}>
                    {log.agent}
                  </span>
                  <span className="text-slate-350">{log.text}</span>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
