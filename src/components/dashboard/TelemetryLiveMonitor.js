import { Activity, Cpu } from "lucide-react";

// Inline Sparkline Component using native React SVG paths
function Sparkline({ data, color = "#2563eb", width = 120, height = 36 }) {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data) * 1.05;
  const min = Math.min(...data) * 0.95;
  const range = max - min || 1;
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const latestVal = data[data.length - 1];
  const cx = width;
  const cy = height - ((latestVal - min) / range) * height;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle 
        cx={cx - 2} 
        cy={cy} 
        r="4" 
        fill={color}
        opacity="0.3"
      >
        <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle 
        cx={cx - 2} 
        cy={cy} 
        r="2.5" 
        fill={color}
      />
    </svg>
  );
}

export default function TelemetryLiveMonitor({
  theme,
  data,
  getStatusBadges,
  graphsPopupMachineId,
  setGraphsPopupMachineId,
  componentsPopupMachineId,
  setComponentsPopupMachineId
}) {
  return (
    <section id="zone-1" className="space-y-3 transition-all duration-500">
      <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex items-center space-x-2">
        <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
        <span>Zone 1: Telemetry Live Monitor (Fleet Grid)</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data?.machines.map((machine) => {
          const latest = data.telemetry[machine.id]?.[data.telemetry[machine.id].length - 1];
          const health = getStatusBadges(machine.status);
          const tempHistory = data.telemetry[machine.id]?.map(p => p.temperature) || [];
          const vibHistory = data.telemetry[machine.id]?.map(p => p.vibration) || [];
          
          const hasTemp = (machine.critical_thresholds?.temperature ?? 0) > 0;
          const hasVib = (machine.critical_thresholds?.vibration ?? 0) > 0;
          const hasPres = (machine.critical_thresholds?.pressure ?? 0) > 0;
          const hasCurr = (machine.critical_thresholds?.current ?? 0) > 0;

          return (
            <div key={machine.id} className={`${theme === 'dark' ? 'bg-[#0c0f17] border-[#182030] hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'} rounded-xl p-5 border transition-all duration-300 relative overflow-hidden group flex flex-col`}>
              <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden pointer-events-none">
                <div className={`absolute top-2.5 right-[-26px] transform rotate-45 text-center text-[9px] font-mono font-bold uppercase py-0.5 w-[90px] ${
                  machine.status === "Operational" ? "bg-emerald-500/10 text-emerald-400" :
                  machine.status === "Degraded" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                }`}>
                  {health.label}
                </div>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`font-mono font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{machine.name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider">{machine.id} · {machine.location}</span>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${health.bg} flex items-center space-x-1 mr-6`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${health.dot} ${machine.status !== "Operational" ? "animate-ping" : ""}`}></span>
                  <span>{machine.status.toUpperCase()}</span>
                </span>
              </div>

              {latest ? (
                <div className="space-y-4 font-mono">
                  {/* First Row: Temp & Vibration */}
                  {(hasTemp || hasVib) && (
                    <div className={`grid ${hasTemp && hasVib ? 'grid-cols-2' : 'grid-cols-1'} gap-4 border-b pb-4 ${theme === 'dark' ? 'border-[#182030]/60' : 'border-slate-100'}`}>
                      {hasTemp && (
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Winding Temp</div>
                          <div className={`text-xl font-bold mt-0.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {latest.temperature.toFixed(1)} <span className="text-xs text-slate-400 font-medium">°C</span>
                          </div>
                        </div>
                      )}
                      {hasVib && (
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Radial Vibration</div>
                          <div className={`text-xl font-bold mt-0.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {latest.vibration.toFixed(2)} <span className="text-xs text-slate-400 font-medium">mm/s</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Second Row: Pressure & Current */}
                  {(hasPres || hasCurr) && (
                    <div className={`grid ${hasPres && hasCurr ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                      {hasPres && (
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Discharge Pressure</span>
                          <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>{latest.pressure.toFixed(2)} Bar</span>
                        </div>
                      )}
                      {hasCurr && (
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Coil Amperage</span>
                          <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>{latest.current.toFixed(1)} A</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">No active telemetry signal.</div>
              )}

              {/* Action Buttons */}
              <div className={`mt-auto pt-4 border-t flex justify-end items-center space-x-2 z-10 ${theme === 'dark' ? 'border-[#182030]/40' : 'border-slate-100'}`}>
                <button 
                  onClick={() => setGraphsPopupMachineId(graphsPopupMachineId === machine.id ? null : machine.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded border transition-all duration-300 ${
                    graphsPopupMachineId === machine.id 
                      ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                      : (theme === 'dark' 
                          ? 'bg-slate-900/80 border-[#2b3548] text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-[#182030]' 
                          : 'bg-white border-slate-200 text-slate-505 hover:text-blue-600 hover:border-blue-300 hover:bg-slate-50 shadow-sm')
                  }`}
                  title="View Graphs"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono font-bold tracking-wider uppercase">Graphs</span>
                </button>

                <button 
                  onClick={() => setComponentsPopupMachineId(componentsPopupMachineId === machine.id ? null : machine.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded border transition-all duration-300 ${
                    componentsPopupMachineId === machine.id 
                      ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]' 
                      : (theme === 'dark' 
                          ? 'bg-slate-900/80 border-[#2b3548] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-[#182030]' 
                          : 'bg-white border-slate-200 text-slate-505 hover:text-cyan-600 hover:border-cyan-300 hover:bg-slate-50 shadow-sm')
                  }`}
                  title="View Components"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono font-bold tracking-wider uppercase">Parts</span>
                </button>
              </div>

              {/* Components Popup Overlay */}
              {componentsPopupMachineId === machine.id && (
                <div className={`absolute inset-0 z-20 flex flex-col p-5 backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-[#0c0f17]/95' : 'bg-white/95'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className={`font-mono text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-305' : 'text-slate-700'}`}>
                      Machine Components
                    </h4>
                    <button 
                      onClick={() => setComponentsPopupMachineId(null)}
                      className={`p-1 rounded-full ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-505 hover:text-slate-808 hover:bg-slate-200'}`}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {machine.components && machine.components.length > 0 ? (
                      machine.components.map((comp, idx) => {
                        let displayHealth = comp.health;
                        if (machine.status !== "Operational" && machine.critical_thresholds?.required_part_id === comp.id) {
                          displayHealth = machine.status === "Critical" ? 14 : 42;
                        }
                        return (
                          <div key={idx} className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-[#182030]/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className={`font-semibold text-xs truncate max-w-[80%] ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`} title={comp.name}>{comp.name}</div>
                              <div className={`text-[10px] font-mono font-bold ${displayHealth >= 90 ? 'text-emerald-500' : displayHealth >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                                {displayHealth}%
                              </div>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                              <div className={`h-1.5 rounded-full transition-all duration-1000 ${displayHealth >= 90 ? 'bg-emerald-500' : displayHealth >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${displayHealth}%` }}></div>
                            </div>
                            <div className={`text-[9px] mt-1.5 text-slate-500 font-mono tracking-wider`}>ID: {comp.id}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-500 text-center mt-10">No components data available.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Graphs Popup Overlay */}
              {graphsPopupMachineId === machine.id && (
                <div className={`absolute inset-0 z-20 flex flex-col p-5 backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-[#0c0f17]/95' : 'bg-white/95'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className={`font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${theme === 'dark' ? 'text-slate-305' : 'text-slate-700'}`}>
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span>24H Realtime Telemetry</span>
                    </h4>
                    <button 
                      onClick={() => setGraphsPopupMachineId(null)}
                      className={`p-1 rounded-full ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-505 hover:text-slate-808 hover:bg-slate-200'}`}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center space-y-8 pb-4">
                    {(hasTemp || hasVib) ? (
                      <>
                        {hasTemp && (
                          <div className="flex flex-col space-y-2">
                            <div className="text-[10px] font-mono tracking-widest text-slate-500 flex justify-between">
                              <span>WINDING TEMPERATURE</span>
                              <span style={{ color: health.sparkColor }} className="font-bold">{latest?.temperature?.toFixed(1)}°C</span>
                            </div>
                            <div className={`h-16 w-full rounded-lg border flex items-center justify-center p-2 ${theme === 'dark' ? 'bg-[#182030]/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                              <Sparkline data={tempHistory} color={health.sparkColor} width={220} height={50} />
                            </div>
                          </div>
                        )}
                        
                        {hasVib && (
                          <div className="flex flex-col space-y-2">
                            <div className="text-[10px] font-mono tracking-widest text-slate-500 flex justify-between">
                              <span>RADIAL VIBRATION</span>
                              <span className="text-blue-500">{latest?.vibration?.toFixed(2)}mm/s</span>
                            </div>
                            <div className={`h-16 w-full rounded-lg border flex items-center justify-center p-2 ${theme === 'dark' ? 'bg-[#182030]/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                              <Sparkline data={vibHistory} color="#3b82f6" width={220} height={50} />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-slate-555 text-center font-mono">No telemetry graphs available.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
