"use client";

import React from "react";
import { Activity, Cpu, Layers, Settings, Database, ArrowRight, Plus, Trash, Sparkles, Building, LayoutGrid } from "lucide-react";

export default function ProjectConfigurator({
  theme,
  projectNameInput,
  setProjectNameInput,
  generateDefaultName,
  activeSetupTab,
  setActiveSetupTab,
  selectedTemplateId,
  setSelectedTemplateId,
  customMachines,
  setCustomMachines,
  handleCreateProject,
  seeding
}) {
  return (
    <div className="lg:col-span-8 flex flex-col h-full min-h-0">
      <div className={`border rounded-2xl p-5 md:p-8 flex flex-col space-y-6 h-full min-h-0 backdrop-blur-md transition-all duration-300 overflow-y-auto custom-scrollbar ${
        theme === 'dark' 
          ? 'bg-[#080b11]/30 border-[#1b2336]/40 text-slate-300' 
          : 'bg-white/60 border-slate-200 text-slate-700 shadow-xl shadow-slate-100'
      }`}>
        
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
            <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'} leading-relaxed font-sans font-normal`}>
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
            <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'} leading-relaxed font-sans font-normal`}>
              Traverses recursive material supply-chain graphs to bypass logistics bottlenecks and optimize procurement.
            </p>
          </div>

        </div>

        {/* Project Configurator Section */}
        <div className={`${theme === 'dark' ? 'bg-[#080b11]/90 border-[#1b2336]/85' : 'bg-white/80 border-slate-200 shadow-lg'} border rounded-2xl overflow-hidden`}>
          
          {/* Project Naming Input Bar */}
          <div className={`p-4 md:p-6 border-b ${theme === 'dark' ? 'border-[#1b2336]/80 bg-[#06080c]/50' : 'border-slate-200 bg-slate-50'} space-y-4`}>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 mb-2 uppercase">
                  Configure Workspace Name
                </label>
                <input
                  type="text"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  placeholder="Enter project name or leave blank for high-tech auto-naming..."
                  className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-xl p-3 outline-none transition-all font-mono text-xs`}
                />
              </div>
              <button
                type="button"
                onClick={() => setProjectNameInput(generateDefaultName(activeSetupTab === "presets" ? "template" : "custom", selectedTemplateId))}
                className={`px-4 py-3 rounded-xl border font-mono text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                    : 'bg-cyan-100 border-cyan-300 text-cyan-800 hover:bg-cyan-200/80 shadow-sm'
                }`}
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                Generate Name
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex border-b ${theme === 'dark' ? 'border-[#1b2336]/80 bg-[#06080c]' : 'border-slate-250 bg-slate-100/60'} font-mono text-[10px] md:text-xs p-1 gap-1`}>
            <button 
              onClick={() => setActiveSetupTab("presets")}
              className={`flex-1 py-3 px-2 rounded-xl font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                activeSetupTab === "presets" 
                  ? (theme === 'dark' 
                      ? "text-cyan-400 bg-cyan-950/25 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]" 
                      : "text-cyan-800 bg-cyan-200/80 border border-cyan-400/60 shadow-sm") 
                  : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/50 rounded-xl"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Select Factory Template
            </button>
            <button 
              onClick={() => setActiveSetupTab("custom")}
              className={`flex-1 py-3 px-2 rounded-xl font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                activeSetupTab === "custom" 
                  ? (theme === 'dark' 
                      ? "text-cyan-400 bg-cyan-950/25 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]" 
                      : "text-cyan-800 bg-cyan-200/80 border border-cyan-400/60 shadow-sm") 
                  : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/50 rounded-xl"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Build Custom Workspace
            </button>
          </div>
          
          <div className="p-4 md:p-6">
            {activeSetupTab === "presets" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  
                  <div 
                    onClick={() => setSelectedTemplateId("steel")}
                    className={`border ${
                      selectedTemplateId === "steel"
                        ? (theme === 'dark' ? 'border-cyan-500 bg-cyan-950/15 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-cyan-500 bg-cyan-50/20 shadow-md')
                        : (theme === 'dark' 
                            ? 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-blue-500/50 hover:bg-blue-950/[0.04]' 
                            : 'border-slate-200 bg-slate-50/50 hover:border-blue-500 hover:bg-blue-50/20 shadow-sm')
                    } p-5 rounded-2xl hover:shadow-[0_0_30px_rgba(59,130,246,0.05)] cursor-pointer group transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px]`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Building className="w-20 h-20 text-blue-400" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-mono font-bold ${theme === 'dark' ? 'text-blue-400 bg-blue-500/10 border-blue-500/25' : 'text-blue-600 bg-blue-50 border-blue-200'} px-2 py-0.5 rounded uppercase tracking-wider`}>STEEL_MILL</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 group-hover:animate-ping"></span>
                      </div>
                      <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-blue-500 transition-colors`}>Heavy Steel Rolling Mill</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                        Baseline fleet consisting of Rotary Gear Pumps, Industrial Exhaust Fans, and Pneumatic Compressors. Optimized for testing ball-bearing degradation.
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-500">
                      <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 3 pdm assets</span>
                      <span className="text-blue-555 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">SELECT MODULE <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedTemplateId("petrochemical")}
                    className={`border ${
                      selectedTemplateId === "petrochemical"
                        ? (theme === 'dark' ? 'border-cyan-500 bg-cyan-950/15 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-cyan-500 bg-cyan-50/20 shadow-md')
                        : (theme === 'dark' 
                            ? 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-emerald-500/50 hover:bg-emerald-950/[0.04]' 
                            : 'border-slate-200 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/20 shadow-sm')
                    } p-5 rounded-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] cursor-pointer group transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px]`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Activity className="w-20 h-20 text-emerald-400" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-mono font-bold ${theme === 'dark' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' : 'text-emerald-600 bg-emerald-50 border-emerald-200'} px-2 py-0.5 rounded uppercase tracking-wider`}>HYDROCRACKER</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:animate-ping"></span>
                      </div>
                      <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-emerald-500 transition-colors`}>Petrochemical Refinery</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                        Gas turbines, high-pressure gaskets, and transfer pumps. Features specialized oil & gas RAG manuals and Houston fast seal logistics routing.
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-500">
                      <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 3 pdm assets</span>
                      <span className="text-emerald-555 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">SELECT MODULE <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedTemplateId("automotive")}
                    className={`border ${
                      selectedTemplateId === "automotive"
                        ? (theme === 'dark' ? 'border-cyan-500 bg-cyan-950/15 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-cyan-500 bg-cyan-50/20 shadow-md')
                        : (theme === 'dark' 
                            ? 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-purple-500/50 hover:bg-purple-950/[0.04]' 
                            : 'border-slate-200 bg-slate-50/50 hover:border-purple-500 hover:bg-purple-50/20 shadow-sm')
                    } p-5 rounded-2xl hover:shadow-[0_0_30px_rgba(168,85,247,0.05)] cursor-pointer group transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px]`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Cpu className="w-20 h-20 text-purple-400" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-mono font-bold ${theme === 'dark' ? 'text-purple-400 bg-purple-500/10 border-purple-500/25' : 'text-purple-600 bg-purple-50 border-purple-200'} px-2 py-0.5 rounded uppercase tracking-wider`}>ROBOTICS</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 group-hover:animate-ping"></span>
                      </div>
                      <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-purple-500 transition-colors`}>6-Axis Assembly Robotics</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                        Robot joint gearboxes, painting line drives, and assembly cells. Optimized for testing high-precision harmonic gear fault diagnostic routines.
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-500">
                      <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 3 pdm assets</span>
                      <span className="text-purple-555 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">SELECT MODULE <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedTemplateId("blank")}
                    className={`border ${
                      selectedTemplateId === "blank"
                        ? (theme === 'dark' ? 'border-cyan-500 bg-cyan-950/15 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-cyan-500 bg-cyan-50/20 shadow-md')
                        : (theme === 'dark' 
                            ? 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-slate-500/50 hover:bg-slate-950/[0.04]' 
                            : 'border-slate-200 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50/20 shadow-sm')
                    } p-5 rounded-2xl hover:shadow-[0_0_30px_rgba(100,116,139,0.05)] cursor-pointer group transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px]`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Settings className="w-20 h-20 text-slate-400" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-mono font-bold ${theme === 'dark' ? 'text-slate-400 bg-slate-500/10 border-slate-500/25' : 'text-slate-650 bg-slate-50 border-slate-200'} px-2 py-0.5 rounded uppercase tracking-wider`}>BLANK_SPACE</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:animate-ping"></span>
                      </div>
                      <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-slate-400 transition-colors`}>Truly Empty Workspace</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                        Initialize a completely blank dashboard. No pre-seeded machinery, telemetry streams, or graphs. Build your entire fleet from scratch.
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-500">
                      <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 0 pdm assets</span>
                      <span className="text-slate-555 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">SELECT MODULE <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </div>

                {/* Provision Preset Action Button */}
                <div className="flex justify-end pt-4 border-t border-[#1b2336]/60">
                  <button
                    onClick={() => handleCreateProject("template")}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]"
                  >
                    <span>Create & Launch Preset Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {customMachines.map((machine, index) => (
                    <div key={index} className={`border ${theme === 'dark' ? 'border-[#1b2336]/80 bg-[#05070a]/50' : 'border-slate-200 bg-slate-50'} p-5 rounded-2xl relative space-y-4 font-mono text-xs`}>
                      <div className="flex justify-between items-center border-b border-[#1b2336]/60 pb-3">
                        <span className="text-cyan-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
                          Asset #{index + 1} Profile
                        </span>
                        
                        {customMachines.length > 1 && (
                          <button 
                            onClick={() => setCustomMachines(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-550 mb-1.5 uppercase font-bold tracking-wider">Asset ID Tag</label>
                          <input 
                            type="text" 
                            value={machine.id} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, id: val } : m));
                            }}
                            className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-xl p-2.5 outline-none transition-all font-mono`}
                            placeholder="e.g. MCH-101"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-550 mb-1.5 uppercase font-bold tracking-wider">Equipment Name</label>
                          <input 
                            type="text" 
                            value={machine.name} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, name: val } : m));
                            }}
                            className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-xl p-2.5 outline-none transition-all font-sans`}
                            placeholder="e.g. Conveyor Belt Motor A"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-550 mb-1.5 uppercase font-bold tracking-wider">Bay Location</label>
                          <input 
                            type="text" 
                            value={machine.location} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, location: val } : m));
                            }}
                            className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-xl p-2.5 outline-none transition-all font-sans`}
                            placeholder="e.g. Bay 4 - Extraction Line"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="block text-[10px] text-slate-550 mb-2 uppercase font-bold tracking-wider">Operational Critical Limits Thresholds</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[9px] text-slate-550 mb-1 font-bold">Winding Temp (°C)</label>
                            <input 
                              type="number" 
                              value={machine.thresholds.temperature} 
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : (parseFloat(e.target.value) ?? 0);
                                setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, thresholds: { ...m.thresholds, temperature: val } } : m));
                              }}
                              className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-lg p-2 outline-none focus:border-cyan-500`}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-550 mb-1 font-bold">Vibration (mm/s)</label>
                            <input 
                              type="number" 
                              value={machine.thresholds.vibration} 
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : (parseFloat(e.target.value) ?? 0);
                                setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, thresholds: { ...m.thresholds, vibration: val } } : m));
                              }}
                              className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-lg p-2 outline-none focus:border-cyan-500`}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-550 mb-1 font-bold">Discharge Pres (Bar)</label>
                            <input 
                              type="number" 
                              value={machine.thresholds.pressure} 
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : (parseFloat(e.target.value) ?? 0);
                                setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, thresholds: { ...m.thresholds, pressure: val } } : m));
                              }}
                              className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-lg p-2 outline-none focus:border-cyan-500`}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-550 mb-1 font-bold">Coil Current (Amps)</label>
                            <input 
                              type="number" 
                              value={machine.thresholds.current} 
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : (parseFloat(e.target.value) ?? 0);
                                setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, thresholds: { ...m.thresholds, current: val } } : m));
                              }}
                              className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-lg p-2 outline-none focus:border-cyan-500`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center font-mono text-xs pt-4 border-t border-[#1b2336]/60">
                  <button
                    disabled={customMachines.length >= 3}
                    onClick={() => setCustomMachines(prev => [
                      ...prev,
                      { id: `MCH-10${prev.length + 1}`, name: "", location: "", thresholds: { temperature: 90, vibration: 8, pressure: 6.5, current: 15 } }
                    ])}
                    className={`px-4 py-2.5 ${theme === 'dark' ? 'bg-[#090e18] border-[#1b2336] text-white hover:bg-slate-900/60' : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300 hover:text-slate-900'} rounded-xl transition-all font-bold flex items-center gap-1.5`}
                  >
                    <Plus className="w-4 h-4" /> Add Another Asset
                  </button>
                  
                  <button
                    disabled={seeding || customMachines.some(m => !m.name.trim() || !m.location.trim())}
                    onClick={() => handleCreateProject("custom")}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]"
                  >
                    <span>Initialize & Launch Custom Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
