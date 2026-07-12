"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  PETROCHEMICAL_TEMPLATE,
  AUTOMOTIVE_TEMPLATE,
  STEEL_TEMPLATE,
  generateBaselines,
  seedWorkspaceData
} from "@/lib/templatesData";
import CustomWorkspaceBuilder from "@/app/_components/CustomWorkspaceBuilder";
import { useToast } from "@/app/_components/ToastContext";
// We moved to a unified grid view for workspaces, so WorkspaceSidebar and ProjectConfigurator are not rendered directly.
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
  Moon,
  ChevronDown,
  Search,
  Share2,
  X,
  Pencil,
  FileText
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
  const { showToast, showConfirm } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [thoughts, setThoughts] = useState([
    { id: 1, agent: "System", type: "info", text: "Autonomous Control Tower Initialized. Scanning network..." },
    { id: 2, agent: "System", type: "info", text: "Local storage workspace engine online. Standing by..." }
  ]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedSupplierNode, setSelectedSupplierNode] = useState(null);
  const [showGraphLegendPopup, setShowGraphLegendPopup] = useState(false);
  const [selectedRoadmapOrderId, setSelectedRoadmapOrderId] = useState(null);
  const [simulatorDropdownOpen, setSimulatorDropdownOpen] = useState(false);
  const [componentsPopupMachineId, setComponentsPopupMachineId] = useState(null);
  const [graphsPopupMachineId, setGraphsPopupMachineId] = useState(null);
  const prevStages = useRef({});
  const thoughtsContainerRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const [theme, setTheme] = useState("dark");
  const [notificationPermission, setNotificationPermission] = useState("default");

  const requestNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };

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
  const SENSOR_PRESETS = {
    "winding_temp": { name: "Winding Temperature", min: 20.0, max: 90.0, current: 55.0, unit: "°C" },
    "vibration": { name: "Vibration", min: 0.1, max: 8.0, current: 1.8, unit: "mm/s" },
    "discharge_pressure": { name: "Discharge Pressure", min: 1.0, max: 6.5, current: 5.2, unit: "Bar" },
    "coil_current": { name: "Coil Current", min: 2.0, max: 15.0, current: 8.2, unit: "Amps" }
  };

  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [activeSetupTab, setActiveSetupTab] = useState("presets");
  const [seeding, setSeeding] = useState(false);
  const [customMachines, setCustomMachines] = useState([
    { id: "MCH-101", name: "High-Temp Fan A", location: "Bay 4 - Extraction", customSensors: [{ name: "Winding Temperature", min: 20.0, max: 90.0, current: 55.0, unit: "°C", isPreset: "winding_temp" }] }
  ]);

  // States for dynamic custom fleet creation
  const [customMachineName, setCustomMachineName] = useState("Custom Compressor Alpha");
  const [customMachineLocation, setCustomMachineLocation] = useState("Bay 1 - Main Complex");

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
  const [activeProjectTabs, setActiveProjectTabs] = useState({});

  // Workspaces View UI filter, search and modal states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "presets", "recent"
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectDescriptionInput, setProjectDescriptionInput] = useState("");
  const [projectTemplateInput, setProjectTemplateInput] = useState("steel");
  const [createWorkspaceMode, setCreateWorkspaceMode] = useState("template"); // "template" | "custom"

  // Key configurations states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState("");
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState("");
  const [dbStatus, setDbStatus] = useState({ connected: false, error: null, checking: false });
  const [geminiStatus, setGeminiStatus] = useState({ configured: false });
  const [savingKeys, setSavingKeys] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Helper to update this tab's active project in localStorage
  const updateTabActiveProject = useCallback((projectId) => {
    if (typeof window === "undefined") return;
    try {
      let tabId = sessionStorage.getItem("tabId");
      if (!tabId) {
        tabId = Math.random().toString(36).substring(2, 11);
        sessionStorage.setItem("tabId", tabId);
      }
      const currentRaw = localStorage.getItem("active_project_tabs");
      let current = currentRaw ? JSON.parse(currentRaw) : {};
      
      const now = Date.now();
      const cleaned = {};
      Object.keys(current).forEach(id => {
        if (id === tabId || (current[id] && now - current[id].lastActive < 15000)) {
          cleaned[id] = current[id];
        }
      });

      if (projectId) {
        cleaned[tabId] = { projectId, lastActive: now };
      } else {
        delete cleaned[tabId];
      }
      localStorage.setItem("active_project_tabs", JSON.stringify(cleaned));
      setActiveProjectTabs(cleaned);
    } catch (err) {
      console.error("Failed to update active project tabs", err);
    }
  }, []);

  // Periodically refresh active tabs to clear out stale entries (e.g. from crashed tabs)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem("active_project_tabs");
        if (raw) {
          setActiveProjectTabs(JSON.parse(raw));
        }
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Heartbeat to keep this tab's active project alive in localStorage
  useEffect(() => {
    if (!isSetupCompleted || !activeProjectId) return;
    
    const heartbeat = () => {
      updateTabActiveProject(activeProjectId);
    };
    
    const interval = setInterval(heartbeat, 5000);
    return () => clearInterval(interval);
  }, [isSetupCompleted, activeProjectId, updateTabActiveProject]);

  // Load project initialization state & projects list
  useEffect(() => {
    let tabId = sessionStorage.getItem("tabId");
    if (!tabId) {
      tabId = Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem("tabId", tabId);
    }

    updateTabActiveProject(null);

    const syncActiveTabs = () => {
      try {
        const raw = localStorage.getItem("active_project_tabs");
        setActiveProjectTabs(raw ? JSON.parse(raw) : {});
      } catch (e) {
        console.error(e);
      }
    };
    syncActiveTabs();

    const handleStorage = (e) => {
      if (e.key === "active_project_tabs") {
        syncActiveTabs();
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleUnload = () => {
      try {
        const currentRaw = localStorage.getItem("active_project_tabs");
        if (currentRaw) {
          const current = JSON.parse(currentRaw);
          delete current[tabId];
          localStorage.setItem("active_project_tabs", JSON.stringify(current));
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    const savedProjects = localStorage.getItem("projects");
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);

        // Pre-initialize milestone refs for all projects to prevent initial-load notification spam
        parsedProjects.forEach(proj => {
          const localDataRaw = localStorage.getItem(`workspace_data_${proj.id}`);
          if (localDataRaw) {
            try {
              const data = JSON.parse(localDataRaw);
              if (data.maintenance_orders) {
                data.maintenance_orders.forEach(order => {
                  const machine = data.machines?.find(m => m.id === order.machine_id);
                  const machineStatus = machine?.status || "Operational";
                  let approvalState = "Approved";
                  if (order.status === "Pending_Sourcing") {
                    approvalState = "Pending";
                  } else if (order.status === "Rejected") {
                    approvalState = "Rejected";
                  }

                  let activeStageIndex = 0;
                  if (approvalState === "Approved") {
                    activeStageIndex = 1;
                    if (order.status === "Dispatched_Sourcing_Active") {
                      activeStageIndex = 1;
                    } else if (order.status === "Approved") {
                      activeStageIndex = machineStatus === "Operational" ? 3 : 2;
                    }
                  }
                  
                  const refKey = `${proj.id}-${order.id}`;
                  prevStages.current[refKey] = activeStageIndex;
                });
              }
            } catch (err) {
              console.error("Failed to parse project data during init:", err);
            }
          }
        });
      } catch (e) {
        console.error("Failed to parse projects:", e);
      }
    }


    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [updateTabActiveProject]);

  const fetchKeys = async () => {
    try {
      setDbStatus(prev => ({ ...prev, checking: true }));
      const res = await fetch("/api/setup/keys");
      const data = await res.json();
      if (res.ok) {
        // Intentionally do NOT pre-fill inputs — users must type new values to overwrite
        setDbStatus({
          connected: data.dbConnected,
          error: data.dbError,
          checking: false
        });
        setGeminiStatus({
          configured: data.geminiConfigured
        });
      } else {
        setDbStatus(prev => ({ ...prev, checking: false, error: data.error }));
      }
    } catch (err) {
      console.error("Failed to fetch keys:", err);
      setDbStatus(prev => ({ ...prev, checking: false, error: err.message }));
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSaveKeys = async (e) => {
    if (e) e.preventDefault();
    setSavingKeys(true);
    try {
      const res = await fetch("/api/setup/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          DATABASE_URL: dbUrlInput,
          GEMINI_API_KEY: geminiApiKeyInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDbStatus({
          connected: data.dbConnected,
          error: data.dbError,
          checking: false
        });
        setGeminiStatus({
          configured: data.geminiConfigured
        });
        if (data.dbConnected) {
          showToast("Configuration saved! Database connection successful.", "success");
        } else {
          showToast("Configuration saved, but database connection failed. Please check your credentials.", "warning");
        }
        setShowSettingsModal(false);
      } else {
        showToast("Failed to save settings: " + (data.error || "Unknown error"), "error");
      }
    } catch (err) {
      showToast("Error saving settings: " + err.message, "error");
    } finally {
      setSavingKeys(false);
    }
  };

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

  const handleSetup = async (type, templateId = null, customMchs = null, isNewProject = false, projectId = null) => {
    setSeeding(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      const finalProjectId = projectId || activeProjectId;
      if (!finalProjectId) {
        showToast("Setup failed: No project active.", "error");
        return;
      }
      
      const seeded = seedWorkspaceData(type, templateId, customMchs);
      localStorage.setItem(`workspace_data_${finalProjectId}`, JSON.stringify(seeded));
      localStorage.setItem("isSetupCompleted", "true");
      updateTabActiveProject(finalProjectId);
      localStorage.setItem("lastSeededProjectId", finalProjectId);
      window.location.href = "/dashboard";
      
      // Trigger tour onboarding only on first creation
      if (isNewProject) {
        localStorage.removeItem("hasSeenTutorial");
        setShowTutorial(true);
        setTutorialStep(0);
      }
    } catch (err) {
      console.error("Local setup failed:", err);
      showToast("Local setup failed: " + err.message, "error");
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateProject = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const type = projectTemplateInput === "empty" ? "custom" : "template";
    const templateId = type === "template" ? projectTemplateInput : null;
    const finalName = projectNameInput.trim() || generateDefaultName(type, templateId);
    
    const finalMachines = type === "custom" ? customMachines.map((m, idx) => {
      const getLimit = (presetKey, fallback) => {
        const found = (m.customSensors || []).find(s => s.isPreset === presetKey);
        return found ? parseFloat(found.max) || fallback : fallback;
      };
      return {
        id: m.id || `MCH-10${idx + 1}`,
        name: m.name.trim() || `Custom Asset ${idx + 1}`,
        location: m.location.trim() || "Main Facility Block",
        status: "Operational",
        thresholds: {
          temperature: getLimit("winding_temp", 90.0),
          vibration: getLimit("vibration", 8.0),
          pressure: getLimit("discharge_pressure", 6.5),
          current: getLimit("coil_current", 15.0),
          required_part_id: "PART-001"
        },
        sensors: (m.customSensors || []).map((s, sIdx) => ({
          id: `SNS-CUST-${idx}-${sIdx}`,
          name: s.name,
          min: parseFloat(s.min) || 0,
          max: parseFloat(s.max) || 100,
          current: parseFloat(s.current) || 50,
          unit: s.unit
        }))
      };
    }) : [];

    const newProject = {
      id: "proj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      name: finalName,
      description: projectDescriptionInput.trim(),
      type,
      templateId,
      customMachines: finalMachines,
      createdAt: new Date().toISOString()
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
    
    setActiveProjectId(newProject.id);
    localStorage.setItem("activeProjectId", newProject.id);
    
    setProjectNameInput("");
    setProjectDescriptionInput("");
    setProjectTemplateInput("steel");
    setShowCreateModal(false);

    await handleSetup(type, newProject.templateId, newProject.customMachines, true, newProject.id);
  };

  const handleLaunchProject = async (proj) => {
    setActiveProjectId(proj.id);
    localStorage.setItem("activeProjectId", proj.id);
    localStorage.setItem("isSetupCompleted", "true");
    updateTabActiveProject(proj.id);
    const localData = localStorage.getItem(`workspace_data_${proj.id}`);
    if (!localData) {
      await handleSetup(proj.type, proj.templateId, proj.customMachines, false, proj.id);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleRenameProject = (projId, newName) => {
    if (!projId) return;
    const updated = projects.map(p => p.id === projId ? { ...p, name: newName } : p);
    setProjects(updated);
    localStorage.setItem("projects", JSON.stringify(updated));
  };

  const handleDeleteProject = (projId, e) => {
    e.stopPropagation();
    showConfirm("Are you sure you want to delete this project config?", () => {
      const updated = projects.filter(p => p.id !== projId);
      setProjects(updated);
      localStorage.setItem("projects", JSON.stringify(updated));

      if (activeProjectId === projId) {
        setActiveProjectId(null);
        localStorage.removeItem("activeProjectId");
        localStorage.removeItem("isSetupCompleted");
        setIsSetupCompleted(false);
        updateTabActiveProject(null);
      }
      showToast("Workspace config successfully deleted.", "success");
    });
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
      const activeId = localStorage.getItem("activeProjectId") || activeProjectId;
      if (!activeId) {
        alert("Configuration save failed: No project active.");
        return;
      }
      
      let localData = localStorage.getItem(`workspace_data_${activeId}`);
      let currentData = localData ? JSON.parse(localData) : {};
      
      currentData.machines = editorMachines;
      currentData.inventory = editorInventory;
      currentData.graph = {
        nodes: editorNodes,
        links: editorEdges
      };
      
      if (!currentData.telemetry) currentData.telemetry = {};
      const now = new Date();
      const pointsToGenerate = 15;
      
      editorMachines.forEach(m => {
        if (!currentData.telemetry[m.id]) {
          const metrics = generateBaselines(m.id);
          const mTelemetry = [];
          for (let i = 0; i < pointsToGenerate; i++) {
            const timestamp = new Date(now.getTime() - 10 * 60 * 1000 * (pointsToGenerate - i));
            const temp = metrics.temp + (Math.random() * 2 - 1);
            const vib = metrics.vib + (Math.random() * 0.4 - 0.2);
            const pres = metrics.pres + (Math.random() * 0.2 - 0.1);
            const cur = metrics.cur + (Math.random() * 0.6 - 0.3);
            mTelemetry.push({
              timestamp: timestamp.toISOString(),
              temperature: parseFloat(temp.toFixed(2)),
              vibration: parseFloat(vib.toFixed(2)),
              pressure: parseFloat(pres.toFixed(2)),
              current: parseFloat(cur.toFixed(2))
            });
          }
          currentData.telemetry[m.id] = mTelemetry;
        }
      });
      
      localStorage.setItem(`workspace_data_${activeId}`, JSON.stringify(currentData));
      setShowEditor(false);
      await refreshData();
      alert("Factory fleet structure successfully synchronized with Local Storage!");
    } catch (err) {
      console.error("Config save failed:", err);
      alert("Saving configuration failed: " + err.message);
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

  // Native browser notifications helper
  const triggerDeviceNotification = useCallback((title, message) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          if (document.hidden) {
            // Tab is in the background: prioritize Service Worker to bypass browser background execution blocks
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                  registration.showNotification(title, {
                    body: message
                  });
                } else {
                  new Notification(title, { body: message });
                }
              }).catch(err => {
                console.error("SW registration fetch failed:", err);
                new Notification(title, { body: message });
              });
            } else {
              new Notification(title, { body: message });
            }
          } else {
            // Tab is in the foreground: standard constructor is fully allowed and faster
            new Notification(title, { body: message });
          }
        } catch (err) {
          console.error("Failed to trigger native Notification", err);
        }
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(title, { body: message });
          }
        });
      }
    }
  }, []);

  // Request browser Notification permission on mount or first user interaction click, and register Service Worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(reg => console.log("SW Registered:", reg.scope))
        .catch(err => console.error("SW Registration failed:", err));
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      
      const request = () => {
        if (Notification.permission === "default") {
          Notification.requestPermission().then(permission => {
            setNotificationPermission(permission);
          });
        }
      };
      window.addEventListener("click", request, { once: true });
      return () => window.removeEventListener("click", request);
    }
  }, []);

  // Watcher and notifier for milestone changes (scoped to all projects)
  const checkMilestones = useCallback((projectId, maintenanceOrders, machines, inventory) => {
    if (!maintenanceOrders) return;

    maintenanceOrders.forEach(order => {
      const machine = machines?.find(m => m.id === order.machine_id);
      const machineStatus = machine?.status || "Operational";
      const requiredPartId = machine?.critical_thresholds?.required_part_id;
      const part = inventory?.find(p => p.part_id === requiredPartId);
      const componentName = part?.part_name || "Critical Component";

      // Compute active stage index
      let approvalState = "Approved";
      if (order.status === "Pending_Sourcing") {
        approvalState = "Pending";
      } else if (order.status === "Rejected") {
        approvalState = "Rejected";
      }

      let activeStageIndex = 0;
      if (approvalState === "Approved") {
        activeStageIndex = 1;
        if (order.status === "Dispatched_Sourcing_Active") {
          activeStageIndex = 1;
        } else if (order.status === "Approved") {
          activeStageIndex = machineStatus === "Operational" ? 3 : 2;
        }
      }

      const refKey = `${projectId}-${order.id}`;
      const prevStage = prevStages.current[refKey];
      if (prevStage !== undefined && activeStageIndex !== prevStage) {
        // Stage labels that match exactly what the UI displays
        const supplierMatch = order.root_cause?.match(/Selected Supplier:\s*([^\n\r(]+)/) ||
                              order.root_cause?.match(/dispatched to\s*([^\n\r(]+)/i);
        const supplierLabel = supplierMatch ? supplierMatch[1].trim() : "Supplier";

        const stageLabels = [
          { n: 1, name: "Sourcing Approval" },
          { n: 2, name: supplierLabel },
          { n: 3, name: "Company Warehouse" },
          { n: 4, name: machine?.id || "Machine" }
        ];

        const prevLabel = stageLabels[prevStage];
        const nextLabel = stageLabels[activeStageIndex];
        const prevDisplay = prevLabel ? `Stage ${prevLabel.n}: ${prevLabel.name}` : `Stage ${prevStage + 1}`;
        const nextDisplay = nextLabel ? `Stage ${nextLabel.n}: ${nextLabel.name}` : `Stage ${activeStageIndex + 1}`;

        if (activeStageIndex > prevStage) {
          triggerDeviceNotification(
            "Stage Advanced",
            `${componentName} (Ticket #${order.id}) moved from ${prevDisplay} → ${nextDisplay}.`
          );
        } else {
          triggerDeviceNotification(
            "Stage Rolled Back",
            `${componentName} (Ticket #${order.id}) reverted from ${prevDisplay} → ${nextDisplay}.`
          );
        }
      }

      // Update ref
      prevStages.current[refKey] = activeStageIndex;
    });
  }, [triggerDeviceNotification]);

  // Core API Poller
  const refreshData = useCallback(async () => {
    try {
      const activeId = localStorage.getItem("activeProjectId") || activeProjectId;
      if (!activeId) {
        setData(null);
        setLoading(false);
        return;
      }
      
      let localData = localStorage.getItem(`workspace_data_${activeId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        // Patch missing components from templates for existing workspaces
        let needsSave = false;
        if (parsed.machines) {
          parsed.machines.forEach(machine => {
            if (!machine.components || machine.components.length === 0) {
              const templateMachine = [PETROCHEMICAL_TEMPLATE, AUTOMOTIVE_TEMPLATE, STEEL_TEMPLATE]
                .flatMap(t => t.machines)
                .find(m => m.id === machine.id);
              if (templateMachine && templateMachine.components) {
                machine.components = templateMachine.components;
                needsSave = true;
              }
            }
          });
          if (needsSave) {
            localStorage.setItem(`workspace_data_${activeId}`, JSON.stringify(parsed));
          }
        }
        setData(parsed);
        checkMilestones(activeId, parsed.maintenance_orders, parsed.machines, parsed.inventory);
      } else {
        const savedProjects = localStorage.getItem("projects");
        if (savedProjects) {
          const projs = JSON.parse(savedProjects);
          const currentProj = projs.find(p => p.id === activeId);
          if (currentProj) {
            const seeded = seedWorkspaceData(currentProj.type, currentProj.templateId, currentProj.customMachines);
            localStorage.setItem(`workspace_data_${activeId}`, JSON.stringify(seeded));
            setData(seeded);
            checkMilestones(activeId, seeded.maintenance_orders, seeded.machines, seeded.inventory);
          } else {
            setData(null);
          }
        } else {
          setData(null);
        }
      }
    } catch (err) {
      console.error("[UI] Local storage read failed:", err);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, checkMilestones]);

  // Keep polling in the background continuously
  useEffect(() => {
    if (!isSetupCompleted) return;

    refreshData();
    pollIntervalRef.current = setInterval(refreshData, 6000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isSetupCompleted, refreshData]);

  // Listen for storage events to update data instantly across tabs for ALL projects
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith("workspace_data_")) {
        const projectId = e.key.replace("workspace_data_", "");
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            
            // 1. Run the milestone check regardless of whether it's active
            checkMilestones(projectId, parsed.maintenance_orders, parsed.machines, parsed.inventory);
            
            // 2. If it is the currently active project on this tab, update the state to refresh the UI
            const activeId = localStorage.getItem("activeProjectId") || activeProjectId;
            if (projectId === activeId) {
              setData(parsed);
            }
          } catch (err) {
            console.error("Storage event parse error", err);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [activeProjectId, checkMilestones]);

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
  const handleSimulation = async (machineIdToSimulate = null) => {
    setSimulating(true);
    setThoughts((prev) => [
      ...prev,
      { id: Date.now(), agent: "Simulator", type: "warning", text: `Simulating stator coil winding overload on ${machineIdToSimulate || "Machine 2"}...` }
    ]);

    try {
      const activeId = localStorage.getItem("activeProjectId") || activeProjectId;
      if (!activeId) {
        throw new Error("No active project workspace loaded.");
      }
      
      const localData = localStorage.getItem(`workspace_data_${activeId}`);
      if (!localData) {
        throw new Error("Workspace data not found in local storage.");
      }
      
      const currentData = JSON.parse(localData);
      
      let targetMachine = null;
      if (currentData.machines && currentData.machines.length > 0) {
        if (typeof machineIdToSimulate === 'string') {
          targetMachine = currentData.machines.find(m => m.id === machineIdToSimulate);
        } else {
          targetMachine = currentData.machines.find(m => m.id === "MCH-002");
          if (!targetMachine) {
            targetMachine = currentData.machines.find(m => m.id === "MCH-202") || 
                            currentData.machines.find(m => m.id === "MCH-302") || 
                            currentData.machines.find(m => m.status === "Operational") ||
                            currentData.machines[0];
          }
        }
      }
      
      if (!targetMachine) {
        throw new Error("No machines found in this fleet to target.");
      }
      
      const machineId = targetMachine.id;
      const machineName = targetMachine.name;
      const thresholds = targetMachine.critical_thresholds || { temperature: 80, vibration: 10, pressure: 3, current: 20 };
      
      const base_temp = (thresholds.temperature || 80.0) * 0.65;
      const base_vib = (thresholds.vibration || 10.0) * 0.35;
      const base_pres = (thresholds.pressure || 3.0) * 0.95;
      const base_cur = (thresholds.current || 20.0) * 0.75;
      
      const telemetryRecords = [];
      const now = new Date();
      const points = 144;
      
      for (let i = 0; i < points; i++) {
        const timestamp = new Date(now.getTime() - 10 * 60 * 1000 * (points - i));
        const progress = i / (points - 1);
        const degFactor = Math.pow(progress, 2.5);
        
        const tLimit = thresholds.temperature || 80.0;
        const temp = tLimit > 0 ? (base_temp + (tLimit * 1.15 - base_temp) * degFactor + (Math.random() - 0.5)) : 0;
        
        const vLimit = thresholds.vibration || 10.0;
        const vib = vLimit > 0 ? (base_vib + (vLimit * 1.30 - base_vib) * degFactor + (Math.random() * 0.2 - 0.1)) : 0;
        
        const pLimit = thresholds.pressure || 3.0;
        const pres = pLimit > 0 ? (base_pres - (base_pres - pLimit * 0.40) * degFactor + (Math.random() * 0.1 - 0.05)) : 0;
        
        const cLimit = thresholds.current || 20.0;
        const cur = cLimit > 0 ? (base_cur + (cLimit * 1.35 - base_cur) * degFactor + (Math.random() * 0.4 - 0.2)) : 0;
        
        telemetryRecords.push({
          timestamp: timestamp.toISOString(),
          temperature: parseFloat(temp.toFixed(2)),
          vibration: parseFloat(vib.toFixed(2)),
          pressure: parseFloat(pres.toFixed(2)),
          current: parseFloat(cur.toFixed(2))
        });
      }
      
      currentData.telemetry[machineId] = telemetryRecords;
      targetMachine.status = "Critical";
      
      const required_part = thresholds.required_part_id || "PART-004";
      
      let invItem = currentData.inventory.find(inv => inv.part_id === required_part);
      if (!invItem) {
        invItem = {
          part_id: required_part,
          part_name: required_part === "PART-001" ? "Heavy-Duty Bearing Assembly" : "3-Phase Electric Motor Winding",
          stock_level: 1,
          reorder_point: 3,
          cost: 850.00,
          location: "Warehouse B - Aisle 5"
        };
        currentData.inventory.push(invItem);
      }
      
      const part_name = invItem.part_name;
      const stock_level = invItem.stock_level;
      const reorder_point = invItem.reorder_point;
      const is_in_stock = stock_level > reorder_point;
      
      let detected_fault = "AC stator winding thermal overload and structural blade imbalance";
      let rul = 14;
      if (required_part === "PART-001" || required_part.toLowerCase().includes("bearing")) {
        detected_fault = "Rotary gear pump main bearing cage wear and localized race friction";
        rul = 12;
      } else if (required_part === "PART-002" || required_part.toLowerCase().includes("seal")) {
        detected_fault = "Centrifugal impeller cavitation leading to hydraulic seal fracture";
        rul = 10;
      }
      
      const latestReading = telemetryRecords[telemetryRecords.length - 1];
      const anomaly_explanation = `Metric 'vibration' crossed critical limit: ${latestReading.vibration.toFixed(2)} mm/s > ${(thresholds.vibration || 10.0).toFixed(2)} mm/s. Metric 'temperature' crossed critical limit: ${latestReading.temperature.toFixed(1)}°C > ${(thresholds.temperature || 80.0).toFixed(1)}°C. High thermal ramp rate detected.`;
      
      const newOrderId = (currentData.maintenance_orders || []).reduce((max, o) => o.id > max ? o.id : max, 0) + 1;
      let detailed_cause = "";
      let order_status = "";
      let assigned_technician = "";
      
      let thoughts_log = [
        `[AnomalyDetectionAgent (Evaluator)] Initiating telemetry fleet scan...`,
        `[AnomalyDetectionAgent (Evaluator)] Evaluating machine ${machineName} (${machineId})...`,
        `[AnomalyDetectionAgent (Evaluator)] Machine ${machineId} Evaluation: Anomaly=true, Severity=Critical`,
        `[AnomalyDetectionAgent (Evaluator)] Updated local machine '${machineId}' status to 'Critical'.`,
        `[DiagnosticAgent (RAG Analyst)] Performing RAG query against Chroma Vector Database...`,
        `[DiagnosticAgent (RAG Analyst)] Successfully retrieved 2 relevant manual chunks from ChromaDB.`,
        `[DiagnosticAgent (RAG Analyst)] Analyzing telemetry alongside operational manuals to isolate root cause...`,
        `[DiagnosticAgent (RAG Analyst)] Diagnostic Completed: Fault='${detected_fault}', RUL=${rul}h, Part Needed=${required_part}`,
        `[PlanningToolAgent (Action)] Analyzing diagnostic. Required part: ${required_part}`,
        `[PlanningToolAgent (Action) Tool] Executing check_inventory for Part: ${required_part}`,
        `[PlanningToolAgent (Action)] Tool Call Response: Stock Level = ${stock_level}, Reorder point = ${reorder_point}`
      ];
      
      let suppliers = [];
      let best_supplier_id = null;
      let best_supplier_name = "SKF Munich";
      let best_score = 0;
      
      if (is_in_stock) {
        invItem.stock_level = stock_level - 1;
        order_status = "Approved";
        assigned_technician = "Sarah Jenkins (PdM Specialist)";
        
        detailed_cause = `Automated PdM Diagnostic & Dispatch Report:
- Isolated Fault: ${detected_fault}
- Remaining Useful Life (RUL): ${rul} Hours
- Required Part: ${required_part} (${part_name}) - IN STOCK (Stock Level: ${stock_level}, Location: ${invItem.location})
- Dispatch Action: PART SECURED. Maintenance order approved automatically. Scheduling immediate technician dispatch.

Anomaly Telemetry Analysis:
${anomaly_explanation}`;
        
        thoughts_log.push(
          `[PlanningToolAgent (Action)] Success: Part ${required_part} is IN STOCK (Stock: ${stock_level} > Reorder Point: ${reorder_point}).`,
          `[PlanningToolAgent (Action) Tool] Executing create_maintenance_order status='Approved'...`,
          `[Orchestrator] Workflow completed for machine: '${machineName}'!`,
          `[Orchestrator] Outcome: Immediate Dispatch Scheduled.`
        );
      } else {
        order_status = "Pending_Sourcing";
        assigned_technician = "Procurement & Logistics Agent";
        
        detailed_cause = `Automated PdM Diagnostic & Supply Chain Routing Report:
- Isolated Fault: ${detected_fault}
- Remaining Useful Life (RUL): ${rul} Hours
- Required Part: ${required_part} (${part_name}) - OUT OF STOCK / BELOW REORDER LIMIT (Stock Level: ${stock_level}, Reorder Threshold: ${reorder_point})
- Logistical Urgent Dispatch: Triggered supply chain routing search in supplier graph database.`;
        
        if (currentData.graph && currentData.graph.links) {
          const links = currentData.graph.links;
          const nodes = currentData.graph.nodes;
          
          links.forEach(l => {
            const otherNodeId = l.source === required_part ? l.target : (l.target === required_part ? l.source : null);
            if (otherNodeId) {
              const otherNode = nodes.find(n => n.id === otherNodeId && n.type === "Supplier");
              if (otherNode) {
                const risk = otherNode.risk || 0.5;
                const price = l.price || 500;
                const transit = l.transit || 5;
                const score = 100 - (transit * 7.5) - (risk * 45.0) - (price / 100 * 1.5);
                suppliers.push({
                  supplier_id: otherNode.id,
                  supplier_name: otherNode.name,
                  price: price,
                  transit_time_days: transit,
                  risk_rating: risk,
                  contact_email: otherNode.email || `logistics@${otherNode.name.toLowerCase().replace(/\s/g, "")}.com`,
                  score: score
                });
              }
            }
          });
        }
        
        if (suppliers.length === 0) {
          suppliers = [
            {
              supplier_id: "SUP-002",
              supplier_name: "SKF Munich",
              price: 1200.00,
              transit_time_days: 5,
              risk_rating: 0.15,
              contact_email: "logistics@skf.de",
              score: 100 - (5 * 7.5) - (0.15 * 45.0) - (1200 / 100 * 1.5)
            },
            {
              supplier_id: "SUP-001",
              supplier_name: "Siemens Shanghai",
              price: 850.00,
              transit_time_days: 28,
              risk_rating: 0.70,
              contact_email: "procurement@siemens.cn",
              score: Math.max(0, 100 - (28 * 7.5) - (0.7 * 45.0) - (850 / 100 * 1.5))
            }
          ];
        }
        
        suppliers.sort((a, b) => b.score - a.score);
        const best = suppliers[0];
        best_supplier_id = best.supplier_id;
        best_supplier_name = best.supplier_name;
        best_score = best.score;
        
        const orderQty = Math.max(1, reorder_point - stock_level + 2);
        
        const email_subject = `URGENT: Expedited Parts Procurement Order - Machine Down (${machineId})`;
        const email_body = `Subject: ${email_subject}
To: ${best.contact_email} (Attn: ${best_supplier_name} Sales & Logistics)
From: procurement-agent@industrial-ai.com
Date: ${new Date().toISOString().split('T')[0]}

Dear ${best_supplier_name} Team,

This is an URGENT automated procurement request on behalf of our Industrial Operations Facility. 

We have encountered a critical equipment status alert on our factory floor:
- Equipment: ${machineName} (ID: ${machineId})
- Fleet Operational Status: CRITICAL / IMMINENT DOWNTIME HAZARD

To prevent severe assembly line stagnation and operational downtime, we require the immediate dispatch of the following component:
- Required Component: ${part_name}
- Requested Quantity: ${orderQty} unit(s)

As our supplier graph indicates you are our optimal source, please process this order for EXPEDITED shipping immediately. Please confirm stock availability, estimated dispatch time, and provide tracking numbers to our digital logistics webhook as soon as they are generated.

We request priority processing and air-courier routing if possible. All associated expedited freight surcharges have been pre-approved on our corporate procurement billing profile.

Thank you for your rapid cooperation in resolving this production emergency.

Sincerely,
Autonomous Supply Chain Procurement Agent
Industrial Sector AI Automation Network`;

        const procurement_summary = `\n\n[Procurement Action] Order dispatched to ${best_supplier_name} (${best_supplier_id}). ` +
          `Professional email draft generated. Requested ${orderQty} unit(s) with expedited shipping. ` +
          `Sourcing Optimization score: ${best_score.toFixed(2)}.\n\n` +
          email_body;

        detailed_cause += procurement_summary;
        order_status = "Dispatched_Sourcing_Active";
        assigned_technician = "Procurement & Logistics Agent";
        
        thoughts_log.push(
          `[PlanningToolAgent (Action)] Supply Chain Alert: Part ${required_part} is OUT OF STOCK or BELOW REORDER POINT (Stock: ${stock_level} <= Reorder Point: ${reorder_point}). Sourcing action required!`,
          `[PlanningToolAgent (Action) Tool] Executing create_maintenance_order status='Pending_Sourcing'...`,
          `[PlanningToolAgent (Action) Tool] Triggering supply chain reroute for Part ID: ${required_part}...`,
          `[PlanningToolAgent (Action)] Executing recursive supplier graph traversal for: ${part_name}`,
          `[SourcingOptimizationAgent] Optimizing sourcing for part '${part_name}' with ${suppliers.length} options...`,
          `[SourcingOptimizationAgent] Chosen '${best_supplier_name}' with score ${best_score.toFixed(2)}.`,
          `[PlanningToolAgent (Action) Tool] Executing draft_procurement_order for Supplier: ${best_supplier_id}`,
          `[PlanningToolAgent (Action) Tool] Updated maintenance order #${newOrderId} status to 'Dispatched_Sourcing_Active'`,
          `[Orchestrator] Workflow completed for machine: '${machineName}'!`,
          `[Orchestrator] Outcome: Pending Supply Chain Sourcing - Sourcing Active.`
        );
      }
      
      const newOrder = {
        id: newOrderId,
        machine_id: machineId,
        priority: "Critical",
        status: order_status,
        root_cause: detailed_cause,
        assigned_technician: assigned_technician,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (!currentData.maintenance_orders) currentData.maintenance_orders = [];
      currentData.maintenance_orders.unshift(newOrder);
      
      localStorage.setItem(`workspace_data_${activeId}`, JSON.stringify(currentData));
      
      let delay = 200;
      thoughts_log.forEach((logLine) => {
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

  if (isSetupCompleted) {
    return (
      <div className={`flex h-screen flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#030508] text-cyan-400' : 'bg-[#f8fafc] text-cyan-600'} font-mono`}>
        <Activity className={`h-10 w-10 animate-spin mb-4 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <div className="animate-pulse tracking-widest text-xs font-bold">REDIRECTING TO CONTROL TOWER...</div>
      </div>
    );
  }

  // Preset list for presentation
  const presets = [
    {
      id: "steel",
      name: "Heavy Steel Rolling Mill",
      desc: "Baseline fleet consisting of Rotary Gear Pumps, Industrial Exhaust Fans, and Pneumatic Compressors. Optimized for testing ball-bearing degradation.",
      details: "3 PDMs • Bearings • Real-time telemetry",
      typeTag: "STEEL_MILL"
    },
    {
      id: "petrochemical",
      name: "Petrochemical Refinery",
      desc: "Gas turbines, high-pressure gaskets, and transfer pumps. Features specialized oil & gas RAG manuals and Houston fast seal logistics routing.",
      details: "3 PDMs • Stator Overload • RAG manuals",
      typeTag: "PETROCHEMICAL"
    },
    {
      id: "automotive",
      name: "6-Axis Assembly Robotics",
      desc: "Robot joint gearboxes, painting line drives, and assembly cells. Optimized for testing high-precision harmonic gear fault diagnostic routines.",
      details: "3 PDMs • Harmonic Gear • Dynamic torque",
      typeTag: "AUTOMOTIVE"
    },
    {
      id: "empty",
      name: "Truly Empty Workspace",
      desc: "Initialize a completely blank dashboard. No pre-seeded machinery, telemetry streams, or graphs. Build your entire fleet from scratch.",
      details: "0 PDMs • Blank Slate • Complete control",
      typeTag: "CUSTOM_FLEET"
    }
  ];

  const getPresetIcon = (presetId) => {
    switch (presetId) {
      case "steel": return <Building className="w-5 h-5 text-amber-500" />;
      case "petrochemical": return <Activity className="w-5 h-5 text-blue-500" />;
      case "automotive": return <Cpu className="w-5 h-5 text-purple-500" />;
      default: return <LayoutGrid className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (activeTab === "recent") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return result;
  }, [projects, searchQuery, activeTab]);

  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return presets;
    const q = searchQuery.toLowerCase();
    return presets.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleOpenNewWorkspace = () => {
    setProjectTemplateInput("steel");
    setProjectNameInput(generateDefaultName("template", "steel"));
    setProjectDescriptionInput("");
    setCreateWorkspaceMode("template");
    setShowCreateModal(true);
  };

  const handleOpenPresetCreate = (templateId) => {
    setProjectTemplateInput(templateId);
    const defaultName = generateDefaultName(templateId === "empty" ? "custom" : "template", templateId === "empty" ? null : templateId);
    setProjectNameInput(defaultName);
    setProjectDescriptionInput("");
    setCreateWorkspaceMode(templateId === "empty" ? "custom" : "template");
    setShowCreateModal(true);
  };

  const handleRenameClick = (e, projId, currentName) => {
    e.stopPropagation();
    const newName = prompt("Rename workspace:", currentName);
    if (newName && newName.trim()) {
      handleRenameProject(projId, newName.trim());
    }
  };

  const handleShareClick = (e, projId) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(projId);
      showToast(`Workspace ID copied to clipboard: ${projId}`, "success");
    }
  };

  return (
    <div className={`h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#030508] text-slate-300' : 'bg-[#f8fafc] text-slate-700'} font-sans p-4 md:p-6 lg:p-6 flex flex-col items-center justify-start relative select-none selection:bg-cyan-500/30 transition-colors duration-300`}>
        
        {/* Prismatic Grid Background */}
        <div className={`absolute inset-0 bg-[linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px),linear-gradient(90deg,${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none animate-grid-move`}></div>
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,${theme === 'dark' ? '#030508' : '#f8fafc'}_10%,${theme === 'dark' ? '#030508' : '#f8fafc'}_100%)] pointer-events-none`}></div>

        {/* Ambient Floating Glow Mesh Spheres */}
        <div className={`absolute top-[-15%] left-[-15%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-purple-600/[0.045]' : 'bg-purple-400/[0.06]'} rounded-full blur-[130px] pointer-events-none animate-pulse-slow`}></div>
        <div className={`absolute bottom-[-15%] right-[-15%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-cyan-500/[0.045]' : 'bg-cyan-400/[0.06]'} rounded-full blur-[130px] pointer-events-none animate-pulse-slow-alt`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[580px] ${theme === 'dark' ? 'bg-blue-600/[0.02]' : 'bg-blue-500/[0.035]'} rounded-full blur-[150px] pointer-events-none`}></div>

        {/* Theme Toggle Button */}
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

        {/* Core workspaces list layout container */}
        <div className="w-full max-w-6xl flex-1 flex flex-col min-h-0 z-10 animate-fadeIn p-2 pb-4">
          
          {/* Top Title & Quick Action bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
                <img 
                  src={theme === 'dark' ? '/ISAI logo white.png' : '/ISAI logo black.png'} 
                  alt="ISAI Logo" 
                  className="h-8 w-auto object-contain"
                />
                <span>Workspaces</span>
                {typeof window !== "undefined" && window.__TAURI__ && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'} border animate-pulse`}>
                    DESKTOP_ACTIVE
                  </span>
                )}
              </h1>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-sans`}>
                Manage and monitor your predictive maintenance IoT fleets
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className={`py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 border hover:scale-[1.01] ${
                  theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-800 text-slate-350 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
                title="Database & Gemini Settings"
              >
                <Settings className="w-4 h-4 animate-spin-slow" />
                <span>SETTINGS</span>
              </button>

              <button
                onClick={handleOpenNewWorkspace}
                className={`py-2.5 px-5 rounded-xl font-mono text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 border hover:scale-[1.01] ${
                  theme === 'dark'
                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 hover:border-cyan-700 shadow-md shadow-cyan-100/50'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>NEW WORKSPACE</span>
              </button>
            </div>
          </div>

          {/* Search bar & filter tabs navigation */}
          <div className={`flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 border-b pb-4 ${
            theme === 'dark' ? 'border-[#1b2336]/40' : 'border-slate-200'
          }`}>
            {/* Filter tabs */}
            <div className="flex gap-1.5 bg-slate-900/10 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60 max-w-fit">
              {[
                { id: "all", label: "All Workspaces" },
                { id: "presets", label: "Presets" },
                { id: "recent", label: "Recent" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? (theme === 'dark' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-300')
                      : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent')
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "presets" ? "Search presets..." : "Search workspaces..."}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 border ${
                  theme === 'dark'
                    ? 'bg-[#080b11]/60 border-[#1b2336] text-slate-200 placeholder-slate-500 focus:border-cyan-500/80'
                    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-cyan-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition"
                >
                  <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                </button>
              )}
            </div>
          </div>

          {/* Grid of workspace cards */}
          <div className="flex-1 overflow-y-auto pr-1 pb-6 custom-scrollbar">
            {activeTab === "presets" ? (
              filteredPresets.length === 0 ? (
                <div className="text-center py-20 opacity-60 space-y-3 border border-dashed rounded-2xl p-6 border-slate-800">
                  <LayoutGrid className="w-12 h-12 mx-auto text-cyan-400/30 animate-pulse" />
                  <p className="font-mono text-xs font-bold uppercase tracking-wider">No Presets Found</p>
                  <p className="text-xs font-sans">Try clearing your search query filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                  {filteredPresets.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleOpenPresetCreate(preset.id)}
                      className={`border cursor-pointer transition-all duration-300 p-6 rounded-2xl relative group flex flex-col justify-between hover:scale-[1.015] hover:shadow-lg ${
                        theme === 'dark'
                          ? 'border-[#1b2336]/60 bg-[#0a0d16]/50 hover:border-cyan-500/60 hover:bg-[#0c0f1e]/60 shadow-[0_0_20px_rgba(0,0,0,0.1)]'
                          : 'bg-white border-slate-200 hover:border-cyan-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] shadow-sm'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            theme === 'dark' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-600 bg-amber-50 border-amber-200'
                          } border`}>
                            {preset.typeTag}
                          </span>
                          {getPresetIcon(preset.id)}
                        </div>

                        <h3 className={`text-sm font-bold font-mono tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-cyan-400 transition-colors`}>
                          {preset.name}
                        </h3>

                        <p className={`text-[11px] leading-relaxed font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {preset.desc}
                        </p>
                      </div>

                      <div className={`mt-5 pt-4 border-t flex justify-between items-center font-mono text-[10px] ${
                        theme === 'dark' ? 'border-[#1b2336]/40 text-slate-400' : 'border-slate-150 text-slate-500'
                      }`}>
                        <span className="font-bold">{preset.details}</span>
                        <span className="text-cyan-400 group-hover:text-cyan-300 font-bold flex items-center gap-1">
                          <span>BUILD</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredProjects.length === 0 ? (
                <div className={`text-center py-24 rounded-2xl border border-dashed p-8 ${
                  theme === 'dark' ? 'border-slate-800 bg-slate-950/20' : 'border-slate-205 bg-slate-50/50'
                } space-y-4`}>
                  <LayoutGrid className={`w-12 h-12 mx-auto ${theme === 'dark' ? 'text-cyan-400/30' : 'text-cyan-600/30'} animate-pulse`} />
                  <div className="space-y-1">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider">No Saved Workspaces</p>
                    <p className="text-[11px] font-sans opacity-70">
                      {searchQuery ? "No workspaces matched your search term." : "Select + New Workspace to configure your first predictive maintenance fleet."}
                    </p>
                  </div>
                  {!searchQuery && (
                    <button
                      onClick={handleOpenNewWorkspace}
                      className={`py-2 px-4 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all duration-300 border hover:scale-[1.01] ${
                        theme === 'dark'
                          ? 'bg-cyan-950/30 border-cyan-500/20 text-cyan-400 hover:bg-cyan-900/30'
                          : 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 hover:border-cyan-700 shadow-sm'
                      }`}
                    >
                      CREATE WORKSPACE
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                  {filteredProjects.map((proj) => {
                    const isProjActive = Object.values(activeProjectTabs).some(entry => entry && entry.projectId === proj.id && (Date.now() - entry.lastActive < 15000)) || activeProjectId === proj.id;
                    let typeLabel = proj.type === "template" ? (proj.templateId || "steel").toUpperCase() : "CUSTOM_FLEET";

                    return (
                      <div
                        key={proj.id}
                        onClick={() => handleLaunchProject(proj)}
                        className={`border cursor-pointer transition-all duration-300 p-6 rounded-2xl relative group flex flex-col justify-between hover:scale-[1.015] hover:shadow-lg ${
                          isProjActive
                            ? (theme === 'dark' ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_24px_rgba(6,182,212,0.15)]' : 'border-cyan-500 bg-cyan-50/30 shadow-md')
                            : (theme === 'dark' ? 'border-[#1b2336]/60 bg-[#0a0d16]/50 hover:border-cyan-500/60 hover:bg-[#0c0f1e]/60 shadow-[0_0_20px_rgba(0,0,0,0.1)]'
                                                : 'bg-white border-slate-200 hover:border-cyan-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] shadow-sm')
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              proj.type === "template"
                                ? (theme === 'dark' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-600 bg-blue-50 border-blue-200')
                                : (theme === 'dark' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-purple-600 bg-purple-50 border-purple-200')
                            } border`}>
                              {typeLabel}
                            </span>
                            <span className={`text-[9px] font-mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>

                          <h3 className={`text-sm font-bold font-mono tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-cyan-400 transition-colors truncate`}>
                            {proj.name}
                          </h3>

                          <p className={`text-[11px] leading-relaxed font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} line-clamp-2 min-h-[32px]`}>
                            {proj.description || `Autonomous control tower workspace built on ${proj.type === "template" ? (proj.templateId || "steel") : "custom"} asset parameters.`}
                          </p>
                        </div>

                        <div className={`mt-5 pt-4 border-t flex justify-between items-center font-mono text-[10px] ${
                          theme === 'dark' ? 'border-[#1b2336]/40 text-slate-400' : 'border-slate-150 text-slate-500'
                        }`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLaunchProject(proj); }}
                            className={`font-bold flex items-center gap-1 transition-all ${
                              isProjActive
                                ? 'text-emerald-400'
                                : 'text-cyan-400 group-hover:text-cyan-300'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{isProjActive ? "ACTIVE" : "LAUNCH"}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleShareClick(e, proj.id)}
                              className="hover:text-cyan-400 p-1.5 rounded hover:bg-cyan-500/10 transition-all text-slate-500"
                              title="Copy Workspace ID"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleRenameClick(e, proj.id, proj.name)}
                              className="hover:text-cyan-400 p-1.5 rounded hover:bg-cyan-500/10 transition-all text-slate-500"
                              title="Rename Workspace"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(proj.id, e)}
                              className="text-red-400 hover:text-red-505 p-1.5 rounded hover:bg-red-500/10 transition-all"
                              title="Delete Workspace"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Modal: Create new workspace dialog layout */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
            <div className={`w-full max-w-lg border rounded-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-[#0a0d16] border-[#1b2336] text-slate-200 shadow-cyan-900/10'
                : 'bg-white border-slate-200 text-slate-700 shadow-slate-300/40'
            }`}>
              
              {/* Close Button */}
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-500/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-5">
                <h2 className={`text-base font-bold font-mono tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Create new workspace
                </h2>
                <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Start building your predictive maintenance fleet
                </p>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                {/* Workspace Name Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono uppercase tracking-wider block opacity-75">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                   
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    placeholder="My Factory Fleet"
                    className={`w-full px-4 py-2.5 rounded-xl text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 border ${
                      theme === 'dark'
                        ? 'bg-[#0c0f17] border-[#1b2336] text-slate-200 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* Workspace Description Textarea */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono uppercase tracking-wider block opacity-75">
                    Description (optional)
                  </label>
                  <textarea
                    value={projectDescriptionInput}
                    onChange={(e) => setProjectDescriptionInput(e.target.value)}
                    placeholder="A brief description of your workspace..."
                    className={`w-full px-4 py-2.5 rounded-xl text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 border min-h-[70px] max-h-[140px] resize-y ${
                      theme === 'dark'
                        ? 'bg-[#0c0f17] border-[#1b2336] text-slate-200 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* Workspace Creator Mode Tabs (Wireframe Style) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold font-mono uppercase tracking-wider block opacity-75">
                    Workspace Mode
                  </label>
                  <div className="flex bg-slate-900/10 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateWorkspaceMode("template");
                        setProjectTemplateInput("steel");
                        setProjectNameInput(generateDefaultName("template", "steel"));
                      }}
                      className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all duration-300 ${
                        createWorkspaceMode === "template"
                          ? (theme === 'dark' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-300')
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Template
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateWorkspaceMode("custom");
                        setProjectTemplateInput("empty");
                        setProjectNameInput(generateDefaultName("custom", null));
                      }}
                      className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all duration-300 ${
                        createWorkspaceMode === "custom"
                          ? (theme === 'dark' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-300')
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Mode Contents */}
                {createWorkspaceMode === "template" ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold font-mono uppercase tracking-wider block opacity-75">
                      Select Fleet Template
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "steel", name: "Steel Mill", desc: "Rotary pumps & fans", machines: ["Rotary Gear Pump A", "High-Speed Fan B", "Heavy-Duty Compressor C"], sensors: ["Winding Temp", "Vibration", "Discharge Pres", "Coil Current"] },
                        { id: "petrochemical", name: "Petrochemical", desc: "Gas turbines & pipes", machines: ["Gas Turbine Generator A", "High-Pressure Pipe B", "Petrochemical Pump C"], sensors: ["Flow Rate", "Vibration", "Exhaust Temp", "Control Pressure"] },
                        { id: "automotive", name: "Automotive", desc: "6-axis robotic arms", machines: ["Welder Robot Joint A", "Conveyor Drive B", "Assembly Compressor C"], sensors: ["Torque Load", "Joint Vibration", "System Temp", "Coil Amperage"] }
                      ].map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setProjectTemplateInput(t.id);
                            const defaultNames = ["Heavy Steel Mill", "Titanium Smelter", "Vulcan Ironworks", "Forge Nexus", "Hydrocracker Hub", "Refinery Grid", "Petrochemical Nexus", "Octane Transfer Complex", "6-Axis Assembly Sector", "Welding Line Beta", "Precision Motion Base", "Robotics Assembly Grid", "Quantum Factory", "Cyber-Physical Grid", "Hyperion Facility", "Apex Assembly"];
                            if (!projectNameInput || defaultNames.some(dn => projectNameInput.startsWith(dn))) {
                              setProjectNameInput(generateDefaultName("template", t.id));
                            }
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 select-none hover:scale-[1.01] ${
                            projectTemplateInput === t.id
                              ? (theme === 'dark' ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-cyan-600 bg-cyan-50 text-slate-900')
                              : (theme === 'dark' ? 'border-[#1b2336] bg-[#0c0f17] hover:border-slate-800 text-slate-400 hover:text-slate-350' : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-650 hover:text-slate-900')
                          }`}
                        >
                          <div className="font-mono text-xs font-bold">{t.name}</div>
                          <div className="text-[10px] opacity-75 mt-0.5 font-sans leading-tight">{t.desc}</div>
                          
                          {/* Template Details Preview */}
                          <div className="mt-2.5 pt-2 border-t border-slate-500/10 space-y-1 text-[9px] font-mono opacity-80">
                            <div className="font-bold text-cyan-400">Assets Included:</div>
                            {t.machines.map((m, idx) => (
                              <div key={idx} className="truncate">• {m}</div>
                            ))}
                            <div className="font-bold text-slate-500 mt-1">Sensors: {t.sensors.join(", ")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Custom Fleet Dynamic Forms */}
                {createWorkspaceMode === "custom" && (
                  <div className={`space-y-4 border-t pt-4 ${theme === 'dark' ? 'border-[#1b2336]' : 'border-slate-200'}`}>
                    <CustomWorkspaceBuilder
                      theme={theme}
                      customMachines={customMachines}
                      setCustomMachines={setCustomMachines}
                      handleCreateProject={() => {}}
                      seeding={seeding}
                      hideSubmitButton={true}
                    />
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-500/10 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={`px-4 py-2 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all border ${
                      theme === 'dark'
                        ? 'border-slate-750 bg-transparent text-slate-400 hover:bg-slate-900'
                        : 'border-slate-300 bg-transparent text-slate-650 hover:bg-slate-105'
                    }`}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all border ${
                      theme === 'dark'
                        ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30'
                        : 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 hover:border-cyan-700 shadow-sm'
                    }`}
                  >
                    CREATE WORKSPACE
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {seeding && (
          <div className={`fixed inset-0 z-50 ${
            theme === 'dark' ? 'bg-[#030508]/95 text-cyan-400' : 'bg-[#f8fafc]/95 text-cyan-600'
          } backdrop-blur-md flex flex-col items-center justify-center font-mono`}>
            <Activity className={`h-10 w-10 animate-spin mb-4 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <div className="animate-pulse tracking-[0.15em] text-xs uppercase text-center px-4 font-bold">
              Initializing local workspace storage...
            </div>
          </div>
        )}

        {/* Modal: Global Settings Configurator */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
            <div className={`w-full max-w-lg border rounded-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-[#0a0d16] border-[#1b2336] text-slate-200 shadow-cyan-900/10'
                : 'bg-white border-slate-200 text-slate-700 shadow-slate-300/40'
            }`}>
              
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-500/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-5">
                <h2 className={`text-base font-bold font-mono tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
                  <Settings className="w-4 h-4" />
                  <span>Database & AI Setup</span>
                </h2>
                <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Overwrite the existing credentials with your custom ones
                </p>
              </div>

              <form onSubmit={handleSaveKeys} className="space-y-4">
                {/* Database URL */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold font-mono uppercase tracking-wider block opacity-75">
                      PostgreSQL Connection URL
                    </label>
                    {dbStatus.checking ? (
                      <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-1 animate-pulse">
                        <Activity className="w-3 h-3 animate-spin" /> Testing...
                      </span>
                    ) : dbStatus.connected ? (
                      <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                        ✓  Connected
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-amber-500 font-bold">
                        ⚠️ Disconnected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={dbUrlInput}
                    onChange={(e) => setDbUrlInput(e.target.value)}
                    placeholder="postgresql://user:pass@host:5432/dbname"
                    className={`w-full px-4 py-2.5 rounded-xl text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 border ${
                      theme === 'dark'
                        ? 'bg-[#0c0f17] border-[#1b2336] text-slate-200 focus:border-cyan-500 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#0c0f17] [&:-webkit-autofill]:[color:#e2e8f0]'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#f8fafc]'
                    }`}
                  />
                  {dbStatus.error && (
                    <div className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg p-2.5 font-mono break-all mt-1">
                      Connection Error: {dbStatus.error}
                    </div>
                  )}
                </div>

                {/* Gemini API Key */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold font-mono uppercase tracking-wider block opacity-75">
                      Google Gemini API Key 
                    </label>
                    {geminiStatus.configured ? (
                      <span className="text-[9px] font-mono text-emerald-400 font-bold">
                        ✓ Configured
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-500">
                        Fallback Mode Enabled
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      autoComplete="new-password"
                      value={geminiApiKeyInput}
                      onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className={`w-full pl-4 pr-10 py-2.5 rounded-xl text-xs transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 border ${
                        theme === 'dark'
                          ? 'bg-[#0c0f17] border-[#1b2336] text-slate-200 focus:border-cyan-500 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#0c0f17] [&:-webkit-autofill]:[color:#e2e8f0]'
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#f8fafc]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                    >
                      {showApiKey ? (
                        <span className="text-[10px] font-mono select-none">HIDE</span>
                      ) : (
                        <span className="text-[10px] font-mono select-none">SHOW</span>
                      )}
                    </button>
                  </div>
                </div>

                

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-500/10 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className={`px-4 py-2 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all border ${
                      theme === 'dark'
                        ? 'border-slate-750 bg-transparent text-slate-400 hover:bg-slate-900'
                        : 'border-slate-300 bg-transparent text-slate-650 hover:bg-slate-105'
                    }`}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={savingKeys}
                    className={`px-4 py-2 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all border flex items-center gap-1.5 ${
                      theme === 'dark'
                        ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30'
                        : 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 hover:border-cyan-700 shadow-sm'
                    }`}
                  >
                    {savingKeys && <Activity className="w-3 h-3 animate-spin" />}
                    <span>{savingKeys ? "SAVING..." : "SAVE SETTINGS"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
}