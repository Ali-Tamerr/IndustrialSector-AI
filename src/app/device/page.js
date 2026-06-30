"use client";

import { useState, useEffect } from "react";
import { 
  Sliders, 
  Cpu, 
  Terminal, 
  Send, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Activity,
  ArrowRight,
  TrendingUp
} from "lucide-react";

export default function DeviceClientPage() {
  const [adminId, setAdminId] = useState("ADM-8A9F");
  const [machineId, setMachineId] = useState("MCH-001");
  const [customMachineId, setCustomMachineId] = useState("");
  const [status, setStatus] = useState("Operational");
  
  // Telemetry metrics
  const [temperature, setTemperature] = useState("55.0");
  const [vibration, setVibration] = useState("1.8");
  const [pressure, setPressure] = useState("5.2");
  const [current, setCurrent] = useState("8.2");
  
  const [message, setMessage] = useState("");
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setLogs([
      { time: new Date().toLocaleTimeString(), text: "IoT telemetry client initialized." },
      { time: new Date().toLocaleTimeString(), text: "Ready to transmit to local gateway." }
    ]);
  }, []);

  const addLog = (text) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), text }, ...prev].slice(0, 8));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(false);
    setErrorMsg("");
    setSuccessMsg("");
    
    const finalMachineId = machineId === "Custom" ? customMachineId : machineId;
    
    if (!finalMachineId) {
      setErrorMsg("Please specify a Machine ID.");
      return;
    }

    if (!adminId) {
      setErrorMsg("Admin Link ID is required to route the report.");
      return;
    }

    setSubmitting(true);
    addLog(`Transmitting telemetry payload for ${finalMachineId}...`);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          machineId: finalMachineId,
          status,
          temperature,
          vibration,
          pressure,
          current,
          message: message || `Device reporting telemetry state: Status is ${status}.`
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Report submitted successfully! (ID: ${data.reportId})`);
        addLog(`SUCCESS: Route cleared by Gateway. Data ingested by Admin [${adminId}]`);
        setMessage("");
      } else {
        setErrorMsg(data.error || "Failed to submit report");
        addLog(`ERROR: Transmission rejected. Reason: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network connection failed. Check if server is running.");
      addLog("ERROR: Connection timeout to local Control Tower endpoint.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPreset = (preset) => {
    setStatus(preset.status);
    setTemperature(preset.temp);
    setVibration(preset.vib);
    setPressure(preset.pres);
    setCurrent(preset.cur);
    setMessage(preset.msg);
    addLog(`Loaded preset for status: ${preset.status}`);
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
              Simulates a hardware monitoring device connected to heavy machinery. This panel runs without account credentials and submits raw telemetry logs to the admin account utilizing the Link ID.
            </p>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
              <h2 className="font-semibold text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>How to use:</span>
              </h2>
              <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                <li>Input the Admin Link ID (Default: <code className="text-emerald-300">ADM-8A9F</code>).</li>
                <li>Set telemetry metrics or choose quick-presets.</li>
                <li>Transmit report. View updates instantly in the Admin Portal.</li>
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

        {/* Right column: The interactive reporting form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-[#080d16]/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white font-now pb-4 border-b border-slate-800 flex items-center justify-between">
              <span>Telemetry Transmitter</span>
              <Sliders className="w-5 h-5 text-emerald-400" />
            </h2>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-200 text-xs leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-emerald-200 text-xs leading-relaxed">{successMsg}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Routing ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Admin Link ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADM-8A9F"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full bg-[#04060a] border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-white text-sm outline-none font-mono"
                />
              </div>

              {/* Machine Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Target Machine ID</label>
                <div className="flex gap-2">
                  <select
                    value={machineId}
                    onChange={(e) => setMachineId(e.target.value)}
                    className="flex-1 bg-[#04060a] border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-white text-sm outline-none"
                  >
                    <option value="MCH-001">MCH-001 (Rotary Gear Pump A)</option>
                    <option value="MCH-002">MCH-002 (High-Speed Fan B)</option>
                    <option value="MCH-003">MCH-003 (Heavy-Duty Compressor C)</option>
                    <option value="Custom">Custom Machine ID</option>
                  </select>
                  
                  {machineId === "Custom" && (
                    <input
                      type="text"
                      required
                      placeholder="MCH-999"
                      value={customMachineId}
                      onChange={(e) => setCustomMachineId(e.target.value)}
                      className="w-[120px] bg-[#04060a] border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-white text-sm outline-none font-mono"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Quick telemetry presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Simulation Presets</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSetPreset({
                    status: "Operational", temp: "55.4", vib: "1.8", pres: "5.2", cur: "8.2",
                    msg: "Normal operational metrics. Running within thresholds."
                  })}
                  className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-400 font-medium hover:bg-slate-800 transition-colors"
                >
                  Healthy (Operational)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset({
                    status: "Degraded", temp: "84.5", vib: "8.2", pres: "4.8", cur: "14.2",
                    msg: "High vibrational stress detected on bearing casing. Maintenance recommended."
                  })}
                  className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-amber-400 font-medium hover:bg-slate-800 transition-colors"
                >
                  Warning (Degraded)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset({
                    status: "Critical", temp: "98.2", vib: "10.4", pres: "2.1", cur: "19.5",
                    msg: "EMERGENCY: Stator winding heat spike and compressor pressure loss."
                  })}
                  className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-red-400 font-medium hover:bg-slate-800 transition-colors"
                >
                  Danger (Critical)
                </button>
              </div>
            </div>

            {/* Metrics Configuration Grid */}
            <div className="bg-[#05080e] border border-slate-900 rounded-2xl p-5 space-y-5">
              <h3 className="text-xs uppercase font-bold tracking-wider text-blue-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Adjust Sensor Levels</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Temperature (°C)</span>
                    <span className="text-white font-mono font-bold">{temperature}°C</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="140"
                    step="0.5"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Vibration */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Vibration (mm/s)</span>
                    <span className="text-white font-mono font-bold">{vibration} mm/s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="18"
                    step="0.1"
                    value={vibration}
                    onChange={(e) => setVibration(e.target.value)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Pressure */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Discharge Pressure (Bar)</span>
                    <span className="text-white font-mono font-bold">{pressure} Bar</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.2"
                    value={pressure}
                    onChange={(e) => setPressure(e.target.value)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Current */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Coil Current (Amps)</span>
                    <span className="text-white font-mono font-bold">{current} A</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    step="0.2"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Custom Log Message */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Diagnostic Message or Alarm Description</label>
              <textarea
                placeholder="Describe current device issues, warnings, or write a log entry..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="3"
                className="w-full bg-[#04060a] border border-slate-800 focus:border-emerald-500 rounded-xl p-4 text-white text-sm outline-none resize-none transition-all focus:ring-1 focus:ring-emerald-500/30"
              ></textarea>
            </div>

            {/* Submission buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-emerald-600/10 border border-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Transmit Logs & Telemetry</span>
              </button>
              
              <div className="text-slate-500 text-xs text-center sm:text-left flex items-center gap-2.5">
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
                <span>Reports map directly to the connected admin dashboard.</span>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
