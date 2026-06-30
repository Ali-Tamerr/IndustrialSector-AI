import { useEffect } from "react";
import { Cpu, Activity, Play, Layers, Settings, Inbox } from "lucide-react";

export default function TutorialTour({
  theme,
  showTutorial,
  tutorialStep,
  setTutorialStep,
  closeTutorial
}) {
  const tutorialSteps = [
    {
      title: "Welcome to the Autonomic Control Tower",
      description: "This dashboard orchestrates an advanced, offline-first multi-agent industrial repair system. When machinery fails, specialized AI agents automatically diagnose the failure, audit spare parts inventories, optimize supply-chain logistics, and prepare supplier purchase orders in seconds.",
      icon: <Cpu className="w-12 h-12 text-blue-400 animate-pulse" />,
      selector: null,
      positionClass: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg",
      style: {},
    },
    {
      title: "Zone 1: Telemetry Live Monitor",
      description: "Real-time sensor arrays track Winding Temperature, Radial Vibration, Discharge Pressure, and Coil Current for your factory fleet. Custom SVG sparklines display live 24-hour fluctuations to identify abnormal spikes before they become breakdowns.",
      icon: <Activity className="w-12 h-12 text-emerald-400" />,
      selector: "zone-1",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", bottom: "24px", right: "24px", left: "auto", top: "auto", transform: "none" },
    },
    {
      title: "Autonomous Agent Catalyst",
      description: "Clicking 'Simulate Bearing Failure on Machine 2' injects a live fault in the fleet. This acts as the catalyst for our AI agents to step in, collaborate, and execute emergency procurement actions.",
      icon: <Play className="w-12 h-12 text-red-400 animate-pulse" />,
      selector: "simulator-btn",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", top: "96px", left: "24px", right: "auto", bottom: "auto", transform: "none" },
    },
    {
      title: "Zone 2: Multi-Agent Execution Log",
      description: "Observe the 'Thoughts' stream—the live, step-by-step reasoning logs of collaborating agents. Watch the Anomaly Agent flag the failure, the Diagnostic Agent query technical manuals, and the Sourcing Agent negotiate part routing.",
      icon: <Layers className="w-12 h-12 text-amber-400" />,
      selector: "zone-2",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", top: "96px", right: "24px", left: "auto", bottom: "auto", transform: "none" },
    },
    {
      title: "Zone 3: Component Sourcing Roadmap",
      description: "Here, automated purchase and dispatch tickets are created in PostgreSQL. Click 'Inspect Email Draft' to review professional, AI-crafted supplier procurement contracts complete with lead-time, price, and resilience scores.",
      icon: <Inbox className="w-12 h-12 text-purple-400" />,
      selector: "zone-3",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", top: "96px", left: "24px", right: "auto", bottom: "auto", transform: "none" },
    },
    {
      title: "Zone 4: Action Center",
      description: "Here, automated purchase and dispatch tickets are created in PostgreSQL. Click 'Inspect Email Draft' to review professional, AI-crafted supplier procurement contracts complete with lead-time, price, and resilience scores.",
      icon: <Inbox className="w-12 h-12 text-purple-400" />,
      selector: "zone-4",
      positionClass: "fixed w-full max-w-sm",
      style: { position: "fixed", top: "96px", left: "50%", transform: "translateX(-50%)", right: "auto", bottom: "auto" },
    }
  ];

  // Scroll and highlight selector element during step changes
  useEffect(() => {
    if (showTutorial) {
      const step = tutorialSteps[tutorialStep];
      if (step && step.selector) {
        const element = document.getElementById(step.selector);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-blue-500", "ring-offset-4", "ring-offset-[#06080c]", "scale-[1.015]");
          return () => {
            element.classList.remove("ring-2", "ring-blue-500", "ring-offset-4", "ring-offset-[#06080c]", "scale-[1.015]");
          };
        }
      }
    }
  }, [tutorialStep, showTutorial]);

  if (!showTutorial) return null;

  const currentStep = tutorialSteps[tutorialStep] || tutorialSteps[0];

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${
      currentStep.selector 
        ? "bg-slate-950/20 pointer-events-none" 
        : "bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
    }`}>
      <div 
        style={currentStep.style}
        className={`${theme === 'dark' ? 'bg-[#0c0f17]/95 border-[#182030] text-slate-350 shadow-2xl' : 'bg-white/95 border-slate-200 text-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.12)]'} rounded-2xl overflow-hidden relative p-6 space-y-6 animate-fadeIn font-sans transition-all duration-500 ease-in-out pointer-events-auto ${
          currentStep.selector 
            ? currentStep.positionClass 
            : "w-full max-w-lg"
        }`}
      >
        
        {/* Header / Skip */}
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
            STEP {tutorialStep + 1} OF {tutorialSteps.length}
          </span>
          <button 
            onClick={closeTutorial}
            className={`font-mono text-xs px-2.5 py-1 rounded transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-white hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-105'}`}
          >
            Skip Tour ✕
          </button>
        </div>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-4 rounded-full border shadow-inner ${theme === 'dark' ? 'bg-slate-900/60 border-[#182030]' : 'bg-slate-50 border-slate-100'}`}>
            {currentStep.icon}
          </div>
          <h3 className={`text-lg font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            {currentStep.title}
          </h3>
          <p className={`text-xs leading-relaxed font-normal max-w-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {currentStep.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2">
          {tutorialSteps.map((_, idx) => (
            <span 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === tutorialStep ? "w-6 bg-blue-500" : "w-1.5 bg-slate-705"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className={`flex justify-between items-center pt-2 border-t font-mono text-xs ${theme === 'dark' ? 'border-[#182030]/50' : 'border-slate-100'}`}>
          <button
            disabled={tutorialStep === 0}
            onClick={() => setTutorialStep(prev => prev - 1)}
            className={`px-4 py-2 rounded border transition-colors ${
              tutorialStep === 0 
                ? (theme === 'dark' ? "text-slate-600 border-slate-900 cursor-not-allowed" : "text-slate-400 border-slate-200 cursor-not-allowed") 
                : (theme === 'dark' ? "text-slate-300 border-slate-800 hover:bg-slate-800" : "text-slate-700 border-slate-250 hover:bg-slate-50")
            }`}
          >
            ◀ Back
          </button>
          
          {tutorialStep < tutorialSteps.length - 1 ? (
            <button
              onClick={() => setTutorialStep(prev => prev + 1)}
              className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
              Next Step ▶
            </button>
          ) : (
            <button
              onClick={closeTutorial}
              className="px-5 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              Get Started ✓
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
