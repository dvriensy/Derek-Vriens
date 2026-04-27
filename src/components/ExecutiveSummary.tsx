/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, Shield, ListTodo, AlertTriangle, Info } from 'lucide-react';
import { ExecutiveSummary as ExecutiveSummaryType } from '../types';
import { cn } from '../lib/utils';

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Compliant':
        return <ShieldCheck className="w-6 h-6 text-emerald-400" />;
      case 'Non-Compliant':
        return <ShieldAlert className="w-6 h-6 text-red-400" />;
      case 'Conditional':
        return <Shield className="w-6 h-6 text-amber-400" />;
      default:
        return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'Non-Compliant':
        return 'bg-red-500/10 border-red-500/30';
      case 'Conditional':
        return 'bg-amber-500/10 border-amber-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 mb-12"
    >
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <h2 className="text-[10px] uppercase font-bold tracking-[0.3em] text-zinc-500 flex items-center gap-2">
          <ListTodo className="w-3 h-3" />
          Executive Summary Report
        </h2>
      </div>

      <div className={cn("p-8 border rounded-sm transition-all", getStatusBg(summary.complianceStatus))}>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            {getStatusIcon(summary.complianceStatus)}
            <div className="text-center">
              <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 mb-1">Status</p>
              <p className="text-sm font-bold text-[#F5F5F4]">{summary.complianceStatus}</p>
            </div>
          </div>
          
          <div className="flex-grow space-y-4">
            <p className="text-lg font-light text-zinc-200 leading-relaxed italic border-l-2 border-white/10 pl-6 py-2">
              "{summary.overview}"
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#F5F5F4]">Key Technical Findings</h3>
                </div>
                <ul className="space-y-2">
                  {summary.keyFindings.map((finding, idx) => (
                    <li key={idx} className="text-xs text-zinc-400 flex gap-3">
                      <span className="text-zinc-600 font-mono">0{idx + 1}</span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>

              {summary.majorRedFlags.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#F5F5F4]">Critical Red Flags</h3>
                  </div>
                  <ul className="space-y-2">
                    {summary.majorRedFlags.map((flag, idx) => (
                      <li key={idx} className="text-xs text-red-300 bg-red-500/5 px-3 py-2 rounded-sm border border-red-500/10 flex gap-3">
                         <span className="font-bold opacity-50">!</span>
                         {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
