/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from "motion/react";
import { CheckCircle2, ChevronRight, DraftingCompass, MapPin, Ruler, Wind, FileText, Download, AlertCircle, Wrench, Zap, Clock, ScanText, Search, Send, HelpCircle, Loader2 } from "lucide-react";
import { AirBalanceData } from "../types";
import { generateAirBalanceReport } from "../lib/pdfReport";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { cn } from "../lib/utils";
import { queryPDFReport } from "../lib/gemini";

interface DashboardProps {
  data: AirBalanceData;
  sourceFileName: string;
  onUpdateData?: (data: AirBalanceData) => void;
  fileCount?: number;
  hideAIAuditSections?: boolean;
  pdfBase64?: string | null;
}

export function Dashboard({ data, sourceFileName, onUpdateData, fileCount, hideAIAuditSections, pdfBase64 }: DashboardProps) {
  const [completedFindings, setCompletedFindings] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState('');
  const [isQuerying, setIsQuerying] = React.useState(false);
  const [queryResponse, setQueryResponse] = React.useState<{ q: string, a: string }[]>([]);

  const isMetric = data.projectIdentity.measurementUnits === 'Metric (L/s)';
  const convertToCfm = (ls: number) => ls * 2.119;

  const handleTaskToggle = (checklistIndex: number, taskId: string) => {
    if (!onUpdateData) return;

    const newData = { ...data };
    const checklist = newData.fieldStrategy.checklists[checklistIndex];
    if (checklist) {
      checklist.tasks = checklist.tasks.map(t => 
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      );
      onUpdateData(newData);
    }
  };

  const toggleCriticalDeficiency = (def: string) => {
    setCompletedFindings(prev => 
      prev.includes(def) ? prev.filter(d => d !== def) : [...prev, def]
    );
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !pdfBase64 || isQuerying) return;

    try {
      setIsQuerying(true);
      const question = query.trim();
      setQuery('');
      
      const response = await queryPDFReport(pdfBase64, question);
      setQueryResponse(prev => [{ q: question, a: response }, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsQuerying(false);
    }
  };

  const vavSummationData = data.equipmentSchedules?.vavSummation || { discrepancy: 0, mainUnitCfm: 0, totalVavCfm: 0, mathString: '' };
  
  // Safety check for CAV systems: If totalVavCfm is 0 but we have outlets, sum them up
  const allOutlets = data.equipmentSchedules?.units?.flatMap(u => u.outlets || []) || [];
  const calculatedOutletSum = allOutlets.reduce((acc, o) => acc + o.designVolume, 0);
  
  const totalSecondarySum = vavSummationData.totalVavCfm > 0 ? vavSummationData.totalVavCfm : calculatedOutletSum;
  const isCORSMode = data.projectIdentity.classification?.toLowerCase().includes('cav') || (vavSummationData.totalVavCfm === 0 && calculatedOutletSum > 0);
  
  const finalMathString = vavSummationData.mathString || (isCORSMode && allOutlets.length > 0 
    ? allOutlets.map(o => o.designVolume).join(' + ') + ` = ${calculatedOutletSum}`
    : 'Σ 0 = 0');

  const discrepancy = Math.abs(vavSummationData.mainUnitCfm - totalSecondarySum);
  const discrepancyPercent = vavSummationData.mainUnitCfm > 0 
    ? (discrepancy / vavSummationData.mainUnitCfm) * 100
    : 0;
  const hasMathError = discrepancyPercent > 2;
  const secondaryLabel = isCORSMode ? "Sum of Outlets" : "Terminal Box Sum";

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-end gap-4">
        <button
          onClick={() => generateAirBalanceReport(data, sourceFileName)}
          className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#141414] rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Export Technical Audit
        </button>
      </div>
      
      {data.executiveSummary && <ExecutiveSummary summary={data.executiveSummary} />}
      
      {/* Pre-Balance Readiness Summary */}
      {!hideAIAuditSections && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold font-serif tracking-tight text-white">Pre-TAB Readiness Audit</h2>
            <span className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
              (data.preBalanceReadiness?.criticalDeficiencies?.length || 0) > 0 ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
            )}>
              {(data.preBalanceReadiness?.criticalDeficiencies?.length || 0) > 0 ? "Deficiencies Found" : "System Clear"}
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className="text-zinc-400 leading-relaxed italic">
              {data.preBalanceReadiness?.systemOverview || "Extracted system overview for pre-balance readiness assessment."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(data.preBalanceReadiness?.checklist || []).map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-[#141414] border border-white/5 rounded-sm shadow-sm transition-hover hover:border-white/10">
                <div className={cn(
                  "p-1 rounded-full mt-0.5",
                  item.status === 'Ready' ? "bg-emerald-500/10 text-emerald-400" :
                  item.status === 'Caution' ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-500"
                )}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-zinc-200 uppercase tracking-tight">{item.item}</p>
                  <p className="text-[10px] text-zinc-500 leading-normal">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 border-l border-white/5 pl-8 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500">Critical Deficiencies</h3>
            <div className="space-y-3">
              {(data.preBalanceReadiness?.criticalDeficiencies || []).length > 0 ? (
                data.preBalanceReadiness?.criticalDeficiencies.map((def, i) => {
                  const isDone = completedFindings.includes(def);
                  return (
                    <div 
                      key={i} 
                      onClick={() => toggleCriticalDeficiency(def)}
                      className={cn(
                        "flex gap-3 items-start cursor-pointer transition-all",
                        isDone ? "text-zinc-600 grayscale opacity-40" : "text-red-400 group"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center mt-0.5",
                        isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-red-500/30 group-hover:border-red-400"
                      )}>
                        {isDone ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-3 h-3" />}
                      </div>
                      <p className={cn(
                        "text-[11px] leading-relaxed font-medium transition-all",
                        isDone ? "line-through" : ""
                      )}>
                        {def}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-[11px] text-zinc-600 italic">No critical deficiencies identified in the current documentation.</p>
              )}
            </div>
          </div>
          
          <div className="p-6 bg-zinc-900 border border-white/5 text-white rounded-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-50">Quick Site Strategy</h4>
            <ul className="space-y-3 text-[11px]">
               <li className="flex gap-2">
                 <span className="text-amber-400 font-bold">01.</span>
                 <span className="text-zinc-300">Verify RTU/AHU runtime first</span>
               </li>
               <li className="flex gap-2">
                 <span className="text-amber-400 font-bold">02.</span>
                 <span className="text-zinc-300">Confirm plenum seal integrity</span>
               </li>
               <li className="flex gap-2">
                 <span className="text-amber-400 font-bold">03.</span>
                 <span className="text-zinc-300">Begin terminal duct-walk</span>
               </li>
            </ul>
          </div>
        </div>
      </div>
      )}

      {/* 1. Project Identity - Column Layout */}
      <div className="border-t border-white/5 divide-y divide-white/5 text-[#F5F5F4]">
        <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start">
          <div className="col-span-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0">01. Project Identity</h3>
          </div>
          <div className="col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-12">
            <DataField label="Project Name" value={data.projectIdentity.projectName} />
            <DataField label="Project Location" value={data.projectIdentity.siteAddress} />
            <DataField label="Engineering Firm" value={data.projectIdentity.engineeringFirm} />
            <DataField label="System Type" value={data.projectIdentity.systemType} />
            <DataField label="System DNA" value={data.projectIdentity.classification} />
            <DataField label="Units" value={data.projectIdentity.measurementUnits} />
          </div>
        </div>

        {/* 2. Global Air Balance Table */}
        <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start">
          <div className="col-span-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0">02. Global Air Balance</h3>
          </div>
          <div className="col-span-3">
            <div className="border border-white/5 rounded-sm p-1 bg-[#141414] shadow-sm overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/5">
                  <tr className="text-zinc-500 uppercase text-[9px] tracking-wider">
                    <th className="p-3 font-bold text-center w-10">#</th>
                    <th className="p-3 font-bold">System Type</th>
                    <th className={cn("p-3 font-bold text-right", isMetric ? "w-24" : "w-32")}>Total Design Vol.</th>
                    <th className="p-3 font-bold text-right w-24">Total OA</th>
                    {isMetric && <th className="p-3 font-bold text-right text-amber-500 bg-amber-500/5 w-32">Equiv. CFM</th>}
                    <th className="p-3 font-bold text-right">Diversified Total</th>
                    <th className="p-3 font-bold">Audit / Calculation Note</th>
                    <th className="p-3 font-bold text-right">Discrepancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {(data.globalAirBalance?.systems || []).map((system, i) => {
                    const outletsVol = system.totalOutletsVolume || 0;
                    const variancePercent = system.totalDesignVolume > 0 ? Math.abs(((outletsVol - system.totalDesignVolume) / system.totalDesignVolume) * 100) : 0;
                    const isHighDiscrepancy = variancePercent > 5;

                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 text-center border-r border-white/5 font-mono text-zinc-500 text-[10px]">{i + 1}</td>
                        <td className="p-3 font-bold text-zinc-200 uppercase">{system.type}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#F5F5F4]">{system.totalDesignVolume.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-zinc-400">{system.totalOutdoorAirVolume?.toLocaleString() || '-'}</td>
                        {isMetric && (
                          <td className="p-3 text-right font-mono font-bold text-amber-500 bg-amber-500/5">
                            {Math.round(convertToCfm(system.totalDesignVolume)).toLocaleString()}
                          </td>
                        )}
                        <td className="p-3 text-right font-mono text-zinc-500">{system.diversifiedTotal?.toLocaleString() || '-'}</td>
                        <td className="p-3 text-zinc-500 italic max-w-xs truncate">{system.calculationNote}</td>
                        <td className={cn(
                          "p-3 text-right font-mono font-bold",
                          isHighDiscrepancy ? "text-red-400 bg-red-400/5" : "text-emerald-400"
                        )}>
                          {isHighDiscrepancy ? "DESIGN DISCREPANCY" : "PASSED"}
                          {outletsVol > 0 && <span className="block text-[9px] opacity-70">({variancePercent.toFixed(1)}% VAR)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 border border-blue-500/10 bg-blue-500/5 rounded-sm">
                <p className="text-[10px] text-blue-400 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  <span className="font-bold uppercase">Technical Note:</span> Automated verification compares schedule totals vs listed diffuser/grille tallies.
                </p>
            </div>
          </div>
        </div>

        {/* 12. Design Reconciliation Audit (Shop Drawings vs Schedules vs Outlets) */}
        {data.designReconciliation && (
          <div className="grid grid-cols-1 md:grid-cols-4 py-12 items-start border-t border-white/5 bg-blue-500/[0.02]">
            <div className="col-span-1">
              <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-400 mb-4 md:mb-0 flex items-center gap-2">
                <DraftingCompass className="w-3 h-3" />
                Cross-Reference Audit
              </h3>
            </div>
            <div className="col-span-3 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-black border border-white/5 rounded-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[9px] uppercase font-bold text-zinc-500">Mechanical Schedule</p>
                    <FileText className="w-3 h-3 text-zinc-700" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-white">{data.designReconciliation.scheduleDesignVolume.toLocaleString()}</span>
                    <span className="text-[10px] text-zinc-500">{isMetric ? 'L/s' : 'CFM'}</span>
                  </div>
                </div>
                <div className="p-6 bg-black border border-white/5 rounded-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[9px] uppercase font-bold text-zinc-500">Shop Drawings</p>
                    <Ruler className="w-3 h-3 text-zinc-700" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-white">
                      {data.designReconciliation.shopDrawingVolume?.toLocaleString() || 'N/A'}
                    </span>
                    <span className="text-[10px] text-zinc-500">{isMetric ? 'L/s' : 'CFM'}</span>
                  </div>
                </div>
                <div className="p-6 bg-black border border-white/5 rounded-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[9px] uppercase font-bold text-zinc-500">Plan Outlet Sum</p>
                    <Wind className="w-3 h-3 text-zinc-700" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-white">{data.designReconciliation.outletSumVolume.toLocaleString()}</span>
                    <span className="text-[10px] text-zinc-500">{isMetric ? 'L/s' : 'CFM'}</span>
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-8 rounded-sm border-l-4 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-xl",
                data.designReconciliation.status === 'Matched' ? "bg-emerald-500/5 border-emerald-500" :
                data.designReconciliation.status === 'Discrepancy' ? "bg-amber-500/5 border-amber-500" : "bg-red-500/5 border-red-500"
              )}>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      data.designReconciliation.status === 'Matched' ? "bg-emerald-500 text-white" :
                      data.designReconciliation.status === 'Discrepancy' ? "bg-amber-500 text-white" : "bg-red-500 text-white"
                    )}>
                      {data.designReconciliation.status}
                    </div>
                    <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Actual Design Air Volume</h4>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-mono font-bold text-teal-400 tracking-tighter">
                      {data.designReconciliation.reconciledVolume.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase">{isMetric ? 'L/s' : 'CFM'}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 italic">Determined by cross-referenced triangulation across all documentation.</p>
                </div>
                
                <div className="w-full lg:w-2/3 space-y-4">
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Audit Discrepancy Log</p>
                  <div className="space-y-2">
                    {data.designReconciliation.discrepancies.map((d, i) => (
                      <div key={i} className="flex flex-col gap-1 p-3 bg-black/40 border border-white/5 rounded-sm">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-3.5 h-3.5 text-zinc-500 mt-0.5" />
                          <p className="text-[11px] text-zinc-300 italic">"{d}"</p>
                        </div>
                        {data.designReconciliation?.visualJustification && (
                          <p className="text-[9px] text-blue-400 font-mono pl-6.5">
                            REF: {data.designReconciliation.visualJustification}
                          </p>
                        )}
                      </div>
                    ))}
                    {data.designReconciliation.discrepancies.length === 0 && (
                      <div className="flex items-center gap-2 text-emerald-500 p-2 text-[10px] font-bold uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        No Critical Discrepancies Found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB Specs & Logistics */}
        {!hideAIAuditSections && (
          <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start">
            <div className="col-span-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 mb-4 md:mb-0">03. Specs & Logistics</h3>
          </div>
          <div className="col-span-3 space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              <DataField label="Tolerance" value={data.tabSpecs.tolerances} />
              <DataField label="Certifications" value={data.tabSpecs.certifications} />
              <DataField label="Doc Ref" value={data.tabSpecs.sectionRef} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <div className={cn(
                  "p-4 border rounded-sm flex items-center justify-between",
                  data.tabSpecs.fireDamperDropTesting ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/5 opacity-50"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", data.tabSpecs.fireDamperDropTesting ? "bg-amber-500 animate-pulse" : "bg-zinc-600")} />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#F5F5F4]">Fire Damper Drop Testing</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] font-mono text-zinc-500">{data.tabSpecs.fireDamperDropTesting ? "REQUIRED" : "NOT SPECIFIED"}</span>
                    {data.tabSpecs.fireDamperCount !== undefined && data.tabSpecs.fireDamperCount > 0 && (
                      <span className="text-[8px] font-bold text-amber-500 uppercase tracking-tighter">Qty: {data.tabSpecs.fireDamperCount} Found</span>
                    )}
                  </div>
                </div>
                {data.tabSpecs.fireDamperLocations && data.tabSpecs.fireDamperLocations.length > 0 && (
                  <div className="p-3 bg-black/40 border border-white/5 rounded-sm max-h-32 overflow-y-auto">
                    <p className="text-[8px] uppercase font-bold text-zinc-600 mb-2 tracking-widest">Identified Damper Locations</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {data.tabSpecs.fireDamperLocations.map((loc, i) => (
                        <span key={i} className="text-[9px] text-amber-500/80 font-mono italic flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500/30" />
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className={cn(
                  "p-4 border rounded-sm flex items-center justify-between",
                  data.tabSpecs.soundReadingsRequired ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/5 opacity-50"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", data.tabSpecs.soundReadingsRequired ? "bg-blue-500 animate-pulse" : "bg-zinc-600")} />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#F5F5F4]">Sound Level NC Readings</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">{data.tabSpecs.soundReadingsRequired ? "REQUIRED" : "NOT SPECIFIED"}</span>
                </div>
                {data.tabSpecs.soundReadingLocations && data.tabSpecs.soundReadingLocations.length > 0 && (
                  <div className="p-3 bg-black/40 border border-white/5 rounded-sm max-h-32 overflow-y-auto">
                    <p className="text-[8px] uppercase font-bold text-zinc-600 mb-2 tracking-widest">Mandated Audit Areas</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {data.tabSpecs.soundReadingLocations.map((loc, i) => (
                        <span key={i} className="text-[9px] text-blue-500/80 font-mono italic flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-blue-500/30" />
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {data.tabSpecs.auditNotes && (
              <div className="p-4 bg-zinc-900 border border-white/5 rounded-sm">
                <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-2">Audit Special Notes</p>
                <p className="text-xs text-zinc-400 leading-relaxed italic">"{data.tabSpecs.auditNotes}"</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-8 border-t border-white/5">
              <div className="space-y-4">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Standard Instrumentation</p>
                <div className="flex flex-wrap gap-2">
                  {data.tabSpecs.instrumentation?.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/5 text-[10px] text-zinc-400 rounded-sm font-mono shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Field Tools Required</p>
                <div className="flex flex-wrap gap-2">
                  {(data.logistics?.toolsRequired || []).map((tool, i) => (
                    <span key={i} className="px-2 py-1 bg-[#141414] text-[#F5F5F4] text-[10px] rounded-sm flex items-center gap-1.5 shadow-md">
                      <Wrench className="w-3 h-3" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* 4. Schedules */}
        <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start">
          <div className="col-span-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0">04. Math Verification</h3>
          </div>
          <div className="col-span-3 space-y-8">
            <div className="border border-white/5 rounded-sm p-1 bg-[#141414] shadow-sm overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/5">
                  <tr className="text-zinc-500 uppercase text-[9px] tracking-wider">
                    <th className="p-3 font-bold">Equipment Tag</th>
                    <th className="p-3 font-bold text-right">Design Total ({isMetric ? 'L/s' : 'CFM'})</th>
                    <th className="p-3 font-bold text-right">Design OA ({isMetric ? 'L/s' : 'CFM'})</th>
                    {isMetric && <th className="p-3 font-bold text-right text-amber-500 bg-amber-500/5">Equiv. CFM (Total)</th>}
                    <th className="p-3 font-bold text-right">Static (w.c.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {data.equipmentSchedules?.units?.map((unit, i) => {
                    const isCritical = parseFloat(unit.staticPressure || "0") > 0.5;
                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-zinc-200 uppercase">{unit.tag}</span>
                            {unit.visualJustification && (
                              <span className="text-[9px] text-zinc-500 italic mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">
                                {unit.visualJustification}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-300">{(unit.designCfm || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-zinc-500">{(unit.outdoorAirCfm || 0).toLocaleString()}</td>
                        {isMetric && (
                          <td className="p-3 text-right font-mono font-bold text-amber-500 bg-amber-500/10 opacity-70">
                            {Math.round(convertToCfm(unit.designCfm || 0)).toLocaleString()}
                          </td>
                        )}
                        <td className={cn(
                          "p-3 text-right font-mono font-bold",
                          isCritical ? "text-amber-500 bg-amber-500/10" : "text-zinc-600"
                        )}>
                          {unit.staticPressure || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={cn(
                "p-8 rounded-sm border flex flex-col justify-between h-full shadow-lg",
                hasMathError ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"
              )}>
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    {hasMathError ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    <h4 className={cn("text-xs font-bold uppercase tracking-[0.2em]", hasMathError ? "text-red-400" : "text-emerald-400")}>
                      {hasMathError ? "Discrepancy Alarm" : "Volume Reconciliation Passed"}
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                       <span className="text-[10px] uppercase font-bold opacity-30 text-zinc-200">Main Unit Total ({isMetric ? 'L/s' : 'CFM'})</span>
                       <div className="text-right">
                         <span className="text-xl font-light font-mono block text-[#F5F5F4]">{vavSummationData.mainUnitCfm.toLocaleString()}</span>
                         {isMetric && <span className="text-[10px] font-mono text-zinc-500">({Math.round(convertToCfm(vavSummationData.mainUnitCfm)).toLocaleString()} CFM)</span>}
                       </div>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                       <span className="text-[10px] uppercase font-bold opacity-30 text-zinc-200">{secondaryLabel} ({isMetric ? 'L/s' : 'CFM'})</span>
                       <div className="text-right">
                         <span className="text-xl font-light font-mono block text-[#F5F5F4]">{totalSecondarySum.toLocaleString()}</span>
                         {isMetric && <span className="text-[10px] font-mono text-zinc-500">({Math.round(convertToCfm(totalSecondarySum)).toLocaleString()} CFM)</span>}
                       </div>
                    </div>
                    <div className="py-2 border-b border-white/10">
                       <p className="text-[9px] uppercase font-bold text-teal-500 mb-1">Reconciliation Math</p>
                       <p className="text-xs font-mono text-teal-400 font-bold tracking-tight">Σ {finalMathString}</p>
                    </div>
                    <div className="flex justify-between items-baseline pt-4">
                       <span className="text-[10px] uppercase font-bold opacity-80 text-zinc-200">Variance ({isMetric ? 'L/s' : 'CFM'})</span>
                       <div className="text-right">
                         <span className="text-2xl font-bold font-mono tracking-tighter block text-teal-400">{discrepancy.toLocaleString()}</span>
                         {isMetric && <span className="text-[10px] font-mono text-amber-500 font-bold opacity-80">({Math.round(convertToCfm(discrepancy)).toLocaleString()} CFM)</span>}
                       </div>
                    </div>
                  </div>
                </div>
                <p className="mt-8 text-[10px] leading-relaxed italic opacity-40 text-zinc-400">
                  {vavSummationData.mathNote}
                </p>
              </div>
              
              <div className="bg-white/[0.02] border border-white/5 p-8 rounded-sm">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Unit Reference Audit</h4>
                 <div className="space-y-4">
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "All units identified in schedules are cross-referenced for design air volume integrity. Any units lacking documented discharge totals are flagged for field verification."
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                       <div className="space-y-1">
                          <p className="text-[9px] uppercase font-bold text-zinc-600">Total Units</p>
                          <p className="text-lg font-mono font-bold text-zinc-200">{(data.equipmentSchedules?.units || []).length}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] uppercase font-bold text-zinc-600">Avg. Unit ESP</p>
                          <p className="text-lg font-mono font-bold text-zinc-200">
                            { (data.equipmentSchedules?.units?.reduce((acc, u) => acc + parseFloat(u.staticPressure || "0"), 0) / (data.equipmentSchedules?.units?.length || 1)).toFixed(2) }
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Shop Drawings */}
        {!hideAIAuditSections && (
          <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start border-b border-white/5">
            <div className="col-span-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0">05. Shop Drawings</h3>
          </div>
          <div className="col-span-3">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm flex items-start gap-4">
                  <DraftingCompass className="w-5 h-5 text-zinc-500 mt-1" />
                  <div className="space-y-2">
                    <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Submittal Status</p>
                    <p className="text-sm font-medium italic text-zinc-400">
                      {data.shopDrawings?.crossRefDetails || "Submittal cross-reference data not extracted."}
                    </p>
                    <div className="flex gap-2 mt-4">
                       <span className={cn(
                         "px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm border",
                         data.shopDrawings?.confirmsDesign ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-800 border-white/5 text-zinc-500"
                       )}>
                         {data.shopDrawings?.confirmsDesign ? "Design Confirmed" : "Verification Pending"}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                   <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Physical Constraints</p>
                   <div className="flex flex-wrap gap-2">
                      {(data.shopDrawings?.physicalConstraints || []).map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-white/[0.05] border border-white/5 text-[10px] text-zinc-400 rounded-sm">
                          {c}
                        </span>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
        )}

        {/* 6. Diversity Audit */}
        <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start border-b border-white/5">
          <div className="col-span-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0">06. Diversity Audit</h3>
          </div>
          <div className="col-span-3">
            {data.diversityAudit ? (
              <div className={cn(
                "p-8 rounded-sm border-l-4 grid grid-cols-1 md:grid-cols-3 gap-8",
                data.diversityAudit.isFlagged ? "bg-red-500/5 border-red-500" : "bg-emerald-500/5 border-emerald-500"
              )}>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Outlet Peak vs Capacity</p>
                  <p className="text-3xl font-mono font-bold tracking-tighter text-[#F5F5F4]">
                    { (data.diversityAudit.ratio * 100).toFixed(1) }%
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Max: {data.diversityAudit.totalOutletPeak.toLocaleString()} / Unit: {data.diversityAudit.unitCapacity.toLocaleString()}
                  </p>
                </div>
                <div className="md:col-span-2 space-y-4">
                   <div className="flex items-center gap-2">
                     {data.diversityAudit.isFlagged ? (
                       <AlertCircle className="w-4 h-4 text-red-500" />
                     ) : (
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     )}
                     <span className="text-[10px] font-bold uppercase tracking-widest">
                       {data.diversityAudit.isFlagged ? "Diversity Warning" : "Compliant Sequence"}
                     </span>
                   </div>
                   <p className="text-sm italic text-zinc-400 leading-relaxed capitalize">
                     {data.diversityAudit.diversityNote || "Diversity within standard operating parameters."}
                   </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600 italic">Diversity audit data restricted or unavailable.</p>
            )}
          </div>
        </div>

        {/* 7. Pressure Path */}
        <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start border-b border-white/5">
          <div className="col-span-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0">07. Pressure Path</h3>
          </div>
          <div className="col-span-3 flex flex-col md:flex-row gap-12">
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <DataField label="Design ESP Rating" value={data.pressurePath?.espRating} />
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Bottleneck Risk</p>
                  <span className={cn(
                    "inline-block mt-1 px-3 py-1 rounded-sm text-[10px] font-bold uppercase",
                    data.pressurePath?.bottleneckRisk === 'High' ? "bg-red-600 text-white" :
                    data.pressurePath?.bottleneckRisk === 'Medium' ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                  )}>
                    {data.pressurePath?.bottleneckRisk || 'Unrated'}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                 <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Complexity Anomalies</p>
                 <ul className="space-y-2">
                    {(data.pressurePath?.complexityNotes || []).map((note, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-1.5 flex-shrink-0" />
                        {note}
                      </li>
                    ))}
                 </ul>
              </div>
            </div>
            <div className="w-full md:w-64 bg-white/5 p-6 border border-white/5">
               <h4 className="text-[9px] font-bold uppercase tracking-widest mb-4 text-[#F5F5F4]">ESP Safeguard</h4>
               <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                 Main unit ESP cross-checked against branch resistance. Bottleneck risks are flagged based on total equivalent length vs static pressure capability.
               </p>
            </div>
          </div>
        </div>

        {/* 8. Hardware Index */}
        {!hideAIAuditSections && (
          <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start border-b border-white/5">
            <div className="col-span-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0">08. Hardware Index</h3>
          </div>
          <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
               <div>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Manual Volume Dampers (MVDs)</p>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-sm text-[10px] font-bold uppercase border",
                      data.hardwareIndex?.mvdStatus === 'Present' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      data.hardwareIndex?.mvdStatus === 'Partial' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                      <Zap className="w-3.5 h-3.5" />
                      {data.hardwareIndex?.mvdStatus || 'Not Detected'}
                    </div>
                  </div>
               </div>
                <div className="space-y-3">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Consolidated Manufacturers</p>
                  <div className="flex flex-wrap gap-2">
                    {(data.hardwareIndex?.manufacturers || []).map((m, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 border border-white/5 text-[10px] text-zinc-300 rounded-sm font-mono">
                        {m}
                      </span>
                    ))}
                    {(!data.hardwareIndex?.manufacturers || data.hardwareIndex.manufacturers.length === 0) && (
                      <span className="text-[10px] text-zinc-600 italic">No manufacturers identified in batch.</span>
                    )}
                  </div>
                </div>
               <div className="space-y-3">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Traverse Point Protocols</p>
                  <div className="space-y-2">
                    {(data.hardwareIndex?.traversePoints || []).map((pt, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-sm">
                        <Wind className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[11px] font-mono font-bold tracking-tight text-zinc-200">{pt}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
            <div className="bg-[#141414] p-8 text-white rounded-sm space-y-4 border border-white/5">
               <div className="flex items-center gap-2 opacity-30">
                 <Ruler className="w-4 h-4" />
                 <span className="text-[9px] uppercase font-bold tracking-widest">Hardware Note</span>
               </div>
               <p className="text-sm font-light italic leading-relaxed text-zinc-300">
                 {data.hardwareIndex?.hardwareNotes || "No specific hardware anomalies or mounting constraints identified."}
               </p>
            </div>
          </div>
        </div>
        )}

        {/* 9. Strategy */}
        {!hideAIAuditSections && (
          <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start border-b border-white/5">
            <div className="col-span-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0">09. Field Tactics</h3>
          </div>
          <div className="col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="p-6 bg-zinc-900 border border-white/5 text-white rounded-sm shadow-xl relative overflow-hidden">
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 opacity-50" />
                      <span className="text-[10px] uppercase font-bold tracking-[0.3em]">First-Hour Strategy</span>
                   </div>
                   <p className="text-sm leading-relaxed serif-italic font-medium text-zinc-200">
                     "{data.fieldStrategy?.firstHourStrategy || "No strategy defined."}"
                   </p>
                 </div>
                 <div className="absolute top-0 right-0 p-2 opacity-10 italic text-[80px] font-serif select-none pointer-events-none">
                   05
                 </div>
              </div>
              <div className="space-y-4">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Full Sequence of Operations</p>
                <div className="space-y-3">
                  {(data.fieldStrategy?.balancingSequences || []).map((s, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <span className="text-[10px] font-mono text-zinc-500 group-hover:text-white transition-colors">{ (i+1).toString().padStart(2, '0') }.</span>
                      <p className="text-[12px] text-zinc-500 leading-normal group-hover:text-zinc-200 transition-colors">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Submittal Cross-Ref</p>
                <div className="p-4 border border-white/5 rounded-sm bg-white/5 flex items-start gap-3">
                  <DraftingCompass className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                    {data.shopDrawings?.crossRefDetails || "Cross-reference data unavailable."}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Critical Path Units</p>
                <div className="flex flex-wrap gap-2">
                  {(data.logistics?.criticalPaths || []).map((cp, i) => (
                    <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold rounded-sm">
                      {cp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Checklists */}
              {(data.fieldStrategy?.checklists || []).length > 0 && (
                <div className="space-y-6 pt-4">
                  {(data.fieldStrategy.checklists).map((list, li) => (
                    <div key={li} className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5F5F4] border-l-2 border-amber-400 pl-3">
                        {list.title}
                      </p>
                      <div className="space-y-2">
                        {list.tasks.map((task) => (
                          <div 
                            key={task.id} 
                            onClick={() => handleTaskToggle(li, task.id)}
                            className="flex items-center gap-3 p-3 bg-[#141414] border border-white/5 rounded-sm cursor-pointer hover:border-white/20 transition-all group"
                          >
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                              task.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-700 bg-black group-hover:border-zinc-500"
                            )}>
                              {task.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <span className={cn(
                              "text-xs transition-all",
                              task.isCompleted ? "text-zinc-600 line-through" : "text-zinc-400"
                            )}>
                              {task.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* 6. Field Data Sheets (Outlet Sheets) */}
        {!hideAIAuditSections && (
          <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start border-b border-white/5">
            <div className="col-span-1">
              <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0">06. Field Data Sheets</h3>
            </div>
            <div className="col-span-3 space-y-16">
              {(data.equipmentSchedules?.units || []).filter(u => u.outlets && u.outlets.length > 0).map((unit, i) => {
                const totalOutletVol = unit.outlets?.reduce((acc, o) => acc + (o.designVolume * (o.quantity || 1)), 0) || 0;
                const unitVariance = unit.designCfm > 0 ? Math.abs(((totalOutletVol - unit.designCfm) / unit.designCfm) * 100) : 0;
                const hasTerminalDiscrepancy = unitVariance > 5;

                return (
                  <div key={i} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                         <FileText className="w-5 h-5 text-zinc-500" />
                         <h4 className="text-lg font-bold font-mono tracking-tighter text-[#F5F5F4]">{unit.tag} Outlet Sheet</h4>
                      </div>
                      <div className={cn(
                        "px-3 py-1 text-[10px] font-bold uppercase rounded-full",
                        hasTerminalDiscrepancy ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {hasTerminalDiscrepancy ? "Variation Flagged" : "Balanced Design"}
                      </div>
                    </div>

                    <div className="border border-white/5 rounded-sm p-1 bg-[#141414] shadow-sm overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-white/5">
                          <tr className="text-zinc-500 uppercase text-[9px] tracking-wider font-bold">
                            <th className="p-3 w-20">Outlet #</th>
                            <th className="p-3">Register Type</th>
                            <th className="p-3">Manufacturer</th>
                            <th className="p-3">Duct Size</th>
                            <th className="p-3 text-right">Design ({isMetric ? 'L/s' : 'CFM'})</th>
                            <th className="p-3 w-32 border-l border-white/5 bg-white/5">Field Reading</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                          {unit.outlets?.map((outlet, oi) => (
                            <tr key={oi} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col">
                                    <span className="font-mono text-zinc-500 font-bold">{outlet.outletNumber}</span>
                                    {outlet.visualJustification && (
                                      <span className="text-[8px] text-zinc-600 italic mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]" title={outlet.visualJustification}>
                                        {outlet.visualJustification}
                                      </span>
                                    )}
                                  </div>
                                  {(outlet.quantity || 1) > 1 && (
                                    <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-bold rounded-[2px]" title={`${outlet.quantity} devices at this location`}>
                                      {outlet.quantity}x
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-zinc-300 font-medium">{outlet.registerType || '-'}</td>
                              <td className="p-3 text-zinc-400 italic text-[10px] font-mono">{outlet.manufacturer || '-'}</td>
                              <td className="p-3 text-zinc-500 font-mono">{outlet.ductSize || '-'}</td>
                              <td className="p-3 text-right font-mono font-bold text-white">
                                {((outlet.quantity || 1) * outlet.designVolume).toLocaleString()}
                                {(outlet.quantity || 1) > 1 && (
                                  <div className="text-[9px] text-zinc-500 font-normal">
                                    ({outlet.quantity} @ {outlet.designVolume})
                                  </div>
                                )}
                              </td>
                              <td className="p-3 border-l border-white/5 bg-black/20 text-zinc-700 italic text-[10px] text-center">
                                ________________
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-white/5">
                          <tr className="border-t-2 border-white/5 font-bold">
                            <td colSpan={4} className="p-3 text-right uppercase text-[9px] tracking-widest text-zinc-500">Total System Design</td>
                            <td className="p-3 text-right font-mono text-base text-white">{totalOutletVol.toLocaleString()}</td>
                            <td className="bg-black/40"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="flex gap-12 items-start bg-black p-6 rounded-sm text-[#F5F5F4] border-t-2 border-amber-500/30">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold text-amber-500">Unit Discharge Total</p>
                        <p className="text-xl font-mono font-bold">{unit.designCfm.toLocaleString()} <span className="text-[10px] font-normal opacity-40">{isMetric ? 'L/s' : 'CFM'}</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold">Sum of Outlets</p>
                        <p className="text-xl font-mono font-bold">{totalOutletVol.toLocaleString()} <span className="text-[10px] font-normal opacity-40">{isMetric ? 'L/s' : 'CFM'}</span></p>
                      </div>
                      <div className="space-y-1 flex-grow">
                        <p className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold">Discrepancy Audit</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className={cn(
                            "text-xl font-mono font-bold",
                            hasTerminalDiscrepancy ? "text-red-400" : "text-emerald-400"
                          )}>
                            {unitVariance.toFixed(1)}%
                          </p>
                          <span className={cn(
                            "px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm border",
                            hasTerminalDiscrepancy 
                              ? "bg-red-400/10 border-red-400/30 text-red-400" 
                              : "bg-emerald-400/10 border-emerald-400/30 text-emerald-400"
                          )}>
                            {hasTerminalDiscrepancy ? "Design Failure" : "Passed"}
                          </span>
                        </div>
                        {unit.outletMathString && (
                          <p className="text-[10px] font-mono text-zinc-500 mt-2 font-bold tracking-tight">Σ {unit.outletMathString}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* 10. Technical OCR Discovery Feed */}
      <div className="grid grid-cols-1 md:grid-cols-4 py-8 items-start border-t border-white/5 bg-zinc-900/10 -mx-6 px-6">
        <div className="col-span-1">
          <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0 flex items-center gap-2">
            <ScanText className="w-3 h-3" />
            10. OCR Technical Feed
          </h3>
        </div>
        <div className="col-span-3 space-y-8">
           <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-sm">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-emerald-400" />
                <p className="text-[9px] uppercase font-bold text-emerald-400 tracking-widest">Document DNA Discovery</p>
              </div>
              <p className="text-sm italic leading-relaxed text-zinc-300">
                {data.ocrInsight || "Analysis of document structure identifies high-confidence schedule blocks and technical note clusters."}
              </p>
           </div>
           
           <div className="space-y-4">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Extracted Data Transcript (OCR Feed)</p>
              <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-sm max-h-[400px] overflow-y-auto custom-scrollbar">
                <pre className="text-[11px] font-mono leading-relaxed text-zinc-500 whitespace-pre-wrap break-words">
                  {data.rawTextFeed || "The OCR engine is processing the vision-based transcript. Significant technical data points have been mapped to the audit sections above."}
                </pre>
              </div>
              <p className="text-[9px] text-zinc-600 italic">
               Note: This transcript is an extraction of technical schedules, legend blocks, and specification snippets used for cross-reference.
             </p>
          </div>
       </div>
    </div>

    {/* 11. PDF Deep Query - Interactive Inquiry */}
    {pdfBase64 && !hideAIAuditSections && (
      <div className="grid grid-cols-1 md:grid-cols-4 py-12 items-start border-t border-white/5">
        <div className="col-span-1">
          <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-4 md:mb-0 flex items-center gap-2">
            <HelpCircle className="w-3 h-3" />
            11. PDF Deep Query
          </h3>
        </div>
        <div className="col-span-3 space-y-8">
          <div className="bg-[#141414] border border-white/5 rounded-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Interactive PDF Inquiry</h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Query unit identification, procedures, or spec details</p>
              </div>
            </div>

            <form onSubmit={handleQuery} className="relative mb-8">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about specific units, procedures, or items in the drawing..."
                className="w-full bg-black border border-white/10 rounded-sm py-4 px-6 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-all pr-12"
                disabled={isQuerying}
              />
              <button
                type="submit"
                disabled={isQuerying || !query.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white disabled:opacity-30 transition-all"
              >
                {isQuerying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>

            <div className="space-y-6">
              {queryResponse.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/5 rounded-sm">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">No Inquiries Yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {queryResponse.map((res, i) => (
                    <div key={i} className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[9px] font-bold text-zinc-400">Q</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-300 italic pt-1">"{res.q}"</p>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-sm">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <DraftingCompass className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-xs leading-relaxed text-zinc-400 prose prose-invert max-w-none">
                          {res.a.split('\n').map((line, idx) => (
                            <p key={idx} className={idx > 0 ? "mt-2" : ""}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {['Find AHU-1 specs', 'Show Fire Damper notes', 'What is the ESP for exhaust fans?', 'Identify MVD locations'].map((hint) => (
              <button
                key={hint}
                onClick={() => setQuery(hint)}
                className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-sm text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-all"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-white/5 rounded-sm overflow-hidden shadow-xl h-full transition-all hover:border-white/10">
      <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
        {icon}
        <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">{title}</h4>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{label}</p>
      <p className="text-sm text-[#F5F5F4] font-medium leading-tight">
        {value || <span className="opacity-20 italic font-normal text-zinc-400">Not Specified</span>}
      </p>
    </div>
  );
}
