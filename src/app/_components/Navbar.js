"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  Activity,
  Cpu, 
  HelpCircle, 
  ShieldCheck, 
  Sliders, 
  LayoutGrid, 
  Settings, 
  Play, 
  ChevronDown, 
  Sun, 
  Moon, 
  Menu, 
  X,
  ArrowLeft,
  PlusCircle,
  User,
  LogOut,
  LogIn
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/app/_components/ToastContext";
import Sidebar from "@/app/_components/Sidebar";

export default function Navbar({
  pageType = "dashboard", // "dashboard" | "admin"
  theme,
  toggleTheme,
  
  // Dashboard-specific props
  activeProject,
  handleRenameProject,
  notificationPermission,
  requestNotificationPermission,
  setShowTutorial,
  setTutorialStep,
  updateTabActiveProject,
  setEditorMachines,
  setEditorInventory,
  setEditorNodes,
  setEditorEdges,
  setShowEditor,
  data,
  simulating,
  handleSimulation,
  simulatorDropdownOpen,
  setSimulatorDropdownOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  mobileSimDropdownOpen,
  setMobileSimDropdownOpen,
  setShowLogPopup,

  // Admin-specific props
  setShowTestForm
}) {
  const { showConfirm, showToast } = useToast();
  const { data: session, status } = useSession();
  const [localShowUserDropdown, setLocalShowUserDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userImage = session?.user?.image || "";
  const userName = session?.user?.name || "";
  const userEmail = session?.user?.email || "";
  const userAdminId = session?.user?.adminId || "";
  const isLoggedIn = status === "authenticated";

  return (
    <>
      <header className={`border-b ${
        theme === 'dark' 
          ? 'border-[#182030] bg-[#0c0f17]/95 text-white' 
          : 'border-slate-200 bg-white/90 shadow-[0_2px_15px_rgba(0,0,0,0.02)] text-slate-800'
      } px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md transition-all duration-300`}>
        
        {/* Brand / Left Section */}
        <div className="flex items-center space-x-4 flex-1 min-w-0 mr-4">
          {(pageType === "dashboard" || pageType === "admin") && (
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-2 rounded-lg border transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                theme === 'dark'
                  ? 'bg-slate-900 border-[#182030] text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm'
              }`}
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {pageType === "dashboard" ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={activeProject?.name || ""}
                  onChange={(e) => handleRenameProject(activeProject?.id, e.target.value)}
                  className={`bg-transparent border-b border-transparent hover:border-slate-500 focus:border-transparent focus:outline-none font-mono text-[16px] font-extrabold tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-855'} transition-all w-full`}
                  placeholder="Unnamed Project"
                />
                {/* <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'} border`}>
                  {activeProject?.type === "template" ? `${activeProject?.templateId?.toUpperCase()}_TEMPLATE` : "CUSTOM_FLEET"}
                </span>
                {typeof window !== "undefined" && window.__TAURI__ && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'} border animate-pulse`}>
                    DESKTOP_SYNC
                  </span>
                )} */}
              </div>
              {/* <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} font-mono tracking-widest uppercase hidden sm:block`}>
                Predictive Maintenance & Supply Chain Sourcing Graph
              </p> */}
            </div>
          ) : (
            <>
              <div className="flex items-center">
                <img 
                  src={theme === 'dark' ? '/ISAI logo white.png' : '/ISAI logo black.png'} 
                  alt="ISAI Logo" 
                  className="h-7 w-auto object-contain mr-1"
                />
              </div>
              <div>
                <h1 className={`text-[16px] font-mono font-extrabold tracking-wider ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>Control Tower</h1>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className={`text-[10px] font-mono tracking-widest uppercase ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}>Predictive Maintenance & Reports Admin</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Actions Section */}
        <div className="flex items-center space-x-3.5">
          {pageType === "dashboard" && (
            <>
              <Link
                href="/device"
                className={`px-3.5 py-2 font-mono text-xs font-semibold rounded-xl border transition-all duration-300 flex items-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                    : 'bg-emerald-50 text-indigo-700 border-emerald-202/85 hover:bg-emerald-600 hover:text-white shadow-sm'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Send to Admin</span>
              </Link>
              
              <Link
                href="/sourcing-test"
                className={`px-3.5 py-2 font-mono text-xs font-semibold rounded-xl border transition-all duration-300 flex items-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-slate-900/60 border-slate-800 text-slate-350 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Sourcing Test</span>
              </Link>
            </>
          )}
          {/* {pageType === "dashboard" && (
            <div className="flex flex-col text-right font-mono text-[10px] mr-2">
              <span className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>FLEET PERFORMANCE</span>
              <span className={`${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} font-bold tracking-widest`}>99.78% RESILIENT</span>
            </div>
          )} */}

          {/* Direct Theme Toggle button */}
          {/* <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-slate-950/40 border-slate-800 text-yellow-400 hover:bg-slate-900 hover:text-yellow-300 hover:scale-105 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-55 hover:text-indigo-705 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:scale-105'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button> */}
        </div>
      </header>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        pageType={pageType}
        notificationPermission={notificationPermission}
        requestNotificationPermission={requestNotificationPermission}
        setTutorialStep={setTutorialStep}
        setShowTutorial={setShowTutorial}
        updateTabActiveProject={updateTabActiveProject}
        setShowLogPopup={setShowLogPopup}
        setEditorMachines={setEditorMachines}
        setEditorInventory={setEditorInventory}
        setEditorNodes={setEditorNodes}
        setEditorEdges={setEditorEdges}
        setShowEditor={setShowEditor}
        data={data}
        simulating={simulating}
        mobileSimDropdownOpen={mobileSimDropdownOpen}
        setMobileSimDropdownOpen={setMobileSimDropdownOpen}
        handleSimulation={handleSimulation}
        setShowTestForm={setShowTestForm}
        userImage={userImage}
        userName={userName}
        userEmail={userEmail}
        isLoggedIn={isLoggedIn}
        signOut={signOut}
      />
    </>
  );
}
