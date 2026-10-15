import React, { useState, useEffect, useRef } from 'react';
import { ActionLogItem } from '../../types';
import { Terminal, ShieldCheck, CheckCircle2, Code2, Cpu, Filter, Pause, Play, Trash2 } from 'lucide-react';

interface ActionLogsStreamProps {
  logs: ActionLogItem[];
  onClearLogs?: () => void;
}

export const ActionLogsStream: React.FC<ActionLogsStreamProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'ALL' | 'BUILD' | 'SUCCESS' | 'SECURITY'>('ALL');
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAutoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.level === filter;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">SUCCESS</span>;
      case 'BUILD':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">BUILD</span>;
      case 'SECURITY':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">SECURITY</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800/80 text-slate-300 border border-slate-700/60">INFO</span>;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 shadow-2xl flex flex-col h-[520px] backdrop-blur-md">
      {/* Stream Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
            Autonomous Squad Live Action Log
          </h3>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Filter buttons & Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            {(['ALL', 'BUILD', 'SUCCESS', 'SECURITY'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  filter === lvl ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isAutoScroll ? 'bg-indigo-950 border-indigo-700/60 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title={isAutoScroll ? 'Pause Auto-Scroll' : 'Resume Auto-Scroll'}
          >
            {isAutoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 pr-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            <span>Awaiting squad engineering events...</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => log.codeSnippet && setSelectedSnippet(log.codeSnippet)}
              className={`p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 hover:border-indigo-800/80 transition-colors ${
                log.codeSnippet ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{log.timestamp}</span>
                  {getLevelBadge(log.level)}
                  <span className="text-indigo-400 font-bold">[{log.agentName}]</span>
                </div>
                <span className="text-slate-400 truncate max-w-[120px]">{log.role}</span>
              </div>

              <p className="text-slate-200 pl-1 leading-relaxed">{log.action}</p>

              {log.codeSnippet && (
                <div className="mt-1.5 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-indigo-400 hover:text-indigo-300">
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    <span>View Generated Code Snippet</span>
                  </span>
                  <span className="text-slate-500 text-[9px]">TypeScript</span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Snippet Inspector Modal */}
      {selectedSnippet && (
        <div className="mt-3 p-3 bg-slate-950 border border-indigo-800/60 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider">Synthesized Source Code</span>
            <button
              onClick={() => setSelectedSnippet(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <pre className="text-[10px] font-mono text-emerald-400 bg-slate-900 p-2.5 rounded-lg overflow-x-auto border border-slate-800">
            {selectedSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};
