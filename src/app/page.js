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
  const thoughtsContainerRef = useRef(null);

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
    { id: "MCH-101", name: "High-Temp Fan A", location: "Bay 4 - Extraction", thresholds: { temperature: 90, vibration: 8, pressure: 6.5, current: 15, required_part_id: "PART-001" } }
  ]);

  // Visual Editor Configurator panel states
  const [showEditor, setShowEditor] = useState(false);
  const [editorTab, setEditorTab] = useState("machines");
  const [editorMachines, setEditorMachines] = useState([]);
  const [editorInventory, setEditorInventory] = useState([]);
  const [editorNodes, setEditorNodes] = useState([]);
  const [editorEdges, setEditorEdges] = useState([]);
  const [savingConfig, setSavingConfig] = useState(false);

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
      if (window.location.hash !== "#dashboard") {
        window.history.replaceState(null, "", "#dashboard");
      }
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

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash !== "#dashboard") {
        setIsSetupCompleted(false);
        setActiveProjectId(null);
        localStorage.removeItem("activeProjectId");
        localStorage.removeItem("isSetupCompleted");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
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
        if (window.location.hash !== "#dashboard") {
          window.history.pushState(null, "", "#dashboard");
        }
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

  const firstMachine = useMemo(() => {
    if (data && data.machines && data.machines.length > 0) {
      return data.machines[0];
    }
    return { id: "MCH-002", name: "High-Speed Industrial Fan B", status: "Operational" };
  }, [data]);

  // Dynamically map and layout supply chain graph nodes into Column coordinates
  const layoutNodes = useMemo(() => {
    if (!data || !data.graph || !data.graph.nodes) return {};

    const nodes = data.graph.nodes;
    const parts = nodes.filter(n => n.type === 'Part');
    const suppliers = nodes.filter(n => n.type === 'Supplier');
    const materials = nodes.filter(n => n.type === 'Material');

    const mapped = {};

    // 1. Add active root machine
    const firstMachineId = firstMachine?.id || "MCH-001";
    mapped[firstMachineId] = {
      id: firstMachineId,
      name: firstMachine?.name || "Root Asset",
      type: 'Machine',
      x: 80,
      y: 170,
      details: `Status: ${firstMachine?.status || 'Operational'}. Telemetry source node.`
    };

    // 2. Layout Parts at x = 220
    parts.forEach((p, idx) => {
      const count = parts.length;
      const spacing = count > 3 ? 60 : 80;
      const startY = 170 - ((count - 1) * spacing) / 2;
      mapped[p.id] = {
        ...p,
        x: 220,
        y: startY + idx * spacing
      };
    });

    // 3. Layout Suppliers at x = 380
    suppliers.forEach((s, idx) => {
      const count = suppliers.length;
      const spacing = count > 4 ? 50 : 80;
      const startY = 170 - ((count - 1) * spacing) / 2;
      mapped[s.id] = {
        ...s,
        x: 380,
        y: startY + idx * spacing
      };
    });

    // 4. Layout Materials at x = 520
    materials.forEach((m, idx) => {
      const count = materials.length;
      const spacing = count > 2 ? 60 : 80;
      const startY = 170 - ((count - 1) * spacing) / 2;
      mapped[m.id] = {
        ...m,
        x: 520,
        y: startY + idx * spacing
      };
    });

    return mapped;
  }, [data, firstMachine]);

  // Load custom presets inside the visual editor
  const handleLoadPreset = (presetType) => {
    if (presetType === "steel") {
      setEditorMachines([
        { id: "MCH-001", name: "Rotary Gear Pump A", location: "Bay 3 - Fluids Processing", thresholds: { temperature: 90, vibration: 8, pressure: 6.5, current: 15, required_part_id: "PART-001" } },
        { id: "MCH-002", name: "High-Speed Industrial Fan B", location: "Bay 7 - Ventilation and Exhaust", thresholds: { temperature: 80, vibration: 10, pressure: 3, current: 20, required_part_id: "PART-004" } },
        { id: "MCH-003", name: "Heavy-Duty Compressor C", location: "Bay 12 - Pneumatics & Air Power", thresholds: { temperature: 95, vibration: 7.5, pressure: 8.5, current: 25, required_part_id: "PART-002" } }
      ]);
      setEditorInventory([
        { part_id: "PART-001", part_name: "Heavy-Duty Bearing Assembly", stock_level: 15, reorder_point: 5, cost: 120.50, location: "Warehouse A - Aisle 4" },
        { part_id: "PART-002", part_name: "High-Pressure Hydraulic Seal", stock_level: 3, reorder_point: 10, cost: 45.00, location: "Warehouse A - Aisle 6" },
        { part_id: "PART-003", part_name: "Centrifugal Pump Impeller", stock_level: 8, reorder_point: 2, cost: 350.00, location: "Warehouse B - Aisle 2" },
        { part_id: "PART-004", part_name: "3-Phase Electric Motor Winding", stock_level: 1, reorder_point: 3, cost: 850.00, location: "Warehouse B - Aisle 5" }
      ]);
      setEditorNodes([
        { id: "PART-001", name: "Heavy-Duty Bearing Assembly", type: "Part", risk: 0, email: "" },
        { id: "PART-002", name: "High-Pressure Hydraulic Seal", type: "Part", risk: 0, email: "" },
        { id: "PART-003", name: "Centrifugal Pump Impeller", type: "Part", risk: 0, email: "" },
        { id: "PART-004", name: "3-Phase Electric Motor Winding", type: "Part", risk: 0, email: "" },
        { id: "SUP-001", name: "Siemens Shanghai", type: "Supplier", risk: 0.70, email: "procurement@siemens.cn" },
        { id: "SUP-002", name: "SKF Munich", type: "Supplier", risk: 0.15, email: "logistics@skf.de" },
        { id: "SUP-003", name: "CopperWorks Ohio", type: "Supplier", risk: 0.10, email: "orders@copperworksohio.com" },
        { id: "SUP-004", name: "VarnishTech Graz", type: "Supplier", risk: 0.20, email: "sales@varnishwtech.at" },
        { id: "SUP-005", name: "Parker Hannifin Cleveland", type: "Supplier", risk: 0.05, email: "orders@parkerhannifin.com" },
        { id: "SUP-006", name: "Sulzer Gothenburg", type: "Supplier", risk: 0.12, email: "procurement@sulzer.se" }
      ]);
      setEditorEdges([
        { source: "SUP-002", target: "PART-001", relationship: "SUPPLIES", transit: 5, price: 450.00 },
        { source: "SUP-005", target: "PART-002", relationship: "SUPPLIES", transit: 2, price: 35.00 },
        { source: "SUP-006", target: "PART-003", relationship: "SUPPLIES", transit: 14, price: 250.00 },
        { source: "SUP-001", target: "PART-004", relationship: "SUPPLIES", transit: 28, price: 850.00 },
        { source: "SUP-002", target: "PART-004", relationship: "SUPPLIES", transit: 5, price: 1200.00 }
      ]);
    } else if (presetType === "petrochemical") {
      setEditorMachines([
        { id: "MCH-201", name: "Crude Transfer Pump Alpha", location: "Bay 5 - Hydrocracking", thresholds: { temperature: 95.0, vibration: 8.5, pressure: 12.0, current: 40.0, required_part_id: "PART-203" } },
        { id: "MCH-202", name: "Gas Combustion Turbine Beta", location: "Bay 9 - Power Generation", thresholds: { temperature: 110.0, vibration: 12.0, pressure: 16.5, current: 85.0, required_part_id: "PART-201" } },
        { id: "MCH-203", name: "Heavy Heat Exchanger Fan", location: "Bay 2 - Cooling Complex", thresholds: { temperature: 85.0, vibration: 9.0, pressure: 4.5, current: 18.0, required_part_id: "PART-204" } }
      ]);
      setEditorInventory([
        { part_id: "PART-201", part_name: "Extreme Heat Gas Turbine Valve", stock_level: 2, reorder_point: 5, cost: 2450.00, location: "Warehouse C - Aisle 1" },
        { part_id: "PART-202", part_name: "Fluorosilicone High-Pressure Gasket", stock_level: 25, reorder_point: 10, cost: 85.00, location: "Warehouse A - Aisle 9" },
        { part_id: "PART-203", part_name: "Petrochemical Centrifugal Impeller", stock_level: 1, reorder_point: 3, cost: 1450.00, location: "Warehouse C - Aisle 3" },
        { part_id: "PART-204", part_name: "Exchanger Fan 3-Phase Rotor Winding", stock_level: 8, reorder_point: 2, cost: 720.00, location: "Warehouse B - Aisle 7" }
      ]);
      setEditorNodes([
        { id: "PART-201", name: "Extreme Heat Gas Turbine Valve", type: "Part", risk: 0, email: "" },
        { id: "PART-202", name: "Fluorosilicone High-Pressure Gasket", type: "Part", risk: 0, email: "" },
        { id: "PART-203", name: "Petrochemical Centrifugal Impeller", type: "Part", risk: 0, email: "" },
        { id: "PART-204", name: "Exchanger Fan 3-Phase Rotor Winding", type: "Part", risk: 0, email: "" },
        { id: "SUP-201", name: "GE Power Systems Logistics", type: "Supplier", risk: 0.08, email: "logistics@gepower.com" },
        { id: "SUP-202", name: "Chevron Seals Houston", type: "Supplier", risk: 0.04, email: "houston.sales@chevronseals.com" },
        { id: "SUP-203", name: "Sulzer Gothenburg", type: "Supplier", risk: 0.12, email: "procurement@sulzer.se" },
        { id: "SUP-204", name: "VarnishTech Graz", type: "Supplier", risk: 0.20, email: "sales@varnishwtech.at" }
      ]);
      setEditorEdges([
        { source: "SUP-201", target: "PART-201", relationship: "SUPPLIES", transit: 4, price: 3200.00 },
        { source: "SUP-202", target: "PART-202", relationship: "SUPPLIES", transit: 1, price: 95.00 },
        { source: "SUP-203", target: "PART-203", relationship: "SUPPLIES", transit: 12, price: 1750.00 },
        { source: "SUP-204", target: "PART-204", relationship: "SUPPLIES", transit: 6, price: 850.00 },
        { source: "SUP-201", target: "PART-203", relationship: "SUPPLIES", transit: 26, price: 1250.00 }
      ]);
    } else if (presetType === "automotive") {
      setEditorMachines([
        { id: "MCH-301", name: "6-Axis Welder Robot Joint", location: "Bay 1 - Welding Cell", thresholds: { temperature: 80.0, vibration: 15.0, pressure: 5.0, current: 30.0, required_part_id: "PART-301" } },
        { id: "MCH-302", name: "Main Assembly Conveyor Drive", location: "Bay 6 - Painting Line", thresholds: { temperature: 75.0, vibration: 8.0, pressure: 6.0, current: 22.0, required_part_id: "PART-302" } },
        { id: "MCH-303", name: "Fleet Pneumatic Compressor Main", location: "Bay 14 - Assembly Main", thresholds: { temperature: 90.0, vibration: 9.5, pressure: 9.0, current: 50.0, required_part_id: "PART-303" } }
      ]);
      setEditorInventory([
        { part_id: "PART-301", part_name: "Harmonic Welder Gear Box Drive", stock_level: 0, reorder_point: 2, cost: 3850.00, location: "Warehouse D - Aisle 3" },
        { part_id: "PART-302", part_name: "3-Phase Drive Motor Brushless", stock_level: 5, reorder_point: 2, cost: 950.00, location: "Warehouse B - Aisle 1" },
        { part_id: "PART-303", part_name: "Pneumatic Double Solenoid Valve", stock_level: 2, reorder_point: 8, cost: 140.00, location: "Warehouse A - Aisle 2" },
        { part_id: "PART-304", part_name: "Welder Copper Cable Core", stock_level: 12, reorder_point: 5, cost: 220.00, location: "Warehouse B - Aisle 9" }
      ]);
      setEditorNodes([
        { id: "PART-301", name: "Harmonic Welder Gear Box Drive", type: "Part", risk: 0, email: "" },
        { id: "PART-302", name: "3-Phase Drive Motor Brushless", type: "Part", risk: 0, email: "" },
        { id: "PART-303", name: "Pneumatic Double Solenoid Valve", type: "Part", risk: 0, email: "" },
        { id: "PART-304", name: "Welder Copper Cable Core", type: "Part", risk: 0, email: "" },
        { id: "SUP-301", name: "Yaskawa Motoman Logistics", type: "Supplier", risk: 0.05, email: "logistics@yaskawa.com" },
        { id: "SUP-302", name: "SMC Pneumatics Cleveland", type: "Supplier", risk: 0.03, email: "orders@smcpneumatics.com" },
        { id: "SUP-303", name: "Siemens Munich", type: "Supplier", risk: 0.10, email: "logistics@siemens.de" },
        { id: "SUP-304", name: "CopperWorks Ohio", type: "Supplier", risk: 0.10, email: "orders@copperworksohio.com" }
      ]);
      setEditorEdges([
        { source: "SUP-301", target: "PART-301", relationship: "SUPPLIES", transit: 7, price: 4200.00 },
        { source: "SUP-302", target: "PART-303", relationship: "SUPPLIES", transit: 2, price: 120.00 },
        { source: "SUP-303", target: "PART-302", relationship: "SUPPLIES", transit: 5, price: 1100.00 },
        { source: "SUP-304", target: "PART-304", relationship: "SUPPLIES", transit: 3, price: 195.00 },
        { source: "SUP-303", target: "PART-301", relationship: "SUPPLIES", transit: 29, price: 3900.00 }
      ]);
    } else if (presetType === "empty") {
      setEditorMachines([]);
      setEditorInventory([]);
      setEditorNodes([]);
      setEditorEdges([]);
    }
  };

  // POST newly visual configurations directly into PostgreSQL DB
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch(`${API_BASE}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machines: editorMachines,
          inventory: editorInventory,
          nodes: editorNodes,
          edges: editorEdges
        })
      });
      if (res.ok) {
        setShowEditor(false);
        await refreshData();
        alert("Factory fleet structure successfully synchronized with PostgreSQL DB!");
      } else {
        const err = await res.json();
        alert("Failed to synchronize structures: " + err.error);
      }
    } catch (err) {
      console.error("Config save failed:", err);
      alert("Connection to backend database failed.");
    } finally {
      setSavingConfig(false);
    }
  };

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

  // Auto scroll console terminal scroll container (non-intrusive)
  useEffect(() => {
    if (thoughtsContainerRef.current) {
      const container = thoughtsContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
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

  if (!isSetupCompleted) {
    return (
      <div className={`h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#030508] text-slate-300' : 'bg-[#f8fafc] text-slate-700'} font-sans p-4 md:p-6 lg:p-6 flex flex-col items-center justify-start relative select-none selection:bg-cyan-500/30 transition-colors duration-300`}>
        
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
        <div className="w-full flex-1 min-h-0 z-10 animate-fadeIn grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch p-2 pb-4">
          
          {/* LEFT PANEL: Saved Fleets Sidebar (ChatGPT style) */}
          <div className="lg:col-span-4 flex flex-col h-full min-h-0">
            <div className={`border rounded-2xl p-5 flex flex-col h-full min-h-0 backdrop-blur-md transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-[#080b11]/50 border-[#1b2336]/60 text-slate-300 shadow-[0_0_30px_rgba(0,0,0,0.2)]' 
                : 'bg-white/80 border-slate-200 text-slate-700 shadow-xl shadow-slate-100'
            }`}>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className={`text-[10px] font-bold tracking-widest uppercase font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} flex items-center space-x-2`}>
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
                      const isProjActive = activeProjectId === proj.id;
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

                            <h3 className={`text-xs font-bold font-mono tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-805'} group-hover:text-cyan-400 transition-colors truncate`}>
                              {proj.name}
                            </h3>

                            <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} truncate font-sans font-normal`}>
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
                              className="text-red-400/70 hover:text-red-455 p-1 rounded hover:bg-red-500/10 transition-all"
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

          {/* RIGHT PANEL: Workspace Area */}
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
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl"
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
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl"
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
                            <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-805'} group-hover:text-blue-500 transition-colors`}>Heavy Steel Rolling Mill</h4>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                              Baseline fleet consisting of Rotary Gear Pumps, Industrial Exhaust Fans, and Pneumatic Compressors. Optimized for testing ball-bearing degradation.
                            </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-505">
                            <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 3 pdm assets</span>
                            <span className="text-blue-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">SELECT MODULE <ArrowRight className="w-3 h-3" /></span>
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
                            <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-805'} group-hover:text-emerald-500 transition-colors`}>Petrochemical Refinery</h4>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                              Gas turbines, high-pressure gaskets, and transfer pumps. Features specialized oil & gas RAG manuals and Houston fast seal logistics routing.
                            </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-505">
                            <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 3 pdm assets</span>
                            <span className="text-emerald-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">SELECT MODULE <ArrowRight className="w-3 h-3" /></span>
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
                            <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-850'} group-hover:text-purple-500 transition-colors`}>6-Axis Assembly Robotics</h4>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                              Robot joint gearboxes, painting line drives, and assembly cells. Optimized for testing high-precision harmonic gear fault diagnostic routines.
                            </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-505">
                            <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 3 pdm assets</span>
                            <span className="text-purple-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">SELECT MODULE <ArrowRight className="w-3 h-3" /></span>
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
                            <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-805'} group-hover:text-slate-400 transition-colors`}>Truly Empty Workspace</h4>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
                              Initialize a completely blank dashboard. No pre-seeded machinery, telemetry streams, or graphs. Build your entire fleet from scratch.
                            </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-505">
                            <span className="flex items-center gap-1"><Database className="w-3 h-3" /> 0 pdm assets</span>
                            <span className="text-slate-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">SELECT MODULE <ArrowRight className="w-3 h-3" /></span>
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
                                <label className="block text-[10px] text-slate-505 mb-1.5 uppercase font-bold tracking-wider">Equipment Name</label>
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
                                    className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-lg p-2 outline-none focus:border-cyan-550`}
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
                                    className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-lg p-2 outline-none focus:border-cyan-550`}
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
                                    className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-lg p-2 outline-none focus:border-cyan-550`}
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
                                    className={`w-full ${theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20'} rounded-lg p-2 outline-none focus:border-cyan-550`}
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

        </div>

        {seeding && (
          <div className={`fixed inset-0 z-50 ${
            theme === 'dark' ? 'bg-[#030508]/95 text-cyan-400' : 'bg-[#f8fafc]/95 text-cyan-600'
          } backdrop-blur-md flex flex-col items-center justify-center font-mono`}>
            <Activity className={`h-10 w-10 animate-spin mb-4 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <div className="animate-pulse tracking-[0.15em] text-xs uppercase text-center px-4 font-bold">
              Hydrating PostgreSQL schemas & initializing workspace vector DB...
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className={`flex h-screen flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#030508] text-cyan-400' : 'bg-[#f8fafc] text-cyan-600'} font-mono`}>
        <Activity className={`h-10 w-10 animate-spin mb-4 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <div className="animate-pulse tracking-widest text-xs font-bold">SYNCHRONIZING WORKSPACE CONTROL METRICS...</div>
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
      <header className={`border-b ${theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]/95 text-white' : 'border-slate-200 bg-white/90 shadow-[0_2px_15px_rgba(0,0,0,0.02)] text-slate-800'} px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md transition-all duration-300`}>
        <div className="flex items-center space-x-3">
          <div className={`h-8.5 w-8.5 ${theme === 'dark' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} rounded border flex items-center justify-center`}>
            <Cpu className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={activeProject?.name || ""}
                onChange={(e) => handleRenameProject(activeProject?.id, e.target.value)}
                className={`bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-500 outline-none font-mono text-[16px] font-extrabold tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-805'} transition-all w-[320px]`}
                placeholder="Unnamed Project"
              />
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'} border`}>
                {activeProject?.type === "template" ? `${activeProject?.templateId?.toUpperCase()}_TEMPLATE` : "CUSTOM_FLEET"}
              </span>
            </div>
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
              if (confirm("Return to Projects Portal? Current database setup will remain active until you launch another fleet config.")) {
                setIsSetupCompleted(false);
                setActiveProjectId(null);
                localStorage.removeItem("activeProjectId");
                localStorage.removeItem("isSetupCompleted");
                if (window.location.hash === "#dashboard") {
                  window.history.pushState(null, "", window.location.pathname);
                }
              }
            }}
            className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-1.5 ${
              theme === 'dark'
                ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600 hover:text-white'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200/85 hover:bg-cyan-600 hover:text-white shadow-sm'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Projects Portal</span>
          </button>

          <button
            onClick={() => {
              setEditorMachines(data?.machines ? JSON.parse(JSON.stringify(data.machines)) : []);
              setEditorInventory(data?.inventory ? JSON.parse(JSON.stringify(data.inventory)) : []);
              setEditorNodes(data?.graph?.nodes ? JSON.parse(JSON.stringify(data.graph.nodes)) : []);
              setEditorEdges(data?.graph?.links ? JSON.parse(JSON.stringify(data.graph.links)) : []);
              setShowEditor(true);
            }}
            className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-1.5 ${
              theme === 'dark'
                ? 'bg-slate-900 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600 hover:text-white'
                : 'bg-white text-cyan-700 border-cyan-200/80 hover:bg-cyan-600 hover:text-white shadow-sm'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Fleet & Graph</span>
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
              
              const hasTemp = (machine.critical_thresholds?.temperature ?? 0) > 0;
              const hasVib = (machine.critical_thresholds?.vibration ?? 0) > 0;
              const hasPres = (machine.critical_thresholds?.pressure ?? 0) > 0;
              const hasCurr = (machine.critical_thresholds?.current ?? 0) > 0;

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

                      {/* Sparkline trends */}
                      {(hasTemp || hasVib) && (
                        <div className={`mt-4 pt-4 border-t flex justify-between items-center ${theme === 'dark' ? 'border-[#182030]/40' : 'border-slate-100'}`}>
                          <div className="text-[9px] text-slate-500 font-bold leading-tight">
                            <div>24H REALTIME GRAPH</div>
                            <div className={`mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              {hasTemp && hasVib ? "TEMP + VIB" : hasTemp ? "TEMPERATURE" : "VIBRATION"}
                            </div>
                          </div>
                          <div className="h-9 opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                            {hasTemp && <Sparkline data={tempHistory} color={health.sparkColor} width={70} height={32} />}
                            {hasVib && <Sparkline data={vibHistory} color="#2563eb" width={70} height={32} />}
                          </div>
                        </div>
                      )}
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
              <div ref={thoughtsContainerRef} className="p-4 flex-1 overflow-y-auto font-mono text-[11px] space-y-3 scroll-smooth leading-relaxed">
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
                {(!data?.graph?.nodes || data.graph.nodes.length === 0) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center font-mono text-xs select-none animate-fadeIn">
                    <div className={`p-4 rounded-full border border-dashed mb-3 ${theme === 'dark' ? 'bg-[#0c0f17] border-slate-700/50' : 'bg-slate-50 border-slate-300'}`}>
                      <Activity className={`h-8 w-8 text-slate-500 animate-pulse`} />
                    </div>
                    <p className={`font-bold tracking-wider uppercase mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>Supply Chain Graph is Empty</p>
                    <p className="text-[10px] text-slate-500 max-w-sm mb-4 leading-relaxed">
                      No parts or suppliers have been registered for this custom fleet project yet. Use the configurator below to build your supply chain pathways.
                    </p>
                    <button 
                      onClick={() => {
                        setEditorMachines(data?.machines ? JSON.parse(JSON.stringify(data.machines)) : []);
                        setEditorInventory(data?.inventory ? JSON.parse(JSON.stringify(data.inventory)) : []);
                        setEditorNodes(data?.graph?.nodes ? JSON.parse(JSON.stringify(data.graph.nodes)) : []);
                        setEditorEdges(data?.graph?.links ? JSON.parse(JSON.stringify(data.graph.links)) : []);
                        setShowEditor(true);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono text-[9px] font-bold rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Seed or Edit Structure</span>
                    </button>
                  </div>
                ) : (
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

                    {/* Sourcing active highlights detection */}
                    {(() => {
                      const activeOrder = data.maintenance_orders?.find(o => o.status.includes('Sourcing') || o.status === 'Pending_Sourcing');
                      const failedMachine = data.machines?.find(m => m.id === activeOrder?.machine_id);
                      const requiredPartId = failedMachine?.critical_thresholds?.required_part_id || "PART-004";
                      const winnerSupplierName = activeOrder?.root_cause?.match(/Selected Supplier:\s*([^\n\r]+)/)?.[1]?.replace(/\([^)]+\)/g, "")?.trim() || "";

                      // Build lines connecting machine node to all Part nodes
                      const partNodes = Object.values(layoutNodes).filter(n => n.type === 'Part');
                      const rootId = firstMachine?.id || "MCH-001";
                      const rootCoords = layoutNodes[rootId] || { x: 80, y: 170 };

                      return (
                        <g>
                          {/* 1. Draw connections from Machine node to all Part nodes */}
                          {partNodes.map(p => {
                            const isPathSourced = activeOrder && p.id === requiredPartId;
                            return (
                              <line
                                key={`mach-to-${p.id}`}
                                x1={rootCoords.x}
                                y1={rootCoords.y}
                                x2={p.x}
                                y2={p.y}
                                stroke={isPathSourced ? "#f59e0b" : (theme === 'dark' ? "#1e293b" : "#cbd5e1")}
                                strokeWidth={isPathSourced ? "3.5" : "1.5"}
                                strokeDasharray={isPathSourced ? "6,4" : ""}
                              />
                            );
                          })}

                          {/* 2. Draw connections between Parts, Suppliers, and Materials from links data */}
                          {(data.graph.links || []).map((link, idx) => {
                            const src = layoutNodes[link.source];
                            const tgt = layoutNodes[link.target];
                            if (!src || !tgt) return null;

                            // Determine if this path connects to the required part and is the winner supplier
                            const isRequiredPartEdge = (src.id === requiredPartId || tgt.id === requiredPartId);
                            const isWinnerEdge = activeOrder && isRequiredPartEdge && 
                              (src.name.toLowerCase().includes(winnerSupplierName.toLowerCase()) || 
                               tgt.name.toLowerCase().includes(winnerSupplierName.toLowerCase()) ||
                               activeOrder.root_cause.toLowerCase().includes(src.name.toLowerCase()) ||
                               activeOrder.root_cause.toLowerCase().includes(tgt.name.toLowerCase()));

                            return (
                              <line
                                key={`edge-${idx}`}
                                x1={src.x}
                                y1={src.y}
                                x2={tgt.x}
                                y2={tgt.y}
                                stroke={isWinnerEdge ? "#f59e0b" : (theme === 'dark' ? "#1e293b" : "#cbd5e1")}
                                strokeWidth={isWinnerEdge ? "3.5" : "1.5"}
                              />
                            );
                          })}

                          {/* 3. Render Ping effects for actively sourced nodes */}
                          {activeOrder && Object.values(layoutNodes).map(node => {
                            const isTargetPart = node.type === 'Part' && node.id === requiredPartId;
                            const isWinnerSupplier = node.type === 'Supplier' && 
                              (node.name.toLowerCase().includes(winnerSupplierName.toLowerCase()) || 
                               activeOrder.root_cause.toLowerCase().includes(node.name.toLowerCase()));

                            if (isTargetPart || isWinnerSupplier) {
                              return (
                                <circle
                                  key={`ping-${node.id}`}
                                  cx={node.x}
                                  cy={node.y}
                                  r="14"
                                  fill="#f59e0b"
                                  opacity="0.15"
                                  className="animate-ping"
                                />
                              );
                            }
                            return null;
                          })}

                          {/* 4. Render Machine Root Node */}
                          {(() => {
                            const isCritical = firstMachine?.status === "Critical" || firstMachine?.status === "Degraded";
                            return (
                              <g transform={`translate(${rootCoords.x}, ${rootCoords.y})`} className="cursor-pointer" onClick={() => setSelectedSupplierNode({ name: firstMachine?.name || "Root Asset", role: 'Telemetry Root Source', details: `Status: ${firstMachine?.status || 'Operational'}. Requires critical spares immediately to bypass active downtime warnings.` })}>
                                <rect x="-35" y="-18" width="70" height="36" rx="4" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={isCritical ? "#ef4444" : "#2563eb"} strokeWidth="2" />
                                <text textAnchor="middle" y="4" fill={theme === 'dark' ? "#f8fafc" : "#1e293b"} fontSize="10" fontWeight="bold" fontFamily="monospace">{firstMachine?.id || "MCH-001"}</text>
                                <text textAnchor="middle" y="-23" fill="#64748b" fontSize="8" fontWeight="600">ROOT FLEET</text>
                              </g>
                            );
                          })()}

                          {/* 5. Render Parts, Suppliers, Materials */}
                          {Object.values(layoutNodes).filter(n => n.type !== 'Machine').map(node => {
                            const isTargetPart = activeOrder && node.type === 'Part' && node.id === requiredPartId;
                            const isWinnerSupplier = activeOrder && node.type === 'Supplier' && 
                              (node.name.toLowerCase().includes(winnerSupplierName.toLowerCase()) || 
                               activeOrder.root_cause.toLowerCase().includes(node.name.toLowerCase()));
                            const isHighlighted = isTargetPart || isWinnerSupplier;

                            if (node.type === 'Part') {
                              return (
                                <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer" onClick={() => {
                                  const invItem = data.inventory?.find(i => i.part_id === node.id);
                                  setSelectedSupplierNode({
                                    name: node.name,
                                    role: `Component Node (${node.id})`,
                                    details: invItem ? `Relational database stock audit: ${invItem.stock_level <= invItem.reorder_point ? 'LOW STOCK' : 'IN STOCK'} (Stock: ${invItem.stock_level}, Reorder Pt: ${invItem.reorder_point}). Value: $${invItem.cost}. Storage Location: ${invItem.location}.` : `Part configuration node. Sourcing active.`
                                  });
                                }}>
                                  <circle r="12" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={isHighlighted ? "#f59e0b" : (theme === 'dark' ? "#475569" : "#94a3b8")} strokeWidth="2" filter={isHighlighted ? "url(#glow-orange)" : ""} />
                                  <text textAnchor="middle" y="3" fill={isHighlighted ? "#f59e0b" : (theme === 'dark' ? "#cbd5e1" : "#475569")} fontSize="9" fontWeight="bold" fontFamily="monospace">{node.id.replace("PART-", "P")}</text>
                                  <text textAnchor="middle" y="-17" fill="#64748b" fontSize="8" fontFamily="monospace">{node.id}</text>
                                </g>
                              );
                            } else if (node.type === 'Supplier') {
                              return (
                                <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer" onClick={() => {
                                  setSelectedSupplierNode({
                                    name: node.name,
                                    role: 'Direct Supplier (Tier 1)',
                                    details: `Supplier risk rating: ${(node.risk * 100).toFixed(0)}%. Email contact: ${node.email || 'N/A'}. Emergency transit route pre-approved for priority fulfillment.`
                                  });
                                }}>
                                  <polygon points="0,-12 11,8 -11,8" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={isHighlighted ? "#f59e0b" : (theme === 'dark' ? "#475569" : "#94a3b8")} strokeWidth="2" filter={isHighlighted ? "url(#glow-orange)" : ""} />
                                  <text textAnchor="middle" y="22" fill={theme === 'dark' ? "#cbd5e1" : "#334155"} fontSize="9" fontWeight="bold">{node.name.length > 12 ? node.name.substr(0, 10) + ".." : node.name}</text>
                                  {isHighlighted && (
                                    <text textAnchor="middle" y="-18" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace">WINNER</text>
                                  )}
                                </g>
                              );
                            } else {
                              // Material Node
                              return (
                                <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer" onClick={() => {
                                  setSelectedSupplierNode({
                                    name: node.name,
                                    role: 'Raw Material (Tier 2)',
                                    details: `Raw material items used in parts production. Sourcing risk score: ${(node.risk * 100).toFixed(0)}%.`
                                  });
                                }}>
                                  <rect x="-24" y="-12" width="48" height="24" rx="2" fill={theme === 'dark' ? "#0c0f17" : "#ffffff"} stroke={theme === 'dark' ? "#1e293b" : "#cbd5e1"} strokeWidth="1.5" />
                                  <text textAnchor="middle" y="3" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">MATERIAL</text>
                                  <text textAnchor="middle" y="23" fill={theme === 'dark' ? "#cbd5e1" : "#334155"} fontSize="9">{node.name.length > 12 ? node.name.substr(0, 10) + ".." : node.name}</text>
                                </g>
                              );
                            }
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                )}
              </div>

              {selectedSupplierNode && (
                <div className={`absolute bottom-4 left-4 right-4 border rounded-lg p-3.5 backdrop-blur-sm font-mono text-xs shadow-2xl transition-all duration-300 bg-slate-950/95 border-amber-500/20 text-slate-350 ${theme === 'dark' ? 'bg-slate-950/95 border-amber-500/20 text-slate-300' : 'bg-white/95 border-amber-500/40 text-slate-700 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-bold tracking-wide uppercase ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>{selectedSupplierNode.name}</span>
                    <span className="text-[9px] text-slate-500 uppercase">{selectedSupplierNode.role}</span>
                  </div>
                  <p className={`leading-normal ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{selectedSupplierNode.details}</p>
                  <button 
                    onClick={() => setSelectedSupplierNode(null)} 
                    className="absolute top-2 right-2 text-slate-555 hover:text-white"
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

      {/* Visual Editor Configurator Modal Panel */}
      {showEditor && (
        <div className="fixed inset-0 z-55 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-5xl rounded-2xl border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-300 ${
            theme === 'dark' ? 'bg-[#0c0f17] border-[#182030] text-slate-300 shadow-[0_0_50px_rgba(6,182,212,0.15)]' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            
            {/* Modal Header */}
            <div className={`border-b px-6 py-4 flex justify-between items-center ${
              theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]/80' : 'border-slate-100 bg-slate-50'
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
              theme === 'dark' ? 'border-[#182030]/60 text-slate-400' : 'border-slate-150 text-slate-600'
            }`}>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">LOAD PRESET STRUCTURES:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadPreset("steel")}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-blue-950/20 border-blue-500/30 text-blue-400 hover:bg-blue-900/30'
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
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30'
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
                      ? 'bg-purple-950/20 border-purple-500/30 text-purple-400 hover:bg-purple-900/30'
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
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
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
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/20"
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
                        theme === 'dark' ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.05)]' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Fleet Machine
                    </button>
                  </div>

                  {editorMachines.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 italic font-mono">No machines defined in custom fleet database. Click "Add Fleet Machine" or load a preset.</div>
                  ) : (
                    <div className="space-y-4">
                      {editorMachines.map((m, idx) => (
                        <div key={idx} className={`border p-4 rounded-xl space-y-3 font-mono text-xs relative ${
                          theme === 'dark' ? 'border-[#1b2336]/60 bg-[#05070a]/40' : 'border-slate-200 bg-slate-50/50'
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
                              <label className="block text-[9px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Asset ID</label>
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
                              <label className="block text-[9px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Name</label>
                              <input
                                type="text"
                                value={m.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                                }}
                                className={`w-full rounded-lg p-2 outline-none text-xs ${
                                  theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500'
                                } border`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Bay Location</label>
                              <input
                                type="text"
                                value={m.location}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, location: val } : item));
                                }}
                                className={`w-full rounded-lg p-2 outline-none text-xs ${
                                  theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                                } border`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Requires Spare Part</label>
                              <select
                                value={m.thresholds?.required_part_id || "PART-001"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditorMachines(prev => prev.map((item, i) => i === idx ? { ...item, thresholds: { ...item.thresholds, required_part_id: val } } : item));
                                }}
                                className={`w-full rounded-lg p-2 outline-none text-xs ${
                                  theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
                            <span className="block text-[9px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Operational Critical Limits Thresholds</span>
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
                                    theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
                                    theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
                                    theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
                                    theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
                        theme === 'dark' ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.05)]' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Spare Part
                    </button>
                  </div>

                  {editorInventory.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 italic font-mono">No spare parts defined. Click "Add Spare Part" or load a preset.</div>
                  ) : (
                    <div className="space-y-4">
                      {editorInventory.map((item, idx) => (
                        <div key={idx} className={`border p-4 rounded-xl grid grid-cols-1 md:grid-cols-7 gap-3 font-mono text-xs relative ${
                          theme === 'dark' ? 'border-[#1b2336]/60 bg-[#05070a]/40' : 'border-slate-200 bg-slate-50/50'
                        }`}>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Part ID</label>
                            <input
                              type="text"
                              value={item.part_id}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, part_id: val } : p));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Part Name</label>
                            <input
                              type="text"
                              value={item.part_name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, part_name: val } : p));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Stock Level</label>
                            <input
                              type="number"
                              value={item.stock_level}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, stock_level: val } : p));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Reorder Pt</label>
                            <input
                              type="number"
                              value={item.reorder_point}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, reorder_point: val } : p));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Unit Cost ($)</label>
                            <input
                              type="number"
                              value={item.cost}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0.0;
                                setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, cost: val } : p));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            />
                          </div>
                          <div className="flex items-end justify-between gap-2">
                            <div className="flex-1">
                              <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Location</label>
                              <input
                                type="text"
                                value={item.location}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditorInventory(prev => prev.map((p, i) => i === idx ? { ...p, location: val } : p));
                                }}
                                className={`w-full rounded-lg p-2 outline-none ${
                                  theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
                        theme === 'dark' ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.05)]' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Graph Node
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editorNodes.map((n, idx) => (
                      <div key={idx} className={`border p-4 rounded-xl space-y-3 font-mono text-xs relative ${
                        theme === 'dark' ? 'border-[#1b2336]/60 bg-[#05070a]/40' : 'border-slate-200 bg-slate-50/50'
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
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Node ID (Tag)</label>
                            <input
                              type="text"
                              value={n.id}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorNodes(prev => prev.map((item, i) => i === idx ? { ...item, id: val } : item));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Node Name</label>
                            <input
                              type="text"
                              value={n.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorNodes(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Node Type</label>
                            <select
                              value={n.type}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorNodes(prev => prev.map((item, i) => i === idx ? { ...item, type: val } : item));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            >
                              <option value="Supplier">Supplier (Tier 1)</option>
                              <option value="Part">Spare Part Component</option>
                              <option value="Material">Raw Material (Tier 2)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Supplier Risk (0.0 to 1.0)</label>
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
                                (theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800')
                              } border`}
                            />
                          </div>
                        </div>
                        {n.type === "Supplier" && (
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Contact Email</label>
                            <input
                              type="email"
                              value={n.email || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorNodes(prev => prev.map((item, i) => i === idx ? { ...item, email: val } : item));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
                        theme === 'dark' ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.05)]' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Graph Connection (Edge)
                    </button>
                  </div>

                  {editorEdges.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 italic font-mono">No routing connections mapped in the database. Click "Add Graph Connection" or load a preset.</div>
                  ) : (
                    <div className="space-y-4">
                      {editorEdges.map((e, idx) => (
                        <div key={idx} className={`border p-4 rounded-xl grid grid-cols-1 md:grid-cols-6 gap-3 font-mono text-xs relative ${
                          theme === 'dark' ? 'border-[#1b2336]/60 bg-[#05070a]/40' : 'border-slate-200 bg-slate-50/50'
                        }`}>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Source (From)</label>
                            <select
                              value={e.source}
                              onChange={(val) => {
                                const v = val.target.value;
                                setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, source: v } : item));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            >
                              {editorNodes.map(node => (
                                <option key={node.id} value={node.id}>{node.id} ({node.name})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Target (To)</label>
                            <select
                              value={e.target}
                              onChange={(val) => {
                                const v = val.target.value;
                                setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, target: v } : item));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            >
                              {editorNodes.map(node => (
                                <option key={node.id} value={node.id}>{node.id} ({node.name})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Relationship</label>
                            <select
                              value={e.relationship}
                              onChange={(val) => {
                                const v = val.target.value;
                                setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, relationship: v } : item));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            >
                              <option value="SUPPLIES">SUPPLIES (Supplier &rarr; Part)</option>
                              <option value="USED_IN">USED_IN (Material &rarr; Part)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Transit Lead Time (Days)</label>
                            <input
                              type="number"
                              value={e.transit}
                              onChange={(val) => {
                                const v = parseInt(val.target.value) || 0;
                                setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, transit: v } : item));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                              } border`}
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] text-slate-500 mb-1 uppercase font-bold tracking-wider">Price / Cost ($)</label>
                            <input
                              type="number"
                              value={e.price}
                              onChange={(val) => {
                                const v = parseFloat(val.target.value) || 0.0;
                                setEditorEdges(prev => prev.map((item, i) => i === idx ? { ...item, price: v } : item));
                              }}
                              className={`w-full rounded-lg p-2 outline-none ${
                                theme === 'dark' ? 'bg-[#080b11] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
              theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]/90' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {savingConfig ? "WRITING TO FACTORY DB..." : "STANDING BY TO COMMIT CONFIG"}
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
                  {savingConfig ? "Synchronizing..." : "Apply & Sync to Factory DB"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
