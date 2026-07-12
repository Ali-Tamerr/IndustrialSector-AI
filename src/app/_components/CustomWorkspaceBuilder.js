"use client";

import React from "react";
import { Trash, Plus, ArrowRight } from "lucide-react";

export default function CustomWorkspaceBuilder({
  theme,
  customMachines,
  setCustomMachines,
  handleCreateProject,
  seeding
}) {
  return (
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
                <label className="block text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Asset ID Tag</label>
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
                <label className="block text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Equipment Name</label>
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
                <label className="block text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Bay Location (optional)</label>
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
              <span className="block text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-wider">Operational Critical Limits Thresholds</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-500 mb-1 font-bold">Winding Temp (°C)</label>
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
                  <label className="block text-[9px] text-slate-500 mb-1 font-bold">Vibration (mm/s)</label>
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
                  <label className="block text-[9px] text-slate-500 mb-1 font-bold">Discharge Pres (Bar)</label>
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
                  <label className="block text-[9px] text-slate-500 mb-1 font-bold">Coil Current (Amps)</label>
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
          disabled={seeding || customMachines.some(m => !m.name.trim())}
          onClick={() => handleCreateProject("custom")}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]"
        >
          <span>Initialize & Launch Custom Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
