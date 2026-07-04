"use client";

import React from "react";
import { Database, Plus, LayoutGrid, Play, Trash } from "lucide-react";

export default function WorkspaceSidebar({
  projects,
  activeProjectId,
  activeProjectTabs,
  theme,
  handleLaunchProject,
  handleDeleteProject,
  setActiveProjectId,
  updateTabActiveProject,
  setProjectNameInput,
  generateDefaultName,
  activeSetupTab,
  selectedTemplateId
}) {
  return (
    <div className="lg:col-span-4 flex flex-col h-full min-h-0">
      <div className={`border rounded-2xl p-5 flex flex-col h-full min-h-0 backdrop-blur-md transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#080b11]/50 border-[#1b2336]/60 text-slate-300 shadow-[0_0_30px_rgba(0,0,0,0.2)]' 
          : 'bg-white/80 border-slate-200 text-slate-700 shadow-xl shadow-slate-100'
      }`}>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className={`text-[10px] font-bold tracking-widest uppercase font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'} flex items-center space-x-2`}>
              <Database className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'} animate-pulse`} />
              <span>Saved Workspaces</span>
            </h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
            } border`}>
              {projects.length} Total
            </span>
          </div>
          
          <button
            onClick={() => {
              setActiveProjectId(null);
              localStorage.removeItem("activeProjectId");
              updateTabActiveProject(null);
              setProjectNameInput("");
            }}
            className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 border hover:scale-[1.01] ${
              theme === 'dark'
                ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                : 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 hover:border-cyan-700 shadow-md shadow-cyan-100/50'
            }`}
          >
            <Plus className="w-4 h-4" />
            NEW WORKSPACE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {projects.length === 0 ? (
            <div className="text-center py-16 opacity-60 space-y-3">
              <LayoutGrid className="w-10 h-10 mx-auto text-cyan-400/40 animate-pulse" />
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider">No Saved Workspaces</p>
              <p className="text-[11px] font-sans font-normal leading-relaxed">
                Select a preset template or configure a custom fleet on the right to spin up your control tower.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {projects.map((proj) => {
                const isProjActive = Object.values(activeProjectTabs).some(entry => entry && entry.projectId === proj.id && (Date.now() - entry.lastActive < 15000)) || activeProjectId === proj.id;
                let details = "";
                if (proj.type === "template") {
                  if (proj.templateId === "steel") details = "Steel Complex • 3 pdm assets";
                  else if (proj.templateId === "petrochemical") details = "Refinery • 3 pdm assets";
                  else if (proj.templateId === "automotive") details = "Robotics • joint torque";
                } else {
                  details = `Custom Fleet • ${proj.customMachines?.length || 0} pdm asset(s)`;
                }

                return (
                  <div 
                    key={proj.id}
                    onClick={() => handleLaunchProject(proj)}
                    className={`border cursor-pointer transition-all duration-300 p-4 rounded-xl relative group overflow-hidden flex flex-col justify-between hover:scale-[1.015] ${
                      isProjActive
                        ? (theme === 'dark' ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-cyan-500 bg-cyan-50/30 shadow-md')
                        : (theme === 'dark' ? 'border-[#1b2336]/60 bg-[#0c0f17]/30 hover:border-slate-600 hover:bg-[#0c0f17]/55' : 'bg-slate-50 border-slate-200 hover:border-slate-305 hover:bg-slate-100')
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          proj.type === "template"
                            ? (theme === 'dark' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-600 bg-blue-50 border-blue-200')
                            : (theme === 'dark' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-purple-600 bg-purple-50 border-purple-200')
                        } border`}>
                          {proj.type === "template" ? `${proj.templateId}` : "CUSTOM"}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <h3 className={`text-xs font-bold font-mono tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-cyan-400 transition-colors truncate`}>
                        {proj.name}
                      </h3>

                      <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-550'} truncate font-sans font-normal`}>
                        {details}
                      </p>
                    </div>

                    <div className={`mt-3 pt-3 border-t flex justify-between items-center font-mono text-[10px] ${theme === 'dark' ? 'border-[#1b2336]/40' : 'border-slate-150'}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLaunchProject(proj); }}
                        className={`font-bold flex items-center gap-1 transition-all ${
                          isProjActive
                            ? 'text-emerald-400'
                            : 'text-cyan-400 group-hover:text-cyan-300'
                        }`}
                      >
                        <Play className="w-3 h-3" />
                        <span>{isProjActive ? "LAUNCHED" : "LAUNCH"}</span>
                      </button>

                      <button
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        className="text-red-405 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-all"
                        title="Delete Environment"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
