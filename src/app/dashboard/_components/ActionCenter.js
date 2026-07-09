import { Inbox } from "lucide-react";

export default function ActionCenter({
  theme,
  data,
  setSelectedEmail
}) {
  const getEmailDraftContent = (rootCause) => {
    if (!rootCause) return null;
    const emailHeader = "Subject: URGENT:";
    const idx = rootCause.indexOf(emailHeader);
    if (idx !== -1) {
      const emailSection = rootCause.substring(idx);
      const lines = emailSection.split("\n");
      const subject = lines[0].replace("Subject: ", "");
      const to = lines[1].replace("To: ", "");
      const from = lines[2].replace("From: ", "");
      const date = lines[3].replace("Date: ", "");
      const body = lines.slice(5).join("\n");
      return { to, from, subject, date, body };
    }
    return null;
  };

  return (
    <section id="zone-4" className="space-y-3 transition-all duration-500">
      <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex items-center space-x-2">
        <Inbox className="w-3.5 h-3.5 text-blue-400" />
        <span>Zone 4: Action Center (Active Maintenance Orders)</span>
      </h2>

      <div className={`${theme === 'dark' ? 'bg-[#0c0f17] border-[#182030]' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-[#0f131c] border-[#182030]' : 'bg-slate-50 border-slate-100'} text-slate-500 border-b uppercase tracking-widest text-[9px]`}>
                <th className="py-3.5 px-5">Ticket ID</th>
                <th className="py-3.5 px-4">Equipment</th>
                <th className="py-3.5 px-4">Diagnosed Fault</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Specialist</th>
                <th className="py-3.5 px-4 text-right">Autonomous Procurement Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#182030]/40 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
              {data?.maintenance_orders && data.maintenance_orders.length > 0 ? (
                data.maintenance_orders.map((order) => {
                  const email = getEmailDraftContent(order.root_cause);
                  
                  return (
                    <tr key={order.id} className={`transition-colors duration-150 ${theme === 'dark' ? 'hover:bg-slate-900/40 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                      <td className={`py-3.5 px-5 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>#{order.id}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{order.machine_id}</span>
                        <span className="text-[10px] text-slate-500">Autonomous PdM</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{order.diagnosed_component || "N/A"}</span>
                        <span className="text-[10px] text-slate-500">{order.anomaly_signature || "N/A"}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.priority === "Critical" ? "bg-red-500/10 text-red-400" :
                          order.priority === "High" ? "bg-amber-500/10 text-amber-400" : "bg-slate-700/20 text-slate-400"
                        }`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === "Approved" ? "bg-emerald-500/10 text-emerald-400" :
                          order.status === "Dispatched_Sourcing_Active" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 ${theme === 'dark' ? 'text-slate-405' : 'text-slate-650'}`}>{order.assigned_technician}</td>
                      <td className="py-3.5 px-4 text-right">
                        {email ? (
                          <button
                            onClick={() => setSelectedEmail(email)}
                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-600 hover:text-white transition-all duration-200"
                          >
                            Inspect Email Draft
                          </button>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Direct Part Secure / No Sourcing Draft</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 italic">
                    No active maintenance orders processed in Local Storage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
