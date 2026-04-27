/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  AlertCircle,
  ArrowRight,
  Target,
  PenTool,
  BrainCircuit,
  MessageSquare,
  FileSpreadsheet
} from 'lucide-react';
import { AirBalanceData, ExcelAuditReport, ExcelFinding, ExecutiveSummary as ExecutiveSummaryType } from '../types';
import { ExecutiveSummary } from './ExecutiveSummary';
import { cn } from '../lib/utils';

interface ExcelAuditViewProps {
  data: AirBalanceData;
  excelData: any[]; // The raw JSON from parseExcelFile
}

export function ExcelAuditView({ data, excelData }: ExcelAuditViewProps) {
  const audit = data.excelAudit;
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [highlightedCell, setHighlightedCell] = useState<string | null>(null);
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [completedSpellingExtras, setCompletedSpellingExtras] = useState<number[]>([]);
  const [completedFindings, setCompletedFindings] = useState<number[]>([]);

  if (!audit) return null;

  const currentSheet = excelData[activeSheetIndex];
  
  const toggleQuestion = (idx: number) => {
    setCompletedQuestions(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const toggleSpelling = (idx: number) => {
    setCompletedSpellingExtras(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const toggleFinding = (idx: number) => {
    setCompletedFindings(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const getCellIssue = (sheetName: string, rowIndex: number, colIndex: number) => {
    const colLetter = String.fromCharCode(65 + colIndex);
    const coord = `${sheetName}!${colLetter}${rowIndex + 1}`;
    
    const finding = audit.findings.find(f => f.location.includes(coord) || f.location.toLowerCase().includes(coord.toLowerCase()));
    const suggestion = audit.suggestedChanges.find(s => s.location.includes(coord) || s.location.toLowerCase().includes(coord.toLowerCase()));
    
    return { finding, suggestion, coord };
  };

  const navigateToCell = (location: string) => {
    // Expected format: "SheetName!B5" or similar
    const match = location.match(/^(.*)!([A-Z]+)(\d+)$/);
    if (!match) return;

    const [_, sheetName, colLetter, rowNum] = match;
    const sheetIdx = excelData.findIndex(s => s.name === sheetName);
    
    if (sheetIdx !== -1) {
      setActiveSheetIndex(sheetIdx);
      const cIdx = colLetter.charCodeAt(0) - 65;
      const rIdx = parseInt(rowNum) - 1;
      const cellId = `cell-${sheetName}-${rIdx}-${cIdx}`;
      const coord = `${sheetName}!${colLetter}${rowNum}`;

      setHighlightedCell(coord);
      
      setTimeout(() => {
        const el = document.getElementById(cellId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, 100);

      // Remove highlight after some time
      setTimeout(() => setHighlightedCell(null), 3000);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Executive Summary Section */}
      {audit.executiveSummary && (
        <ExecutiveSummary summary={audit.executiveSummary} />
      )}

      {/* 1. Executive Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          icon={<BrainCircuit className="w-4 h-4 text-emerald-400" />}
          label="Engineering Score"
          value={`${audit.summary.engineeringScore}/100`}
          subValue={audit.summary.overallStatus}
        />
        <SummaryCard 
          icon={<Target className="w-4 h-4 text-amber-400" />}
          label="Tolerance Audit"
          value={audit.findings.filter(f => f.type === 'Tolerance').length.toString()}
          subValue="Anomalies Identified"
        />
        <SummaryCard 
          icon={<Search className="w-4 h-4 text-blue-400" />}
          label="QA Coverage"
          value={audit.summary.totalCheckedCells.toLocaleString()}
          subValue="Points Scanned"
        />
        <SummaryCard 
          icon={<AlertCircle className="w-4 h-4 text-red-400" />}
          label="Action Required"
          value={audit.summary.issuesFound.toString()}
          subValue="Unique Discrepancies"
        />
      </div>

      {/* 2. Marked-up Excel Render */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 flex items-center gap-2">
              <FileSpreadsheet className="w-3 h-3" />
              Technical Markup Render
            </h3>
            <div className="flex bg-zinc-900 overflow-hidden border border-white/5 rounded-sm">
              {excelData.map((sheet, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSheetIndex(idx)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                    activeSheetIndex === idx 
                      ? "bg-zinc-100 text-black" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {sheet.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
             <LegendItem color="bg-red-500/40" label="Hard Failure" />
             <LegendItem color="bg-orange-500/30" label="Audit Finding" />
             <LegendItem color="bg-blue-500/60" label="Proposed Fix" />
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 overflow-x-auto custom-scrollbar rounded-sm max-h-[600px]">
          <table className="w-full border-collapse">
            <tbody>
              {currentSheet?.data?.map((row: any[], rIdx: number) => (
                <tr key={rIdx} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                  <td className="w-10 bg-zinc-900/50 text-[9px] font-mono text-zinc-600 text-center border-r border-white/5 sticky left-0 z-10">
                    {rIdx + 1}
                  </td>
                  {row.map((cell, cIdx) => {
                    const { finding, suggestion, coord } = getCellIssue(currentSheet.name, rIdx, cIdx);
                    const isHighlighted = highlightedCell === coord;
                    
                    return (
                      <td 
                        key={cIdx} 
                        id={`cell-${currentSheet.name}-${rIdx}-${cIdx}`}
                        className={cn(
                          "px-4 py-2 text-xs font-mono border-r border-white/[0.02] min-w-[120px] relative group transition-all duration-300",
                          cell === null || cell === undefined ? "text-zinc-800" : "text-zinc-400",
                          finding?.severity === 'Critical' ? "bg-red-500/30 text-red-100 ring-1 ring-red-500/50" :
                          finding?.severity === 'High' ? "bg-orange-500/25 text-orange-100 ring-1 ring-orange-500/30" :
                          finding ? "bg-orange-500/10 text-orange-200" : 
                          suggestion ? "bg-blue-500/10 border-l-2 border-l-blue-500/50" : "",
                          isHighlighted ? "ring-2 ring-blue-500 ring-inset bg-blue-500/30 z-10 scale-[1.02]" : "",
                          finding?.severity === 'Critical' && "animate-pulse"
                        )}
                      >
                        {cell}
                        
                        {/* Hover Tooltip for Markup */}
                        {(finding || suggestion) && (
                          <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible z-50 w-64 bg-zinc-900 border border-white/10 rounded p-3 shadow-2xl backdrop-blur-xl">
                            {finding && (
                              <div className="space-y-1 mb-2">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className={cn("w-3 h-3", finding.severity === 'Critical' ? "text-red-400" : "text-amber-400")} />
                                  <span className="text-[9px] uppercase font-bold tracking-wider">{finding.type}</span>
                                </div>
                                <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">{finding.message}</p>
                              </div>
                            )}
                            {suggestion && (
                              <div className="pt-2 border-t border-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                  <PenTool className="w-3 h-3 text-blue-400" />
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400">Proposed Change</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono">
                                   <span className="text-zinc-500 line-through">{suggestion.originalValue}</span>
                                   <ArrowRight className="w-2 h-2 text-zinc-600" />
                                   <span className="text-emerald-400 font-bold">{suggestion.proposedValue}</span>
                                </div>
                                <p className="text-[9px] text-zinc-500 mt-1">{suggestion.reason}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Spelling & Punctuation Audit */}
      {audit.spellingAndPunctuationIssues && audit.spellingAndPunctuationIssues.length > 0 && (
        <div className="space-y-6 pt-4">
          <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <PenTool className="w-3 h-3" />
            Spelling & Punctuation Cleanup
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audit.spellingAndPunctuationIssues.map((issue, idx) => {
              const isDone = completedSpellingExtras.includes(idx);
              const issueObj = typeof issue === 'string' ? { message: issue, location: 'Unknown' } : issue;
              return (
                <div 
                  key={idx}
                  className={cn(
                    "text-left p-4 bg-[#141414] border rounded-sm flex items-start gap-3 transition-all group",
                    isDone ? "opacity-30 border-white/5" : "border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5"
                  )}
                >
                  <button 
                    onClick={() => toggleSpelling(idx)}
                    className={cn(
                      "flex-shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center mt-0.5 transition-all",
                      isDone ? "bg-emerald-500 border-emerald-500" : "border-zinc-800 bg-black group-hover:border-orange-500"
                    )}
                  >
                    {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{issueObj.location}</span>
                      {issueObj.location !== 'Unknown' && (
                        <button 
                          onClick={() => navigateToCell(issueObj.location)}
                          className="invisible group-hover:visible"
                        >
                          <Target className="w-2.5 h-2.5 text-zinc-600 hover:text-blue-400" />
                        </button>
                      )}
                    </div>
                    <p className={cn(
                      "text-xs leading-relaxed transition-all",
                      isDone ? "text-zinc-600 line-through" : "text-zinc-300 font-medium"
                    )}>
                      {issueObj.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Actionable Finding Feed */}
      <div className="space-y-6">
         <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3" />
          Technical Deficiencies (Audit Log)
        </h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {audit.findings.map((finding, idx) => {
              const isDone = completedFindings.includes(idx);
              return (
                <div 
                  key={idx}
                  className={cn(
                    "w-full p-3 rounded-sm border-l-2 flex gap-3 transition-all group",
                    isDone ? "opacity-40 border-zinc-800" : "hover:bg-zinc-800",
                    !isDone && finding.severity === 'Critical' ? "bg-red-500/5 border-red-500/40" :
                    !isDone && finding.severity === 'High' ? "bg-orange-500/10 border-orange-500/40" :
                    "bg-zinc-900/50 border-zinc-700"
                  )}
                >
                  <button 
                    onClick={() => toggleFinding(idx)}
                    className={cn(
                      "flex-shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center mt-0.5 transition-all cursor-pointer",
                      isDone ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 bg-black hover:border-zinc-500"
                    )}
                  >
                    {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>
                  <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => navigateToCell(finding.location)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                          {finding.location}
                        </span>
                        <Target className="w-2 h-2 text-zinc-700 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-widest",
                        finding.severity === 'Critical' ? "bg-red-500 text-white" :
                        finding.severity === 'High' ? "bg-orange-500 text-white" :
                        "bg-zinc-800 text-zinc-400"
                      )}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs font-medium transition-all",
                      isDone ? "text-zinc-500 line-through" : "text-zinc-300"
                    )}>
                      {finding.message}
                    </p>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{finding.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

    </div>
  );
}

function SummaryCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue: string }) {
  return (
    <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-sm group hover:border-white/10 transition-all">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 group-hover:text-zinc-400">{label}</span>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-light text-[#F5F5F4] font-mono">{value}</p>
        <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">{subValue}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-3 h-3 rounded-full", color)}></div>
      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">{label}</span>
    </div>
  );
}
