"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InstructionsPanel from "@/app/device/_components/InstructionsPanel";
import ConsoleOut from "@/app/device/_components/ConsoleOut";
import GatewayConfig from "@/app/device/_components/GatewayConfig";
import FleetAverages from "@/app/device/_components/FleetAverages";

export default function DeviceClientPage() {
  const [adminId, setAdminId] = useState("ADM-8A9F");
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [thoughts, setThoughts] = useState([]);
  const [localLogs, setLocalLogs] = useState([]);
  const [workflowMachines, setWorkflowMachines] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(true);

  const addLog = (text) => {
    setLocalLogs(prev => [{ id: Date.now() + Math.random(), agent: "IoT Client", type: text.startsWith("ERROR") ? "warning" : text.startsWith("SUCCESS") ? "planning" : "info", text }, ...prev].slice(0, 12));
  };

  // Load thoughts from localStorage (persisted by dashboard/c-home) + subscribe for live sync
  useEffect(() => {
    const activeId = localStorage.getItem("activeProjectId");

    // Load persisted agent thoughts
    if (activeId) {
      try {
        const raw = localStorage.getItem(`workspace_thoughts_${activeId}`);
        if (raw) {
          setThoughts(JSON.parse(raw));
        }
      } catch (e) { console.warn("Failed to load thoughts:", e); }
    }

    // Cross-tab live sync: when dashboard writes new thoughts, update here instantly
    const handleStorage = (e) => {
      if (e.key && e.key.startsWith("workspace_thoughts_") && e.newValue) {
        try {
          setThoughts(JSON.parse(e.newValue));
        } catch (err) { /* ignore parse errors */ }
      }
    };
    window.addEventListener("storage", handleStorage);

    setLocalLogs([
      { id: 1, agent: "IoT Client", type: "info", text: "IoT telemetry client initialized." },
      { id: 2, agent: "IoT Client", type: "info", text: "Ready to transmit to local gateway." }
    ]);

    // Fetch machines with their historical averages
    const fetchAverages = async () => {
      try {
        if (typeof window !== "undefined") {
          if (activeId) {
            const localDataRaw = localStorage.getItem(`workspace_data_${activeId}`);
            if (localDataRaw) {
              const parsed = JSON.parse(localDataRaw);
              if (parsed.machines && parsed.machines.length > 0) {
                const calculated = parsed.machines.map((m) => {
                  const telemetryList = parsed.telemetry && parsed.telemetry[m.id] ? parsed.telemetry[m.id] : [];
                  let totalTemp = 0, totalVib = 0, totalPres = 0, totalCur = 0;
                  telemetryList.forEach((pt) => {
                    totalTemp += pt.temperature || 0;
                    totalVib += pt.vibration || 0;
                    totalPres += pt.pressure || 0;
                    totalCur += pt.current || 0;
                  });
                  const count = telemetryList.length || 1;
                  return {
                    id: m.id,
                    name: m.name,
                    status: m.status,
                    avg_temp: parseFloat((totalTemp / count).toFixed(2)),
                    avg_vib: parseFloat((totalVib / count).toFixed(2)),
                    avg_pres: parseFloat((totalPres / count).toFixed(2)),
                    avg_cur: parseFloat((totalCur / count).toFixed(2))
                  };
                });
                setWorkflowMachines(calculated);
                addLog(`SUCCESS: Loaded ${calculated.length} machines with averages from local storage.`);
                setLoadingMachines(false);
                return;
              }
            }
          }
        }
      } catch (localErr) {
        console.warn("Failed to load averages from local storage, falling back to API:", localErr);
      }

      try {
        const res = await fetch("/api/reports?action=averages");
        if (res.ok) {
          const data = await res.json();
          setWorkflowMachines(data.machines || []);
          addLog("SUCCESS: Loaded fleet averages from Control Tower API.");
        } else {
          addLog("ERROR: Failed to fetch active fleet averages.");
        }
      } catch (err) {
        addLog("ERROR: Connection to averages API failed.");
      } finally {
        setLoadingMachines(false);
      }
    };
    
    fetchAverages();

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleBroadcastFleet = async () => {
    if (workflowMachines.length === 0) {
      addLog("ERROR: No machines in workflow to broadcast.");
      return;
    }
    if (!adminId) {
      addLog("ERROR: Admin Link ID is required for broadcasting.");
      return;
    }
    setSubmitting(true);
    addLog(`BROADCAST: Starting forced transmission for ${workflowMachines.length} machines...`);
    
    let successCount = 0;
    for (const machine of workflowMachines) {
      addLog(`Broadcasting average telemetry for ${machine.id}...`);
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminId,
            machineId: machine.id,
            status: machine.status,
            temperature: parseFloat(machine.avg_temp),
            vibration: parseFloat(machine.avg_vib),
            pressure: parseFloat(machine.avg_pres),
            current: parseFloat(machine.avg_cur),
            message: `Forced broadcast of historical average telemetry for ${machine.name} (${machine.id}).`
          })
        });

        const data = await res.json();
        if (res.ok) {
          successCount++;
          addLog(`SUCCESS: ${machine.id} averages received. (ID: ${data.reportId})`);
        } else {
          addLog(`ERROR: ${machine.id} rejected. Reason: ${data.error}`);
        }
      } catch (err) {
        addLog(`ERROR: Network timeout for ${machine.id}.`);
      }
    }
    
    addLog(`BROADCAST COMPLETE: Transmitted ${successCount}/${workflowMachines.length} reports successfully.`);
    setSuccessMsg(`Forced broadcast completed! ${successCount}/${workflowMachines.length} reports sent.`);
    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen bg-[#04060a] text-slate-300 font-sans p-6 overflow-hidden">
      {/* Grid Pattern and Background Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#090d16_1px,transparent_1px),linear-gradient(to_bottom,#090d16_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35 pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-950/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-950/10 blur-[100px] pointer-events-none"></div>

      {/* Back Navigation Button */}
      <div className="relative max-w-5xl mx-auto z-20 mb-6">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono uppercase tracking-wider font-bold hover:bg-slate-850 hover:text-white text-slate-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Control Tower</span>
        </Link>
      </div>

      <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
        
        {/* Left column: Instructions and Live Console */}
        <div className="lg:col-span-1 space-y-6">
          <InstructionsPanel />
          <ConsoleOut logs={logs} />
        </div>

        {/* Right column: Fleet Averages & Broadcasting */}
        <div className="lg:col-span-2 space-y-6">
          <GatewayConfig adminId={adminId} setAdminId={setAdminId} />
          
          <FleetAverages 
            workflowMachines={workflowMachines}
            loadingMachines={loadingMachines}
            submitting={submitting}
            errorMsg={errorMsg}
            successMsg={successMsg}
            handleBroadcastFleet={handleBroadcastFleet}
          />
        </div>

      </div>
    </div>
  );
}
