"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Activity, 
  Cpu, 
  Layers, 
  Settings, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Inbox, 
  Mail, 
  HelpCircle,
  Play,
  RotateCcw
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [thoughts, setThoughts] = useState([
    { id: 1, agent: "System", type: "info", text: "Autonomous Control Tower Initialized. Scanning network..." },
    { id: 2, agent: "System", type: "info", text: "PostgreSQL relational & vector databases online. Standing by..." }
  ]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedSupplierNode, setSelectedSupplierNode] = useState(null);
  const thoughtsEndRef = useRef(null);

  // Core API Poller
  const refreshData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (err) {
      console.error("[UI] Polling failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 6000); // Poll every 6s for dynamic changes
    return () => clearInterval(interval);
  }, []);

  // Auto scroll console terminal
  useEffect(() => {
    if (thoughtsEndRef.current) {
      thoughtsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [thoughts]);

  // Trigger Anomaly simulation
  const handleSimulation = async () => {
    setSimulating(true);
    setThoughts((prev) => [
      ...prev,
      { id: Date.now(), agent: "Simulator", type: "warning", text: "Simulating stator coil winding overload on Machine 2..." }
    ]);

    try {
      const res = await fetch(`${API_BASE}/api/simulate`, { method: "POST" });
      if (res.ok) {
        const payload = await res.json();
        
        // Dynamic typing timeline for thoughts terminal
        if (payload.thoughts_log) {
          let delay = 200;
          payload.thoughts_log.forEach((logLine) => {
            if (!logLine.trim()) return;
            
            setTimeout(() => {
              let agent = "System";
              let text = logLine;
              let type = "info";
              
              const match = logLine.match(/^\[(.*?)\]\s*(.*)/);
              if (match) {
                agent = match[1];
                text = match[2];
                if (agent.includes("Anomaly") || text.includes("WARNING")) type = "warning";
                else if (agent.includes("Diagnostic") || text.includes("Diagnosed")) type = "diagnostic";
                else if (agent.includes("Planning") || text.includes("Inventory")) type = "planning";
                else if (agent.includes("Sourcing") || agent.includes("Graph") || text.includes("route")) type = "sourcing";
              }
              
              setThoughts((prev) => [
                ...prev,
                { id: Date.now() + Math.random(), agent, type, text }
              ]);
            }, delay);
            delay += 350;
          });
        }
      }
      
      // Pull fresh DB state immediately after execution completes
      await refreshData();
    } catch (err) {
      console.error("[UI] Simulation failed:", err);
      setThoughts((prev) => [
        ...prev,
        { id: Date.now(), agent: "System", type: "error", text: `Simulation failure: ${err.message}` }
      ]);
    } finally {
      setSimulating(false);
    }
  };

  // Status badges configurations
  const getStatusBadges = (status) => {
    switch (status) {
      case "Operational":
        return { label: "Stable", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400", sparkColor: "#10b981" };
      case "Degraded":
        return { label: "Warning", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400", sparkColor: "#f59e0b" };
      case "Critical":
        return { label: "Anomaly", bg: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400", sparkColor: "#ef4444" };
      default:
        return { label: "Inactive", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20", dot: "bg-slate-400", sparkColor: "#64748b" };
    }
  };

  // Helper to extract automated emails from the text fields
  const getEmailDraftContent = (rootCause) => {
    if (!rootCause) return null;
    const emailHeader = "Subject: URGENT:";
    const idx = rootCause.indexOf(emailHeader);
    if (idx !== -1) {
      const emailSection = rootCause.substring(idx);
      const lines = emailSection.split("\n");
      const subject = lines[0].replace("Subject: ", "");
      const to = lines[1].replace("To: ", "");
      const from = lines[2].replace("From: ", "");
      const date = lines[3].replace("Date: ", "");
      const body = lines.slice(5).join("\n");
      return { to, from, subject, date, body };
    }
    return null;
  };

  // Determine graph states
  const isM2Anomaly = useMemo(() => {
    if (!data) return false;
    const m2 = data.machines.find(m => m.id === "MCH-002");
    return m2 && m2.status === "Critical";
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0d13] text-blue-500 font-mono">
        <Activity className="h-10 w-10 animate-spin mb-4" />
        <div className="animate-pulse tracking-widest text-xs">SYNCHRONIZING CONTROL TOWER METRICS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080c] pb-12 font-sans select-none text-slate-300">
      
      {/* Dynamic Header */}
      <header className="border-b border-[#182030] bg-[#0c0f17]/95 px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="h-8.5 w-8.5 bg-blue-600/10 rounded border border-blue-500/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h1 className="font-mono text-[16px] font-extrabold tracking-wider text-white flex items-center">
              AUTONOMIC INDUSTRIAL CONTROL TOWER
              <span className="ml-3 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">AGENT_ORCHESTRATOR</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Predictive Maintenance & Supply Chain Sourcing Graph</p>
          </div>
        </div>

        <div className="flex items-center space-x-5">
          <div className="hidden lg:flex flex-col text-right font-mono text-[10px]">
            <span className="text-slate-500">FLEET PERFORMANCE</span>
            <span className="text-emerald-400 font-bold tracking-widest">99.78% RESILIENT</span>
          </div>

          <button
            onClick={handleSimulation}
            disabled={simulating}
            className={`px-4 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-2 ${
              simulating
                ? "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white"
            } shadow-[0_0_15px_rgba(239,68,68,0.03)]`}
          >
            <Play className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`} />
            <span>{simulating ? "PROCESSING AGENTS..." : "Simulate Bearing Failure on Machine 2"}</span>
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Zone 1: Telemetry Live Monitor */}
        <section className="space-y-3">
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

              return (
                <div key={machine.id} className="bg-[#0c0f17] border border-[#182030] rounded-xl p-5 hover:border-slate-700 transition-all duration-300 relative overflow-hidden group">
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
                      <h3 className="font-mono text-white font-bold tracking-wide">{machine.name}</h3>
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider">{machine.id} · {machine.location}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${health.bg} flex items-center space-x-1 mr-6`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${health.dot} ${machine.status !== "Operational" ? "animate-ping" : ""}`}></span>
                      <span>{machine.status.toUpperCase()}</span>
                    </span>
                  </div>

                  {latest ? (
                    <div className="space-y-4 font-mono">
                      <div className="grid grid-cols-2 gap-4 border-b border-[#182030]/60 pb-4">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Winding Temp</div>
                          <div className="text-xl font-bold text-slate-200 mt-0.5">
                            {latest.temperature.toFixed(1)} <span className="text-xs text-slate-400 font-medium">°C</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Radial Vibration</div>
                          <div className="text-xl font-bold text-slate-200 mt-0.5">
                            {latest.vibration.toFixed(2)} <span className="text-xs text-slate-400 font-medium">mm/s</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Discharge Pressure</span>
                          <span className="text-xs font-bold text-slate-300">{latest.pressure.toFixed(2)} Bar</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Coil Amperage</span>
                          <span className="text-xs font-bold text-slate-300">{latest.current.toFixed(1)} A</span>
                        </div>
                      </div>

                      {/* Sparkline trends */}
                      <div className="mt-4 pt-4 border-t border-[#182030]/40 flex justify-between items-center">
                        <div className="text-[9px] text-slate-500 font-bold leading-tight">
                          <div>24H REALTIME GRAPH</div>
                          <div className="text-slate-400 mt-0.5">TEMP + VIB</div>
                        </div>
                        <div className="h-9 opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                          <Sparkline data={tempHistory} color={health.sparkColor} width={70} height={32} />
                          <Sparkline data={vibHistory} color="#2563eb" width={70} height={32} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">No active telemetry signal.</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Console / Graph Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Zone 2: Thoughts Stream Terminal */}
          <section className="lg:col-span-5 space-y-3 flex flex-col">
            <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Zone 2: Multi-Agent Execution Log (Thoughts Stream)</span>
            </h2>
            
            <div className="bg-[#080a0f] border border-[#182030] rounded-xl flex-1 flex flex-col overflow-hidden scanlines shadow-[inset_0_4px_24px_rgba(0,0,0,0.9)] min-h-[460px] max-h-[460px]">
              <div className="border-b border-[#182030]/80 px-4 py-2.5 bg-[#0c0f17] flex items-center justify-between font-mono text-[9px] text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500/20"></span>
                  <span className="h-2 w-2 rounded-full bg-yellow-500/20"></span>
                  <span className="h-2 w-2 rounded-full bg-green-500/20"></span>
                  <span className="ml-2 text-slate-400 font-bold uppercase tracking-widest text-[9px]">ORCHESTRATOR_EXEC_LOG</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <span className="animate-pulse text-blue-400">● SIGNAL ACTIVE</span>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] space-y-3 scroll-smooth leading-relaxed">
                {thoughts.map((log) => {
                  let tagColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";
                  if (log.agent.includes("Anomaly")) tagColor = "text-amber-400 bg-amber-400/10 border-amber-400/20";
                  else if (log.agent.includes("Diagnostic")) tagColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
                  else if (log.agent.includes("Planning") || log.agent.includes("Tool")) tagColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
                  else if (log.agent.includes("Sourcing") || log.agent.includes("Graph")) tagColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
                  else if (log.agent.includes("Simulator")) tagColor = "text-red-400 bg-red-400/10 border-red-400/20";

                  return (
                    <div key={log.id} className="border-l border-slate-800 pl-3 py-0.5 hover:bg-slate-900/40 rounded transition-colors duration-150">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${tagColor} mr-2 uppercase tracking-wide`}>
                        {log.agent}
                      </span>
                      <span className="text-slate-300">{log.text}</span>
                    </div>
                  );
                })}
                <div ref={thoughtsEndRef} />
              </div>
            </div>
          </section>

          {/* Zone 3: Knowledge Graph */}
          <section className="lg:col-span-7 space-y-3 flex flex-col">
            <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>Zone 3: Supply Chain Knowledge Graph</span>
              </div>
              <span className="text-[9px] text-slate-500 normal-case tracking-normal">Click nodes to query relation pathways</span>
            </h2>

            <div className="bg-[#0c0f17] border border-[#182030] rounded-xl p-5 flex-1 flex flex-col justify-between relative overflow-hidden min-h-[460px] max-h-[460px]">
              
              <div className="w-full flex-1 flex items-center justify-center relative bg-[#06080c]/60 rounded-lg border border-[#182030]/40 p-2 overflow-hidden select-none">
                <svg width="100%" height="100%" viewBox="0 0 600 340" className="max-w-full max-h-full">
                  <defs>
                    <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Directed Edge lines linking the hierarchy */}
                  <line x1="80" y1="170" x2="220" y2="90" stroke={isM2Anomaly ? "#f59e0b" : "#1e293b"} strokeWidth={isM2Anomaly ? "3.5" : "1.5"} strokeDasharray={isM2Anomaly ? "6,4" : ""} />
                  <line x1="80" y1="170" x2="220" y2="170" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="80" y1="170" x2="220" y2="250" stroke="#1e293b" strokeWidth="1.5" />

                  <line x1="220" y1="90" x2="380" y2="50" stroke={isM2Anomaly ? "#f59e0b" : "#1e293b"} strokeWidth={isM2Anomaly ? "3.5" : "1.5"} />
                  <line x1="220" y1="90" x2="380" y2="130" stroke="#1e293b" strokeWidth="1.5" />

                  <line x1="220" y1="170" x2="380" y2="50" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="220" y1="170" x2="380" y2="210" stroke="#1e293b" strokeWidth="1.5" />

                  <line x1="220" y1="250" x2="380" y2="210" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="220" y1="250" x2="380" y2="290" stroke="#1e293b" strokeWidth="1.5" />

                  <line x1="380" y1="130" x2="520" y2="130" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="380" y1="50" x2="520" y2="130" stroke={isM2Anomaly ? "#f59e0b" : "#1e293b"} strokeWidth={isM2Anomaly ? "2" : "1"} strokeDasharray="3,3" />

                  {isM2Anomaly && (
                    <g>
                      <circle cx="220" cy="90" r="14" fill="#f59e0b" opacity="0.15" className="animate-ping" />
                      <circle cx="380" cy="50" r="14" fill="#f59e0b" opacity="0.15" className="animate-ping" />
                    </g>
                  )}

                  {/* Nodes */}
                  <g transform="translate(80, 170)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'High-Speed Fan B', role: 'Telemetry Root Source', details: 'Status: CRITICAL. Requires 3-Phase AC motor winding (PART-004) immediately to bypass 48H breakdown.' })}>
                    <rect x="-35" y="-18" width="70" height="36" rx="4" fill="#0c0f17" stroke={isM2Anomaly ? "#ef4444" : "#2563eb"} strokeWidth="2" />
                    <text textAnchor="middle" y="4" fill="#f8fafc" fontSize="10" fontWeight="bold" fontFamily="monospace">MCH-002</text>
                    <text textAnchor="middle" y="-23" fill="#64748b" fontSize="8" fontWeight="600">ROOT FLEET</text>
                  </g>

                  <g transform="translate(220, 90)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: '3-Phase Motor Winding', role: 'Component Node (PART-004)', details: 'Relational database stock audit: OUT OF STOCK (Stock: 1, Reorder Pt: 3). Escalated sourcing to SKF Munich air-freight routing.' })}>
                    <circle r="12" fill="#0c0f17" stroke={isM2Anomaly ? "#f59e0b" : "#475569"} strokeWidth="2" filter={isM2Anomaly ? "url(#glow-orange)" : ""} />
                    <text textAnchor="middle" y="3" fill={isM2Anomaly ? "#f59e0b" : "#cbd5e1"} fontSize="9" fontWeight="bold" fontFamily="monospace">P4</text>
                    <text textAnchor="middle" y="-17" fill="#64748b" fontSize="8" fontFamily="monospace">PART-004</text>
                  </g>

                  <g transform="translate(220, 170)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'Heavy-Duty Bearing Cage', role: 'Component Node (PART-001)', details: 'Relational database stock audit: IN STOCK (Stock: 15, Reorder Pt: 5). Approved Sarah Jenkins ticket for direct dispatch.' })}>
                    <circle r="12" fill="#0c0f17" stroke="#475569" strokeWidth="2" />
                    <text textAnchor="middle" y="3" fill="#cbd5e1" fontSize="9" fontWeight="bold" fontFamily="monospace">P1</text>
                    <text textAnchor="middle" y="-17" fill="#64748b" fontSize="8" fontFamily="monospace">PART-001</text>
                  </g>

                  <g transform="translate(220, 250)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'High-Pressure Hydraulic Seal', role: 'Component Node (PART-002)', details: 'Relational database stock audit: OUT OF STOCK (Stock: 1). Rerouted supply chain to Cleveland.' })}>
                    <circle r="12" fill="#0c0f17" stroke="#475569" strokeWidth="2" />
                    <text textAnchor="middle" y="3" fill="#cbd5e1" fontSize="9" fontWeight="bold" fontFamily="monospace">P2</text>
                    <text textAnchor="middle" y="-17" fill="#64748b" fontSize="8" fontFamily="monospace">PART-002</text>
                  </g>

                  <g transform="translate(380, 50)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'SKF Munich Logistics', role: 'Direct Supplier (Tier 1)', details: 'Winning candidate for Part-004. lead-time: 5 days, Sourcing optimization Resilience Score: 59.50. Air freight routes pre-approved.' })}>
                    <polygon points="0,-12 11,8 -11,8" fill="#0c0f17" stroke={isM2Anomaly ? "#f59e0b" : "#475569"} strokeWidth="2" filter={isM2Anomaly ? "url(#glow-orange)" : ""} />
                    <text textAnchor="middle" y="22" fill="#cbd5e1" fontSize="9" fontWeight="bold">SKF Munich</text>
                    <text textAnchor="middle" y="-18" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace">{isM2Anomaly ? "WINNER 59.50" : ""}</text>
                  </g>

                  <g transform="translate(380, 130)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'Siemens Shanghai Ltd', role: 'Direct Supplier (Tier 1)', details: 'Candidate for Part-004. lead-time: 28 days (Extreme maritime bottleneck penalty), Resilience Score: 18.20. High downtime risk.' })}>
                    <polygon points="0,-12 11,8 -11,8" fill="#0c0f17" stroke="#475569" strokeWidth="2" />
                    <text textAnchor="middle" y="22" fill="#cbd5e1" fontSize="9">Siemens SH</text>
                  </g>

                  <g transform="translate(380, 210)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'Parker Hannifin Cleveland', role: 'Direct Supplier (Tier 1)', details: 'Winning candidate for Part-002. lead-time: 2 days, Sourcing resilience score: 82.23. High quality low risk supplier.' })}>
                    <polygon points="0,-12 11,8 -11,8" fill="#0c0f17" stroke="#475569" strokeWidth="2" />
                    <text textAnchor="middle" y="22" fill="#cbd5e1" fontSize="9">Parker Hannifin</text>
                  </g>

                  <g transform="translate(380, 290)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'VarnishTech Graz', role: 'Direct Supplier (Tier 1)', details: 'Candidate for Part-002. lead-time: 6 days, price: $750, resilience score: 62.40.' })}>
                    <polygon points="0,-12 11,8 -11,8" fill="#0c0f17" stroke="#475569" strokeWidth="2" />
                    <text textAnchor="middle" y="22" fill="#cbd5e1" fontSize="9">VarnishTech</text>
                  </g>

                  <g transform="translate(520, 130)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'CopperWorks Ohio', role: 'Copper Fabricator (Tier 2)', details: 'Supplies raw high-grade wire to SKF Munich coil assembly line. Risk Profile: 0.10 (Low risk profile, stable).' })}>
                    <rect x="-24" y="-12" width="48" height="24" rx="2" fill="#0c0f17" stroke="#1e293b" strokeWidth="1.5" />
                    <text textAnchor="middle" y="3" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">COPPER</text>
                    <text textAnchor="middle" y="23" fill="#cbd5e1" fontSize="9">CopperWorks</text>
                  </g>
                </svg>

                {selectedSupplierNode && (
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-950/95 border border-amber-500/20 rounded-lg p-3.5 backdrop-blur-sm font-mono text-xs shadow-2xl transition-all duration-300">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-amber-400 font-bold tracking-wide uppercase">{selectedSupplierNode.name}</span>
                      <span className="text-[9px] text-slate-500 uppercase">{selectedSupplierNode.role}</span>
                    </div>
                    <p className="text-slate-300 leading-normal">{selectedSupplierNode.details}</p>
                    <button 
                      onClick={() => setSelectedSupplierNode(null)} 
                      className="absolute top-2 right-2 text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="border-t border-[#182030]/40 pt-4 flex flex-wrap gap-4 justify-between font-mono text-[9px] text-slate-500">
                <div className="flex space-x-3">
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-3 border border-blue-500 rounded-sm bg-[#0c0f17]"></span>
                    <span>Fleet Node</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 rounded-full border border-slate-500 bg-[#0c0f17]"></span>
                    <span>Part ID</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-0 w-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-slate-400 bg-transparent"></span>
                    <span>Direct Supp.</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-amber-500">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="font-bold">Active Sourcing Bottleneck Highlighted</span>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Zone 4: Action Center */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex items-center space-x-2">
            <Inbox className="w-3.5 h-3.5 text-blue-400" />
            <span>Zone 4: Action Center (Active Maintenance Orders)</span>
          </h2>

          <div className="bg-[#0c0f17] border border-[#182030] rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0f131c] text-slate-500 border-b border-[#182030] uppercase tracking-widest text-[9px]">
                    <th className="py-3.5 px-5">Ticket ID</th>
                    <th className="py-3.5 px-4">Equipment</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Assigned Specialist</th>
                    <th className="py-3.5 px-4 text-right">Autonomous Procurement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]/40 text-slate-300">
                  {data?.maintenance_orders && data.maintenance_orders.length > 0 ? (
                    data.maintenance_orders.map((order) => {
                      const email = getEmailDraftContent(order.root_cause);
                      
                      return (
                        <tr key={order.id} className="hover:bg-slate-900/40 transition-colors duration-150">
                          <td className="py-3.5 px-5 font-bold text-white">#{order.id}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-200 block">{order.machine_id}</span>
                            <span className="text-[10px] text-slate-500">Autonomous PdM</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.priority === "Critical" ? "bg-red-500/10 text-red-400" :
                              order.priority === "High" ? "bg-amber-500/10 text-amber-400" : "bg-slate-700/20 text-slate-400"
                            }`}>
                              {order.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.status === "Approved" ? "bg-emerald-500/10 text-emerald-400" :
                              order.status === "Dispatched_Sourcing_Active" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400"
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{order.assigned_technician}</td>
                          <td className="py-3.5 px-4 text-right">
                            {email ? (
                              <button
                                onClick={() => setSelectedEmail(email)}
                                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-600 hover:text-white transition-all duration-200"
                              >
                                Inspect Email Draft
                              </button>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Direct Part Secure / No Sourcing Draft</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 italic">
                        No active maintenance orders processed inside PostgreSQL.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* Slide-over / Modal Inspector */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0c0f17] border border-[#182030] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <div className="border-b border-[#182030] bg-[#0c0f17] px-6 py-4 flex justify-between items-center">
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Autonomous Procurement Agent Draft</span>
              </h3>
              <button 
                onClick={() => setSelectedEmail(null)}
                className="text-slate-500 hover:text-white transition-colors duration-150"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-[#06080c] rounded-lg p-4 font-mono text-xs space-y-1.5 border border-[#182030]/80">
                <div><span className="text-slate-500">From:</span> <span className="text-emerald-400">{selectedEmail.from}</span></div>
                <div><span className="text-slate-500">To:</span> <span className="text-blue-400">{selectedEmail.to}</span></div>
                <div><span className="text-slate-500">Subject:</span> <span className="text-white font-bold">{selectedEmail.subject}</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="text-slate-400">{selectedEmail.date}</span></div>
              </div>
              
              <div className="bg-[#06080c] rounded-lg p-4 font-mono text-[11px] max-h-80 overflow-y-auto border border-[#182030]/80 leading-relaxed text-slate-300 whitespace-pre-wrap">
                {selectedEmail.body}
              </div>
            </div>

            <div className="border-t border-[#182030] px-6 py-4 bg-[#0c0f17] flex justify-end space-x-3 font-mono text-xs">
              <button 
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors duration-150"
              >
                Dismiss
              </button>
              <button 
                onClick={() => {
                  alert("Expedited dispatch webhook triggered! Order confirmed.");
                  setSelectedEmail(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors duration-150"
              >
                Approve & Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
