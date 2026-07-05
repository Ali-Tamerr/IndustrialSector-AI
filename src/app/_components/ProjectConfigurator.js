"use client";

import React from "react";
import { Plus, Sparkles, LayoutGrid } from "lucide-react";
import WelcomeHeader from "./WelcomeHeader";
import PresetSelector from "./PresetSelector";
import CustomWorkspaceBuilder from "./CustomWorkspaceBuilder";

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
        
        {/* Welcome Header and Cards */}
        <WelcomeHeader theme={theme} />

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
                  : "text-slate-655 hover:text-slate-850 hover:bg-slate-200/50 rounded-xl"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Build Custom Workspace
            </button>
          </div>
          
          <div className="p-4 md:p-6">
            {activeSetupTab === "presets" ? (
              <PresetSelector
                theme={theme}
                selectedTemplateId={selectedTemplateId}
                setSelectedTemplateId={setSelectedTemplateId}
                handleCreateProject={handleCreateProject}
              />
            ) : (
              <CustomWorkspaceBuilder
                theme={theme}
                customMachines={customMachines}
                setCustomMachines={setCustomMachines}
                handleCreateProject={handleCreateProject}
                seeding={seeding}
              />
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
