"use client";

import React from "react";
import { Trash, Plus, ArrowRight } from "lucide-react";

const SENSOR_PRESETS = {
  "winding_temp": { name: "Winding Temperature", min: 20.0, max: 90.0, current: 55.0, unit: "°C" },
  "vibration": { name: "Vibration", min: 0.1, max: 8.0, current: 1.8, unit: "mm/s" },
  "discharge_pressure": { name: "Discharge Pressure", min: 1.0, max: 6.5, current: 5.2, unit: "Bar" },
  "coil_current": { name: "Coil Current", min: 2.0, max: 15.0, current: 8.2, unit: "Amps" }
};

export default function CustomWorkspaceBuilder({
  theme,
  customMachines,
  setCustomMachines,
  handleCreateProject,
  seeding,
  hideSubmitButton = false
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {customMachines.map((machine, index) => (
          <div key={index} className={`border ${theme === 'dark' ? 'border-[#1b2336]/85 bg-[#05070a]/50' : 'border-slate-200 bg-slate-50'} p-5 rounded-2xl relative space-y-4 font-mono text-xs`}>
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
                  required
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

            {/* Per-Machine Sensors */}
            <div className="pt-4 mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold font-mono uppercase tracking-wider opacity-70">Applied Sensors</span>
                <button
                  type="button"
                  onClick={() => {
                    const newSensor = { name: "Custom Sensor", min: 0.0, max: 100.0, current: 50.0, unit: "", isPreset: "" };
                    setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, customSensors: [...(m.customSensors || []), newSensor] } : m));
                  }}
                  className="text-[9px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> ADD SENSOR
                </button>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {(machine.customSensors || []).map((sensor, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border relative space-y-2.5 ${
                    theme === 'dark' ? 'bg-[#0c0f17] border-[#1b2336]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {(machine.customSensors || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, customSensors: m.customSensors.filter((_, sIdx) => sIdx !== idx) } : m))}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-300 transition"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Preset Selection & Name */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold font-mono uppercase opacity-60">Type Preset</label>
                        <select
                          value={sensor.isPreset || ""}
                          onChange={(e) => {
                            const presetKey = e.target.value;
                            setCustomMachines(prev => prev.map((m, i) => {
                              if (i === index) {
                                const updatedSensors = [...(m.customSensors || [])];
                                if (presetKey && SENSOR_PRESETS[presetKey]) {
                                  updatedSensors[idx] = { ...SENSOR_PRESETS[presetKey], isPreset: presetKey };
                                } else {
                                  updatedSensors[idx] = { ...updatedSensors[idx], isPreset: "", name: "Custom Sensor" };
                                }
                                return { ...m, customSensors: updatedSensors };
                              }
                              return m;
                            }));
                          }}
                          className={`w-full px-2 py-1 rounded text-[10px] outline-none border focus:ring-1 focus:ring-cyan-500 transition-all ${
                            theme === 'dark' ? 'bg-[#0a0d16] border-[#182030] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <option value="">Custom (Type Name)</option>
                          <option value="winding_temp">Winding Temperature</option>
                          <option value="vibration">Vibration</option>
                          <option value="discharge_pressure">Discharge Pressure</option>
                          <option value="coil_current">Coil Current</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-bold font-mono uppercase opacity-60">Sensor Name</label>
                        <input
                          type="text"
                          disabled={!!sensor.isPreset}
                          value={sensor.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomMachines(prev => prev.map((m, i) => i === index ? {
                              ...m, customSensors: m.customSensors.map((s, sIdx) => sIdx === idx ? { ...s, name: val } : s)
                            } : m));
                          }}
                          className={`w-full px-2 py-1 rounded text-[10px] outline-none border focus:ring-1 focus:ring-cyan-500 transition-all ${
                            theme === 'dark' ? 'bg-[#0a0d16] border-[#182030] text-slate-200 disabled:opacity-50' : 'bg-white border-slate-200 text-slate-800 disabled:opacity-50'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Current, Min, Max values */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold font-mono uppercase opacity-60">Current</label>
                        <input
                          type="number"
                          step="any"
                          value={sensor.current}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCustomMachines(prev => prev.map((m, i) => i === index ? {
                              ...m, customSensors: m.customSensors.map((s, sIdx) => sIdx === idx ? { ...s, current: val } : s)
                            } : m));
                          }}
                          className={`w-full px-2 py-1 rounded text-[10px] outline-none border focus:ring-1 focus:ring-cyan-500 transition-all ${
                            theme === 'dark' ? 'bg-[#0a0d16] border-[#182030] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold font-mono uppercase opacity-60">Min Threshold</label>
                        <input
                          type="number"
                          step="any"
                          value={sensor.min}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCustomMachines(prev => prev.map((m, i) => i === index ? {
                              ...m, customSensors: m.customSensors.map((s, sIdx) => sIdx === idx ? { ...s, min: val } : s)
                            } : m));
                          }}
                          className={`w-full px-2 py-1 rounded text-[10px] outline-none border focus:ring-1 focus:ring-cyan-500 transition-all ${
                            theme === 'dark' ? 'bg-[#0a0d16] border-[#182030] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold font-mono uppercase opacity-60">Max Threshold</label>
                        <input
                          type="number"
                          step="any"
                          value={sensor.max}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCustomMachines(prev => prev.map((m, i) => i === index ? {
                              ...m, customSensors: m.customSensors.map((s, sIdx) => sIdx === idx ? { ...s, max: val } : s)
                            } : m));
                          }}
                          className={`w-full px-2 py-1 rounded text-[10px] outline-none border focus:ring-1 focus:ring-cyan-500 transition-all ${
                            theme === 'dark' ? 'bg-[#0a0d16] border-[#182030] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold font-mono uppercase opacity-60">Unit</label>
                        <input
                          type="text"
                          disabled={!!sensor.isPreset}
                          value={sensor.unit || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomMachines(prev => prev.map((m, i) => i === index ? {
                              ...m, customSensors: m.customSensors.map((s, sIdx) => sIdx === idx ? { ...s, unit: val } : s)
                            } : m));
                          }}
                          className={`w-full px-2 py-1 rounded text-[10px] outline-none border focus:ring-1 focus:ring-cyan-500 transition-all ${
                            theme === 'dark' ? 'bg-[#0a0d16] border-[#182030] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>



      <div className="flex justify-between items-center font-mono text-xs pt-4 border-t border-[#1b2336]/60">
        <button
          type="button"
          disabled={customMachines.length >= 3}
          onClick={() => setCustomMachines(prev => [
            ...prev,
            { id: `MCH-10${prev.length + 1}`, name: "", location: "", customSensors: [{ name: "Winding Temperature", min: 20.0, max: 90.0, current: 55.0, unit: "°C", isPreset: "winding_temp" }] }
          ])}
          className={`px-4 py-2.5 ${theme === 'dark' ? 'bg-[#090e18] border-[#1b2336] text-white hover:bg-slate-900/60' : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300 hover:text-slate-900'} rounded-xl transition-all font-bold flex items-center gap-1.5`}
        >
          <Plus className="w-4 h-4" /> Add Another Asset
        </button>
        
        {!hideSubmitButton && (
          <button
            disabled={seeding || customMachines.some(m => !m.name.trim())}
            onClick={() => handleCreateProject("custom")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]"
          >
            <span>Initialize & Launch Custom Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
