"use client";

import { useState, useEffect } from "react";
import { 
  Cpu, 
  Terminal, 
  Send, 
  HelpCircle,
  Activity
} from "lucide-react";

export default function DeviceClientPage() {
  const [adminId, setAdminId] = useState("ADM-8A9F");
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [logs, setLogs] = useState([]);
  const [workflowMachines, setWorkflowMachines] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(true);

  const addLog = (text) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), text }, ...prev].slice(0, 8));
  };

  useEffect(() => {
    setLogs([
      { time: new Date().toLocaleTimeString(), text: "IoT telemetry client initialized." },
      { time: new Date().toLocaleTimeString(), text: "Ready to transmit to local gateway." }
    ]);

    // Fetch machines with their historical averages
    const fetchAverages = async () => {
      try {
        const res = await fetch("/api/reports?action=averages");
        if (res.ok) {
          const data = await res.json();
          setWorkflowMachines(data.machines || []);
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

      <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
        
        {/* Left column: Instructions and Live Console */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Title Badge */}
          <div className="bg-[#080d16]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center border border-emerald-500/20">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white font-now">IoT Device Client</h1>
                <p className="text-[10px] text-emerald-400 font-mono tracking-wider font-bold">Local Reporting Node</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Simulates hardware monitoring devices in the workflow. It computes the average sensor values of the machines from the beginning of the workflow, then broadcasts them directly to the admin account.
            </p>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
              <h2 className="font-semibold text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>How to use:</span>
              </h2>
              <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                <li>Input the target Admin Link ID (Default: <code className="text-emerald-300">ADM-8A9F</code>).</li>
                <li>Wait for the fleet's historical sensor averages to calculate.</li>
                <li>Trigger the Forced Broadcast to send all machine telemetry to the admin.</li>
              </ol>
            </div>
          </div>

          {/* Device Log Terminal Console */}
          <div className="bg-[#070b13]/90 border border-slate-900 rounded-2xl p-5 shadow-xl font-mono">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Console Out</span>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            
            <div className="space-y-2 text-[11px] h-[180px] overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-600 font-bold">{log.time}</span>
                  <span className={log.text.startsWith("ERROR") ? "text-red-400" : log.text.startsWith("SUCCESS") ? "text-emerald-400" : "text-slate-300"}>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Fleet Averages & Broadcasting */}
        <div className="lg:col-span-2 space-y-6">
          {/* Link Configuration Card */}
          <div className="bg-[#080d16]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">
              Gateway Configuration
            </h2>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Admin Link ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ADM-8A9F"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full max-w-xs bg-[#04060a] border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none font-mono"
              />
            </div>
          </div>

          {/* Workflow Averages & Broadcast Table */}
          <div className="bg-[#080d16]/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white font-now flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <span>Workflow Fleet & Averages</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Average sensor values since the beginning of the workflow until page loaded.
                </p>
              </div>
              
              <button
                type="button"
                disabled={submitting || loadingMachines || workflowMachines.length === 0}
                onClick={handleBroadcastFleet}
                className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-lg shadow-emerald-600/10 border border-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900 text-emerald-200 text-xs">
                {successMsg}
              </div>
            )}

            {loadingMachines ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                <p className="text-xs text-slate-500 font-mono">Calculating historical fleet averages...</p>
              </div>
            ) : workflowMachines.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No registered machines found in the current workflow.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-2">Machine ID</th>
                      <th className="py-3 px-2">Machine Name</th>
                      <th className="py-3 px-2">Health State</th>
                      <th className="py-3 px-2 text-right">Avg Temp</th>
                      <th className="py-3 px-2 text-right">Avg Vib</th>
                      <th className="py-3 px-2 text-right">Avg Pres</th>
                      <th className="py-3 px-2 text-right">Avg Cur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {workflowMachines.map((machine) => {
                      const statusColor = 
                        machine.status === "Operational" ? "text-emerald-400 bg-emerald-950/20 border-emerald-500/20" :
                        machine.status === "Degraded" ? "text-amber-400 bg-amber-950/20 border-amber-500/20" :
                        "text-red-400 bg-red-950/20 border-red-500/20";

                      return (
                        <tr key={machine.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 px-2 font-mono font-bold text-white">{machine.id}</td>
                          <td className="py-3.5 px-2 text-slate-300 font-medium">{machine.name}</td>
                          <td className="py-3.5 px-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {machine.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right font-mono text-white">{machine.avg_temp}°C</td>
                          <td className="py-3.5 px-2 text-right font-mono text-white">{machine.avg_vib} mm/s</td>
                          <td className="py-3.5 px-2 text-right font-mono text-white">{machine.avg_pres} Bar</td>
                          <td className="py-3.5 px-2 text-right font-mono text-white">{machine.avg_cur} A</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
