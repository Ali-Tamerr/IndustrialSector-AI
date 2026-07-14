"use client";

import { useRouter } from "next/navigation";
import { 
  X, 
  Cpu, 
  HelpCircle, 
  ShieldCheck, 
  Sliders, 
  LayoutGrid, 
  Settings, 
  Play, 
  ChevronDown, 
  PlusCircle,
  User,
  Sun,
  Moon,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/app/_components/ToastContext";

export default function Sidebar({
  isOpen,
  onClose,
  theme,
  toggleTheme,
  pageType = "dashboard",
  
  // Dashboard props
  notificationPermission,
  requestNotificationPermission,
  setTutorialStep,
  setShowTutorial,
  updateTabActiveProject,
  setShowLogPopup,
  setEditorMachines,
  setEditorInventory,
  setEditorNodes,
  setEditorEdges,
  setShowEditor,
  data,
  simulating,
  mobileSimDropdownOpen,
  setMobileSimDropdownOpen,
  handleSimulation,

  // Admin props
  setShowTestForm,

  // User auth details
  userImage,
  userName,
  userEmail,
  isLoggedIn,
  signOut
}) {
  const router = useRouter();
  const { showConfirm } = useToast();

  return (
    <>
      {/* Slide-out Left Sidebar overlay */}
      <div 
        className={`fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-out Left Sidebar Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 border-r shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          theme === 'dark' 
            ? 'bg-[#0c0f17] border-[#182030] text-white' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${
          theme === 'dark' ? 'border-[#182030]' : 'border-slate-100'
        }`}>
          {/* <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span className="font-mono text-xs font-bold tracking-widest text-slate-400">CONTROL CENTER</span>
          </div> */}
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-slate-900 border-[#182030] text-slate-400 hover:bg-slate-800 hover:text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pageType === "dashboard" ? (
            <div className="flex flex-col space-y-3.5">
              {notificationPermission !== "granted" && (
                <button
                  onClick={() => {
                    requestNotificationPermission();
                    onClose();
                  }}
                  className="w-full px-3 py-3 font-mono text-xs font-bold rounded bg-amber-500 hover:bg-amber-600 text-slate-955 flex items-center justify-center space-x-1.5 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                >
                  <span>🔔 Enable System Notifications</span>
                </button>
              )}

              <button
                onClick={() => { 
                  setTutorialStep(0); 
                  setShowTutorial(true); 
                  onClose();
                }}
                className={`w-full px-3 py-3 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                    : 'bg-blue-50 text-blue-600 border-blue-200/80 hover:bg-blue-600 hover:text-white shadow-sm'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Dashboard Tour</span>
              </button>

              <Link
                href="/admin"
                onClick={onClose}
                className={`w-full px-3 py-3 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200/85 hover:bg-indigo-600 hover:text-white shadow-sm'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Portal</span>
              </Link>

              <Link
                href="/device"
                onClick={onClose}
                className={`w-full px-3 py-3 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                    : 'bg-emerald-50 text-indigo-700 border-emerald-202/85 hover:bg-emerald-600 hover:text-white shadow-sm'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Send to Admin</span>
              </Link>

              <button
                onClick={() => {
                  onClose();
                  showConfirm("Return to Projects Portal? Current database setup will remain active until you launch another fleet config.", () => {
                    updateTabActiveProject(null);
                    router.push("/");
                  });
                }}
                className={`w-full px-3 py-3 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-cyan-955/20 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600 hover:text-white'
                    : 'bg-cyan-50 text-cyan-700 border-cyan-200/85 hover:bg-cyan-600 hover:text-white shadow-sm'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Workflows Page</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  setShowLogPopup(prev => !prev);
                }}
                className={`w-full px-3 py-3 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-blue-955/20 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                    : 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-600 hover:text-white shadow-sm'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Agent Execution Log</span>
              </button>

              {/* <button
                onClick={() => {
                  setEditorMachines(data?.machines ? JSON.parse(JSON.stringify(data.machines)) : []);
                  setEditorInventory(data?.inventory ? JSON.parse(JSON.stringify(data.inventory)) : []);
                  setEditorNodes(data?.graph?.nodes ? JSON.parse(JSON.stringify(data.graph.nodes)) : []);
                  setEditorEdges(data?.graph?.links ? JSON.parse(JSON.stringify(data.graph.links)) : []);
                  setShowEditor(true);
                  onClose();
                }}
                className={`w-full px-3 py-3 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600 hover:text-white'
                    : 'bg-white text-cyan-700 border-cyan-200/80 hover:bg-cyan-600 hover:text-white shadow-sm'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configure Fleet & Graph</span>
              </button> */}

              {/* Failure Simulator section in sidebar */}
              <div className="pt-2 border-t border-slate-200/10">
                <button
                  id="simulator-btn"
                  onClick={() => {
                    if (!simulating) setMobileSimDropdownOpen(!mobileSimDropdownOpen);
                  }}
                  disabled={simulating}
                  className={`w-full px-4 py-3 font-mono text-xs font-semibold rounded border transition-all duration-305 flex items-center justify-center space-x-2 ${
                    simulating
                      ? "bg-slate-900 text-slate-555 border-slate-800 cursor-not-allowed"
                      : (theme === 'dark'
                          ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white"
                          : "bg-red-50 text-red-600 border-red-200/80 hover:bg-red-600 hover:text-white shadow-sm")
                  }`}
                >
                  <Play className={`w-4 h-4 ${simulating ? "animate-spin" : ""}`} />
                  <span>{simulating ? "PROCESSING AGENTS..." : "Simulate Failure"}</span>
                  {!simulating && <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                </button>
                
                {mobileSimDropdownOpen && !simulating && (
                  <div className={`mt-2 max-h-56 overflow-y-auto rounded-lg border text-left ${
                    theme === 'dark' ? 'bg-[#182030] border-[#2b3548]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`text-[9px] font-mono tracking-widest uppercase px-3 py-2 border-b ${
                      theme === 'dark' ? 'text-slate-500 border-[#2b3548]' : 'text-slate-500 border-slate-200'
                    }`}>
                      Select Machine:
                    </div>
                    <ul>
                      {data?.machines?.map(machine => (
                        <li 
                          key={machine.id}
                          onClick={() => {
                            onClose();
                            setMobileSimDropdownOpen(false);
                            handleSimulation(machine.id);
                          }}
                          className={`flex justify-between items-center px-3 py-2.5 cursor-pointer text-xs transition-colors border-b last:border-b-0 ${
                            theme === 'dark' 
                              ? 'border-[#2b3548]/50 hover:bg-[#202a3d] text-slate-300' 
                              : 'border-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="font-medium truncate max-w-[170px]">{machine.name}</span>
                          <span className="font-mono text-[9px] text-slate-500">{machine.id}</span>
                        </li>
                      ))}
                      {(!data?.machines || data?.machines?.length === 0) && (
                        <li className="px-3 py-4 text-center text-xs text-slate-400">
                          No machines available
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-3.5">
              <button
                onClick={() => {
                  setShowTestForm(true);
                  onClose();
                }}
                className={`w-full px-3 py-3 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                    : 'bg-blue-50 text-blue-600 border-blue-200/80 hover:bg-blue-600 hover:text-white shadow-sm'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simulate IoT Failure</span>
              </button>

              <Link
                href="/dashboard"
                onClick={onClose}
                className={`w-full px-3 py-3 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-indigo-955/20 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white'
                    : 'bg-indigo-50 text-indigo-750 border-indigo-200/85 hover:bg-indigo-600 hover:text-white shadow-sm'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Live Fleet Control</span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${theme === 'dark' ? 'border-[#182030]' : 'border-slate-100'}`}>
          {/* <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">System Active</span> */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-slate-900 border-[#182030] text-yellow-400 hover:bg-slate-800'
                : 'bg-slate-50 border-slate-200 text-indigo-605 hover:bg-slate-200'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
