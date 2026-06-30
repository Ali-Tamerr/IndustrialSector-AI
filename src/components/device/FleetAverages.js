import { Cpu, Send } from "lucide-react";

export default function FleetAverages({
  workflowMachines,
  loadingMachines,
  submitting,
  errorMsg,
  successMsg,
  handleBroadcastFleet
}) {
  return (
    <div className="bg-[#080d16]/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white font-now flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Workflow Fleet & Averages</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Average sensor values since the beginning of the workflow until page loaded.
          </p>
        </div>
        
        <button
          type="button"
          disabled={submitting || loadingMachines || workflowMachines.length === 0}
          onClick={handleBroadcastFleet}
          className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-lg shadow-emerald-600/10 border border-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900 text-emerald-200 text-xs">
          {successMsg}
        </div>
      )}

      {loadingMachines ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
          <p className="text-xs text-slate-500 font-mono">Calculating historical fleet averages...</p>
        </div>
      ) : workflowMachines.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No registered machines found in the current workflow.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3 px-2">Machine ID</th>
                <th className="py-3 px-2">Machine Name</th>
                <th className="py-3 px-2">Health State</th>
                <th className="py-3 px-2 text-right">Avg Temp</th>
                <th className="py-3 px-2 text-right">Avg Vib</th>
                <th className="py-3 px-2 text-right">Avg Pres</th>
                <th className="py-3 px-2 text-right">Avg Cur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {workflowMachines.map((machine) => {
                const statusColor = 
                  machine.status === "Operational" ? "text-emerald-400 bg-emerald-950/20 border-emerald-500/20" :
                  machine.status === "Degraded" ? "text-amber-400 bg-amber-950/20 border-amber-500/20" :
                  "text-red-400 bg-red-950/20 border-red-500/20";

                return (
                  <tr key={machine.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-3.5 px-2 font-mono font-bold text-white">{machine.id}</td>
                    <td className="py-3.5 px-2 text-slate-300 font-medium">{machine.name}</td>
                    <td className="py-3.5 px-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {machine.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono text-white">{machine.avg_temp}°C</td>
                    <td className="py-3.5 px-2 text-right font-mono text-white">{machine.avg_vib} mm/s</td>
                    <td className="py-3.5 px-2 text-right font-mono text-white">{machine.avg_pres} Bar</td>
                    <td className="py-3.5 px-2 text-right font-mono text-white">{machine.avg_cur} A</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
