/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileUp, Loader2, AlertCircle, RefreshCw, DraftingCompass, Wind, Ruler } from 'lucide-react';
import { analyzeAirBalancePDF } from './lib/gemini';
import { fileToBase64 } from './lib/utils';
import { AirBalanceData, ExtractionStatus } from './types';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AirBalanceData | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");

  const stages = [
    { threshold: 20, text: "Indexing technical metadata..." },
    { threshold: 40, text: "Extracting Section 23 05 93 specs..." },
    { threshold: 60, text: "Reconciling terminal unit math..." },
    { threshold: 80, text: "Compiling field strategy tactics..." },
    { threshold: 100, text: "Finalizing audit report..." },
  ];

  const processFiles = async (filesToProcess: File[]) => {
    if (filesToProcess.length === 0) return;
    
    const pdfs = filesToProcess.filter(f => f.type === 'application/pdf');
    if (pdfs.length === 0) {
      setError('No valid PDF files found.');
      return;
    }

    try {
      setStatus('loading');
      setError(null);
      setFiles(pdfs);
      setProgress(0);
      
      let mergedData: AirBalanceData | null = null;

      for (let i = 0; i < pdfs.length; i++) {
        const file = pdfs[i];
        const baseProgress = (i / pdfs.length) * 100;
        const nextBaseProgress = ((i + 1) / pdfs.length) * 100;
        
        setProgressStage(`Analyzing ${file.name} (${i + 1}/${pdfs.length})`);
        
        const base64 = await fileToBase64(file);
        const result = await analyzeAirBalancePDF(base64);
        
        if (!mergedData) {
          mergedData = result;
        } else {
          // Merge logic
          mergedData = mergeAirBalanceData(mergedData, result);
        }
        
        setProgress(nextBaseProgress);
      }
      
      setProgressStage("Audit Complete");
      setTimeout(() => {
        setData(mergedData);
        setStatus('success');
      }, 500);
    } catch (err: any) {
      console.error(err);
      let userMessage = err.message || 'An error occurred during analysis.';
      
      const isQuotaError = userMessage.includes('429') || 
                         userMessage.includes('RESOURCE_EXHAUSTED') || 
                         userMessage.includes('quota');
                         
      if (isQuotaError) {
        userMessage = "API Quota Exceeded. The batch is too large or too frequent for the current Gemini tier. Please wait 60 seconds and try processing in smaller batches.";
      }

      setError(userMessage);
      setStatus('error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const items = Array.from(e.dataTransfer.items);
    const gatheredFiles: File[] = [];

    const traverseEntry = async (entry: any) => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => entry.file(resolve));
        if (file.type === 'application/pdf') gatheredFiles.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise<any[]>((resolve) => reader.readEntries(resolve));
        for (const childEntry of entries) {
          await traverseEntry(childEntry);
        }
      }
    };

    for (const item of items) {
      const entry = (item as any).webkitGetAsEntry();
      if (entry) await traverseEntry(entry);
    }

    processFiles(gatheredFiles);
  };

  const mergeAirBalanceData = (existing: AirBalanceData, newData: AirBalanceData): AirBalanceData => {
    return {
      ...existing,
      // Prefer project identity from first file, but update if new one is more complete
      projectIdentity: {
        ...existing.projectIdentity,
        projectName: existing.projectIdentity.projectName || newData.projectIdentity.projectName,
        siteAddress: existing.projectIdentity.siteAddress || newData.projectIdentity.siteAddress,
      },
      // Merge equipment
      equipmentSchedules: {
        ...existing.equipmentSchedules,
        units: [
          ...existing.equipmentSchedules.units,
          ...newData.equipmentSchedules.units.filter(u => 
            !existing.equipmentSchedules.units.some(eu => eu.tag === u.tag)
          )
        ],
        // Re-calculate summation if needed or just use current if it's more complete
        vavSummation: newData.equipmentSchedules.vavSummation.totalVavCfm > existing.equipmentSchedules.vavSummation.totalVavCfm 
          ? newData.equipmentSchedules.vavSummation 
          : existing.equipmentSchedules.vavSummation
      },
      // Concat lists
      tabSpecs: {
        ...existing.tabSpecs,
        instrumentation: Array.from(new Set([
          ...(existing.tabSpecs.instrumentation || []),
          ...(newData.tabSpecs.instrumentation || [])
        ]))
      },
      shopDrawings: {
        ...existing.shopDrawings,
        inletSizeNotes: [...(existing.shopDrawings.inletSizeNotes || []), ...(newData.shopDrawings.inletSizeNotes || [])],
        physicalConstraints: [...(existing.shopDrawings.physicalConstraints || []), ...(newData.shopDrawings.physicalConstraints || [])],
      },
      fieldStrategy: {
        ...existing.fieldStrategy,
        balancingSequences: [...(existing.fieldStrategy.balancingSequences || []), ...(newData.fieldStrategy.balancingSequences || [])],
        checklists: [...existing.fieldStrategy.checklists, ...newData.fieldStrategy.checklists]
      },
      preBalanceReadiness: {
        ...existing.preBalanceReadiness,
        checklist: [...existing.preBalanceReadiness.checklist, ...newData.preBalanceReadiness.checklist],
        criticalDeficiencies: Array.from(new Set([
          ...existing.preBalanceReadiness.criticalDeficiencies,
          ...newData.preBalanceReadiness.criticalDeficiencies
        ]))
      },
      logistics: {
        toolsRequired: Array.from(new Set([...existing.logistics.toolsRequired, ...newData.logistics.toolsRequired])),
        criticalPaths: Array.from(new Set([...existing.logistics.criticalPaths, ...newData.logistics.criticalPaths])),
      }
    };
  };

  const reset = () => {
    setStatus('idle');
    setData(null);
    setError(null);
    setFiles([]);
  };

  return (
    <div className="min-h-screen technical-grid flex flex-col font-sans selection:bg-zinc-800 text-[#F5F5F4]">
      {/* Navigation Header */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F5F5F4] rounded-sm flex items-center justify-center">
              <DraftingCompass className="w-5 h-5 text-[#141414]" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[#F5F5F4] uppercase serif-italic">TAB Assist <span className="font-mono font-normal not-italic text-zinc-500 text-[10px] ml-1">v2.0</span></h1>
            </div>
          </div>
          
          {status !== 'idle' && (
            <button 
              onClick={reset}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              New Audit
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-12 lg:mt-24"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                <div className="space-y-12">
                  <div className="space-y-6">
                    <div className="inline-flex px-2 py-1 rounded bg-zinc-800 text-zinc-100 text-[9px] font-bold uppercase tracking-[0.2em]">
                      Expert Technical Assistant
                    </div>
                    <h2 className="text-6xl font-light text-[#F5F5F4] leading-[0.95] tracking-tight">
                      Surgical Accuracy <br />
                      for HVAC TAB.
                    </h2>
                    <p className="text-zinc-500 text-lg max-w-md leading-relaxed">
                      Upload project drawings or submittals. TAB Assist performs an 8-point technical audit including diversity math and pressure pathology.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                    <FeatureItem 
                      icon={<Ruler className="w-4 h-4" />} 
                      title="Spec Audit" 
                      desc="Section 23 05 93 verification for tolerances and certs."
                    />
                    <FeatureItem 
                      icon={<Wind className="w-4 h-4" />} 
                      title="Math Review" 
                      desc="Automated VAV-to-Main summation check."
                    />
                  </div>
                </div>

                <div className="relative">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    className="relative group h-full"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative h-full flex flex-col items-center justify-center border border-white/10 bg-[#141414] hover:border-white/30 transition-all rounded-xl p-12 text-center cursor-pointer min-h-[400px]">
                      <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="space-y-8">
                        <div className="w-20 h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto border border-white/5 group-hover:bg-[#F5F5F4] group-hover:border-[#F5F5F4] transition-all duration-500">
                           <FileUp className="w-8 h-8 text-zinc-600 group-hover:text-[#141414] transition-colors" />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[#F5F5F4] font-medium text-lg">Drop PDF Drawing Set or Folder</p>
                           <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono text-center">Batch Processing Enabled (Max 20MB / file)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-40 max-w-md mx-auto w-full"
            >
              <div className="w-full space-y-8">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-zinc-200 animate-spin stroke-[1.5]" />
                    <div className="absolute inset-0 blur-xl bg-white/5 animate-pulse"></div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[#F5F5F4] font-medium text-xl">Batch Analysis</p>
                    <p className="font-mono text-zinc-500 text-xs">{files.length} Document(s) in queue</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-zinc-200"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-mono font-bold">
                      {progressStage}
                    </p>
                    <p className="text-[#F5F5F4] text-[10px] font-mono font-bold">
                      {Math.round(progress)}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto py-20 text-center space-y-8 glass-card rounded-2xl p-12 border-red-100"
            >
              <div className="w-16 h-16 bg-red-950/20 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-4">
                <h3 className="text-[#F5F5F4] text-xl font-bold">Technical Audit Interrupted</h3>
                <p className="text-zinc-500 text-sm leading-relaxed px-4">{error}</p>
                {error?.includes('Quota') && (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded text-left">
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">Recommendation</p>
                    <p className="text-[11px] text-zinc-400">Reduce folder size to 2-3 PDFs per audit, or upgrade your Gemini API tier for high-volume concurrent processing.</p>
                  </div>
                )}
              </div>
              <button
                onClick={reset}
                className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-widest text-[11px] rounded-md hover:bg-black transition-all"
              >
                Try Another File
              </button>
            </motion.div>
          )}

          {status === 'success' && data && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider rounded">Audit Complete</span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Job: {data.projectIdentity.projectName || 'Unnamed Project'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-1 text-teal-400">Accu-Air Technical Services Ltd.</span>
                    <h2 className="text-4xl font-light text-[#F5F5F4] tracking-tight">Technical Compliance Console</h2>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  Drawing Set: {files.length > 0 ? files[0].name : "N/A"} 
                  {files.length > 1 && ` (+${files.length - 1} more)`}
                </p>
              </div>
              <Dashboard 
                data={data} 
                sourceFileName={files.length > 0 ? files[0].name : 'Unknown_File'} 
                onUpdateData={(updated) => setData({ ...updated })}
                fileCount={files.length}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <footer className="mt-auto border-t border-white/5 py-12 px-6">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold">
            Industry Standard TAB Intelligence Utility
          </p>
          <div className="hidden md:flex items-center gap-8 text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
            <span>Precision Indexing</span>
            <span>Math Verification</span>
            <span>Field Tactics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-3">
      <div className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center text-zinc-100 shadow-sm">
        {icon}
      </div>
      <h3 className="text-zinc-100 font-bold text-xs tracking-tight uppercase">{title}</h3>
      <p className="text-zinc-500 text-xs leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
