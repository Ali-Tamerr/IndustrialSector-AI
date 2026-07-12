import { Layers } from "lucide-react";

export default function ThoughtsStream({
  theme,
  thoughts,
  thoughtsContainerRef
}) {
  return (
    <div className="space-y-3 flex flex-col transition-all duration-500 w-full">
      
      <div className={`bg-[#080a0f] border rounded-xl flex-1 flex flex-col overflow-hidden relative shadow-[inset_0_4px_24px_rgba(0,0,0,0.9)] min-h-[460px] max-h-[460px] ${theme === 'dark' ? 'border-[#182030]' : 'border-slate-200'}`}>
        <div className={`border-b px-4 py-2.5 bg-[#0c0f17] flex items-center justify-between font-mono text-[9px] text-slate-505 ${theme === 'dark' ? 'border-[#182030]/80' : 'border-slate-250'}`}>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500/20"></span>
            <span className="h-2 w-2 rounded-full bg-yellow-500/20"></span>
            <span className="h-2 w-2 rounded-full bg-green-500/20"></span>
            <span className="ml-2 text-slate-400 font-bold uppercase tracking-widest text-[9px]">ORCHESTRATOR_EXEC_LOG</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-450">
            <span className="animate-pulse text-blue-400">● SIGNAL ACTIVE</span>
          </div>
        </div>

        {/* Terminal Body */}
        <div ref={thoughtsContainerRef} className="p-4 flex-1 overflow-y-auto font-mono text-[11px] space-y-3 scroll-smooth leading-relaxed">
          {thoughts.map((log) => {
            let tagColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";
            if (log.agent.includes("Anomaly")) tagColor = "text-amber-400 bg-amber-400/10 border-amber-400/20";
            else if (log.agent.includes("Diagnostic")) tagColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
            else if (log.agent.includes("Planning") || log.agent.includes("Tool")) tagColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
            else if (log.agent.includes("Sourcing") || log.agent.includes("Graph")) tagColor = "text-orange-400 bg-orange-400/10 border-orange-400/20";
            else if (log.agent.includes("Simulator")) tagColor = "text-red-400 bg-red-400/10 border-red-400/20";

            return (
              <div key={log.id} className="border-l border-slate-800 pl-3 py-0.5 hover:bg-slate-900/40 rounded transition-colors duration-150">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${tagColor} mr-2 uppercase tracking-wide`}>
                  {log.agent}
                </span>
                <span className="text-slate-300">{log.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
