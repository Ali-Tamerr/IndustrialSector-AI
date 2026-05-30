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
  RotateCcw,
  Plus,
  Trash,
  ArrowRight,
  Sparkles,
  Building,
  Database,
  LayoutGrid,
  Sun,
  Moon
} from "lucide-react";

const API_BASE = (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL || "");

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedSupplierNode, setSelectedSupplierNode] = useState(null);
  const thoughtsEndRef = useRef(null);

  const [theme, setTheme] = useState("dark");

  // Load and apply theme globally
  useEffect(() => {
    const savedTheme = localStorage.getItem("appTheme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("appTheme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Setup Portal states to explain project and configure data from scratch
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [activeSetupTab, setActiveSetupTab] = useState("presets");
  const [seeding, setSeeding] = useState(false);
  const [customMachines, setCustomMachines] = useState([
    { id: "MCH-101", name: "High-Temp Fan A", location: "Bay 4 - Extraction", thresholds: { temperature: 90, vibration: 8, pressure: 6.5, current: 15 } }
  ]);

  // Projects Portal State variables
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectNameInput, setProjectNameInput] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("steel");

  // Load project initialization state & projects list
  useEffect(() => {
    const completed = localStorage.getItem("isSetupCompleted");
    if (completed === "true") {
      setIsSetupCompleted(true);
    }
    const savedProjects = localStorage.getItem("projects");
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (e) {
        console.error("Failed to parse projects:", e);
      }
    }
    const savedActiveId = localStorage.getItem("activeProjectId");
    if (savedActiveId) {
      setActiveProjectId(savedActiveId);
    }
  }, []);

  const generateDefaultName = (type, templateId) => {
    const customPrefixes = [
      "Quantum Factory", "Cyber-Physical Grid", "Hyperion Facility", "Apex Assembly",
      "Omni-Nexus Fleet", "Specter Automation", "Vanguard Complex", "Helix Industrial"
    ];
    const steelPrefixes = [
      "Heavy Steel Mill", "Titanium Smelter", "Vulcan Ironworks", "Forge Nexus",
      "Apex Rolling Complex", "Pinnacle Steel Grid"
    ];
    const petroPrefixes = [
      "Hydrocracker Hub", "Refinery Grid", "Petrochemical Nexus", "Octane Transfer Complex",
      "Aero-Chemical Base", "Solvent Processing Sector"
    ];
    const autoPrefixes = [
      "6-Axis Assembly Sector", "Welding Line Beta", "Precision Motion Base", "Robotics Assembly Grid",
      "Automotive Cell Delta", "Kinetic Assembler Facility"
    ];

    let prefixes = customPrefixes;
    if (type === "template") {
      if (templateId === "steel") prefixes = steelPrefixes;
      else if (templateId === "petrochemical") prefixes = petroPrefixes;
      else if (templateId === "automotive") prefixes = autoPrefixes;
    }
    
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${randomPrefix} #${randomNum}`;
  };

  const handleSetup = async (type, templateId = null, customMchs = null) => {
    setSeeding(true);
    try {
      const res = await fetch(`${API_BASE}/api/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          templateId,
          customMachines: type === "custom" ? (customMchs || customMachines) : []
        })
      });
      if (res.ok) {
        localStorage.setItem("isSetupCompleted", "true");
        setIsSetupCompleted(true);
        await refreshData();
        // Trigger tour onboarding dynamically on startup
        localStorage.removeItem("hasSeenTutorial");
        setShowTutorial(true);
        setTutorialStep(0);
      } else {
        const errData = await res.json();
        alert("Setup failed: " + errData.error);
      }
    } catch (err) {
      console.error("Setup connection failed:", err);
      alert("Database connection failed. Please check if your DATABASE_URL in .env is correct.");
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateProject = async (type) => {
    const finalName = projectNameInput.trim() || generateDefaultName(type, selectedTemplateId);
    const newProject = {
      id: "proj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      name: finalName,
      type,
      templateId: type === "template" ? selectedTemplateId : null,
      customMachines: type === "custom" ? customMachines : [],
      createdAt: new Date().toISOString()
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
    
    setActiveProjectId(newProject.id);
    localStorage.setItem("activeProjectId", newProject.id);
    setProjectNameInput("");

    await handleSetup(type, newProject.templateId, newProject.customMachines);
  };

  const handleLaunchProject = async (proj) => {
    setActiveProjectId(proj.id);
    localStorage.setItem("activeProjectId", proj.id);
    await handleSetup(proj.type, proj.templateId, proj.customMachines);
  };

  const handleRenameProject = (projId, newName) => {
    if (!projId) return;
    const updated = projects.map(p => p.id === projId ? { ...p, name: newName } : p);
    setProjects(updated);
    localStorage.setItem("projects", JSON.stringify(updated));
  };

  const handleDeleteProject = (projId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project config?")) return;
    
    const updated = projects.filter(p => p.id !== projId);
    setProjects(updated);
    localStorage.setItem("projects", JSON.stringify(updated));

    if (activeProjectId === projId) {
      setActiveProjectId(null);
      localStorage.removeItem("activeProjectId");
      localStorage.removeItem("isSetupCompleted");
      setIsSetupCompleted(false);
    }
  };

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  const tutorialSteps = [
    {
      title: "Welcome to the Autonomic Control Tower",
      description: "This dashboard orchestrates an advanced, offline-first multi-agent industrial repair system. When machinery fails, specialized AI agents automatically diagnose the failure, audit spare parts inventories, optimize supply-chain logistics, and prepare supplier purchase orders in seconds.",
      icon: <Cpu className="w-12 h-12 text-blue-400 animate-pulse" />,
      selector: null,
      positionClass: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg",
      style: {},
    },
    {
      title: "Zone 1: Telemetry Live Monitor",
      description: "Real-time sensor arrays track Winding Temperature, Radial Vibration, Discharge Pressure, and Coil Current for your factory fleet. Custom SVG sparklines display live 24-hour fluctuations to identify abnormal spikes before they become breakdowns.",
      icon: <Activity className="w-12 h-12 text-emerald-400" />,
      selector: "zone-1",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", bottom: "24px", right: "24px", left: "auto", top: "auto", transform: "none" },
    },
    {
      title: "Autonomous Agent Catalyst",
      description: "Clicking 'Simulate Bearing Failure on Machine 2' injects a live fault in the fleet. This acts as the catalyst for our AI agents to step in, collaborate, and execute emergency procurement actions.",
      icon: <Play className="w-12 h-12 text-red-400 animate-pulse" />,
      selector: "simulator-btn",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", top: "96px", left: "24px", right: "auto", bottom: "auto", transform: "none" },
    },
    {
      title: "Zone 2: Multi-Agent Execution Log",
      description: "Observe the 'Thoughts' stream—the live, step-by-step reasoning logs of collaborating agents. Watch the Anomaly Agent flag the failure, the Diagnostic Agent query technical manuals, and the Sourcing Agent negotiate part routing.",
      icon: <Layers className="w-12 h-12 text-amber-400" />,
      selector: "zone-2",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", top: "96px", right: "24px", left: "auto", bottom: "auto", transform: "none" },
    },
    {
      title: "Zone 3: Supply Chain Knowledge Graph",
      description: "A dynamic semantic graph mapping spare parts and Tier-1 and Tier-2 suppliers. Hover over nodes to inspect real-time logistics. When a bottleneck or failure occurs, the best routing path is automatically highlighted in orange.",
      icon: <Settings className="w-12 h-12 text-orange-400 animate-spin" />,
      selector: "zone-3",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", top: "96px", left: "24px", right: "auto", bottom: "auto", transform: "none" },
    },
    {
      title: "Zone 4: Action Center",
      description: "Here, automated purchase and dispatch tickets are created in PostgreSQL. Click 'Inspect Email Draft' to review professional, AI-crafted supplier procurement contracts complete with lead-time, price, and resilience scores.",
      icon: <Inbox className="w-12 h-12 text-purple-400" />,
      selector: "zone-4",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", top: "96px", left: "50%", transform: "translateX(-50%)", right: "auto", bottom: "auto" },
    }
  ];

  const closeTutorial = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setShowTutorial(false);
  };

  // Auto trigger tutorial on first visit
  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenTutorial");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Scroll and highlight selector element during step changes
  useEffect(() => {
    if (showTutorial) {
      const step = tutorialSteps[tutorialStep];
      if (step && step.selector) {
        const element = document.getElementById(step.selector);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-blue-500", "ring-offset-4", "ring-offset-[#06080c]", "scale-[1.015]");
          return () => {
            element.classList.remove("ring-2", "ring-blue-500", "ring-offset-4", "ring-offset-[#06080c]", "scale-[1.015]");
          };
        }
      }
    }
  }, [tutorialStep, showTutorial]);

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
    const isDark = theme === "dark";
    switch (status) {
      case "Operational":
        return { 
          label: "Stable", 
          bg: isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-55 text-emerald-700 border-emerald-300", 
          dot: "bg-emerald-500", 
          sparkColor: "#10b981" 
        };
      case "Degraded":
        return { 
          label: "Warning", 
          bg: isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-55 text-amber-700 border-amber-300", 
          dot: "bg-amber-500", 
          sparkColor: "#f59e0b" 
        };
      case "Critical":
        return { 
          label: "Anomaly", 
          bg: isDark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-55 text-red-700 border-red-300", 
          dot: "bg-red-500", 
          sparkColor: "#ef4444" 
        };
      default:
        return { 
          label: "Inactive", 
          bg: isDark ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-slate-100 text-slate-700 border-slate-200", 
          dot: "bg-slate-500", 
          sparkColor: "#64748b" 
        };
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
    if (!data || !data.machines) return false;
    return data.machines.some(m => m.status === "Critical" || m.status === "Degraded");
  }, [data]);

  const firstMachine = useMemo(() => {
    if (data && data.machines && data.machines.length > 0) {
      return data.machines[0];
    }
    return { id: "MCH-002", name: "High-Speed Industrial Fan B", status: "Operational" };
  }, [data]);

  if (!isSetupCompleted) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#030508] text-slate-300' : 'bg-[#f8fafc] text-slate-700'} font-sans p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden select-none selection:bg-cyan-500/30 transition-colors duration-300`}>
        
        {/* Prismatic Digital Grid Background */}
        <div className={`absolute inset-0 bg-[linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px),linear-gradient(90deg,${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none animate-grid-move`}></div>
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,${theme === 'dark' ? '#030508' : '#f8fafc'}_10%,${theme === 'dark' ? '#030508' : '#f8fafc'}_100%)] pointer-events-none`}></div>

        {/* Ambient Floating Glow Mesh Spheres */}
        <div className={`absolute top-[-15%] left-[-15%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-purple-600/[0.045]' : 'bg-purple-400/[0.06]'} rounded-full blur-[130px] pointer-events-none animate-pulse-slow`}></div>
        <div className={`absolute bottom-[-15%] right-[-15%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-cyan-500/[0.045]' : 'bg-cyan-400/[0.06]'} rounded-full blur-[130px] pointer-events-none animate-pulse-slow-alt`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[580px] ${theme === 'dark' ? 'bg-blue-600/[0.02]' : 'bg-blue-500/[0.035]'} rounded-full blur-[150px] pointer-events-none`}></div>

        {/* Theme Toggle Button positioned absolute in the top-right corner */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 z-30">
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full border transition-all duration-300 flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-slate-950/40 border-slate-800 text-yellow-400 hover:bg-slate-900 hover:text-yellow-300 hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 hover:text-indigo-700 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:scale-105'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="w-full max-w-5xl space-y-10 z-10 animate-fadeIn">
          
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full ${theme === 'dark' ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : 'bg-cyan-50 border-cyan-200 text-cyan-600 shadow-sm'} text-[10px] font-mono tracking-[0.2em] font-bold`}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>ORCHESTRATOR INITIALIZATION CORE</span>
            </div>
            
            <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight uppercase font-mono ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400' : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600'} bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(6,182,212,0.1)]`}>
              AUTONOMIC CONTROL TOWER
            </h1>
            
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'} max-w-2xl mx-auto leading-relaxed`}>
              Activate an autonomic, offline-first multi-agent predictive maintenance (PdM) fleet. Unify industrial telemetry, RAG diagnostics, and automated supply-chain graph routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className={`relative backdrop-blur-md ${theme === 'dark' ? 'bg-white/[0.01] border-[#1b2336]/60 hover:bg-white/[0.015] hover:border-red-500/25' : 'bg-white/60 border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:bg-white/80 hover:border-red-500/30'} rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.03)] hover:-translate-y-0.5 group overflow-hidden`}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/10 via-red-500/40 to-red-500/10 opacity-60 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-5">
                <div className={`h-10 w-10 ${theme === 'dark' ? 'bg-red-950/20 border-red-500/25' : 'bg-red-50 border-red-200'} rounded-xl flex items-center justify-center shadow-[inset_0_0_8px_rgba(239,68,68,0.1)]`}>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <span className={`text-[9px] font-mono tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase`}>01 // CRITICAL</span>
              </div>

              <h3 className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'} uppercase tracking-wider mb-2`}>The Downtime Crisis</h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                Machinery breakdown is catastrophic. Industrial plants lose $22,000+ per minute when critical assets fail. Manual diagnostics, phone Tag, and surprise spare-stock deficits stall recovery for days or weeks.
              </p>
            </div>

            <div className={`relative backdrop-blur-md ${theme === 'dark' ? 'bg-white/[0.01] border-[#1b2336]/60 hover:bg-white/[0.015] hover:border-blue-500/25' : 'bg-white/60 border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:bg-white/80 hover:border-blue-500/30'} rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.03)] hover:-translate-y-0.5 group overflow-hidden`}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-blue-500/10 opacity-60 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-5">
                <div className={`h-10 w-10 ${theme === 'dark' ? 'bg-blue-950/20 border-blue-500/25' : 'bg-blue-50 border-blue-200'} rounded-xl flex items-center justify-center shadow-[inset_0_0_8px_rgba(59,130,246,0.1)]`}>
                  <Cpu className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <span className={`text-[9px] font-mono tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase`}>02 // COMPUTE</span>
              </div>

              <h3 className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'} uppercase tracking-wider mb-2`}>Multi-Agent Diagnostics</h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                This system unifies monitoring. Upon sensor drift, specialized AI agents immediately diagnose failure modes, query machine manuals inside a vector database (RAG), and prepare targeted engineering repair tickets.
              </p>
            </div>

            <div className={`relative backdrop-blur-md ${theme === 'dark' ? 'bg-white/[0.01] border-[#1b2336]/60 hover:bg-white/[0.015] hover:border-emerald-500/20' : 'bg-white/60 border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:bg-white/80 hover:border-emerald-500/30'} rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.03)] hover:-translate-y-0.5 group overflow-hidden`}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/10 via-emerald-500/40 to-emerald-500/10 opacity-60 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-5">
                <div className={`h-10 w-10 ${theme === 'dark' ? 'bg-emerald-950/20 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'} rounded-xl flex items-center justify-center shadow-[inset_0_0_8px_rgba(16,185,129,0.1)]`}>
                  <Layers className="w-5 h-5 text-emerald-400" />
                </div>
                <span className={`text-[9px] font-mono tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} uppercase`}>03 // RESOLVE</span>
              </div>

              <h3 className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'} uppercase tracking-wider mb-2`}>Optimal Sourcing bypass</h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                When a replacement part is out of stock, Sourcing agents automatically traverse the supply chain graph, choosing SKF Munich (5-day air-freight) over Siemens Shanghai (28-day maritime bottleneck) to bypass delays.
              </p>
            </div>

          </div>

          <div className={`${theme === 'dark' ? 'bg-[#080b11]/90 border-[#1b2336]/80' : 'bg-white/80 border-slate-200 shadow-xl'} border rounded-2xl overflow-hidden`}>
            
            <div className={`flex border-b ${theme === 'dark' ? 'border-[#1b2336]/80 bg-[#06080c]' : 'border-slate-200 bg-slate-55'} font-mono text-xs p-1 gap-1`}>
              <button 
                onClick={() => setActiveSetupTab("presets")}
                className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeSetupTab === "presets" 
                    ? (theme === 'dark' 
                        ? "text-cyan-400 bg-cyan-950/25 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]" 
                        : "text-cyan-600 bg-cyan-50 border border-cyan-200/50 shadow-inner") 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/30 rounded-xl"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Select Ready-to-Run Factory Template
              </button>
              <button 
                onClick={() => setActiveSetupTab("custom")}
                className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeSetupTab === "custom" 
                    ? (theme === 'dark' 
                        ? "text-cyan-400 bg-cyan-950/25 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]" 
                        : "text-cyan-600 bg-cyan-50 border border-cyan-200/50 shadow-inner") 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/30 rounded-xl"
                }`}
              >
                <Plus className="w-4 h-4" />
                Build Custom Fleet from Scratch
              </button>
            </div>

            <div className="p-6 md:p-8">
              {activeSetupTab === "presets" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    <div 
                      onClick={() => handleSetup("template", "steel")}
                      className={`border ${
                        theme === 'dark' 
                          ? 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-blue-500/50 hover:bg-blue-950/[0.04]' 
                          : 'border-slate-200 bg-slate-50/50 hover:border-blue-500 hover:bg-blue-50/20 shadow-sm'
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
                        <span className="text-blue-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">LOAD MODULE <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>

                    <div 
                      onClick={() => handleSetup("template", "petrochemical")}
                      className={`border ${
                        theme === 'dark' 
                          ? 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-emerald-500/50 hover:bg-emerald-950/[0.04]' 
                          : 'border-slate-200 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/20 shadow-sm'
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
                        <span className="text-emerald-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">LOAD MODULE <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>

                    <div 
                      onClick={() => handleSetup("template", "automotive")}
                      className={`border ${
                        theme === 'dark' 
                          ? 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-purple-500/50 hover:bg-purple-950/[0.04]' 
                          : 'border-slate-200 bg-slate-50/50 hover:border-purple-500 hover:bg-purple-50/20 shadow-sm'
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
                        <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-emerald-500 transition-colors`}>6-Axis Assembly Robotics</h4>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                          Robot joint gearboxes, painting line drives, and assembly cells. Optimized for testing high-precision harmonic gear fault diagnostic routines.
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-500">
                        <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 3 pdm assets</span>
                        <span className="text-purple-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">LOAD MODULE <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>

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
                            Asset #{index + 1} System Profile
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
                            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Bay Location</label>
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
                                  const val = parseFloat(e.target.value) || 0;
                                  setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, thresholds: { ...m.thresholds, temperature: val } } : m));
                                }}
                                className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336]' : 'bg-white border-slate-200'} rounded-lg p-2 text-white outline-none focus:border-cyan-500`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1 font-bold">Vibration (mm/s)</label>
                              <input 
                                type="number" 
                                value={machine.thresholds.vibration} 
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, thresholds: { ...m.thresholds, vibration: val } } : m));
                                }}
                                className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336]' : 'bg-white border-slate-200'} rounded-lg p-2 text-white outline-none focus:border-cyan-500`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1 font-bold">Discharge Pres (Bar)</label>
                              <input 
                                type="number" 
                                value={machine.thresholds.pressure} 
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, thresholds: { ...m.thresholds, pressure: val } } : m));
                                }}
                                className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336]' : 'bg-white border-slate-200'} rounded-lg p-2 text-white outline-none focus:border-cyan-500`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1 font-bold">Coil Current (Amps)</label>
                              <input 
                                type="number" 
                                value={machine.thresholds.current} 
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCustomMachines(prev => prev.map((m, i) => i === index ? { ...m, thresholds: { ...m.thresholds, current: val } } : m));
                                }}
                                className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336]' : 'bg-white border-slate-200'} rounded-lg p-2 text-white outline-none focus:border-cyan-500`}
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
                      className={`px-4 py-2.5 ${theme === 'dark' ? 'bg-[#090e18] border-[#1b2336]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'} rounded-xl transition-all font-bold flex items-center gap-1.5`}
                    >
                      <Plus className="w-4 h-4" /> Add Another Asset
                    </button>
                    
                    <button
                      disabled={seeding || customMachines.some(m => !m.name.trim() || !m.location.trim())}
                      onClick={() => handleSetup("custom")}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]"
                    >
                      <span>Initialize Custom Fleet</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {seeding && (
          <div className="fixed inset-0 z-50 bg-[#030508]/95 backdrop-blur-md flex flex-col items-center justify-center text-cyan-400 font-mono">
            <Activity className="h-10 w-10 animate-spin mb-4 text-cyan-400" />
            <div className="animate-pulse tracking-[0.15em] text-xs uppercase">Hydrating PostgreSQL schemas & building Chroma Vector DB...</div>
          </div>
        )}
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className={`flex h-screen flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#030508] text-cyan-400' : 'bg-[#f8fafc] text-blue-600'} font-mono`}>
        <Activity className="h-10 w-10 animate-spin mb-4" />
        <div className="animate-pulse tracking-widest text-xs">SYNCHRONIZING CONTROL TOWER METRICS...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#030508] text-slate-300' : 'bg-[#f8fafc] text-slate-700'} pb-12 font-sans select-none transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Prismatic Digital Grid Background for Dashboard */}
      <div className={`absolute inset-0 bg-[linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px),linear-gradient(90deg,${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none animate-grid-move`}></div>
      
      {/* Ambient Floating Glow Mesh Spheres */}
      <div className={`absolute top-[-10%] left-[-10%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-purple-600/[0.04]' : 'bg-purple-400/[0.05]'} rounded-full blur-[130px] pointer-events-none animate-pulse-slow`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-cyan-500/[0.04]' : 'bg-cyan-400/[0.05]'} rounded-full blur-[130px] pointer-events-none animate-pulse-slow-alt`}></div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] ${theme === 'dark' ? 'bg-blue-600/[0.02]' : 'bg-blue-500/[0.03]'} rounded-full blur-[150px] pointer-events-none`}></div>

      {/* Dynamic Header */}
      <header className={`border-b ${theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]/95 text-white' : 'border-slate-200 bg-white/90 shadow-[0_2px_15px_rgba(0,0,0,0.02)] text-slate-800'} px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md transition-all duration-300 relative z-10`}>
        <div className="flex items-center space-x-3">
          <div className={`h-8.5 w-8.5 ${theme === 'dark' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} rounded border flex items-center justify-center`}>
            <Cpu className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h1 className={`font-mono text-[16px] font-extrabold tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'} flex items-center`}>
              AUTONOMIC INDUSTRIAL CONTROL TOWER
              <span className={`ml-3 px-2 py-0.5 rounded text-[9px] font-mono font-bold ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'} border`}>AGENT_ORCHESTRATOR</span>
            </h1>
            <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} font-mono tracking-widest uppercase`}>Predictive Maintenance & Supply Chain Sourcing Graph</p>
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          <div className="hidden lg:flex flex-col text-right font-mono text-[10px]">
            <span className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>FLEET PERFORMANCE</span>
            <span className={`${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} font-bold tracking-widest`}>99.78% RESILIENT</span>
          </div>

          <button
            onClick={() => { setTutorialStep(0); setShowTutorial(true); }}
            className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-1.5 ${
              theme === 'dark'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                : 'bg-blue-50 text-blue-600 border-blue-200/80 hover:bg-blue-600 hover:text-white shadow-sm'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Dashboard Tour</span>
          </button>

          <button
            onClick={() => {
              if (confirm("Reset current project to zero and re-configure machinery/templates?")) {
                localStorage.removeItem("isSetupCompleted");
                setIsSetupCompleted(false);
              }
            }}
            className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-1.5 ${
              theme === 'dark'
                ? 'bg-red-950/20 text-red-400 border-red-500/20 hover:bg-red-600 hover:text-white'
                : 'bg-red-50 text-red-655 border-red-200/85 hover:bg-red-600 hover:text-white shadow-sm'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Fleet</span>
          </button>

          <button
            id="simulator-btn"
            onClick={handleSimulation}
            disabled={simulating}
            className={`px-4 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-2 ${
              simulating
                ? "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                : (theme === 'dark'
                    ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white"
                    : "bg-red-50 text-red-600 border-red-200/80 hover:bg-red-600 hover:text-white shadow-sm")
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`} />
            <span>{simulating ? "PROCESSING AGENTS..." : `Simulate Failure on ${firstMachine.id}`}</span>
          </button>

          {/* Theme Toggle Button positioned at the far right of the sticky header */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-slate-950/40 border-slate-800 text-yellow-400 hover:bg-slate-900 hover:text-yellow-300 hover:scale-105 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 hover:text-indigo-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:scale-105'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Zone 1: Telemetry Live Monitor */}
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

              return (
                <div key={machine.id} className={`${theme === 'dark' ? 'bg-[#0c0f17] border-[#182030] hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'} rounded-xl p-5 border transition-all duration-300 relative overflow-hidden group`}>
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
                      <div className={`grid grid-cols-2 gap-4 border-b pb-4 ${theme === 'dark' ? 'border-[#182030]/60' : 'border-slate-100'}`}>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Winding Temp</div>
                          <div className={`text-xl font-bold mt-0.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {latest.temperature.toFixed(1)} <span className="text-xs text-slate-400 font-medium">°C</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Radial Vibration</div>
                          <div className={`text-xl font-bold mt-0.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {latest.vibration.toFixed(2)} <span className="text-xs text-slate-400 font-medium">mm/s</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Discharge Pressure</span>
                          <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>{latest.pressure.toFixed(2)} Bar</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Coil Amperage</span>
                          <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>{latest.current.toFixed(1)} A</span>
                        </div>
                      </div>

                      {/* Sparkline trends */}
                      <div className={`mt-4 pt-4 border-t flex justify-between items-center ${theme === 'dark' ? 'border-[#182030]/40' : 'border-slate-100'}`}>
                        <div className="text-[9px] text-slate-500 font-bold leading-tight">
                          <div>24H REALTIME GRAPH</div>
                          <div className={`mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>TEMP + VIB</div>
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
          <section id="zone-2" className="lg:col-span-5 space-y-3 flex flex-col transition-all duration-500">
            <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Zone 2: Multi-Agent Execution Log (Thoughts Stream)</span>
            </h2>
            
            <div className={`bg-[#080a0f] border rounded-xl flex-1 flex flex-col overflow-hidden scanlines shadow-[inset_0_4px_24px_rgba(0,0,0,0.9)] min-h-[460px] max-h-[460px] ${theme === 'dark' ? 'border-[#182030]' : 'border-slate-200'}`}>
              <div className={`border-b px-4 py-2.5 bg-[#0c0f17] flex items-center justify-between font-mono text-[9px] text-slate-500 ${theme === 'dark' ? 'border-[#182030]/80' : 'border-slate-250'}`}>
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
          <section id="zone-3" className="lg:col-span-7 space-y-3 flex flex-col transition-all duration-500">
            <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>Zone 3: Supply Chain Knowledge Graph</span>
              </div>
              <span className="text-[9px] text-slate-500 normal-case tracking-normal">Click nodes to query relation pathways</span>
            </h2>

            <div className={`${theme === 'dark' ? 'bg-[#0c0f17] border-[#182030]' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-5 flex-1 flex flex-col justify-between relative overflow-hidden min-h-[460px] max-h-[460px]`}>
              
              <div className={`w-full flex-1 flex items-center justify-center relative rounded-lg border p-2 overflow-hidden select-none transition-all duration-300 ${theme === 'dark' ? 'bg-[#06080c]/60 border-[#182030]/40' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
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
                  <line x1="80" y1="170" x2="220" y2="90" stroke={isM2Anomaly ? "#f59e0b" : (theme === 'dark' ? "#1e293b" : "#cbd5e1")} strokeWidth={isM2Anomaly ? "3.5" : "1.5"} strokeDasharray={isM2Anomaly ? "6,4" : ""} />
                  <line x1="80" y1="170" x2="220" y2="170" stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1.5" />
                  <line x1="80" y1="170" x2="220" y2="250" stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1.5" />

                  <line x1="220" y1="90" x2="380" y2="50" stroke={isM2Anomaly ? "#f59e0b" : (theme === 'dark' ? "#1e293b" : "#cbd5e1")} strokeWidth={isM2Anomaly ? "3.5" : "1.5"} />
                  <line x1="220" y1="90" x2="380" y2="130" stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1.5" />

                  <line x1="220" y1="170" x2="380" y2="50" stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1.5" />
                  <line x1="220" y1="170" x2="380" y2="210" stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1.5" />

                  <line x1="220" y1="250" x2="380" y2="210" stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1.5" />
                  <line x1="220" y1="250" x2="380" y2="290" stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1.5" />

                  <line x1="380" y1="130" x2="520" y2="130" stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="380" y1="50" x2="520" y2="130" stroke={isM2Anomaly ? "#f59e0b" : (theme === 'dark' ? "#1e293b" : "#cbd5e1")} strokeWidth={isM2Anomaly ? "2" : "1"} strokeDasharray="3,3" />

                  {isM2Anomaly && (
                    <g>
                      <circle cx="220" cy="90" r="14" fill="#f59e0b" opacity="0.15" className="animate-ping" />
                      <circle cx="380" cy="50" r="14" fill="#f59e0b" opacity="0.15" className="animate-ping" />
                    </g>
                  )}

                  {/* Nodes */}
                  <g transform="translate(80, 170)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: firstMachine.name, role: 'Telemetry Root Source', details: `Status: ${firstMachine.status}. Requires critical spares immediately to bypass active downtime warnings.` })}>
                    <rect x="-35" y="-18" width="70" height="36" rx="4" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={isM2Anomaly ? "#ef4444" : "#2563eb"} strokeWidth="2" />
                    <text textAnchor="middle" y="4" fill={theme === 'dark' ? "#f8fafc" : "#1e293b"} fontSize="10" fontWeight="bold" fontFamily="monospace">{firstMachine.id}</text>
                    <text textAnchor="middle" y="-23" fill="#64748b" fontSize="8" fontWeight="600">ROOT FLEET</text>
                  </g>

                  <g transform="translate(220, 90)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: '3-Phase Motor Winding', role: 'Component Node (PART-004)', details: 'Relational database stock audit: OUT OF STOCK (Stock: 1, Reorder Pt: 3). Escalated sourcing to SKF Munich air-freight routing.' })}>
                    <circle r="12" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={isM2Anomaly ? "#f59e0b" : (theme === 'dark' ? "#475569" : "#94a3b8")} strokeWidth="2" filter={isM2Anomaly ? "url(#glow-orange)" : ""} />
                    <text textAnchor="middle" y="3" fill={isM2Anomaly ? "#f59e0b" : (theme === 'dark' ? "#cbd5e1" : "#475569")} fontSize="9" fontWeight="bold" fontFamily="monospace">P4</text>
                    <text textAnchor="middle" y="-17" fill="#64748b" fontSize="8" fontFamily="monospace">PART-004</text>
                  </g>

                  <g transform="translate(220, 170)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'Heavy-Duty Bearing Cage', role: 'Component Node (PART-001)', details: 'Relational database stock audit: IN STOCK (Stock: 15, Reorder Pt: 5). Approved Sarah Jenkins ticket for direct dispatch.' })}>
                    <circle r="12" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={theme === 'dark' ? "#475569" : "#94a3b8"} strokeWidth="2" />
                    <text textAnchor="middle" y="3" fill={theme === 'dark' ? "#cbd5e1" : "#475569"} fontSize="9" fontWeight="bold" fontFamily="monospace">P1</text>
                    <text textAnchor="middle" y="-17" fill="#64748b" fontSize="8" fontFamily="monospace">PART-001</text>
                  </g>

                  <g transform="translate(220, 250)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'High-Pressure Hydraulic Seal', role: 'Component Node (PART-002)', details: 'Relational database stock audit: OUT OF STOCK (Stock: 1). Rerouted supply chain to Cleveland.' })}>
                    <circle r="12" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={theme === 'dark' ? "#475569" : "#94a3b8"} strokeWidth="2" />
                    <text textAnchor="middle" y="3" fill={theme === 'dark' ? "#cbd5e1" : "#475569"} fontSize="9" fontWeight="bold" fontFamily="monospace">P2</text>
                    <text textAnchor="middle" y="-17" fill="#64748b" fontSize="8" fontFamily="monospace">PART-002</text>
                  </g>

                  <g transform="translate(380, 50)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'SKF Munich Logistics', role: 'Direct Supplier (Tier 1)', details: 'Winning candidate for Part-004. lead-time: 5 days, Sourcing optimization Resilience Score: 59.50. Air freight routes pre-approved.' })}>
                    <polygon points="0,-12 11,8 -11,8" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={isM2Anomaly ? "#f59e0b" : (theme === 'dark' ? "#475569" : "#94a3b8")} strokeWidth="2" filter={isM2Anomaly ? "url(#glow-orange)" : ""} />
                    <text textAnchor="middle" y="22" fill={theme === 'dark' ? "#cbd5e1" : "#334155"} fontSize="9" fontWeight="bold">SKF Munich</text>
                    <text textAnchor="middle" y="-18" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace">{isM2Anomaly ? "WINNER 59.50" : ""}</text>
                  </g>

                  <g transform="translate(380, 130)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'Siemens Shanghai Ltd', role: 'Direct Supplier (Tier 1)', details: 'Candidate for Part-004. lead-time: 28 days (Extreme maritime bottleneck penalty), Resilience Score: 18.20. High downtime risk.' })}>
                    <polygon points="0,-12 11,8 -11,8" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={theme === 'dark' ? "#475569" : "#94a3b8"} strokeWidth="2" />
                    <text textAnchor="middle" y="22" fill={theme === 'dark' ? "#cbd5e1" : "#334155"} fontSize="9">Siemens SH</text>
                  </g>

                  <g transform="translate(380, 210)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'Parker Hannifin Cleveland', role: 'Direct Supplier (Tier 1)', details: 'Winning candidate for Part-002. lead-time: 2 days, Sourcing resilience score: 82.23. High quality low risk supplier.' })}>
                    <polygon points="0,-12 11,8 -11,8" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={theme === 'dark' ? "#475569" : "#94a3b8"} strokeWidth="2" />
                    <text textAnchor="middle" y="22" fill={theme === 'dark' ? "#cbd5e1" : "#334155"} fontSize="9">Parker Hannifin</text>
                  </g>

                  <g transform="translate(380, 290)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'VarnishTech Graz', role: 'Direct Supplier (Tier 1)', details: 'Candidate for Part-002. lead-time: 6 days, price: $750, resilience score: 62.40.' })}>
                    <polygon points="0,-12 11,8 -11,8" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={theme === 'dark' ? "#475569" : "#94a3b8"} strokeWidth="2" />
                    <text textAnchor="middle" y="22" fill={theme === 'dark' ? "#cbd5e1" : "#334155"} fontSize="9">VarnishTech</text>
                  </g>

                  <g transform="translate(520, 130)" className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: 'CopperWorks Ohio', role: 'Copper Fabricator (Tier 2)', details: 'Supplies raw high-grade wire to SKF Munich coil assembly line. Risk Profile: 0.10 (Low risk profile, stable).' })}>
                    <rect x="-24" y="-12" width="48" height="24" rx="2" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1.5" />
                    <text textAnchor="middle" y="3" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">COPPER</text>
                    <text textAnchor="middle" y="23" fill={theme === 'dark' ? "#cbd5e1" : "#334155"} fontSize="9">CopperWorks</text>
                  </g>
                </svg>

                {selectedSupplierNode && (
                  <div className={`absolute bottom-4 left-4 right-4 border rounded-lg p-3.5 backdrop-blur-sm font-mono text-xs shadow-2xl transition-all duration-300 ${theme === 'dark' ? 'bg-slate-950/95 border-amber-500/20 text-slate-300' : 'bg-white/95 border-amber-500/40 text-slate-700 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'}`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`font-bold tracking-wide uppercase ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>{selectedSupplierNode.name}</span>
                      <span className="text-[9px] text-slate-500 uppercase">{selectedSupplierNode.role}</span>
                    </div>
                    <p className={`leading-normal ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{selectedSupplierNode.details}</p>
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
              <div className={`border-t pt-4 flex flex-wrap gap-4 justify-between font-mono text-[9px] text-slate-500 ${theme === 'dark' ? 'border-[#182030]/40' : 'border-slate-100'}`}>
                <div className="flex space-x-3">
                  <span className="flex items-center space-x-1">
                    <span className={`h-2 w-3 border border-blue-500 rounded-sm ${theme === 'dark' ? 'bg-[#0c0f17]' : 'bg-white'}`}></span>
                    <span>Fleet Node</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className={`h-2.5 w-2.5 rounded-full border border-slate-500 ${theme === 'dark' ? 'bg-[#0c0f17]' : 'bg-white'}`}></span>
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
        <section id="zone-4" className="space-y-3 transition-all duration-500">
          <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex items-center space-x-2">
            <Inbox className="w-3.5 h-3.5 text-blue-400" />
            <span>Zone 4: Action Center (Active Maintenance Orders)</span>
          </h2>

          <div className={`${theme === 'dark' ? 'bg-[#0c0f17] border-[#182030]' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className={`${theme === 'dark' ? 'bg-[#0f131c] border-[#182030]' : 'bg-slate-50 border-slate-100'} text-slate-500 border-b uppercase tracking-widest text-[9px]`}>
                    <th className="py-3.5 px-5">Ticket ID</th>
                    <th className="py-3.5 px-4">Equipment</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Assigned Specialist</th>
                    <th className="py-3.5 px-4 text-right">Autonomous Procurement Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#182030]/40 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                  {data?.maintenance_orders && data.maintenance_orders.length > 0 ? (
                    data.maintenance_orders.map((order) => {
                      const email = getEmailDraftContent(order.root_cause);
                      
                      return (
                        <tr key={order.id} className={`transition-colors duration-150 ${theme === 'dark' ? 'hover:bg-slate-900/40 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                          <td className={`py-3.5 px-5 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>#{order.id}</td>
                          <td className="py-3.5 px-4">
                            <span className={`font-semibold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{order.machine_id}</span>
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
                          <td className={`py-3.5 px-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{order.assigned_technician}</td>
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

      {/* Tutorial Tour Guide Overlay */}
      {showTutorial && (
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${
          tutorialSteps[tutorialStep].selector 
            ? "bg-slate-950/20 pointer-events-none" 
            : "bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
        }`}>
          <div 
            style={tutorialSteps[tutorialStep].style}
            className={`${theme === 'dark' ? 'bg-[#0c0f17]/95 border-[#182030] text-slate-300 shadow-2xl' : 'bg-white/95 border-slate-200 text-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.12)]'} rounded-2xl overflow-hidden relative p-6 space-y-6 animate-fadeIn font-sans transition-all duration-500 ease-in-out pointer-events-auto ${
              tutorialSteps[tutorialStep].selector 
                ? tutorialSteps[tutorialStep].positionClass 
                : "w-full max-w-lg"
            }`}
          >
            
            {/* Header / Skip */}
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                STEP {tutorialStep + 1} OF {tutorialSteps.length}
              </span>
              <button 
                onClick={closeTutorial}
                className={`font-mono text-xs px-2.5 py-1 rounded transition-colors ${theme === 'dark' ? 'text-slate-505 hover:text-white hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                Skip Tour ✕
              </button>
            </div>

            {/* Icon & Title */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full border shadow-inner ${theme === 'dark' ? 'bg-slate-900/60 border-[#182030]' : 'bg-slate-50 border-slate-100'}`}>
                {tutorialSteps[tutorialStep].icon}
              </div>
              <h3 className={`text-lg font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {tutorialSteps[tutorialStep].title}
              </h3>
              <p className={`text-xs leading-relaxed font-normal max-w-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {tutorialSteps[tutorialStep].description}
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2">
              {tutorialSteps.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === tutorialStep ? "w-6 bg-blue-500" : "w-1.5 bg-slate-700"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className={`flex justify-between items-center pt-2 border-t font-mono text-xs ${theme === 'dark' ? 'border-[#182030]/50' : 'border-slate-100'}`}>
              <button
                disabled={tutorialStep === 0}
                onClick={() => setTutorialStep(prev => prev - 1)}
                className={`px-4 py-2 rounded border transition-colors ${
                  tutorialStep === 0 
                    ? (theme === 'dark' ? "text-slate-600 border-slate-900 cursor-not-allowed" : "text-slate-400 border-slate-200 cursor-not-allowed") 
                    : (theme === 'dark' ? "text-slate-300 border-slate-800 hover:bg-slate-800" : "text-slate-700 border-slate-250 hover:bg-slate-50")
                }`}
              >
                ◀ Back
              </button>
              
              {tutorialStep < tutorialSteps.length - 1 ? (
                <button
                  onClick={() => setTutorialStep(prev => prev + 1)}
                  className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                >
                  Next Step ▶
                </button>
              ) : (
                <button
                  onClick={closeTutorial}
                  className="px-5 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  Get Started ✓
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Slide-over / Modal Inspector */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`${theme === 'dark' ? 'bg-[#0c0f17] border-[#182030] text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-2xl'} border rounded-xl w-full max-w-2xl overflow-hidden relative`}>
            <div className={`border-b px-6 py-4 flex justify-between items-center ${theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]' : 'border-slate-100 bg-slate-50'}`}>
              <h3 className={`font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Autonomous Procurement Agent Draft</span>
              </h3>
              <button 
                onClick={() => setSelectedEmail(null)}
                className={`text-slate-500 transition-colors duration-150 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-slate-800'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className={`rounded-lg p-4 font-mono text-xs space-y-1.5 border ${theme === 'dark' ? 'bg-[#06080c] border-[#182030]/80 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                <div><span className="text-slate-500">From:</span> <span className="text-emerald-400">{selectedEmail.from}</span></div>
                <div><span className="text-slate-500">To:</span> <span className="text-blue-400">{selectedEmail.to}</span></div>
                <div><span className="text-slate-500">Subject:</span> <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedEmail.subject}</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="text-slate-400">{selectedEmail.date}</span></div>
              </div>
              
              <div className={`rounded-lg p-4 font-mono text-[11px] max-h-80 overflow-y-auto border leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'bg-[#06080c] border-[#182030]/80 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                {selectedEmail.body}
              </div>
            </div>

            <div className={`border-t px-6 py-4 flex justify-end space-x-3 font-mono text-xs ${theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]' : 'border-slate-100 bg-slate-50'}`}>
              <button 
                onClick={() => setSelectedEmail(null)}
                className={`px-4 py-2 rounded transition-colors duration-150 ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/50'}`}
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
