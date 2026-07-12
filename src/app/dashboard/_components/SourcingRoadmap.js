import { Settings, ShieldCheck } from "lucide-react";

export default function SourcingRoadmap({
  theme,
  data,
  selectedRoadmapOrderId,
  setSelectedRoadmapOrderId
}) {
  const orders = data?.maintenance_orders || [];
  
  if (orders.length === 0) {
    return (
      <section id="zone-3" className="lg:col-span-7 space-y-3 flex flex-col transition-all duration-500 relative">
        <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>Zone 2: Component Sourcing Roadmap</span>
          </div>
          {/* <span className="text-[9px] text-slate-500 normal-case tracking-normal font-medium">Real-time supply chain progression tracker</span> */}
        </h2>
        
        <div className={`${theme === 'dark' ? 'bg-[#0c0f17] border-[#182030]' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-4 flex-1 flex flex-col overflow-y-auto min-h-[460px] max-h-[460px] space-y-3`}>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center font-mono text-xs select-none">
            <div className={`p-4 rounded-full border border-dashed mb-3 ${theme === 'dark' ? 'bg-[#0e131f] border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <p className={`font-bold tracking-wider uppercase mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>System Standby - Fleet Stable</p>
            <p className="text-[10px] text-slate-500 max-w-sm leading-relaxed">
              All equipment units are running within standard operational thresholds. No active sourcing or maintenance tickets found.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="zone-3" className="lg:col-span-7 space-y-3 flex flex-col transition-all duration-500 relative">
      <h2 className="text-[11px] font-bold tracking-widest uppercase font-mono text-slate-500 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Settings className="w-3.5 h-3.5 text-blue-400" />
          <span>Zone 2: Component Sourcing Roadmap</span>
        </div>
        {/* <span className="text-[9px] text-slate-500 normal-case tracking-normal font-medium">Real-time supply chain progression tracker</span> */}
      </h2>

      <div className={`${theme === 'dark' ? 'bg-[#0c0f17] border-[#182030]' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-4 flex-1 flex flex-col overflow-y-auto min-h-[460px] max-h-[460px] space-y-3`}>
        <div className="space-y-3">
          {orders.map((order) => {
            const machine = data?.machines?.find(m => m.id === order.machine_id);
            const machineId = machine?.id || order.machine_id;
            const requiredPartId = machine?.critical_thresholds?.required_part_id;
            const part = data?.inventory?.find(p => p.part_id === requiredPartId);
            const componentName = part?.part_name || "Critical Component";

            // Parse supplier
            const supplierMatch = order.root_cause?.match(/Selected Supplier:\s*([^\n\r(]+)/) || 
                                  order.root_cause?.match(/dispatched to\s*([^\n\r(]+)/) || 
                                  order.root_cause?.match(/order dispatched to\s*([^\n\r(]+)/i);
            const supplierName = supplierMatch ? supplierMatch[1].trim() : "Optimal Supplier";

            let approvalState = "Approved";
            if (order.status === "Pending_Sourcing") {
              approvalState = "Pending";
            } else if (order.status === "Rejected") {
              approvalState = "Rejected";
            }

            // Stages: 0: Suppliers' Approval, 1: Supplier, 2: Company Warehouse, 3: Machine
            let activeStageIndex = 0;
            if (approvalState === "Approved") {
              activeStageIndex = 1;
              if (order.status === "Dispatched_Sourcing_Active") {
                activeStageIndex = 1;
              } else if (order.status === "Approved") {
                activeStageIndex = machine?.status === "Operational" ? 3 : 2;
              }
            }

            // Details of stages - flipped physically (Machine, Warehouse, Supplier, Approval)
            const stages = [
              {
                id: "machine",
                step: 4,
                title: `${machineId}`,
                subtitle: activeStageIndex >= 3 ? "Applied" : "Pending",
                details: activeStageIndex >= 3 ? "Restored to service" : "Awaiting installation",
                state: activeStageIndex === 3 ? "completed" : "awaiting"
              },
              {
                id: "warehouse",
                step: 3,
                title: "Company Warehouse",
                subtitle: activeStageIndex >= 2 ? (activeStageIndex === 2 ? "Arrived" : "Completed") : "On Route",
                details: activeStageIndex >= 2 ? "" : "",
                state: activeStageIndex > 2 ? "completed" : (activeStageIndex === 2 ? "current-active" : "awaiting")
              },
              {
                id: "supplier",
                step: 2,
                title: supplierName,
                subtitle: activeStageIndex >= 1 ? (order.status === "Dispatched_Sourcing_Active" ? "In Transit" : "Completed") : "Awaiting",
                details: activeStageIndex >= 1 ? "" : "",
                state: activeStageIndex > 1 ? "completed" : (activeStageIndex === 1 ? "current-active" : "awaiting")
              },
              {
                id: "approval",
                step: 1,
                title: "Suppliers' Approval",
                subtitle: approvalState === "Approved" ? "Approved" : (approvalState === "Pending" ? "Pending" : "Rejected"),
                details: approvalState === "Approved" ? "Purchase order completed" : (approvalState === "Pending" ? "Auditing stock & lead times" : "Risk limit exceeded"),
                state: approvalState === "Approved" ? "completed" : (approvalState === "Pending" ? "current-pending" : "blocked")
              }
            ];

            const isSelected = order.id === (selectedRoadmapOrderId || orders[0]?.id);

            return (
              <div 
                key={order.id} 
                onClick={() => setSelectedRoadmapOrderId(order.id)}
                className={`border rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-305 min-h-[148px] ${
                  isSelected 
                    ? (theme === 'dark' ? 'bg-[#0f131c] border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.15)]' : 'bg-slate-50 border-blue-400 shadow-sm')
                    : (theme === 'dark' ? 'bg-[#0f131c]/60 border-[#182030] hover:bg-[#121722]' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/30')
                }`}
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-3 min-w-0">
                  <div className="min-w-0 mr-4 flex-1">
                    <h3 className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-slate-105' : 'text-slate-800'}`} title={componentName}>
                      {componentName}
                    </h3>
                    <p className={`text-[9px] font-mono tracking-widest mt-1 uppercase ${theme === 'dark' ? 'text-indigo-400/90' : 'text-indigo-600/90'}`} title={`${machine?.name || 'Machine'}, ${machineId}`}>
                      FOR: {machine?.name || "Machine"}, {machineId}
                    </p>
                  </div>
                </div>

                {/* Stepper Progression Container */}
                <div className="relative pt-1 pb-3 flex-1 flex flex-col justify-center">
                  
                  {/* Connector Line Background */}
                  <div className={`absolute left-[12.5%] right-[12.5%] top-5 h-[2px] ${theme === 'dark' ? 'bg-[#182030]' : 'bg-slate-200'} pointer-events-none z-0`}></div>
                  
                  {/* Connector Line Active Overlay */}
                  {activeStageIndex > 0 && approvalState !== "Rejected" && (
                    <div 
                      className="absolute right-[12.5%] top-5 h-[2px] bg-emerald-500 pointer-events-none z-0 transition-all duration-500"
                      style={{ 
                        width: `${(activeStageIndex / 3) * 75}%`
                      }}
                    ></div>
                  )}

                  {/* Steps Grid */}
                  <div className="grid grid-cols-4 gap-1 relative z-10">
                    {stages.map((stage) => {
                      let nodeStyles = "";
                      let labelColor = "";

                      if (stage.state === "completed") {
                        nodeStyles = theme === 'dark' 
                          ? "bg-emerald-500 border-emerald-500 text-[#0c0f17]" 
                          : "bg-emerald-600 border-emerald-600 text-white";
                        labelColor = theme === 'dark' ? "text-emerald-400" : "text-emerald-700";
                      } else if (stage.state === "current-active") {
                        nodeStyles = theme === 'dark' 
                          ? "bg-blue-500 border-blue-500 text-[#0c0f17]" 
                          : "bg-blue-600 border-blue-600 text-white";
                        labelColor = theme === 'dark' ? "text-blue-400" : "text-blue-700";
                      } else if (stage.state === "current-pending") {
                        nodeStyles = theme === 'dark' 
                          ? "bg-amber-500 border-amber-500 text-[#0c0f17]" 
                          : "bg-amber-600 border-amber-600 text-white";
                        labelColor = theme === 'dark' ? "text-amber-400" : "text-amber-700";
                      } else if (stage.state === "blocked") {
                        nodeStyles = theme === 'dark' 
                          ? "bg-red-500 border-red-500 text-[#0c0f17]" 
                          : "bg-red-600 border-red-600 text-white";
                        labelColor = theme === 'dark' ? "text-red-400" : "text-red-700";
                      } else {
                        nodeStyles = theme === 'dark' 
                          ? "bg-[#0e131f] border-slate-700 text-slate-500" 
                          : "bg-slate-100 border-slate-300 text-slate-400";
                        labelColor = "text-slate-550";
                      }

                      return (
                        <div key={stage.id} className="flex flex-col items-center text-center">
                          {/* Circular Node */}
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs select-none transition-colors duration-300 ${nodeStyles}`}>
                            {stage.state === "completed" ? "✓" : stage.step}
                          </div>

                          {/* Info below */}
                          <div className="mt-2 max-w-[110px] min-w-0">
                            <div className="text-[7.5px] text-slate-505 uppercase tracking-wider font-bold mb-0.5">Stage {stage.step}</div>
                            <div className={`text-[9.5px] font-bold leading-tight truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`} title={stage.title}>
                              {stage.title}
                            </div>
                            <div className={`text-[8.5px] font-semibold mt-0.5 ${labelColor}`}>
                              {stage.subtitle}
                            </div>
                            <div className="text-[8px] text-slate-505 leading-snug mt-1 max-h-[32px] overflow-hidden">
                              {stage.details}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
