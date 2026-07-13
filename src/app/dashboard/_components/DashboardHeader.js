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
  X 
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/app/_components/ToastContext";

export default function DashboardHeader({
  theme,
  toggleTheme,
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
  setMobileSimDropdownOpen
}) {
  const { showConfirm } = useToast();
  return (
    <header className={`border-b ${theme === 'dark' ? 'border-[#182030] bg-[#0c0f17]/95 text-white' : 'border-slate-200 bg-white/90 shadow-[0_2px_15px_rgba(0,0,0,0.02)] text-slate-800'} px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md transition-all duration-300`}>
      <div className="flex items-center space-x-3">
        <div className={`h-8.5 w-8.5 ${theme === 'dark' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} rounded border flex items-center justify-center`}>
          <Cpu className="w-5 h-5 text-blue-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={activeProject?.name || ""}
              onChange={(e) => handleRenameProject(activeProject?.id, e.target.value)}
              className={`bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-500 outline-none font-mono text-[16px] font-extrabold tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-805'} transition-all w-full max-w-[180px] sm:max-w-[240px] md:max-w-[320px]`}
              placeholder="Unnamed Project"
            />
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'} border`}>
              {activeProject?.type === "template" ? `${activeProject?.templateId?.toUpperCase()}_TEMPLATE` : "CUSTOM_FLEET"}
            </span>
          </div>
          <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} font-mono tracking-widest uppercase hidden sm:block`}>Predictive Maintenance & Supply Chain Sourcing Graph</p>
        </div>
      </div>

      <div className="flex items-center space-x-3.5">
        <div className="hidden lg:flex flex-col text-right font-mono text-[10px]">
          <span className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>FLEET PERFORMANCE</span>
          <span className={`${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} font-bold tracking-widest`}>99.78% RESILIENT</span>
        </div>

        {/* Desktop Navigation Buttons */}
        <div className="hidden lg:flex items-center space-x-3.5">
          {notificationPermission !== "granted" && (
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-2 font-mono text-xs font-bold rounded bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center space-x-1.5 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              title="Click to authorize system notifications on milestone events"
            >
              <span>🔔 Enable System Notifications</span>
            </button>
          )}

          <button
            onClick={() => { setTutorialStep(0); setShowTutorial(true); }}
            className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-1.5 ${
              theme === 'dark'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                : 'bg-blue-50 text-blue-600 border-blue-200/80 hover:bg-blue-600 hover:text-white shadow-sm'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Dashboard Tour</span>
          </button>
          <Link
            href="/"
            className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-1.5 ${
              theme === 'dark'
                ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200/85 hover:bg-indigo-600 hover:text-white shadow-sm'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </Link>
          <Link
            href="/device"
            className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-1.5 ${
              theme === 'dark'
                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200/85 hover:bg-emerald-600 hover:text-white shadow-sm'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Device Client</span>
          </Link>
          <button
            onClick={() => {
              showConfirm("Return to Projects Portal? Current database setup will remain active until you launch another fleet config.", () => {
                updateTabActiveProject(null);
                window.location.href = "/c-home";
              });
            }}
            className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-1.5 ${
              theme === 'dark'
                ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600 hover:text-white'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200/85 hover:bg-cyan-600 hover:text-white shadow-sm'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Projects Portal</span>
          </button>

          <button
            onClick={() => {
              setEditorMachines(data?.machines ? JSON.parse(JSON.stringify(data.machines)) : []);
              setEditorInventory(data?.inventory ? JSON.parse(JSON.stringify(data.inventory)) : []);
              setEditorNodes(data?.graph?.nodes ? JSON.parse(JSON.stringify(data.graph.nodes)) : []);
              setEditorEdges(data?.graph?.links ? JSON.parse(JSON.stringify(data.graph.links)) : []);
              setShowEditor(true);
            }}
            className={`px-3 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-1.5 ${
              theme === 'dark'
                ? 'bg-slate-900 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600 hover:text-white'
                : 'bg-white text-cyan-700 border-cyan-200/80 hover:bg-cyan-600 hover:text-white shadow-sm'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Fleet & Graph</span>
          </button>

          <div className="relative">
            <button
              id="simulator-btn"
              onClick={() => {
                if (!simulating) setSimulatorDropdownOpen(!simulatorDropdownOpen);
              }}
              disabled={simulating}
              className={`px-4 py-2 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center space-x-2 ${
                simulating
                  ? "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                  : (theme === 'dark'
                      ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white"
                      : "bg-red-55 text-red-600 border-red-200/80 hover:bg-red-600 hover:text-white shadow-sm")
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`} />
              <span>{simulating ? "PROCESSING AGENTS..." : "Simulate Failure"}</span>
              {!simulating && <ChevronDown className="w-3.5 h-3.5 ml-1" />}
            </button>
            
            {simulatorDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-[340px] rounded-xl shadow-xl z-50 overflow-hidden border ${theme === 'dark' ? 'bg-[#182030] border-[#2b3548] shadow-[0_10px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)]'}`}>
                <div className={`text-[10px] font-mono tracking-widest uppercase px-4 py-3 border-b ${theme === 'dark' ? 'text-slate-500 border-[#2b3548]' : 'text-slate-500 border-slate-200'}`}>
                  On:
                </div>
                <ul className="max-h-72 overflow-y-auto">
                  {data?.machines?.map(machine => (
                    <li 
                      key={machine.id}
                      onClick={() => {
                        setSimulatorDropdownOpen(false);
                        handleSimulation(machine.id);
                      }}
                      className={`flex justify-between items-center px-4 py-3 cursor-pointer text-xs transition-colors border-b last:border-b-0 ${
                        theme === 'dark' 
                          ? 'border-[#2b3548]/50 hover:bg-[#202a3d] text-slate-300' 
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className={theme === 'dark' ? 'text-red-400/90 font-medium' : 'text-red-600/90 font-medium'}>{machine.name}</span>
                      <span className={`font-mono text-[10px] ml-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{machine.id}</span>
                    </li>
                  ))}
                  {(!data?.machines || data?.machines?.length === 0) && (
                    <li className={`px-4 py-4 text-center text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      No machines available
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-slate-950/40 border-slate-800 text-yellow-400 hover:bg-slate-900 hover:text-yellow-300 hover:scale-105 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 hover:text-indigo-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:scale-105'
          }`}
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center lg:hidden ${
            theme === 'dark'
              ? 'bg-slate-950/40 border-slate-800 text-slate-350 hover:bg-slate-900 hover:text-white hover:scale-105'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:scale-105'
          }`}
          title="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Mobile Navigation Dropdown Popup */}
        {mobileMenuOpen && (
          <div className={`absolute right-6 top-[calc(100%-8px)] mt-2 w-72 rounded-xl shadow-2xl z-50 overflow-hidden border p-4 space-y-3 transition-all duration-300 lg:hidden ${
            theme === 'dark' 
              ? 'bg-[#0c0f17]/95 border-[#2a3547] shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-lg' 
              : 'bg-white/95 border-slate-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.15)] backdrop-blur-lg text-slate-800'
          }`}>
            <div className="flex flex-col space-y-2.5">
              {notificationPermission !== "granted" && (
                <button
                  onClick={() => {
                    requestNotificationPermission();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2.5 font-mono text-xs font-bold rounded bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center space-x-1.5 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                  title="Click to authorize system notifications"
                >
                  <span>🔔 Enable System Notifications</span>
                </button>
              )}

              <button
                onClick={() => { 
                  setTutorialStep(0); 
                  setShowTutorial(true); 
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                    : 'bg-blue-50 text-blue-600 border-blue-200/80 hover:bg-blue-600 hover:text-white shadow-sm'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Dashboard Tour</span>
              </button>
              <Link
                href="/"
                className={`w-full px-3 py-2.5 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200/85 hover:bg-indigo-600 hover:text-white shadow-sm'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>

              <Link
                href="/device"
                className={`w-full px-3 py-2.5 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/85 hover:bg-emerald-600 hover:text-white shadow-sm'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Device Client</span>
              </Link>

              <button
                onClick={() => {
                  showConfirm("Return to Projects Portal? Current database setup will remain active until you launch another fleet config.", () => {
                    updateTabActiveProject(null);
                    window.location.href = "/c-home";
                  });
                }}
                className={`w-full px-3 py-2.5 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600 hover:text-white'
                    : 'bg-cyan-50 text-cyan-700 border-cyan-200/85 hover:bg-cyan-600 hover:text-white shadow-sm'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Projects Portal</span>
              </button>

              <button
                onClick={() => {
                  setEditorMachines(data?.machines ? JSON.parse(JSON.stringify(data.machines)) : []);
                  setEditorInventory(data?.inventory ? JSON.parse(JSON.stringify(data.inventory)) : []);
                  setEditorNodes(data?.graph?.nodes ? JSON.parse(JSON.stringify(data.graph.nodes)) : []);
                  setEditorEdges(data?.graph?.links ? JSON.parse(JSON.stringify(data.graph.links)) : []);
                  setShowEditor(true);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600 hover:text-white'
                    : 'bg-white text-cyan-700 border-cyan-200/80 hover:bg-cyan-600 hover:text-white shadow-sm'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configure Fleet & Graph</span>
              </button>

              <div className="border-t border-slate-200/20 pt-2.5 mt-1 space-y-1.5">
                <button
                  onClick={() => {
                    if (!simulating) setMobileSimDropdownOpen(!mobileSimDropdownOpen);
                  }}
                  disabled={simulating}
                  className={`w-full px-4 py-2.5 font-mono text-xs font-semibold rounded border transition-all duration-300 flex items-center justify-center space-x-2 ${
                    simulating
                      ? "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                      : (theme === 'dark'
                          ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white"
                          : "bg-red-50 text-red-600 border-red-200/80 hover:bg-red-600 hover:text-white shadow-sm")
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`} />
                  <span>{simulating ? "PROCESSING AGENTS..." : "Simulate Failure"}</span>
                  {!simulating && <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                </button>

                {mobileSimDropdownOpen && !simulating && (
                  <div className={`mt-1.5 max-h-40 overflow-y-auto rounded-lg border text-left ${theme === 'dark' ? 'bg-[#182030] border-[#2b3548]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[9px] font-mono tracking-widest uppercase px-3 py-1.5 border-b ${theme === 'dark' ? 'text-slate-500 border-[#2b3548]' : 'text-slate-500 border-slate-200'}`}>
                      Select Machine:
                    </div>
                    <ul>
                      {data?.machines?.map(machine => (
                        <li 
                          key={machine.id}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileSimDropdownOpen(false);
                            handleSimulation(machine.id);
                          }}
                          className={`flex justify-between items-center px-3 py-2 cursor-pointer text-xs transition-colors border-b last:border-b-0 ${
                            theme === 'dark' 
                              ? 'border-[#2b3548]/50 hover:bg-[#202a3d] text-slate-300' 
                              : 'border-slate-100 hover:bg-slate-105 text-slate-700'
                          }`}
                        >
                          <span className="font-medium truncate max-w-[130px]">{machine.name}</span>
                          <span className="font-mono text-[9px] text-slate-500">{machine.id}</span>
                        </li>
                      ))}
                      {(!data?.machines || data?.machines?.length === 0) && (
                        <li className="px-3 py-3 text-center text-xs text-slate-400">
                          No machines available
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
