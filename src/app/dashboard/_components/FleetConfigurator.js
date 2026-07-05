import { Settings, Cpu, Database, LayoutGrid, Activity, Plus, Trash } from "lucide-react";

export default function FleetConfigurator({
  theme,
  showEditor,
  setShowEditor,
  editorTab,
  setEditorTab,
  editorMachines,
  setEditorMachines,
  editorInventory,
  setEditorInventory,
  editorNodes,
  setEditorNodes,
  editorEdges,
  setEditorEdges,
  handleLoadPreset,
  handleSaveConfig,
  savingConfig
}) {
  if (!showEditor) return null;

  return (
    <div className="fixed inset-0 z-55 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className={`w-full max-w-5xl rounded-2xl border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#0c0f17] border-[#182030] text-slate-350 shadow-[0_0_50px_rgba(6,182,212,0.15)]' : 'bg-white border-slate-200 text-slate-750'
      }`}>
        
        {/* Modal Header */}
        <div className={`border-b px-6 py-4 flex justify-between items-center ${
          theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]/80' : 'border-slate-105 bg-slate-50'
        }`}>
          <div>
            <h3 className={`font-mono text-sm font-bold uppercase tracking-wider flex items-center space-x-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
              <Settings className="w-5 h-5 text-cyan-400 animate-spin-slow" />
              <span>Visual Fleet & Graph Configurator</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Customize your factory machines, spare parts catalog, and supply chain routing nodes/edges</p>
          </div>
          <button 
            onClick={() => setShowEditor(false)}
            className={`text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-lg ${
              theme === 'dark' ? 'hover:bg-slate-800/45' : 'hover:bg-slate-100'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Presets Quick Load Bar inside modal */}
        <div className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono bg-cyan-950/[0.08] ${
          theme === 'dark' ? 'border-[#182030]/60 text-slate-400' : 'border-slate-150 text-slate-655'
        }`}>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">LOAD PRESET STRUCTURES:</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleLoadPreset("steel")}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-blue-955/20 border-blue-500/30 text-blue-400 hover:bg-blue-900/30'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Heavy Steel Mill
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset("petrochemical")}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-emerald-955/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Petrochemical Refinery
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset("automotive")}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-purple-955/20 border-purple-500/30 text-purple-400 hover:bg-purple-900/30'
                  : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Robotics Assembly
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset("empty")}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-205 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Clear to Empty (Zero)
            </button>
          </div>
        </div>

        {/* Modal Tabs Selector */}
        <div className={`flex border-b font-mono text-xs p-1 gap-1 ${
          theme === 'dark' ? 'border-[#182030]/80 bg-[#06080c]' : 'border-slate-200 bg-slate-50'
        }`}>
          {[
            { tabId: "machines", label: "Fleet Assets", icon: <Cpu className="w-3.5 h-3.5" /> },
            { tabId: "inventory", label: "Spare Inventory", icon: <Database className="w-3.5 h-3.5" /> },
            { tabId: "nodes", label: "Graph Nodes", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
            { tabId: "edges", label: "Graph Edges", icon: <Activity className="w-3.5 h-3.5" /> },
          ].map(t => (
            <button
              key={t.tabId}
              onClick={() => setEditorTab(t.tabId)}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold uppercase transition-all duration-200 flex items-center justify-center gap-1.5 ${
                editorTab === t.tabId
                  ? (theme === 'dark' 
                      ? "text-cyan-400 bg-cyan-950/25 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.05)]" 
                      : "text-cyan-600 bg-cyan-50 border border-cyan-200/50 shadow-inner") 
                  : "text-slate-505 hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-909/20"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* FLEET ASSETS TAB */}
          {editorTab === "machines" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Fleet Asset System Profiles ({editorMachines.length})</span>
                <button
                  type="button"
                  onClick={() => setEditorMachines(prev => [
                    ...prev,
                    { id: `MCH-10${prev.length + 1}`, name: `Asset ${prev.length + 1}`, location: "Bay 1 Assembly", thresholds: { temperature: 90.0, vibration: 8.0, pressure: 6.5, current: 15.0, required_part_id: "PART-001" } }
                  ])}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase flex items-center gap-1 transition-all duration-200 ${
                    theme === 'dark' ? 'bg-cyan-955/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.05)]' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-105'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Fleet Machine
                </button>
              </div>

              {editorMachines.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-505 italic font-mono">No machines defined in custom fleet database. Click "Add Fleet Machine" or load a preset.</div>
              ) : (
                <div className="space-y-4">
                  {editorMachines.map((m, idx) => (
                    <div key={idx} className={`border p-4 rounded-xl space-y-3 font-mono text-xs relative ${
                      theme === 'dark' ? 'border-[#1b2336]/60 bg-[#05070a]/40' : 'border-slate-205 bg-slate-50/50'
                    }`}>
                      <div className="flex justify-between items-center border-b pb-2 mb-2 border-slate-700/20">
                        <span className="text-cyan-500 font-bold">Fleet Asset #{idx + 1} Profile</span>
                        <button
                          type="button"
                          onClick={() => setEditorMachines(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 font-bold flex items-center gap-0.5"
                        >
                          <Trash className="w-3 h-3" /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[9px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Asset ID</label>
                          <input
                            type="text"
                            value={m.id}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, id: val } : item));
                            }}
                            className={`w-full rounded-lg p-2 outline-none text-xs ${
                              theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'
                            } border`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Name</label>
                          <input
                            type="text"
                            value={m.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                            }}
                            className={`w-full rounded-lg p-2 outline-none text-xs ${
                              theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-808 focus:border-cyan-500'
                            } border`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Bay Location</label>
                          <input
                            type="text"
                            value={m.location}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, location: val } : item));
                            }}
                            className={`w-full rounded-lg p-2 outline-none text-xs ${
                              theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-808'
                            } border`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Requires Spare Part</label>
                          <select
                            value={m.thresholds?.required_part_id || "PART-001"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, thresholds: { ...item.thresholds, required_part_id: val } } : item));
                            }}
                            className={`w-full rounded-lg p-2 outline-none text-xs ${
                              theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-808'
                            } border`}
                          >
                            {editorInventory.length === 0 ? (
                              <option value="PART-001">PART-001 (Default)</option>
                            ) : (
                              editorInventory.map(part => (
                                <option key={part.part_id} value={part.part_id}>{part.part_id} - {part.part_name}</option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="block text-[9px] text-slate-550 mb-1.5 uppercase font-bold tracking-wider">Operational Critical Limits Thresholds</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-0.5">Winding Temp limit (°C)</label>
                            <input
                              type="number"
                              value={m.thresholds?.temperature || 90.0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0.0;
                                setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, thresholds: { ...item.thresholds, temperature: val } } : item));
                              }}
                              className={`w-full rounded-lg p-1.5 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                              } border`}
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-0.5">Vibration limit (mm/s)</label>
                            <input
                              type="number"
                              value={m.thresholds?.vibration || 8.0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0.0;
                                setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, thresholds: { ...item.thresholds, vibration: val } } : item));
                              }}
                              className={`w-full rounded-lg p-1.5 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                              } border`}
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-0.5">Discharge Pres limit (Bar)</label>
                            <input
                              type="number"
                              value={m.thresholds?.pressure || 6.5}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0.0;
                                setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, thresholds: { ...item.thresholds, pressure: val } } : item));
                              }}
                              className={`w-full rounded-lg p-1.5 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                              } border`}
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-0.5">Coil Amps limit (A)</label>
                            <input
                              type="number"
                              value={m.thresholds?.current || 15.0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0.0;
                                setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, thresholds: { ...item.thresholds, current: val } } : item));
                              }}
                              className={`w-full rounded-lg p-1.5 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                              } border`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SPARE INVENTORY TAB */}
          {editorTab === "inventory" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Spare Parts Catalog ({editorInventory.length})</span>
                <button
                  type="button"
                  onClick={() => setEditorInventory(prev => [
                    ...prev,
                    { part_id: `PART-10${prev.length + 1}`, part_name: `Spare Part ${prev.length + 1}`, stock_level: 5, reorder_point: 2, cost: 150.00, location: "Warehouse A - Aisle 1" }
                  ])}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase flex items-center gap-1 transition-all duration-200 ${
                    theme === 'dark' ? 'bg-cyan-955/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.05)]' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-105'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Spare Part
                </button>
              </div>

              {editorInventory.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-505 italic font-mono">No spare parts defined. Click "Add Spare Part" or load a preset.</div>
              ) : (
                <div className="space-y-4">
                  {editorInventory.map((item, idx) => (
                    <div key={idx} className={`border p-4 rounded-xl grid grid-cols-1 md:grid-cols-7 gap-3 font-mono text-xs relative ${
                      theme === 'dark' ? 'border-[#1b2336]/60 bg-[#05070a]/40' : 'border-slate-205 bg-slate-50/50'
                    }`}>
                      <div>
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Part ID</label>
                        <input
                          type="text"
                          value={item.part_id}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, part_id: val } : p));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Part Name</label>
                        <input
                          type="text"
                          value={item.part_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, part_name: val } : p));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Stock Level</label>
                        <input
                          type="number"
                          value={item.stock_level}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, stock_level: val } : p));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Reorder Pt</label>
                        <input
                          type="number"
                          value={item.reorder_point}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, reorder_point: val } : p));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Unit Cost ($)</label>
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0.0;
                            setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, cost: val } : p));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        />
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div className="flex-1">
                          <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Location</label>
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, location: val } : p));
                            }}
                            className={`w-full rounded-lg p-2 outline-none ${
                              theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                            } border`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditorInventory(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 font-bold p-2.5 rounded-lg border border-red-500/10 hover:bg-red-500/10"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GRAPH NODES TAB */}
          {editorTab === "nodes" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Supply Chain Nodes ({editorNodes.length})</span>
                <button
                  type="button"
                  onClick={() => setEditorNodes(prev => [
                    ...prev,
                    { id: `SUP-10${prev.length + 1}`, name: `Supplier ${prev.length + 1}`, type: "Supplier", risk: 0.15, email: "sales@supplier.com" }
                  ])}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase flex items-center gap-1 transition-all duration-200 ${
                    theme === 'dark' ? 'bg-cyan-955/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.05)]' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-105'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Graph Node
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editorNodes.map((n, idx) => (
                  <div key={idx} className={`border p-4 rounded-xl space-y-3 font-mono text-xs relative ${
                    theme === 'dark' ? 'border-[#1b2336]/60 bg-[#05070a]/40' : 'border-slate-205 bg-slate-50/50'
                  }`}>
                    <div className="flex justify-between items-center border-b pb-1.5 mb-1.5 border-slate-700/20">
                      <span className="text-cyan-500 font-bold uppercase text-[10px]">Node #{idx + 1} Profile</span>
                      <button
                        type="button"
                        onClick={() => setEditorNodes(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 font-bold flex items-center gap-0.5"
                      >
                        <Trash className="w-3 h-3" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8.5px] text-slate-555 mb-1 uppercase font-bold tracking-wider">Node ID (Tag)</label>
                        <input
                          type="text"
                          value={n.id}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditorNodes(prev => prev.map((item, i) => i === idx ? { ...item, id: val } : item));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-555 mb-1 uppercase font-bold tracking-wider">Node Name</label>
                        <input
                          type="text"
                          value={n.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditorNodes(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-555 mb-1 uppercase font-bold tracking-wider">Node Type</label>
                        <select
                          value={n.type}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditorNodes(prev => prev.map((item, i) => i === idx ? { ...item, type: val } : item));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        >
                          <option value="Supplier">Supplier (Tier 1)</option>
                          <option value="Part">Spare Part Component</option>
                          <option value="Material">Raw Material (Tier 2)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-555 mb-1 uppercase font-bold tracking-wider">Supplier Risk (0.0 to 1.0)</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={n.risk || 0.0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0.0;
                            setEditorNodes(prev => prev.map((item, i) => i === idx ? { ...item, risk: val } : item));
                          }}
                          disabled={n.type === "Part"}
                          className={`w-full rounded-lg p-2 outline-none ${
                            n.type === "Part" ? "bg-slate-850/40 text-slate-500 cursor-not-allowed border-slate-800" :
                            (theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808')
                          } border`}
                        />
                      </div>
                    </div>
                    {n.type === "Supplier" && (
                      <div>
                        <label className="block text-[8.5px] text-slate-555 mb-1 uppercase font-bold tracking-wider">Contact Email</label>
                        <input
                          type="email"
                          value={n.email || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditorNodes(prev => prev.map((item, i) => i === idx ? { ...item, email: val } : item));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                          placeholder="sales@supplier.com"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GRAPH EDGES TAB */}
          {editorTab === "edges" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Supplier Graph Routing Edges ({editorEdges.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    const defaultSource = editorNodes.find(n => n.type === "Supplier")?.id || "SUP-001";
                    const defaultTarget = editorNodes.find(n => n.type === "Part")?.id || "PART-001";
                    setEditorEdges(prev => [
                      ...prev,
                      { source: defaultSource, target: defaultTarget, relationship: "SUPPLIES", transit: 5, price: 200.00 }
                    ]);
                  }}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase flex items-center gap-1 transition-all duration-200 ${
                    theme === 'dark' ? 'bg-cyan-955/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.05)]' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-105'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Graph Connection (Edge)
                </button>
              </div>

              {editorEdges.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-555 italic font-mono">No routing connections mapped in the database. Click "Add Graph Connection" or load a preset.</div>
              ) : (
                <div className="space-y-4">
                  {editorEdges.map((e, idx) => (
                    <div key={idx} className={`border p-4 rounded-xl grid grid-cols-1 md:grid-cols-6 gap-3 font-mono text-xs relative ${
                      theme === 'dark' ? 'border-[#1b2336]/60 bg-[#05070a]/40' : 'border-slate-202 bg-slate-50/50'
                    }`}>
                      <div>
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Source (From)</label>
                        <select
                          value={e.source}
                          onChange={(val) => {
                            const v = val.target.value;
                            setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, source: v } : item));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        >
                          {editorNodes.map(node => (
                            <option key={node.id} value={node.id}>{node.id} ({node.name})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Target (To)</label>
                        <select
                          value={e.target}
                          onChange={(val) => {
                            const v = val.target.value;
                            setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, target: v } : item));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        >
                          {editorNodes.map(node => (
                            <option key={node.id} value={node.id}>{node.id} ({node.name})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Relationship</label>
                        <select
                          value={e.relationship}
                          onChange={(val) => {
                            const v = val.target.value;
                            setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, relationship: v } : item));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        >
                          <option value="SUPPLIES">SUPPLIES (Supplier &rarr; Part)</option>
                          <option value="USED_IN">USED_IN (Material &rarr; Part)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Transit Lead Time (Days)</label>
                        <input
                          type="number"
                          value={e.transit}
                          onChange={(val) => {
                            const v = parseInt(val.target.value) || 0;
                            setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, transit: v } : item));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-550 mb-1 uppercase font-bold tracking-wider">Price / Cost ($)</label>
                        <input
                          type="number"
                          value={e.price}
                          onChange={(val) => {
                            const v = parseFloat(val.target.value) || 0.0;
                            setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, price: v } : item));
                          }}
                          className={`w-full rounded-lg p-2 outline-none ${
                            theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                          } border`}
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() => setEditorEdges(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 font-bold p-2.5 rounded-lg border border-red-500/10 hover:bg-red-500/10"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className={`border-t px-6 py-4 flex justify-between items-center font-mono text-xs ${
          theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]/90' : 'border-slate-105 bg-slate-50'
        }`}>
          <div className="text-[10px] text-slate-505 uppercase tracking-widest font-bold">
            {savingConfig ? "WRITING TO LOCAL STORAGE..." : "STANDING BY TO COMMIT CONFIG"}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowEditor(false)}
              className={`px-4 py-2 rounded-xl transition-all duration-200 border ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/50'
              }`}
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all duration-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50"
            >
              {savingConfig ? "Synchronizing..." : "Apply & Sync to Local Storage"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
