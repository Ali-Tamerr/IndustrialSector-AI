"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
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
        <div className="flex items-center space-x-4">
          {(pageType === "dashboard" || pageType === "admin") && (
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-2 rounded-lg border transition-all duration-300 flex items-center justify-center ${
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
            <>
              <div className="flex items-center">
                <img 
                  src={theme === 'dark' ? '/ISAI logo white.png' : '/ISAI logo black.png'} 
                  alt="ISAI Logo" 
                  className="h-7 w-auto object-contain mr-1"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeProject?.name || ""}
                    onChange={(e) => handleRenameProject(activeProject?.id, e.target.value)}
                    className={`bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-500 outline-none font-mono text-[16px] font-extrabold tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-855'} transition-all w-full max-w-[180px] sm:max-w-[240px] md:max-w-[320px]`}
                    placeholder="Unnamed Project"
                  />
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'} border`}>
                    {activeProject?.type === "template" ? `${activeProject?.templateId?.toUpperCase()}_TEMPLATE` : "CUSTOM_FLEET"}
                  </span>
                  {typeof window !== "undefined" && window.__TAURI__ && (
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'} border animate-pulse`}>
                      DESKTOP_SYNC
                    </span>
                  )}
                </div>
                <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} font-mono tracking-widest uppercase hidden sm:block`}>
                  Predictive Maintenance & Supply Chain Sourcing Graph
                </p>
              </div>
            </>
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
            <div className="hidden lg:flex flex-col text-right font-mono text-[10px] mr-2">
              <span className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>FLEET PERFORMANCE</span>
              <span className={`${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} font-bold tracking-widest`}>99.78% RESILIENT</span>
            </div>
          )}

          {/* Unified Profile / Account Dropdown always visible */}
          <div className="relative">
            <button
              onClick={() => setLocalShowUserDropdown(!localShowUserDropdown)}
              className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-305 flex items-center space-x-1.5 active:scale-95 ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-[#182030] text-slate-300 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {userImage ? (
                <img 
                  src={userImage} 
                  alt={userName || "User"} 
                  className="w-4 h-4 rounded-full object-cover border border-cyan-500/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{userName || userEmail || userAdminId || "Guest"}</span>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-305 ${localShowUserDropdown ? 'rotate-180' : ''}`} />
            </button>

            {localShowUserDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLocalShowUserDropdown(false)} />
                <div className={`absolute right-0 mt-2 w-48 rounded border shadow-xl z-50 transition-all duration-300 animate-fadeIn ${
                  theme === 'dark' 
                    ? 'bg-[#0c0f17] border-[#182030] text-slate-300' 
                    : 'bg-white border-slate-200 text-slate-705'
                }`}>
                  <div className="p-1.5 space-y-1">
                    
                    {/* Theme Toggle option inside dropdown */}
                    <button
                      onClick={() => {
                        toggleTheme();
                        setLocalShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 py-2 px-3 text-[11px] font-mono uppercase font-bold rounded transition-colors text-left ${
                        theme === 'dark' 
                          ? 'text-yellow-400 hover:bg-slate-800' 
                          : 'text-indigo-600 hover:bg-slate-100'
                      }`}
                    >
                      {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <div className={`border-t my-1 ${theme === 'dark' ? 'border-[#182030]' : 'border-slate-100'}`} />

                    {/* Auth Actions */}
                    {isLoggedIn ? (
                      <button
                        onClick={() => {
                          setLocalShowUserDropdown(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 py-2 px-3 text-[11px] font-mono uppercase font-bold text-red-400 hover:bg-red-500/10 rounded transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <Link
                        href="/"
                        onClick={() => setLocalShowUserDropdown(false)}
                        className="w-full flex items-center gap-2 py-2 px-3 text-[11px] font-mono uppercase font-bold text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors text-left"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Admin Login</span>
                      </Link>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
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
