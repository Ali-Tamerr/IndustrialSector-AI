"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  AlertTriangle, 
  Terminal, 
  Cpu, 
  RefreshCw, 
  PlusCircle, 
  Clipboard,
  ExternalLink,
  CheckCircle,
  FileText,
  LogOut,
  Sliders,
  Activity
} from "lucide-react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState("ADM-8A9F");
  
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [copied, setCopied] = useState(false);

  // Test report modal/form states
  const [showTestForm, setShowTestForm] = useState(false);
  const [testMachineId, setTestMachineId] = useState("MCH-001");
  const [testStatus, setTestStatus] = useState("Operational");
  const [testTemp, setTestTemp] = useState("55.2");
  const [testVib, setTestVib] = useState("1.8");
  const [testPres, setTestPres] = useState("5.2");
  const [testCur, setTestCur] = useState("8.2");
  const [testMessage, setTestMessage] = useState("");
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testSuccessMsg, setTestSuccessMsg] = useState("");

  // Check login state on load
  useEffect(() => {
    const logged = localStorage.getItem("adminLoggedIn");
    const savedId = localStorage.getItem("adminLinkID");
    if (logged === "true") {
      setIsLoggedIn(true);
      if (savedId) setAdminId(savedId);
    }
  }, []);

  // Fetch reports when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchReports();
      // Poll every 5 seconds for new reports
      const interval = setInterval(fetchReports, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, adminId]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/reports?adminId=${adminId}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    // Mockup authentication
    if (email === "admin@industrial.ai" && password === "password123") {
      setIsLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminLinkID", adminId);
    } else {
      setError("Invalid email or password. Use mockup details provided below.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("adminLoggedIn");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(adminId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestReport = async (e) => {
    e.preventDefault();
    setSubmittingTest(true);
    setTestSuccessMsg("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          machineId: testMachineId,
          status: testStatus,
          temperature: testTemp,
          vibration: testVib,
          pressure: testPres,
          current: testCur,
          message: testMessage || `Manual test log triggered from Admin Dashboard for ${testMachineId}.`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTestSuccessMsg("Report submitted successfully!");
        setTestMessage("");
        fetchReports();
        setTimeout(() => {
          setShowTestForm(false);
          setTestSuccessMsg("");
        }, 1500);
      } else {
        setError(data.error || "Failed to submit test report");
      }
    } catch (err) {
      console.error(err);
      setError("Network error submitting report");
    } finally {
      setSubmittingTest(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen bg-[#06080c] flex items-center justify-center overflow-hidden font-sans">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-950/15 blur-[120px] pointer-events-none animate-pulse-slow-alt"></div>

        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

        {/* Login Container */}
        <div className="relative w-full max-w-md bg-[#0c0f17]/85 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl animate-fadeIn">
          {/* Logo Head */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 border border-blue-400/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-now">Control Tower</h1>
            <p className="text-slate-400 text-sm mt-1">Industrial Machine Reports Admin Portal</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-200 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@industrial.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#070a10] border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#070a10] border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/15 border border-blue-500/20 active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              Sign In to Admin Portal
            </button>
          </form>

          {/* Mock credentials reminder (aesthetic card) */}
          <div className="mt-8 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/65 py-1 px-2 rounded-md border border-blue-900/30">Mock Account Details</span>
            <div className="mt-3 space-y-1.5 text-xs text-slate-300">
              <p className="flex justify-between"><span className="text-slate-400">Email:</span> <code className="text-blue-200">admin@industrial.ai</code></p>
              <p className="flex justify-between"><span className="text-slate-400">Password:</span> <code className="text-blue-200">password123</code></p>
              <p className="flex justify-between"><span className="text-slate-400">Device Link ID:</span> <code className="text-blue-200">{adminId}</code></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080c] text-slate-200 flex flex-col overflow-x-hidden font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-[#070a11]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-now">Control Tower</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Reports Admin Hub</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/device"
            target="_blank"
            className="flex items-center gap-2 py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Open Device Client</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 py-2 px-3 text-xs bg-red-950/20 border border-red-900/30 text-red-200 rounded-lg hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Device Sync Info Banner */}
        <div className="bg-[#0b101d] border border-blue-950/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[64px] pointer-events-none"></div>
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-xl font-bold text-white font-now">Local Device Integration</h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Any local diagnostic device, IoT node, or monitoring script can report machinery telemetry and logs to your account by using the Link ID below. No account credentials needed on reporting devices.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
            <div className="bg-[#070a11] border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between min-w-[220px]">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-bold text-blue-400 block mb-0.5">Admin Link ID</span>
                <code className="text-base font-bold text-white font-mono">{adminId}</code>
              </div>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Copy Link ID"
              >
                {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Clipboard className="w-5 h-5" />}
              </button>
            </div>
            
            <button
              onClick={() => setShowTestForm(true)}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 border border-blue-500/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simulate Report</span>
            </button>
          </div>
        </div>

        {/* Test Report Generator Modal Form */}
        {showTestForm && (
          <div className="bg-[#0c0f17] border border-slate-800 rounded-2xl p-6 relative animate-fadeIn shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 font-now flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Simulate Local Device Machine Report</span>
            </h3>
            
            {testSuccessMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-900 text-emerald-300 text-xs">
                {testSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSendTestReport} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Machine ID</label>
                <select
                  value={testMachineId}
                  onChange={(e) => setTestMachineId(e.target.value)}
                  className="w-full bg-[#070a10] border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 text-white text-xs outline-none"
                >
                  <option value="MCH-001">MCH-001 (Rotary Gear Pump A)</option>
                  <option value="MCH-002">MCH-002 (High-Speed Fan B)</option>
                  <option value="MCH-003">MCH-003 (Heavy-Duty Compressor C)</option>
                  <option value="Custom">Custom / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Machine Status</label>
                <select
                  value={testStatus}
                  onChange={(e) => setTestStatus(e.target.value)}
                  className="w-full bg-[#070a10] border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 text-white text-xs outline-none"
                >
                  <option value="Operational">Operational (Healthy)</option>
                  <option value="Degraded">Degraded (Warning)</option>
                  <option value="Critical">Critical (Danger)</option>
                </select>
              </div>

              <div className="grid grid-cols-4 gap-2 md:col-span-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={testTemp}
                    onChange={(e) => setTestTemp(e.target.value)}
                    className="w-full bg-[#070a10] border border-slate-800 focus:border-blue-500 rounded-lg p-2 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Vib (mm/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={testVib}
                    onChange={(e) => setTestVib(e.target.value)}
                    className="w-full bg-[#070a10] border border-slate-800 focus:border-blue-500 rounded-lg p-2 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Pres (Bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={testPres}
                    onChange={(e) => setTestPres(e.target.value)}
                    className="w-full bg-[#070a10] border border-slate-800 focus:border-blue-500 rounded-lg p-2 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Current (A)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={testCur}
                    onChange={(e) => setTestCur(e.target.value)}
                    className="w-full bg-[#070a10] border border-slate-800 focus:border-blue-500 rounded-lg p-2 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Diagnostic Message / Log</label>
                <input
                  type="text"
                  placeholder="e.g. Bearing temperature threshold warning. Lubricant level checks required."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-[#070a10] border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 text-white text-xs outline-none"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={submittingTest}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-colors"
                >
                  {submittingTest ? "Sending..." : "Submit Test"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTestForm(false)}
                  className="py-2.5 px-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports Panel */}
        <div className="bg-[#0c0f17] border border-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Panel Header */}
          <div className="p-5 border-b border-slate-900/60 bg-[#090d14] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-950/50 border border-blue-900/30 rounded-lg text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white font-now">Received Reports & Logs</h3>
                <p className="text-slate-400 text-xs mt-0.5">Real-time alerts submitted by devices linked to this tower</p>
              </div>
            </div>

            <button
              onClick={fetchReports}
              className="p-2 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Table Container */}
          {reports.length === 0 ? (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-600">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-white text-sm font-semibold">No reports received yet</p>
                <p className="text-slate-400 text-xs max-w-sm">
                  Send reports using the device emulator page or via the API. Once a device submits log metrics using Link ID <code className="text-blue-300 font-mono">{adminId}</code>, they will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-900 bg-[#070a11]/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Machine ID</th>
                    <th className="py-4 px-6">Alert Level</th>
                    <th className="py-4 px-6">Telemetry readings</th>
                    <th className="py-4 px-6">Log details / Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-xs">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 text-slate-400 whitespace-nowrap font-mono">
                        {new Date(report.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-blue-400" />
                          {report.machine_id}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full font-bold text-[10px] uppercase border ${
                          report.status === "Critical" 
                            ? "bg-red-950/40 border-red-800 text-red-300"
                            : report.status === "Degraded"
                            ? "bg-amber-950/40 border-amber-800 text-amber-300"
                            : "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            report.status === "Critical" ? "bg-red-500" : report.status === "Degraded" ? "bg-amber-500" : "bg-emerald-500"
                          }`}></span>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                          {report.temperature && <span>T: <strong className="text-slate-300">{report.temperature}°C</strong></span>}
                          {report.vibration && <span>V: <strong className="text-slate-300">{report.vibration}mm/s</strong></span>}
                          {report.pressure && <span>P: <strong className="text-slate-300">{report.pressure}Bar</strong></span>}
                          {report.current && <span>I: <strong className="text-slate-300">{report.current}A</strong></span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">
                        {report.message || <span className="text-slate-500 italic">No message provided</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
