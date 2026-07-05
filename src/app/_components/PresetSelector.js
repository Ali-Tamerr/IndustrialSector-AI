"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import PresetCard from "./PresetCard";

export default function PresetSelector({
  theme,
  selectedTemplateId,
  setSelectedTemplateId,
  handleCreateProject
}) {
  const presetIds = ["steel", "petrochemical", "automotive", "blank"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {presetIds.map((id) => (
          <PresetCard
            key={id}
            id={id}
            theme={theme}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
          />
        ))}
      </div>

      {/* Provision Preset Action Button */}
      <div className="flex justify-end pt-4 border-t border-[#1b2336]/60">
        <button
          onClick={() => handleCreateProject("template")}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]"
        >
          <span>Create & Launch Preset Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
