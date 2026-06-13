"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Settings, Cpu, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SourcingTestPage() {
  const [theme, setTheme] = useState("dark");
  const [workflowsData, setWorkflowsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevStages = useRef({});

  // Native browser notifications helper
  const triggerDeviceNotification = useCallback((title, message) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, {
            body: message,
            tag: "sourcing-milestone"
          });
        } catch (err) {
          console.error("Failed to trigger native Notification", err);
        }
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(title, { body: message, tag: "sourcing-milestone" });
          }
        });
      }
    }
  }, []);

  // Request browser Notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Watch for milestone changes across all workflow updates
  useEffect(() => {
    if (workflowsData.length === 0) return;

    workflowsData.forEach(workflow => {
      workflow.orders.forEach(order => {
        let approvalState = "Approved";
        if (order.status === "Pending_Sourcing") {
          approvalState = "Pending";
        } else if (order.status === "Rejected") {
          approvalState = "Rejected";
        }

        let activeStageIndex = 0;
        if (approvalState === "Approved") {
          activeStageIndex = 1;
          if (order.status === "Dispatched_Sourcing_Active") {
            activeStageIndex = 1;
          } else if (order.status === "Approved") {
            activeStageIndex = order.machineStatus === "Operational" ? 3 : 2;
          }
        }

        const refKey = `${workflow.id}-${order.id}`;
        const prevStage = prevStages.current[refKey];
        if (prevStage !== undefined && activeStageIndex !== prevStage) {
          const stagesNames = [
            "Sourcing Approval",
            "Supplier Shipment",
            "Warehouse Arrival",
            "Technician Installation"
          ];
          
          const finishedStageName = stagesNames[prevStage];
          const nextStageName = stagesNames[activeStageIndex];
          
          if (activeStageIndex > prevStage) {
            triggerDeviceNotification(
              "Milestone Completed",
              `Component '${order.componentName}' progressed from '${finishedStageName}' to '${nextStageName}' (Workflow: ${workflow.name || workflow.id}).`
            );
          } else {
            triggerDeviceNotification(
              "Milestone Rolled Back",
              `Component '${order.componentName}' rolled back from '${finishedStageName}' to '${nextStageName}' (Workflow: ${workflow.name || workflow.id}).`
            );
          }
        }

        // Update ref
        prevStages.current[refKey] = activeStageIndex;
      });
    });
  }, [workflowsData, triggerDeviceNotification]);

  const loadData = useCallback(() => {
    try {
      const savedProjects = localStorage.getItem("projects");
      if (!savedProjects) {
        setWorkflowsData([]);
        return;
      }
      const parsedProjects = JSON.parse(savedProjects);
      
      const loaded = parsedProjects.map(proj => {
        const localDataRaw = localStorage.getItem(`workspace_data_${proj.id}`);
        if (!localDataRaw) return { ...proj, orders: [] };
        
        const data = JSON.parse(localDataRaw);
        const orders = data.maintenance_orders || [];
        
        const mappedOrders = orders.map(order => {
          const machine = data.machines?.find(m => m.id === order.machine_id);
          const machineId = machine?.id || order.machine_id;
          const requiredPartId = machine?.critical_thresholds?.required_part_id;
          const part = data.inventory?.find(p => p.part_id === requiredPartId);
          const componentName = part?.part_name || "Critical Component";
          
          return {
            ...order,
            machineName: machine?.name || "Machine",
            machineId,
            componentName,
            requiredPartId,
            status: order.status,
            rootCause: order.root_cause,
            machineStatus: machine?.status || "Operational"
          };
        });

        return {
          ...proj,
          orders: mappedOrders
        };
      }).filter(p => p.orders.length > 0);

      setWorkflowsData(loaded);
    } catch (e) {
      console.error("Error loading workspace data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStageClick = (projectId, orderId, targetIndex) => {
    // Request permission on user gesture (click)
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // 1. Persist to localStorage
    try {
      const localDataRaw = localStorage.getItem(`workspace_data_${projectId}`);
      if (localDataRaw) {
        const data = JSON.parse(localDataRaw);
        
        const updatedOrders = data.maintenance_orders?.map(order => {
          if (order.id === orderId) {
            let nextStatus = order.status;
            if (targetIndex === 0) {
              nextStatus = "Pending_Sourcing";
            } else if (targetIndex === 1) {
              nextStatus = "Dispatched_Sourcing_Active";
            } else if (targetIndex >= 2) {
              nextStatus = "Approved";
            }
            return { ...order, status: nextStatus };
          }
          return order;
        }) || [];
        
        const targetOrder = data.maintenance_orders?.find(o => o.id === orderId);
        let updatedMachines = data.machines || [];
        if (targetOrder) {
          updatedMachines = data.machines?.map(m => {
            if (m.id === targetOrder.machine_id) {
              let nextMachineStatus = m.status;
              if (targetIndex === 3) {
                nextMachineStatus = "Operational";
              } else {
                nextMachineStatus = m.status === "Operational" ? "Critical" : m.status;
              }
              return { ...m, status: nextMachineStatus };
            }
            return m;
          }) || [];
        }

        const updatedData = {
          ...data,
          maintenance_orders: updatedOrders,
          machines: updatedMachines
        };

        localStorage.setItem(`workspace_data_${projectId}`, JSON.stringify(updatedData));
      }
    } catch (e) {
      console.error("Failed to persist stage override", e);
    }

    // 2. Update state to reflect changes instantly in UI
    setWorkflowsData(prevWorkflows => {
      return prevWorkflows.map(wf => {
        if (wf.id !== projectId) return wf;
        
        const updatedOrders = wf.orders.map(order => {
          if (order.id !== orderId) return order;
          
          let nextStatus = order.status;
          if (targetIndex === 0) {
            nextStatus = "Pending_Sourcing";
          } else if (targetIndex === 1) {
            nextStatus = "Dispatched_Sourcing_Active";
          } else if (targetIndex >= 2) {
            nextStatus = "Approved";
          }

          let nextMachineStatus = order.machineStatus;
          if (targetIndex === 3) {
            nextMachineStatus = "Operational";
          } else {
            nextMachineStatus = order.machineStatus === "Operational" ? "Critical" : order.machineStatus;
          }

          return {
            ...order,
            status: nextStatus,
            machineStatus: nextMachineStatus
          };
        });

        return {
          ...wf,
          orders: updatedOrders
        };
      });
    });
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("appTheme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    loadData();
  }, [loadData]);

  // Listen for storage changes to sync across other tabs instantly
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith("workspace_data_")) {
        loadData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadData]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("appTheme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 font-mono ${
      theme === 'dark' ? 'bg-[#06080f] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Dashboard Nav */}
        <div className="flex justify-between items-center border-b pb-4 border-slate-800/60">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-blue-500 animate-spin-slow" />
            <div>
              <h1 className="text-lg font-bold tracking-widest uppercase text-blue-500">
                Sourcing Progress Bar Auditor
              </h1>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Secret development tool for auditing multi-workflow progress bar states
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded border text-xs font-semibold ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
              }`}
            >
              {theme === 'dark' ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}
            </button>
            <Link 
              href="/"
              className={`flex items-center space-x-1 px-3 py-1.5 rounded border text-xs font-semibold ${
                theme === 'dark'
                  ? 'bg-slate-900 border-[#182030] text-slate-400 hover:text-cyan-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-cyan-600'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK</span>
            </Link>
          </div>
        </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500 animate-pulse">
              LOADING COMPONENT WORKFLOW DATA...
            </div>
          ) : workflowsData.length === 0 ? (
            <div className="py-20 text-center border border-dashed rounded-xl border-slate-850 bg-[#0c0f17]/40">
              <p className="text-xs font-bold text-slate-400 tracking-wider">NO ACTIVE WORKFLOW SOURCING PIPELINES FOUND</p>
              <p className="text-[10px] text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Ensure you have active workspaces created and simulated machine failures with pending sourcing status to view their progress bars.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {workflowsData.map((workflow) => (
                <div 
                  key={workflow.id} 
                  className={`p-6 rounded-2xl border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-[#0c0f17] border-blue-500/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' 
                      : 'bg-white border-slate-200 shadow-[0_4px_15px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  {/* Workflow Header */}
                  <div className="flex items-center justify-between mb-6 border-b pb-3 border-slate-800/40">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping"></div>
                      <h2 className="text-xs font-bold tracking-widest text-slate-350 uppercase">
                        WORKFLOW: {workflow.name || `ID ${workflow.id}`}
                      </h2>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {workflow.orders.length} ACTIVE ORDER{workflow.orders.length > 1 ? 'S' : ''}
                    </span>
                  </div>

                  {/* Components Sourcing Pipeline Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workflow.orders.map((order) => {
                      // Parse supplier
                      const supplierMatch = order.rootCause?.match(/Selected Supplier:\s*([^\n\r(]+)/) || 
                                            order.rootCause?.match(/dispatched to\s*([^\n\r(]+)/) || 
                                            order.rootCause?.match(/order dispatched to\s*([^\n\r(]+)/i);
                      const supplierName = supplierMatch ? supplierMatch[1].trim() : "Optimal Supplier";

                      let approvalState = "Approved";
                      if (order.status === "Pending_Sourcing") {
                        approvalState = "Pending";
                      } else if (order.status === "Rejected") {
                        approvalState = "Rejected";
                      }

                      // Stages index
                      let activeStageIndex = 0;
                      if (approvalState === "Approved") {
                        activeStageIndex = 1;
                        if (order.status === "Dispatched_Sourcing_Active") {
                          activeStageIndex = 1;
                        } else if (order.status === "Approved") {
                          activeStageIndex = order.machineStatus === "Operational" ? 3 : 2;
                        }
                      }

                      const stages = [
                        {
                          id: "machine",
                          step: 4,
                          title: `${order.machineId}`,
                          subtitle: activeStageIndex >= 3 ? "Applied" : "Pending",
                          details: activeStageIndex >= 3 ? "Restored to service" : "Awaiting installation",
                          state: activeStageIndex === 3 ? "completed" : "awaiting"
                        },
                        {
                          id: "warehouse",
                          step: 3,
                          title: "Company Warehouse",
                          subtitle: activeStageIndex >= 2 ? (activeStageIndex === 2 ? "Arrived" : "Completed") : "On Route",
                          details: activeStageIndex >= 2 ? "Awaiting technician swap" : "Transit in progress",
                          state: activeStageIndex > 2 ? "completed" : (activeStageIndex === 2 ? "current-active" : "awaiting")
                        },
                        {
                          id: "supplier",
                          step: 2,
                          title: supplierName,
                          subtitle: activeStageIndex >= 1 ? (order.status === "Dispatched_Sourcing_Active" ? "In Transit" : "Completed") : "Awaiting",
                          details: activeStageIndex >= 1 ? "Priority air courier active" : "Pending approval",
                          state: activeStageIndex > 1 ? "completed" : (activeStageIndex === 1 ? "current-active" : "awaiting")
                        },
                        {
                          id: "approval",
                          step: 1,
                          title: "Sourcing Approval",
                          subtitle: approvalState === "Approved" ? "Approved" : (approvalState === "Pending" ? "Pending" : "Rejected"),
                          details: approvalState === "Approved" ? "Purchase order dispatched" : (approvalState === "Pending" ? "Auditing stock & lead times" : "Risk limit exceeded"),
                          state: approvalState === "Approved" ? "completed" : (approvalState === "Pending" ? "current-pending" : "blocked")
                        }
                      ];

                      return (
                        <div 
                          key={order.id} 
                          className={`border rounded-xl p-4 flex flex-col justify-between min-h-[160px] ${
                            theme === 'dark' ? 'bg-[#0f131c]/60 border-[#182030]' : 'bg-slate-50/50 border-slate-200'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-3 min-w-0 border-b pb-2 border-slate-800/20">
                            <div className="min-w-0 mr-4 flex-1">
                              <h3 className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`} title={order.componentName}>
                                {order.componentName}
                              </h3>
                              <p className={`text-[9px] font-mono tracking-widest mt-1 uppercase ${theme === 'dark' ? 'text-indigo-400/90' : 'text-indigo-600/90'}`} title={`${order.machineName}, ${order.machineId}`}>
                                FOR: {order.machineName}, {order.machineId}
                              </p>
                            </div>
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                              TICKET #{order.id}
                            </span>
                          </div>

                          {/* Stepper progression */}
                          <div className="relative pt-2 pb-2 flex-1 flex flex-col justify-center">
                            
                            {/* Connector Line Background */}
                            <div className={`absolute left-[12.5%] right-[12.5%] top-6 h-[2px] ${theme === 'dark' ? 'bg-[#182030]' : 'bg-slate-200'} pointer-events-none z-0`}></div>
                            
                            {/* Connector Line Active Overlay */}
                            {activeStageIndex > 0 && approvalState !== "Rejected" && (
                              <div 
                                className="absolute right-[12.5%] top-6 h-[2px] bg-emerald-500 pointer-events-none z-0 transition-all duration-500"
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
                                    : "bg-[#cf222e] border-red-650 text-white";
                                  labelColor = theme === 'dark' ? "text-red-400" : "text-red-700";
                                } else {
                                  nodeStyles = theme === 'dark' 
                                    ? "bg-[#0e131f] border-slate-700 text-slate-500" 
                                    : "bg-slate-100 border-slate-300 text-slate-400";
                                  labelColor = "text-slate-500";
                                }

                                return (
                                  <div 
                                    key={stage.id} 
                                    className="flex flex-col items-center text-center cursor-pointer group/node"
                                    onClick={() => handleStageClick(workflow.id, order.id, stage.step - 1)}
                                    title={`Simulate Stage ${stage.step}: ${stage.title}`}
                                  >
                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-[10px] select-none transition-all duration-300 group-hover/node:scale-115 group-hover/node:shadow-[0_0_8px_rgba(59,130,246,0.4)] ${nodeStyles}`}>
                                      {stage.state === "completed" ? "✓" : stage.step}
                                    </div>
                                    <div className="mt-2 max-w-[110px] min-w-0 transition-colors duration-200 group-hover/node:text-blue-400">
                                      <div className="text-[7px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Stage {stage.step}</div>
                                      <div className={`text-[9px] font-bold leading-tight truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} group-hover/node:text-blue-300`} title={stage.title}>
                                        {stage.title}
                                      </div>
                                      <div className={`text-[8px] font-semibold mt-0.5 ${labelColor}`}>
                                        {stage.subtitle}
                                      </div>
                                      <div className="text-[7.5px] text-slate-550 leading-snug mt-1 max-h-[28px] overflow-hidden opacity-80 group-hover/node:opacity-100">
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
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
