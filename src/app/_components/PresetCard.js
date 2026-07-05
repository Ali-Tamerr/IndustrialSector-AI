"use client";

import React from "react";
import { Building, Activity, Cpu, Settings, Database, ArrowRight } from "lucide-react";

const CARD_CONFIGS = {
  steel: {
    tag: "STEEL_MILL",
    title: "Heavy Steel Rolling Mill",
    description: "Baseline fleet consisting of Rotary Gear Pumps, Industrial Exhaust Fans, and Pneumatic Compressors. Optimized for testing ball-bearing degradation.",
    assetsCount: 3,
    icon: Building,
    colorClasses: {
      active: {
        dark: 'border-cyan-500 bg-cyan-950/15 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
        light: 'border-cyan-500 bg-cyan-50/20 shadow-md'
      },
      inactive: {
        dark: 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-blue-500/50 hover:bg-blue-950/[0.04]',
        light: 'border-slate-200 bg-slate-50/50 hover:border-blue-500 hover:bg-blue-50/20 shadow-sm'
      },
      iconColor: 'text-blue-400',
      tag: {
        dark: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
        light: 'text-blue-600 bg-blue-50 border-blue-200'
      },
      pingBg: 'bg-blue-400',
      hoverTitle: 'group-hover:text-blue-500',
      footerSelect: 'text-blue-555'
    }
  },
  petrochemical: {
    tag: "HYDROCRACKER",
    title: "Petrochemical Refinery",
    description: "Gas turbines, high-pressure gaskets, and transfer pumps. Features specialized oil & gas RAG manuals and Houston fast seal logistics routing.",
    assetsCount: 3,
    icon: Activity,
    colorClasses: {
      active: {
        dark: 'border-cyan-500 bg-cyan-950/15 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
        light: 'border-cyan-500 bg-cyan-50/20 shadow-md'
      },
      inactive: {
        dark: 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-emerald-500/50 hover:bg-emerald-950/[0.04]',
        light: 'border-slate-200 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/20 shadow-sm'
      },
      iconColor: 'text-emerald-400',
      tag: {
        dark: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
        light: 'text-emerald-600 bg-emerald-50 border-emerald-200'
      },
      pingBg: 'bg-emerald-400',
      hoverTitle: 'group-hover:text-emerald-500',
      footerSelect: 'text-emerald-555'
    }
  },
  automotive: {
    tag: "ROBOTICS",
    title: "6-Axis Assembly Robotics",
    description: "Robot joint gearboxes, painting line drives, and assembly cells. Optimized for testing high-precision harmonic gear fault diagnostic routines.",
    assetsCount: 3,
    icon: Cpu,
    colorClasses: {
      active: {
        dark: 'border-cyan-500 bg-cyan-950/15 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
        light: 'border-cyan-500 bg-cyan-50/20 shadow-md'
      },
      inactive: {
        dark: 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-purple-500/50 hover:bg-purple-950/[0.04]',
        light: 'border-slate-200 bg-slate-50/50 hover:border-purple-500 hover:bg-purple-50/20 shadow-sm'
      },
      iconColor: 'text-purple-400',
      tag: {
        dark: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
        light: 'text-purple-600 bg-purple-50 border-purple-200'
      },
      pingBg: 'bg-purple-400',
      hoverTitle: 'group-hover:text-purple-500',
      footerSelect: 'text-purple-555'
    }
  },
  blank: {
    tag: "BLANK_SPACE",
    title: "Truly Empty Workspace",
    description: "Initialize a completely blank dashboard. No pre-seeded machinery, telemetry streams, or graphs. Build your entire fleet from scratch.",
    assetsCount: 0,
    icon: Settings,
    colorClasses: {
      active: {
        dark: 'border-cyan-500 bg-cyan-950/15 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
        light: 'border-cyan-500 bg-cyan-50/20 shadow-md'
      },
      inactive: {
        dark: 'border-[#1b2336]/70 bg-[#05070a]/40 hover:border-slate-500/50 hover:bg-slate-950/[0.04]',
        light: 'border-slate-200 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50/20 shadow-sm'
      },
      iconColor: 'text-slate-400',
      tag: {
        dark: 'text-slate-400 bg-slate-500/10 border-slate-500/25',
        light: 'text-slate-650 bg-slate-50 border-slate-200'
      },
      pingBg: 'bg-slate-400',
      hoverTitle: 'group-hover:text-slate-400',
      footerSelect: 'text-slate-555'
    }
  }
};

export default function PresetCard({
  id,
  theme,
  selectedTemplateId,
  setSelectedTemplateId
}) {
  const config = CARD_CONFIGS[id];
  if (!config) return null;

  const IconComponent = config.icon;
  const isSelected = selectedTemplateId === id;
  const colors = config.colorClasses;

  return (
    <div 
      onClick={() => setSelectedTemplateId(id)}
      className={`border ${
        isSelected
          ? (theme === 'dark' ? colors.active.dark : colors.active.light)
          : (theme === 'dark' ? colors.inactive.dark : colors.inactive.light)
      } p-5 rounded-2xl hover:shadow-[0_0_30px_rgba(100,116,139,0.05)] cursor-pointer group transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px]`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <IconComponent className={`w-20 h-20 ${colors.iconColor}`} />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={`text-[9px] font-mono font-bold ${theme === 'dark' ? colors.tag.dark : colors.tag.light} px-2 py-0.5 rounded uppercase tracking-wider`}>
            {config.tag}
          </span>
          <span className={`h-1.5 w-1.5 rounded-full ${colors.pingBg} group-hover:animate-ping`}></span>
        </div>
        
        <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} ${colors.hoverTitle} transition-colors`}>
          {config.title}
        </h4>
        
        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-sans font-normal`}>
          {config.description}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-[#1b2336]/60 flex justify-between items-center font-mono text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <Database className="w-3 h-3" /> {config.assetsCount} pdm assets
        </span>
        <span className={`${colors.footerSelect} group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold`}>
          SELECT MODULE <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
