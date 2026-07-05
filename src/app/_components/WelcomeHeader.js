"use client";

import React from "react";
import { Activity, Cpu, Layers } from "lucide-react";

export default function WelcomeHeader({ theme }) {
  return (
    <>
      {/* Header and Welcome */}
      <div className="text-center space-y-3 pb-4 border-b border-[#1b2336]/10">
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight uppercase font-mono ${
          theme === 'dark' ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400' : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600'
        } bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(6,182,212,0.1)]`}>
          INDUSTRIAL SECTOR AI
        </h1>
        
        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} max-w-xl mx-auto leading-relaxed`}>
          An autonomic multi-agent orchestration portal for predictive maintenance. Stream live multi-sensor IoT telemetry, run autonomous RAG diagnostics, and optimize supply-chain parts routing in real time.
        </p>
      </div>

      {/* Guide/Info Cards (AI Prompts style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className={`relative backdrop-blur-md ${
          theme === 'dark' ? 'bg-white/[0.005] border-[#1b2336]/50 hover:border-cyan-500/20' : 'bg-white/50 border-slate-250 shadow-md hover:border-cyan-500/50'
        } rounded-xl p-4 transition-all duration-300 group overflow-hidden`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className={`w-4 h-4 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'} animate-pulse`} />
            <h3 className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'} uppercase tracking-wider`}>IoT Sensor Fusion</h3>
          </div>
          <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'} leading-relaxed font-sans font-normal`}>
            Correlates winding temp, vibration, discharge pressure, and coil current to detect machinery degradation early.
          </p>
        </div>

        <div className={`relative backdrop-blur-md ${
          theme === 'dark' ? 'bg-white/[0.005] border-[#1b2336]/50 hover:border-blue-500/20' : 'bg-white/50 border-slate-250 shadow-md hover:border-blue-500/50'
        } rounded-xl p-4 transition-all duration-300 group overflow-hidden`}>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'} uppercase tracking-wider`}>Autonomous Diagnostics</h3>
          </div>
          <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-655'} leading-relaxed font-sans font-normal`}>
            Specialized AI agents instantly isolate mechanical faults and calculate RUL by cross-referencing manuals via RAG.
          </p>
        </div>

        <div className={`relative backdrop-blur-md ${
          theme === 'dark' ? 'bg-white/[0.005] border-[#1b2336]/50 hover:border-emerald-500/20' : 'bg-white/50 border-slate-250 shadow-md hover:border-emerald-500/50'
        } rounded-xl p-4 transition-all duration-300 group overflow-hidden`}>
          <div className="flex items-center gap-2 mb-2">
            <Layers className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h3 className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'} uppercase tracking-wider`}>Graph-Based Sourcing</h3>
          </div>
          <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-655'} leading-relaxed font-sans font-normal`}>
            Traverses recursive material supply-chain graphs to bypass logistics bottlenecks and optimize procurement.
          </p>
        </div>

      </div>
    </>
  );
}
