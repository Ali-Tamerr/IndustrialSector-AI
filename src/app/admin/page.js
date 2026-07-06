"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  ArrowLeft,
  Bell
} from "lucide-react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState("ADM-8A9F");
  const [fleetData, setFleetData] = useState(null);
  
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("approved"); // approved or notifications
  const [adminView, setAdminView] = useState("dashboard"); // dashboard or reports
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleApproveReport = async (reportId) => {
    try {
      const res = await fetch("/api/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, approved: true })
      });

      if (res.ok) {
        setReports(prev => 
          prev.map(r => r.id === reportId ? { ...r, approved: true } : r)
        );
      }
    } catch (err) {
      console.error("Failed to approve report:", err);
    }
  };

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

  // Fetch fleet stats when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchFleetData();
      const interval = setInterval(fetchFleetData, 6000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchFleetData = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const data = await res.json();
        setFleetData(data);
      }
    } catch (err) {
      console.error("Failed to fetch fleet data:", err);
    }
  };

  const criticalMachinesCount = useMemo(() => {
    if (!fleetData || !fleetData.machines) return 0;
    return fleetData.machines.filter(m => m.status === "Critical").length;
  }, [fleetData]);

  const totalExpenditure = useMemo(() => {
    if (!fleetData || !fleetData.maintenance_orders || !fleetData.machines || !fleetData.inventory) return 0;
    const orders = fleetData.maintenance_orders;
    const machines = fleetData.machines;
    const inventory = fleetData.inventory;
    const graphLinks = fleetData.graph?.links || [];
    
    let total = 0;
    orders.forEach(order => {
      // Find machine
      const machine = machines.find(m => m.id === order.machine_id);
      if (!machine) return;
      
      // Get required part
      const partId = machine.critical_thresholds?.required_part_id || 
                     (machine.id === 'MCH-001' ? 'PART-001' : 
                      machine.id === 'MCH-002' ? 'PART-004' : 
                      machine.id === 'MCH-003' ? 'PART-002' : null);
      if (!partId) return;
      
      // Check if it went to a supplier sourcing flow (status is 'Dispatched_Sourcing_Active' or 'Pending_Sourcing')
      const isSourced = order.status === 'Dispatched_Sourcing_Active' || order.status === 'Pending_Sourcing';
      
      if (isSourced && graphLinks.length > 0) {
        // Try to find the edge price.
        // We can parse the winning supplier from root_cause text
        const supplierMatch = order.root_cause?.match(/Supplier:\s*(\w+-\d+)/) || 
                              order.root_cause?.match(/dispatched to\s*([^\n(]+)\s*\((\w+-\d+)\)/i);
        const supplierId = supplierMatch ? supplierMatch[2] : null;
        
        if (supplierId) {
          const link = graphLinks.find(l => l.source === supplierId && l.target === partId);
          if (link) {
            total += link.price;
            return;
          }
        }
        
        // Fallback sourcing price
        const firstSupplierLink = graphLinks.find(l => l.target === partId);
        if (firstSupplierLink) {
          total += firstSupplierLink.price;
          return;
        }
      }
      
      // If in-stock or default, use the baseline inventory cost
      const part = inventory.find(p => p.part_id === partId);
      if (part) {
        total += part.cost;
      } else {
        // Default fallback costs if inventory isn't loaded
        const defaults = { 'PART-001': 120.50, 'PART-002': 45.00, 'PART-003': 350.00, 'PART-004': 850.00 };
        total += defaults[partId] || 100.00;
      }
    });
    
    return total;
  }, [fleetData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
        setAdminId(data.adminId);
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminLinkID", data.adminId);
      } else {
        setError(data.error || "Invalid email or password. Use mockup details provided below.");
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setError("Network or server error during authentication.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("adminLoggedIn");
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
      <div className={`relative min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#030508] text-slate-200' : 'bg-[#f8fafc] text-slate-800'
      }`}>
        
        {/* Subtle non-AI neutral grids */}
        <div className={`absolute inset-0 bg-[linear-gradient(to_right,${
          theme === 'dark' ? 'rgba(255,255,255,0.003)' : 'rgba(0,0,0,0.008)'
        }_1px,transparent_1px),linear-gradient(to_bottom,${
          theme === 'dark' ? 'rgba(255,255,255,0.003)' : 'rgba(0,0,0,0.008)'
        }_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none`}></div>

        {/* Back Navigation Button */}
        <div className="absolute top-6 left-6 z-20">
          <Link 
            href="/dashboard"
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[11px] font-mono uppercase tracking-wider font-bold transition-all shadow-sm ${
              theme === 'dark'
                ? 'bg-slate-900 border-[#1b2336] hover:bg-slate-800 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Clean, editorial-style Login Panel */}
        <div className={`relative w-full max-w-md border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-[#0a0d16] border-[#1b2336]' 
            : 'bg-white border-slate-200'
        }`}>
          
          {/* Card Header (solid color, clean typography) */}
          <div className={`px-8 py-6 border-b flex items-center gap-4 ${
            theme === 'dark' ? 'border-[#1b2336] bg-[#0c0f1e]' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              theme === 'dark' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-base font-bold font-mono tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>Control Tower Admin</h1>
              <p className={`text-[11px] font-sans font-normal mt-0.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>Industrial Machine Reports Portal</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-808/30 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-200 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={`block text-[10px] font-bold font-mono uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>Admin Email</label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-3 w-4 h-4 ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="email"
                    required
                    placeholder="admin@industrial.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border rounded-lg py-2.5 pl-10 pr-4 text-xs font-mono outline-none transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#030508] border-[#1b2336] text-white focus:border-cyan-500' 
                        : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-bold font-mono uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>Password</label>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-3 w-4 h-4 ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full border rounded-lg py-2.5 pl-10 pr-4 text-xs font-mono outline-none transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#030508] border-[#1b2336] text-white focus:border-cyan-500' 
                        : 'bg-white border-slate-200 text-slate-808 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs tracking-wider uppercase font-mono transition-colors active:scale-[0.99] mt-4"
              >
                Sign In
              </button>
            </form>

            {/* Mock credentials list (clean layout, no nesting boxes) */}
            <div className={`pt-4 border-t ${theme === 'dark' ? 'border-[#1b2336]/60' : 'border-slate-150'}`}>
              <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                theme === 'dark' ? 'text-cyan-400' : 'text-cyan-705'
              }`}>Mock Account Credentials</span>
              <div className={`mt-3 space-y-2 text-[11px] font-mono ${theme === 'dark' ? 'text-slate-350' : 'text-slate-655'}`}>
                <div className="flex justify-between border-b pb-1.5 border-dashed border-slate-700/20">
                  <span className="text-slate-500">Email:</span> 
                  <span>admin@industrial.ai</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-dashed border-slate-700/20">
                  <span className="text-slate-500">Password:</span> 
                  <span>password123</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Device Link ID:</span> 
                  <span>{adminId}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const pendingReports = reports.filter(r => !r.approved);
  const approvedReports = reports.filter(r => r.approved);
  const displayedReports = activeTab === "approved" ? approvedReports : pendingReports;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#030508] text-slate-300' : 'bg-[#f8fafc] text-slate-700'
    }`}>
      
      {/* Header */}
      <header className={`border-b backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors duration-300 ${
        theme === 'dark' ? 'border-[#1b2336]/60 bg-[#080b11]/90' : 'border-slate-200 bg-white/90'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-300 ${
            theme === 'dark' ? 'bg-cyan-955/20 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-base font-bold font-mono tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>Control Tower</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className={`text-[9px] uppercase font-bold font-mono tracking-wider ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>Reports Admin Hub</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 py-2 px-3 text-[11px] font-mono uppercase font-bold border rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-slate-900 border-[#1b2336] hover:bg-slate-800 text-slate-355' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Control Tower</span>
          </Link>

          <Link
            href="/device"
            className={`flex items-center gap-1.5 py-2 px-3 text-[11px] font-mono uppercase font-bold border rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-slate-900 border-[#1b2336] hover:bg-slate-800 text-slate-355' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Device Client</span>
          </Link>

          <button
            onClick={() => setShowTestForm(true)}
            className={`flex items-center gap-1.5 py-2 px-3 text-[11px] font-mono uppercase font-bold border rounded-lg transition-all active:scale-95 ${
              theme === 'dark' 
                ? 'bg-cyan-955/20 border-cyan-500/20 text-cyan-400 hover:bg-cyan-955/40' 
                : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simulate Report</span>
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-1.5 py-2 px-3 text-[11px] font-mono uppercase font-bold border rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-red-955/20 border-red-900/30 text-red-305 hover:bg-red-955/40' 
                : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Sidebar + Main Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* Sidebar */}
        {/* ponytail: collapsible navigation sidebar to maximize main screen workspace area */}
        <aside className={`w-full ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} border-b md:border-b-0 md:border-r shrink-0 transition-all duration-300 ${
          theme === 'dark' ? 'bg-[#06080e] border-[#1b2336]/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="p-4 space-y-6 md:sticky md:top-24">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2`}>
              {!sidebarCollapsed && (
                <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>Navigation</span>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                  theme === 'dark' 
                    ? 'border-[#1b2336] bg-[#0c101b] hover:bg-[#151c2d] text-slate-400 hover:text-white' 
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
            
            <nav className="space-y-1">
              <button
                onClick={() => setAdminView("dashboard")}
                className={`w-full flex items-center rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all text-left ${
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                } ${
                  adminView === "dashboard"
                    ? (theme === 'dark' ? 'bg-cyan-955/20 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm')
                    : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
                }`}
                title={sidebarCollapsed ? "Admin Dashboard" : ""}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Admin Dashboard</span>}
              </button>

              <button
                onClick={() => setAdminView("reports")}
                className={`w-full relative flex items-center rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all text-left ${
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                } ${
                  adminView === "reports"
                    ? (theme === 'dark' ? 'bg-cyan-955/20 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm')
                    : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
                }`}
                title={sidebarCollapsed ? "Received Reports" : ""}
              >
                <div className="flex items-center gap-3">
                  <Clipboard className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Received Reports</span>}
                </div>
                {pendingReports.length > 0 && (
                  <span className={`bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse ${
                    sidebarCollapsed ? 'absolute -top-1 -right-1' : ''
                  }`}>
                    {pendingReports.length}
                  </span>
                )}
              </button>
            </nav>

            {/* Admin Info Summary inside Sidebar */}
            <div className={`pt-4 border-t ${theme === 'dark' ? 'border-[#1b2336]/60' : 'border-slate-200'}`}>
              {sidebarCollapsed ? (
                <div className="flex justify-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center relative ${
                    theme === 'dark' ? 'bg-[#090d15]/40 border-[#1b2336]/40' : 'bg-white border-slate-200 shadow-sm'
                  }`} title={`System Operator: ${adminId}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                </div>
              ) : (
                <div className={`p-3.5 rounded-lg border text-left space-y-2 ${
                  theme === 'dark' ? 'bg-[#090d15]/40 border-[#1b2336]/40' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <span className={`text-[9px] font-bold font-mono uppercase tracking-wider block ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}>System Operator</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {adminId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">

          {/* View 1: Admin Dashboard */}
          {adminView === "dashboard" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              
              {/* Dashboard Title Banner */}
              <div className="space-y-1">
                <h2 className={`text-base font-bold font-mono uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-808'}`}>Dashboard Overview</h2>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-505'}`}>
                  Real-time operational KPIs, critical assets tracking, and capital component expenditure.
                </p>
              </div>

              {/* KPI Dashboard Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Critical Machines Card */}
                <div className={`border rounded-xl p-5 flex items-center justify-between transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-[#0a0d16] border-[#1b2336]' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-505'
                    }`}>Critical Assets</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold font-mono ${
                        criticalMachinesCount > 0
                          ? (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                          : (theme === 'dark' ? 'text-white' : 'text-slate-808')
                      }`}>
                        {criticalMachinesCount}
                      </span>
                      <span className={`text-[10px] font-medium font-sans ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>/ {fleetData?.machines?.length || 0} fleet</span>
                    </div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Requires active intervention</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    criticalMachinesCount > 0
                      ? (theme === 'dark' ? 'bg-red-955/20 border-red-500/20 text-red-450' : 'bg-red-50 border-red-200 text-red-700')
                      : (theme === 'dark' ? 'bg-slate-900 border-[#1b2336] text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400')
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>

                {/* Component Expenditure Card */}
                <div className={`border rounded-xl p-5 flex items-center justify-between transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-[#0a0d16] border-[#1b2336]' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-505'
                    }`}>Component Capital</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold font-mono ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        ${totalExpenditure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Emergency procurement spent</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    theme === 'dark' ? 'bg-cyan-955/20 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                  }`}>
                    <Sliders className="w-5 h-5" />
                  </div>
                </div>

                {/* Maintenance Tickets Card */}
                <div className={`border rounded-xl p-5 flex items-center justify-between transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-[#0a0d16] border-[#1b2336]' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-505'
                    }`}>Total Tickets</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-808'}`}>
                        {fleetData?.maintenance_orders?.length || 0}
                      </span>
                    </div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>PdM orders processed</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    theme === 'dark' ? 'bg-slate-900 border-[#1b2336] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <Clipboard className="w-5 h-5" />
                  </div>
                </div>

                {/* Device Link Status Card */}
                <div className={`border rounded-xl p-5 flex items-center justify-between transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-[#0a0d16] border-[#1b2336]' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-505'
                    }`}>Device Link</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-emerald-400">ACTIVE</span>
                    </div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Linked to ID: {adminId}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    theme === 'dark' ? 'bg-emerald-955/20 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Capital Expenditure Audit Trail */}
              <div className={`border rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
                theme === 'dark' ? 'bg-[#0a0d16] border-[#1b2336]' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className={`p-5 border-b flex items-center justify-between ${
                  theme === 'dark' ? 'border-[#1b2336] bg-[#0c0f1e]' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border transition-all duration-300 ${
                      theme === 'dark' ? 'bg-cyan-955/20 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-705'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`font-bold font-mono tracking-wide text-xs ${theme === 'dark' ? 'text-white' : 'text-slate-808'}`}>Spare Components Capital Audit</h3>
                      <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-505'}`}>Transaction trail of replacement components allocated or procured</p>
                    </div>
                  </div>
                </div>

                {!fleetData?.maintenance_orders || fleetData.maintenance_orders.length === 0 ? (
                  <div className="py-12 px-6 text-center text-slate-500 text-xs">
                    No components capital transactions detected.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className={`border-b text-[10px] font-mono font-bold uppercase tracking-wider ${
                          theme === 'dark' ? 'border-[#1b2336] bg-[#0c0f1e] text-slate-400' : 'border-slate-200 bg-slate-50/50 text-slate-505'
                        }`}>
                          <th className="py-3 px-5">Ticket ID</th>
                          <th className="py-3 px-5">Target Asset</th>
                          <th className="py-3 px-5">Component Required</th>
                          <th className="py-3 px-5">Allocation Method</th>
                          <th className="py-3 px-5 text-right">Capital Cost</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#1b2336]/35' : 'divide-slate-200/55'}`}>
                        {fleetData.maintenance_orders.map(order => {
                          const machine = fleetData.machines?.find(m => m.id === order.machine_id);
                          const partId = machine?.critical_thresholds?.required_part_id || 
                                         (order.machine_id === 'MCH-001' ? 'PART-001' : 
                                          order.machine_id === 'MCH-002' ? 'PART-004' : 
                                          order.machine_id === 'MCH-003' ? 'PART-002' : null);
                          const part = fleetData.inventory?.find(p => p.part_id === partId);
                          const isSourced = order.status === 'Dispatched_Sourcing_Active' || order.status === 'Pending_Sourcing';
                          
                          let finalPrice = part?.cost || 100.00;
                          let sourcingType = "Warehouse Stock Allocation";
                          
                          if (isSourced && fleetData.graph?.links) {
                            const supplierMatch = order.root_cause?.match(/Supplier:\s*(\w+-\d+)/) || 
                                                  order.root_cause?.match(/dispatched to\s*([^\n(]+)\s*\((\w+-\d+)\)/i);
                            const supplierId = supplierMatch ? supplierMatch[2] : null;
                            const link = supplierId ? fleetData.graph.links.find(l => l.source === supplierId && l.target === partId) : null;
                            
                            if (link) {
                              finalPrice = link.price;
                              sourcingType = `Emergency Supplier: ${supplierMatch[1] || supplierId}`;
                            } else {
                              const fallbackLink = fleetData.graph.links.find(l => l.target === partId);
                              if (fallbackLink) {
                                finalPrice = fallbackLink.price;
                                sourcingType = "Emergency Supplier Procurement";
                              }
                            }
                          }

                          return (
                            <tr key={order.id} className={theme === 'dark' ? 'hover:bg-slate-900/20 text-slate-355' : 'hover:bg-slate-50 text-slate-700'}>
                              <td className="py-3 px-5 font-mono font-bold">#{order.id}</td>
                              <td className="py-3 px-5 font-mono">{order.machine_id}</td>
                              <td className="py-3 px-5">{part?.part_name || 'Component part'}</td>
                              <td className="py-3 px-5">
                                <span className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full font-bold text-[9px] uppercase border ${
                                  isSourced 
                                    ? "bg-cyan-950/40 border-cyan-808/30 text-cyan-300"
                                    : "bg-slate-955/20 border-slate-800/30 text-slate-300"
                                }`}>
                                  {sourcingType}
                                </span>
                              </td>
                              <td className="py-3 px-5 text-right font-mono font-bold text-cyan-400">
                                ${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* View 2: Received Reports & Logs */}
          {adminView === "reports" && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
              
              {/* Reports Title Banner */}
              <div className="space-y-1">
                <h2 className={`text-base font-bold font-mono uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-808'}`}>Received Reports & Logs</h2>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-505'}`}>
                  Manage device client integrations, review real-time alerts, and verify maintenance log approvals.
                </p>
              </div>

              {/* Test Report Generator Modal Form */}
              {showTestForm && (
                <div className={`border rounded-xl p-6 relative animate-fadeIn shadow-lg transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-[#0a0d16] border-[#1b2336] text-slate-350' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <h3 className={`text-xs font-bold font-mono uppercase mb-4 flex items-center gap-2 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>
                    <Cpu className="w-4 h-4 text-cyan-450" />
                    <span>Simulate Local Device Machine Report</span>
                  </h3>
                  
                  {testSuccessMsg && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-955/20 border border-emerald-900 text-emerald-305 text-xs">
                      {testSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSendTestReport} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className={`block text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-505'
                      }`}>Machine ID</label>
                      <select
                        value={testMachineId}
                        onChange={(e) => setTestMachineId(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 text-xs outline-none ${
                          theme === 'dark' ? 'bg-[#030508] border-[#1b2336] text-white' : 'bg-white border-slate-200 text-slate-808'
                        }`}
                      >
                        <option value="MCH-001">MCH-001 (Rotary Gear Pump A)</option>
                        <option value="MCH-002">MCH-002 (High-Speed Fan B)</option>
                        <option value="MCH-003">MCH-003 (Heavy-Duty Compressor C)</option>
                        <option value="Custom">Custom / Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-505'
                      }`}>Machine Status</label>
                      <select
                        value={testStatus}
                        onChange={(e) => setTestStatus(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 text-xs outline-none ${
                          theme === 'dark' ? 'bg-[#030508] border-[#1b2336] text-white' : 'bg-white border-slate-200 text-slate-808'
                        }`}
                      >
                        <option value="Operational">Operational (Healthy)</option>
                        <option value="Degraded">Degraded (Warning)</option>
                        <option value="Critical">Critical (Danger)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-4 gap-2 md:col-span-2">
                      <div>
                        <label className={`block text-[9px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-505'
                        }`}>Temp (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={testTemp}
                          onChange={(e) => setTestTemp(e.target.value)}
                          className={`w-full border rounded-lg p-2 text-xs outline-none ${
                            theme === 'dark' ? 'bg-[#030508] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-808'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[9px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-550'
                        }`}>Vib (mm/s)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={testVib}
                          onChange={(e) => setTestVib(e.target.value)}
                          className={`w-full border rounded-lg p-2 text-xs outline-none ${
                            theme === 'dark' ? 'bg-[#030508] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-808'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[9px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-550'
                        }`}>Pres (Bar)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={testPres}
                          onChange={(e) => setTestPres(e.target.value)}
                          className={`w-full border rounded-lg p-2 text-xs outline-none ${
                            theme === 'dark' ? 'bg-[#030508] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-808'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[9px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-550'
                        }`}>Current (A)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={testCur}
                          onChange={(e) => setTestCur(e.target.value)}
                          className={`w-full border rounded-lg p-2 text-xs outline-none ${
                            theme === 'dark' ? 'bg-[#030508] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-808'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <label className={`block text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-550'
                      }`}>Diagnostic Message / Log</label>
                      <input
                        type="text"
                        placeholder="e.g. Bearing temperature threshold warning. Lubricant level checks required."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 text-xs outline-none ${
                          theme === 'dark' ? 'bg-[#030508] border-[#1b2336] text-white focus:border-cyan-500' : 'bg-white border-slate-202 text-slate-808'
                        }`}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        type="submit"
                        disabled={submittingTest}
                        className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono uppercase font-bold rounded-lg transition-colors border-0"
                      >
                        {submittingTest ? "Sending..." : "Submit Test"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTestForm(false)}
                        className={`py-2.5 px-3 border text-xs font-mono uppercase font-bold rounded-lg transition-colors ${
                          theme === 'dark' 
                            ? 'bg-slate-900 border-[#1b2336] text-slate-400 hover:text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Reports Panel */}
              <div className={`border rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-[#0a0d16] border-[#1b2336]' 
                  : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {/* Panel Header */}
                <div className={`p-5 border-b flex items-center justify-between transition-colors duration-300 ${
                  theme === 'dark' ? 'border-[#1b2336] bg-[#0c0f1e]' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border transition-all duration-300 ${
                      theme === 'dark' ? 'bg-cyan-955/20 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-705'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold font-mono tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-808'}`}>Received Reports & Logs</h3>
                      <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Real-time alerts submitted by devices linked to this tower</p>
                    </div>
                  </div>

                  <button
                    onClick={fetchReports}
                    className={`p-2 border rounded-lg transition-all flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold ${
                      theme === 'dark' 
                        ? 'hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white' 
                        : 'hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className={`flex border-b text-xs font-mono font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'border-[#1b2336] bg-[#080b12]' : 'border-slate-200 bg-slate-50/30'
                }`}>
                  <button
                    onClick={() => setActiveTab("approved")}
                    className={`px-6 py-3 border-b-2 transition-all ${
                      activeTab === "approved"
                        ? (theme === 'dark' ? 'border-cyan-500 text-cyan-400 bg-cyan-955/10' : 'border-cyan-600 text-cyan-700 bg-cyan-50/30')
                        : (theme === 'dark' ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30')
                    }`}
                  >
                    Approved Logs ({approvedReports.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`px-6 py-3 border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === "notifications"
                        ? (theme === 'dark' ? 'border-cyan-500 text-cyan-400 bg-cyan-955/10' : 'border-cyan-600 text-cyan-700 bg-cyan-50/30')
                        : (theme === 'dark' ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30')
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Notifications</span>
                    {pendingReports.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-cyan-500 text-black animate-pulse">
                        {pendingReports.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Table Container */}
                {displayedReports.length === 0 ? (
                  activeTab === "approved" ? (
                    <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-600">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-808'}`}>No approved reports yet</p>
                        <p className={`text-xs max-w-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Incoming reports from device clients or IoT sensors first land in the Notifications tab for admin evaluation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-600">
                        <Bell className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-808'}`}>No pending notifications</p>
                        <p className={`text-xs max-w-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          All machinery telemetry logs are up-to-date and approved. System is running healthy.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className={`border-b text-[10px] font-mono font-bold uppercase tracking-wider transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'border-[#1b2336] bg-[#0c0f1e] text-slate-400' 
                            : 'border-slate-200 bg-slate-50/50 text-slate-505'
                        }`}>
                          <th className="py-4 px-6">Timestamp</th>
                          <th className="py-4 px-6">Machine ID</th>
                          <th className="py-4 px-6">Alert Level</th>
                          <th className="py-4 px-6">Telemetry readings</th>
                          <th className="py-4 px-6">Log details / Message</th>
                          {activeTab === "notifications" && <th className="py-4 px-6 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-xs ${
                        theme === 'dark' ? 'divide-[#1b2336]/35' : 'divide-slate-200/55'
                      }`}>
                        {displayedReports.map((report) => (
                          <tr key={report.id} className={`transition-colors duration-300 ${
                            theme === 'dark' ? 'hover:bg-slate-900/20 text-slate-350' : 'hover:bg-slate-50 text-slate-700'
                          }`}>
                            <td className={`py-4 px-6 font-mono whitespace-nowrap ${
                              theme === 'dark' ? 'text-slate-450' : 'text-slate-500'
                            }`}>
                              {new Date(report.created_at).toLocaleString()}
                            </td>
                            <td className={`py-4 px-6 font-bold font-mono whitespace-nowrap ${
                              theme === 'dark' ? 'text-white' : 'text-slate-808'
                            }`}>
                              <span className="flex items-center gap-2">
                                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                {report.machine_id}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full font-bold text-[10px] uppercase border ${
                                report.status === "Critical" 
                                  ? "bg-red-955/20 border-red-900/30 text-red-400"
                                  : report.status === "Degraded"
                                  ? "bg-amber-955/20 border-amber-900/30 text-amber-400"
                                  : "bg-emerald-955/20 border-emerald-900/30 text-emerald-450"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  report.status === "Critical" ? "bg-red-500" : report.status === "Degraded" ? "bg-amber-500" : "bg-emerald-500"
                                }`}></span>
                                {report.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className={`flex items-center gap-3 font-mono text-[11px] ${
                                theme === 'dark' ? 'text-slate-450' : 'text-slate-550'
                              }`}>
                                {report.temperature && <span>T: <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-705'}>{report.temperature}°C</strong></span>}
                                {report.vibration && <span>V: <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-705'}>{report.vibration}mm/s</strong></span>}
                                {report.pressure && <span>P: <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-705'}>{report.pressure}Bar</strong></span>}
                                {report.current && <span>I: <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-705'}>{report.current}A</strong></span>}
                              </div>
                            </td>
                            <td className={`py-4 px-6 font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              {report.message || <span className="text-slate-500 italic">No message provided</span>}
                            </td>
                            {activeTab === "notifications" && (
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleApproveReport(report.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-650 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold tracking-wider uppercase transition-colors active:scale-95 shadow-sm border-0"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
