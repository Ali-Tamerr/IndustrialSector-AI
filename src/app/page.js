"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Navbar from "@/app/_components/Navbar";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  AlertTriangle, 
  Terminal, 
  Cpu, 
  RefreshCw, 
  Clipboard,
  ExternalLink,
  CheckCircle,
  FileText,
  Bell,
  LayoutGrid,
  Sliders
} from "lucide-react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState("ADM-8A9F");
  const [fleetData, setFleetData] = useState(null);

  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  // Sync Google session with local state variables
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setIsLoggedIn(true);
      if (session.user.adminId) setAdminId(session.user.adminId);
      if (session.user.email) setEmail(session.user.email);
      if (session.user.name) setName(session.user.name);
      if (session.user.image) setImage(session.user.image);
    } else if (status === "unauthenticated") {
      setIsLoggedIn(false);
    }
  }, [session, status]);
  
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("approved"); // approved or notifications
  const [adminView, setAdminView] = useState("dashboard"); // dashboard or reports
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleLogout = () => {
    signOut();
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

  if (status === "loading") {
    return (
      <div className={`relative min-h-screen flex flex-col items-center justify-center font-mono transition-colors duration-300 overflow-hidden ${
        theme === 'dark' ? 'bg-[#030508] text-cyan-400' : 'bg-[#f8fafc] text-cyan-600'
      }`}>
        {/* Prismatic Background Grid */}
        <div className={`absolute inset-0 bg-[linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px),linear-gradient(90deg,${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none`}></div>
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-t-cyan-500 animate-spin"></div>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] animate-pulse">Verifying Session...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={`relative min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-300 overflow-hidden ${
        theme === 'dark' ? 'bg-[#030508] text-slate-205' : 'bg-[#f8fafc] text-slate-800'
      }`}>
        
        {/* Prismatic Background Grid */}
        <div className={`absolute inset-0 bg-[linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px),linear-gradient(90deg,${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none`}></div>

        {/* Glow Mesh Spheres */}
        <div className={`absolute top-[-10%] left-[-10%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-purple-600/[0.04]' : 'bg-purple-400/[0.05]'} rounded-full blur-[130px] pointer-events-none`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-cyan-500/[0.04]' : 'bg-cyan-400/[0.05]'} rounded-full blur-[130px] pointer-events-none`}></div>

        {/* Clean, editorial-style Login Panel */}
        <div className={`relative w-full max-w-md border rounded-xl overflow-hidden shadow-sm transition-all duration-300 z-10 ${
          theme === 'dark' 
            ? 'bg-[#0c0f17] border-[#182030]' 
            : 'bg-white border-slate-200'
        }`}>
          
          {/* Card Header (solid color, clean typography) */}
          <div className={`px-8 py-6 border-b flex items-center gap-4 ${
            theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
            }`}>
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className={`text-base font-bold font-mono tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-905'
              }`}>Control Tower Admin</h1>
              <p className={`text-[11px] font-sans font-normal mt-0.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>Industrial Machine Reports Portal</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-202 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => signIn("google")}
                className="w-full py-3.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-md border-0"
              >
                {/* Google Icon SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>

            <div className={`pt-4 border-t ${theme === 'dark' ? 'border-[#182030]' : 'border-slate-150'}`}>
              <div className={`space-y-1.5 text-[10px] font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <p>• Only authorized Google Accounts are allowed access.</p>
                <p>• Sourced admin account profiles will be synchronized automatically.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Floating back-and-forth toggle button in the bottom-left corner */}
        <div className="fixed bottom-6 right-6 z-[9999]">
          <Link
            href="/c-home"
            className={`px-5 h-10 rounded-full border transition-all duration-300 flex items-center justify-center font-mono font-bold text-sm hover:scale-110 ${
              theme === 'dark'
                ? 'bg-black/80 border-slate-200 text-slate-200 hover:text-cyan-600 hover:border-cyan-300 shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                : 'bg-black/80 border-slate-200 text-slate-700 hover:text-cyan-600 hover:border-cyan-300 shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
            }`}
            title="Go to Machine Workspaces Page"
          >
            Machine Workspaces
          </Link>
        </div>

      </div>
    );
  }

  const pendingReports = reports.filter(r => !r.approved);
  const approvedReports = reports.filter(r => r.approved);
  const displayedReports = activeTab === "approved" ? approvedReports : pendingReports;

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none transition-colors duration-300 relative overflow-hidden ${
      theme === 'dark' ? 'bg-[#030508] text-slate-350' : 'bg-[#f8fafc] text-slate-700'
    }`}>
      
      {/* Prismatic Background Grid */}
      <div className={`absolute inset-0 bg-[linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px),linear-gradient(90deg,${theme === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.015)'}_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none`}></div>
      
      {/* Glow Mesh Spheres */}
      <div className={`absolute top-[-10%] left-[-10%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-purple-600/[0.04]' : 'bg-purple-400/[0.05]'} rounded-full blur-[130px] pointer-events-none`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] ${theme === 'dark' ? 'bg-cyan-500/[0.04]' : 'bg-cyan-400/[0.05]'} rounded-full blur-[130px] pointer-events-none`}></div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] ${theme === 'dark' ? 'bg-blue-600/[0.02]' : 'bg-blue-500/[0.03]'} rounded-full blur-[150px] pointer-events-none`}></div>
      <Navbar
        pageType="admin"
        theme={theme}
        toggleTheme={toggleTheme}
        setShowTestForm={setShowTestForm}
        showUserDropdown={showUserDropdown}
        setShowUserDropdown={setShowUserDropdown}
        handleLogout={handleLogout}
        image={image}
        name={name}
        email={email}
        adminId={adminId}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Sidebar + Main Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* Sidebar */}
        <aside className={`w-full ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} border-b md:border-b-0 md:border-r shrink-0 transition-all duration-300 ${
          theme === 'dark' ? 'bg-[#0c0f17] border-[#182030]' : 'bg-slate-50 border-slate-200'
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
                className={`p-1.5 rounded border transition-all active:scale-95 ${
                  theme === 'dark' 
                    ? 'border-[#182030] bg-[#182030]/50 hover:bg-[#182030] text-slate-400 hover:text-white' 
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
                className={`w-full flex items-center rounded text-xs font-mono uppercase tracking-wider font-semibold transition-all text-left ${
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                } ${
                  adminView === "dashboard"
                    ? (theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm')
                    : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
                }`}
                title={sidebarCollapsed ? "Admin Dashboard" : ""}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Admin Dashboard</span>}
              </button>

              <button
                onClick={() => setAdminView("reports")}
                className={`w-full relative flex items-center rounded text-xs font-mono uppercase tracking-wider font-semibold transition-all text-left ${
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                } ${
                  adminView === "reports"
                    ? (theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm')
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

              <Link
                href="/c-home"
                className={`w-full flex items-center rounded text-xs font-mono uppercase tracking-wider font-semibold transition-all text-left ${
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                } ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
                title={sidebarCollapsed ? "Machine Control Page" : ""}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Machine Control Page</span>}
              </Link>
            </nav>

            {/* Admin Info Summary inside Sidebar */}
            <div className={`pt-4 border-t ${theme === 'dark' ? 'border-[#1b2336]/60' : 'border-slate-200'}`}>
              {sidebarCollapsed ? (
                <div className="flex justify-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center relative ${
                    theme === 'dark' ? 'bg-[#090d15]/40 border-[#1b2336]/40' : 'bg-white border-slate-200 shadow-sm'
                  }`} title={`Admin ID: ${adminId}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                </div>
              ) : (
                <div className={`p-3.5 rounded-lg border text-left space-y-2 ${
                  theme === 'dark' ? 'bg-[#090d15]/40 border-[#1b2336]/40' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <span className={`text-[9px] font-bold font-mono uppercase tracking-wider block ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}>Admin ID</span>
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
                    ? 'bg-[#0c0f17] border-[#182030]' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>Critical Assets</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold font-mono ${
                        criticalMachinesCount > 0
                          ? (theme === 'dark' ? 'text-red-400' : 'text-red-650')
                          : (theme === 'dark' ? 'text-white' : 'text-slate-800')
                      }`}>
                        {criticalMachinesCount}
                      </span>
                      <span className={`text-[10px] font-medium font-sans ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>/ {fleetData?.machines?.length || 0} fleet</span>
                    </div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Requires active intervention</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    criticalMachinesCount > 0
                      ? (theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700')
                      : (theme === 'dark' ? 'bg-[#182030]/50 border-[#182030] text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400')
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>

                {/* Component Expenditure Card */}
                <div className={`border rounded-xl p-5 flex items-center justify-between transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-[#0c0f17] border-[#182030]' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>Component Capital</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold font-mono ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-605'}`}>
                        ${totalExpenditure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Emergency procurement spent</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                  }`}>
                    <Sliders className="w-5 h-5" />
                  </div>
                </div>

                {/* Maintenance Tickets Card */}
                <div className={`border rounded-xl p-5 flex items-center justify-between transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-[#0c0f17] border-[#182030]' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>Total Tickets</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        {fleetData?.maintenance_orders?.length || 0}
                      </span>
                    </div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>PdM orders processed</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    theme === 'dark' ? 'bg-[#182030]/50 border-[#182030] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-505'
                  }`}>
                    <Clipboard className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Capital Expenditure Audit Trail */}
              <div className={`border rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
                theme === 'dark' ? 'bg-[#0c0f17] border-[#182030]' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className={`p-5 border-b flex items-center justify-between ${
                  theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded border transition-all duration-300 ${
                      theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
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
                          theme === 'dark' ? 'border-[#182030] bg-[#0c0f17] text-slate-400' : 'border-slate-200 bg-slate-50/50 text-slate-500'
                        }`}>
                          <th className="py-3 px-5">Order ID</th>
                          <th className="py-3 px-5">Machine ID</th>
                          <th className="py-3 px-5">Component Required</th>
                          <th className="py-3 px-5">Allocation Method</th>
                          <th className="py-3 px-5 text-right">Capital Cost</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#182030]/50' : 'divide-slate-200/55'}`}>
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
                            <tr key={order.id} className={theme === 'dark' ? 'hover:bg-slate-900/20 text-slate-350' : 'hover:bg-slate-50 text-slate-700'}>
                              <td className="py-3 px-5 font-mono font-bold">#{order.id}</td>
                              <td className="py-3 px-5 font-mono">{order.machine_id}</td>
                              <td className="py-3 px-5">{part?.part_name || 'Component part'}</td>
                              <td className="py-3 px-5">
                                <span className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full font-bold text-[9px] uppercase border ${
                                  isSourced 
                                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-350"
                                    : "bg-slate-500/10 border-slate-500/20 text-slate-300"
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
                         {/* Test Report Generator Modal Form */}
              {showTestForm && (
                <div className={`border rounded-xl p-6 relative animate-fadeIn shadow-lg transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-[#0c0f17] border-[#182030] text-slate-350' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <h3 className={`text-xs font-bold font-mono uppercase mb-4 flex items-center gap-2 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-805'
                  }`}>
                    <Cpu className="w-4 h-4 text-cyan-450 animate-pulse" />
                    <span>Simulate Local Device Machine Report</span>
                  </h3>
                  
                  {testSuccessMsg && (
                    <div className="mb-4 p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                      {testSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSendTestReport} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className={`block text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>Machine ID</label>
                      <select
                        value={testMachineId}
                        onChange={(e) => setTestMachineId(e.target.value)}
                        className={`w-full border rounded p-2.5 text-xs outline-none transition-all duration-300 ${
                          theme === 'dark' ? 'bg-[#030508] border-[#182030] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>Machine Status</label>
                      <select
                        value={testStatus}
                        onChange={(e) => setTestStatus(e.target.value)}
                        className={`w-full border rounded p-2.5 text-xs outline-none transition-all duration-300 ${
                          theme === 'dark' ? 'bg-[#030508] border-[#182030] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
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
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>Temp (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={testTemp}
                          onChange={(e) => setTestTemp(e.target.value)}
                          className={`w-full border rounded p-2 text-xs outline-none transition-all duration-300 ${
                            theme === 'dark' ? 'bg-[#030508] border-[#182030] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[9px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>Vib (mm/s)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={testVib}
                          onChange={(e) => setTestVib(e.target.value)}
                          className={`w-full border rounded p-2 text-xs outline-none transition-all duration-300 ${
                            theme === 'dark' ? 'bg-[#030508] border-[#182030] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[9px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>Pres (Bar)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={testPres}
                          onChange={(e) => setTestPres(e.target.value)}
                          className={`w-full border rounded p-2 text-xs outline-none transition-all duration-300 ${
                            theme === 'dark' ? 'bg-[#030508] border-[#182030] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[9px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>Current (A)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={testCur}
                          onChange={(e) => setTestCur(e.target.value)}
                          className={`w-full border rounded p-2 text-xs outline-none transition-all duration-300 ${
                            theme === 'dark' ? 'bg-[#030508] border-[#182030] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <label className={`block text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>Diagnostic Message / Log</label>
                      <input
                        type="text"
                        placeholder="e.g. Bearing temperature threshold warning. Lubricant level checks required."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        className={`w-full border rounded p-2.5 text-xs outline-none transition-all duration-300 ${
                          theme === 'dark' ? 'bg-[#030508] border-[#182030] text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        type="submit"
                        disabled={submittingTest}
                        className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono uppercase font-bold rounded transition-colors border-0"
                      >
                        {submittingTest ? "Sending..." : "Submit Test"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTestForm(false)}
                        className={`py-2.5 px-3 border text-xs font-mono uppercase font-bold rounded transition-colors ${
                          theme === 'dark' 
                            ? 'bg-slate-900 border-[#182030] text-slate-400 hover:text-white' 
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
                  ? 'bg-[#0c0f17] border-[#182030]' 
                  : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {/* Panel Header */}
                <div className={`p-5 border-b flex items-center justify-between transition-colors duration-300 ${
                  theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded border transition-all duration-300 ${
                      theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold font-mono tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Received Reports & Logs</h3>
                      <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Real-time alerts submitted by devices linked to this tower</p>
                    </div>
                  </div>

                  <button
                    onClick={fetchReports}
                    className={`p-2 border rounded transition-all flex items-center gap-1.5 text-[11px] font-mono uppercase font-semibold ${
                      theme === 'dark' 
                        ? 'bg-slate-900 border-[#182030] text-slate-400 hover:text-white hover:bg-slate-800' 
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className={`flex border-b text-xs font-mono font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]/50' : 'border-slate-200 bg-slate-50/30'
                }`}>
                  <button
                    onClick={() => setActiveTab("approved")}
                    className={`px-6 py-3 border-b-2 transition-all ${
                      activeTab === "approved"
                        ? (theme === 'dark' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-blue-600 text-blue-700 bg-blue-50/30')
                        : (theme === 'dark' ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30')
                    }`}
                  >
                    Approved Logs ({approvedReports.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`px-6 py-3 border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === "notifications"
                        ? (theme === 'dark' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-blue-600 text-blue-700 bg-blue-50/30')
                        : (theme === 'dark' ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30')
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Notifications</span>
                    {pendingReports.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-blue-500 text-black animate-pulse">
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
                            ? 'border-[#182030] bg-[#0c0f17] text-slate-400' 
                            : 'border-slate-200 bg-slate-50/50 text-slate-500'
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
                        theme === 'dark' ? 'divide-[#182030]/50' : 'divide-slate-200/55'
                      }`}>
                        {displayedReports.map((report) => (
                          <tr key={report.id} className={`transition-colors duration-300 ${
                            theme === 'dark' ? 'hover:bg-slate-900/20 text-slate-350' : 'hover:bg-slate-50 text-slate-700'
                          }`}>
                            <td className={`py-4 px-6 font-mono whitespace-nowrap ${
                              theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
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
                              <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded font-bold text-[10px] uppercase border ${
                                report.status === "Critical" 
                                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                                  : report.status === "Degraded"
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  report.status === "Critical" ? "bg-red-500" : report.status === "Degraded" ? "bg-amber-500" : "bg-emerald-500"
                                }`}></span>
                                {report.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className={`flex items-center gap-3 font-mono text-[11px] ${
                                theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                              }`}>
                                {report.temperature && <span>T: <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-707'}>{report.temperature}°C</strong></span>}
                                {report.vibration && <span>V: <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-707'}>{report.vibration}mm/s</strong></span>}
                                {report.pressure && <span>P: <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-707'}>{report.pressure}Bar</strong></span>}
                                {report.current && <span>I: <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-707'}>{report.current}A</strong></span>}
                              </div>
                            </td>
                            <td className={`py-4 px-6 font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              {report.message || <span className="text-slate-500 italic">No message provided</span>}
                            </td>
                            {activeTab === "notifications" && (
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleApproveReport(report.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-semibold tracking-wider uppercase transition-colors active:scale-95 shadow-sm border-0"
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
