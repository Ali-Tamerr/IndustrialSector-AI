import { Activity } from "lucide-react";

export default function ConsoleOut({ logs }) {
  return (
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
  );
}
