"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Activity } from "lucide-react";

import Navbar from "@/app/_components/Navbar";
import TelemetryLiveMonitor from "@/app/dashboard/_components/TelemetryLiveMonitor";
import ThoughtsStream from "@/app/dashboard/_components/ThoughtsStream";
import SourcingRoadmap from "@/app/dashboard/_components/SourcingRoadmap";
import ActionCenter from "@/app/dashboard/_components/ActionCenter";
import TutorialTour from "@/app/dashboard/_components/TutorialTour";
import EmailInspector from "@/app/dashboard/_components/EmailInspector";
import FleetConfigurator from "@/app/dashboard/_components/FleetConfigurator";
import { useToast } from "@/app/_components/ToastContext";

import {
  PETROCHEMICAL_TEMPLATE,
  AUTOMOTIVE_TEMPLATE,
  STEEL_TEMPLATE,
  generateBaselines,
  seedWorkspaceData
} from "@/lib/templatesData";

const API_BASE = (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL || "");


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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSimDropdownOpen, setMobileSimDropdownOpen] = useState(false);
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

  // Setup Portal states
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
  const [activeProjectTabs, setActiveProjectTabs] = useState({});
  const [showLogPopup, setShowLogPopup] = useState(false);

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

  // Periodically refresh active tabs to clear out stale entries
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
    
    heartbeat();
    const interval = setInterval(heartbeat, 5000);
    return () => clearInterval(interval);
  }, [isSetupCompleted, activeProjectId, updateTabActiveProject]);

  // Check if this tab is the leader tab for the active project
  const isTabLeader = useCallback(() => {
    if (typeof window === "undefined") return false;
    try {
      const tabId = sessionStorage.getItem("tabId");
      if (!tabId) return false;
      
      const activeId = localStorage.getItem("activeProjectId") || activeProjectId;
      if (!activeId) return false;
      
      const raw = localStorage.getItem("active_project_tabs");
      if (!raw) return true;
      
      const tabs = JSON.parse(raw);
      const now = Date.now();
      const activeTabsForProject = Object.keys(tabs).filter(id => {
        return tabs[id] && tabs[id].projectId === activeId && (now - tabs[id].lastActive < 15000);
      });
      
      activeTabsForProject.sort();
      return activeTabsForProject.length === 0 || activeTabsForProject[0] === tabId;
    } catch (e) {
      return true;
    }
  }, [activeProjectId]);

  // 1-second interval to simulate live sensor telemetry fluctuations (mean-reverting random walk)
  useEffect(() => {
    if (!isSetupCompleted || !activeProjectId) return;

    const interval = setInterval(() => {
      if (!isTabLeader()) return;

      const activeId = localStorage.getItem("activeProjectId") || activeProjectId;
      if (!activeId) return;

      try {
        const localData = localStorage.getItem(`workspace_data_${activeId}`);
        if (!localData) return;

        const currentData = JSON.parse(localData);
        if (!currentData.machines || !currentData.telemetry) return;

        let hasChanges = false;
        const nowStr = new Date().toISOString();

        currentData.machines.forEach((machine) => {
          const mTelemetry = currentData.telemetry[machine.id];
          if (!mTelemetry || mTelemetry.length === 0) return;

          const latest = mTelemetry[mTelemetry.length - 1];
          const hasCustomSensors = machine.sensors && machine.sensors.length > 0;
          const thresholds = machine.critical_thresholds || { temperature: 80, vibration: 10, pressure: 3, current: 20 };

          let newReading = { timestamp: nowStr };

          if (hasCustomSensors) {
            machine.sensors.forEach((s) => {
              const nameLower = s.name.toLowerCase();
              let target = s.current;

              // If degraded/critical, simulate breaching boundaries
              if (machine.status !== "Operational") {
                target = s.max * 1.05; // Force anomaly breach
              }

              const latestVal = latest[s.name] !== undefined ? latest[s.name] :
                                (nameLower.includes("temp") ? latest.temperature :
                                 nameLower.includes("vib") ? latest.vibration :
                                 nameLower.includes("pres") ? latest.pressure :
                                 nameLower.includes("cur") || nameLower.includes("amp") ? latest.current : s.current);

              const driftCoeff = 0.15;
              const dev = (s.max - s.min) * 0.05 || 1.0;
              const nextVal = latestVal + driftCoeff * (target - latestVal) + (Math.random() * dev * 0.5 - dev * 0.25);
              const clampedVal = parseFloat(Math.max(s.min * 0.5, Math.min(s.max * 1.5, nextVal)).toFixed(2));

              if (nameLower.includes("temp")) {
                newReading.temperature = clampedVal;
              } else if (nameLower.includes("vib")) {
                newReading.vibration = clampedVal;
              } else if (nameLower.includes("pres")) {
                newReading.pressure = clampedVal;
              } else if (nameLower.includes("cur") || nameLower.includes("amp")) {
                newReading.current = clampedVal;
              } else {
                newReading[s.name] = clampedVal;
              }
            });

            // Set standard defaults so components don't crash
            if (newReading.temperature === undefined) newReading.temperature = latest.temperature || 0;
            if (newReading.vibration === undefined) newReading.vibration = latest.vibration || 0;
            if (newReading.pressure === undefined) newReading.pressure = latest.pressure || 0;
            if (newReading.current === undefined) newReading.current = latest.current || 0;

          } else {
            const metrics = generateBaselines(machine.id);
            let tempTarget = metrics.temp;
            let vibTarget = metrics.vib;
            let presTarget = metrics.pres;
            let curTarget = metrics.cur;

            if (machine.status !== "Operational") {
              tempTarget = Math.max(latest.temperature, thresholds.temperature || 80.0);
              vibTarget = Math.max(latest.vibration, thresholds.vibration || 10.0);
              presTarget = latest.pressure;
              curTarget = Math.max(latest.current, thresholds.current || 20.0);
            }

            const driftCoeff = 0.15;
            const nextTemp = latest.temperature + driftCoeff * (tempTarget - latest.temperature) + (Math.random() * 0.4 - 0.2);
            const nextVib = latest.vibration + driftCoeff * (vibTarget - latest.vibration) + (Math.random() * 0.08 - 0.04);
            const nextPres = latest.pressure + driftCoeff * (presTarget - latest.pressure) + (Math.random() * 0.04 - 0.02);
            const nextCur = latest.current + driftCoeff * (curTarget - latest.current) + (Math.random() * 0.12 - 0.06);

            newReading.temperature = parseFloat(Math.max(0, nextTemp).toFixed(2));
            newReading.vibration = parseFloat(Math.max(0, nextVib).toFixed(2));
            newReading.pressure = parseFloat(Math.max(0, nextPres).toFixed(2));
            newReading.current = parseFloat(Math.max(0, nextCur).toFixed(2));
          }

          // Check if custom sensor values trigger an automatic critical alert
          if (hasCustomSensors && machine.status === "Operational") {
            let isAnomaly = false;
            machine.sensors.forEach(s => {
              const nameLower = s.name.toLowerCase();
              const currentVal = nameLower.includes("temp") ? newReading.temperature :
                                 nameLower.includes("vib") ? newReading.vibration :
                                 nameLower.includes("pres") ? newReading.pressure :
                                 nameLower.includes("cur") || nameLower.includes("amp") ? newReading.current : newReading[s.name];
              if (currentVal < s.min || currentVal > s.max) {
                isAnomaly = true;
              }
            });
            if (isAnomaly) {
              machine.status = "Critical";
            }
          }

          mTelemetry.push(newReading);
          currentData.telemetry[machine.id] = mTelemetry.slice(-15);
          hasChanges = true;
        });

        if (hasChanges) {
          localStorage.setItem(`workspace_data_${activeId}`, JSON.stringify(currentData));
          setData(currentData);
        }
      } catch (err) {
        console.error("Telemetry simulation failed:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSetupCompleted, activeProjectId, isTabLeader]);

  // Load project initialization state & projects list
  useEffect(() => {
    let tabId = sessionStorage.getItem("tabId");
    if (!tabId) {
      tabId = Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem("tabId", tabId);
    }

    const completed = localStorage.getItem("isSetupCompleted");
    const savedActiveId = localStorage.getItem("activeProjectId");
    if (completed !== "true" || !savedActiveId) {
      window.location.replace("/");
      return;
    } else {
      setIsSetupCompleted(true);
      setActiveProjectId(savedActiveId);
      updateTabActiveProject(savedActiveId);
    }

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
      setIsSetupCompleted(true);
      updateTabActiveProject(finalProjectId);
      localStorage.setItem("lastSeededProjectId", finalProjectId);
      await refreshData();
      
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

  const handleRenameProject = (projId, newName) => {
    if (!projId) return;
    const updated = projects.map(p => p.id === projId ? { ...p, name: newName } : p);
    setProjects(updated);
    localStorage.setItem("projects", JSON.stringify(updated));
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
        { id: "SUP-201", name: "Start of Transport", type: "Supplier", risk: 0.08, email: "logistics@gepower.com" },
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
        showToast("Configuration save failed: No project active.", "error");
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
      showToast("Factory fleet structure successfully synchronized with Local Storage!", "success");
    } catch (err) {
      console.error("Config save failed:", err);
      showToast("Saving configuration failed: " + err.message, "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const closeTutorial = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setShowTutorial(false);
  };

  // Scroll and highlight selector element during step changes
  useEffect(() => {
    // This side-effect is handled directly in the TutorialTour component
  }, []);

  // Native browser notifications helper
  const triggerDeviceNotification = useCallback((title, message) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          if (document.hidden) {
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

  // Request browser Notification permission
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

  // Watcher and notifier for milestone changes
  const checkMilestones = useCallback((projectId, maintenanceOrders, machines, inventory) => {
    if (!maintenanceOrders) return;

    maintenanceOrders.forEach(order => {
      const machine = machines?.find(m => m.id === order.machine_id);
      const machineStatus = machine?.status || "Operational";
      const requiredPartId = machine?.critical_thresholds?.required_part_id;
      const part = inventory?.find(p => p.part_id === requiredPartId);
      const componentName = part?.part_name || "Critical Component";

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
        const supplierMatch = order.root_cause?.match(/Selected Supplier:\s*([^\n\r(]+)/) ||
                              order.root_cause?.match(/dispatched to\s*([^\n\r(]+)/i);
        const supplierLabel = supplierMatch ? supplierMatch[1].trim() : "Supplier";

        const stageLabels = [
          { n: 1, name: "Suppliers' Approval" },
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

  // Listen for storage events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith("workspace_data_")) {
        const projectId = e.key.replace("workspace_data_", "");
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            checkMilestones(projectId, parsed.maintenance_orders, parsed.machines, parsed.inventory);
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

  // Auto scroll console terminal
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
          dot: "bg-red-555", 
          sparkColor: "#ef4444" 
        };
      default:
        return { 
          label: "Inactive", 
          bg: isDark ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-slate-100 text-slate-700 border-slate-205", 
          dot: "bg-slate-505", 
          sparkColor: "#64748b" 
        };
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#030508] text-slate-350' : 'bg-[#f8fafc] text-slate-700'} pb-12 font-sans select-none transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Prismatic Background Grid */}
      <div className={`absolute inset-0 bg-[linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px),linear-gradient(90deg,${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none animate-grid-move`}></div>
      
      {/* Glow Mesh Spheres */}
      <div className={`absolute top-[-10%] left-[-10%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-purple-600/[0.04]' : 'bg-purple-400/[0.05]'} rounded-full blur-[130px] pointer-events-none animate-pulse-slow`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-cyan-500/[0.04]' : 'bg-cyan-400/[0.05]'} rounded-full blur-[130px] pointer-events-none animate-pulse-slow-alt`}></div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] ${theme === 'dark' ? 'bg-blue-600/[0.02]' : 'bg-blue-500/[0.03]'} rounded-full blur-[150px] pointer-events-none`}></div>

      <Navbar
        pageType="dashboard"
        theme={theme}
        toggleTheme={toggleTheme}
        activeProject={activeProject}
        handleRenameProject={handleRenameProject}
        notificationPermission={notificationPermission}
        requestNotificationPermission={requestNotificationPermission}
        setShowTutorial={setShowTutorial}
        setTutorialStep={setTutorialStep}
        updateTabActiveProject={updateTabActiveProject}
        setEditorMachines={setEditorMachines}
        setEditorInventory={setEditorInventory}
        setEditorNodes={setEditorNodes}
        setEditorEdges={setEditorEdges}
        setShowEditor={setShowEditor}
        data={data}
        simulating={simulating}
        handleSimulation={handleSimulation}
        simulatorDropdownOpen={simulatorDropdownOpen}
        setSimulatorDropdownOpen={setSimulatorDropdownOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        mobileSimDropdownOpen={mobileSimDropdownOpen}
        setMobileSimDropdownOpen={setMobileSimDropdownOpen}
        setShowLogPopup={setShowLogPopup}
      />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <TelemetryLiveMonitor
          theme={theme}
          data={data}
          getStatusBadges={getStatusBadges}
          graphsPopupMachineId={graphsPopupMachineId}
          setGraphsPopupMachineId={setGraphsPopupMachineId}
          componentsPopupMachineId={componentsPopupMachineId}
          setComponentsPopupMachineId={setComponentsPopupMachineId}
        />

        <div className="grid grid-cols-1 gap-6">
          <SourcingRoadmap
            theme={theme}
            data={data}
            selectedRoadmapOrderId={selectedRoadmapOrderId}
            setSelectedRoadmapOrderId={setSelectedRoadmapOrderId}
          />
        </div>

        <ActionCenter
          theme={theme}
          data={data}
          setSelectedEmail={setSelectedEmail}
        />
      </main>

      <TutorialTour
        theme={theme}
        showTutorial={showTutorial}
        tutorialStep={tutorialStep}
        setTutorialStep={setTutorialStep}
        closeTutorial={closeTutorial}
      />

      <EmailInspector
        theme={theme}
        selectedEmail={selectedEmail}
        setSelectedEmail={setSelectedEmail}
      />

      <FleetConfigurator
        theme={theme}
        showEditor={showEditor}
        setShowEditor={setShowEditor}
        editorTab={editorTab}
        setEditorTab={setEditorTab}
        editorMachines={editorMachines}
        setEditorMachines={setEditorMachines}
        editorInventory={editorInventory}
        setEditorInventory={setEditorInventory}
        editorNodes={editorNodes}
        setEditorNodes={setEditorNodes}
        editorEdges={editorEdges}
        setEditorEdges={setEditorEdges}
        handleLoadPreset={handleLoadPreset}
        handleSaveConfig={handleSaveConfig}
        savingConfig={savingConfig}
      />

      {/* Multi-Agent Execution Log Popup Modal */}
      {showLogPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassmorphic Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
            onClick={() => setShowLogPopup(false)}
          />
          
          <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 ${
            theme === 'dark'
              ? 'bg-[#0a0d14] border-slate-800 shadow-cyan-950/20'
              : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}>
            {/* Modal Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              theme === 'dark' ? 'border-slate-800 bg-[#0d111b]' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="font-mono text-xs font-bold tracking-wider uppercase">
                  Multi-Agent Execution Thoughts Stream
                </span>
              </div>
              <button
                onClick={() => setShowLogPopup(false)}
                className={`p-1.5 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-650 hover:text-slate-900'
                }`}
              >
                <span className="font-mono text-xs block px-1">CLOSE ×</span>
              </button>
            </div>

            {/* Modal Terminal Panel Content */}
            <div className="p-5">
              <ThoughtsStream
                theme={theme}
                thoughts={thoughts}
                thoughtsContainerRef={thoughtsContainerRef}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
