import { Terminal, HelpCircle } from "lucide-react";

export default function InstructionsPanel() {
  return (
    <div className="bg-[#080d16]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center border border-emerald-500/20">
          <Terminal className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white font-now">IoT Device Client</h1>
          <p className="text-[10px] text-emerald-400 font-mono tracking-wider font-bold">Local Reporting Node</p>
        </div>
      </div>
      
      <p className="text-xs text-slate-400 leading-relaxed mb-4">
        Simulates hardware monitoring devices in the workflow. It computes the average sensor values of the machines from the beginning of the workflow, then broadcasts them directly to the admin account.
      </p>

      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
        <h2 className="font-semibold text-white flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>How to use:</span>
        </h2>
        <ol className="list-decimal pl-4 space-y-1 text-slate-400">
          <li>Input the target Admin Link ID (Default: <code className="text-emerald-300">ADM-8A9F</code>).</li>
          <li>Wait for the fleet's historical sensor averages to calculate.</li>
          <li>Trigger the Forced Broadcast to send all machine telemetry to the admin.</li>
        </ol>
      </div>
    </div>
  );
}
