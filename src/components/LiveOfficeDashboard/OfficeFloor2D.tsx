import React, { useState, useEffect } from 'react';
import { OfficeAgentState, TeamMember } from '../../types';
import { TEAM_MEMBERS } from '../../data/teamData';
import { speechService } from '../../lib/speech';
import { Bot, Coffee, Code2, Server, ShieldCheck, Sparkles, Cpu, Layers, Terminal, Zap, Eye } from 'lucide-react';

interface OfficeFloor2DProps {
  onSelectAgent: (agent: OfficeAgentState) => void;
  selectedAgentId?: string;
}

export const OfficeFloor2D: React.FC<OfficeFloor2DProps> = ({
  onSelectAgent,
  selectedAgentId,
}) => {
  // Define the 8 Agents positioned across the open-plan floor
  const [agents, setAgents] = useState<OfficeAgentState[]>([
    {
      id: 'agent-ceo',
      memberId: 'ceo',
      name: 'Calixto Ong',
      role: 'Human CEO',
      x: 140,
      y: 120,
      targetX: 140,
      targetY: 120,
      status: 'reviewing',
      currentTask: 'Reviewing autonomous sprint velocity and customer deliverables',
      progress: 92,
      speechBubble: 'Sprint velocity at 18.5x — excellent progress team!',
      color: '#38bdf8', // cyan
      deskPosition: { x: 140, y: 120 },
    },
    {
      id: 'agent-orchestrator',
      memberId: 'orchestrator',
      name: 'Aria Sterling',
      role: 'AI Orchestrator',
      x: 260,
      y: 120,
      targetX: 260,
      targetY: 120,
      status: 'speaking',
      currentTask: 'Synthesizing cross-squad task dependencies and PRD milestones',
      progress: 88,
      speechBubble: 'Allocated 4 micro-tasks to Engineering & QA bays.',
      color: '#818cf8', // indigo
      deskPosition: { x: 260, y: 120 },
    },
    {
      id: 'agent-ba',
      memberId: 'ba',
      name: 'Marcus Vance',
      role: 'Lead BA',
      x: 420,
      y: 120,
      targetX: 420,
      targetY: 120,
      status: 'architecting',
      currentTask: 'Decomposing user stories into acceptance criteria test suites',
      progress: 95,
      speechBubble: 'Backlog specifications validated with 100% precision.',
      color: '#fbbf24', // amber
      deskPosition: { x: 420, y: 120 },
    },
    {
      id: 'agent-architect',
      memberId: 'architect',
      name: 'Dr. Sophia Chen',
      role: 'Solutions Architect',
      x: 140,
      y: 280,
      targetX: 140,
      targetY: 280,
      status: 'architecting',
      currentTask: 'Optimizing distributed database indexing & Redis caching layer',
      progress: 78,
      speechBubble: 'Schema migrations executing with zero lock contention.',
      color: '#a855f7', // purple
      deskPosition: { x: 140, y: 280 },
    },
    {
      id: 'agent-dev',
      memberId: 'dev',
      name: 'Leo Takahashi',
      role: 'Senior Full-Stack',
      x: 280,
      y: 280,
      targetX: 280,
      targetY: 280,
      status: 'coding',
      currentTask: 'Compiling React 19 component trees & reactive state hooks',
      progress: 84,
      speechBubble: 'Generating high-throughput API gateway bridges.',
      color: '#34d399', // emerald
      deskPosition: { x: 280, y: 280 },
    },
    {
      id: 'agent-uiux',
      memberId: 'uiux',
      name: 'Elena Rostova',
      role: 'Creative UI/UX',
      x: 420,
      y: 280,
      targetX: 420,
      targetY: 280,
      status: 'reviewing',
      currentTask: 'Polishing micro-interactions, responsive typography & dark themes',
      progress: 90,
      speechBubble: 'Design tokens AA accessibility verified.',
      color: '#f472b6', // pink
      deskPosition: { x: 420, y: 280 },
    },
    {
      id: 'agent-qa',
      memberId: 'qa',
      name: 'Devon Miller',
      role: 'QA & Security',
      x: 200,
      y: 420,
      targetX: 200,
      targetY: 420,
      status: 'testing',
      currentTask: 'Running OWASP fuzz testing & automated Playwright E2E suites',
      progress: 99,
      speechBubble: '48 E2E test suites passed with 0 regressions.',
      color: '#fb7185', // rose
      deskPosition: { x: 200, y: 420 },
    },
    {
      id: 'agent-devops',
      memberId: 'devops',
      name: 'Maya Al-Mansoor',
      role: 'DevOps & SRE',
      x: 360,
      y: 420,
      targetX: 360,
      targetY: 420,
      status: 'deploying',
      currentTask: 'Orchestrating edge container clusters & CI/CD deployment pipelines',
      progress: 94,
      speechBubble: 'Live container hot-reloaded to production edge.',
      color: '#38bdf8', // sky
      deskPosition: { x: 360, y: 420 },
    },
  ]);

  // Dynamic autonomous movement & speech cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          // Occasionally walk towards coffee or whiteboard, or return to desk
          const shouldMove = Math.random() > 0.65;
          let newX = agent.deskPosition.x;
          let newY = agent.deskPosition.y;
          let newStatus = agent.status;

          if (shouldMove) {
            const randomOffset = (Math.random() - 0.5) * 40;
            newX = Math.max(80, Math.min(500, agent.deskPosition.x + randomOffset));
            newY = Math.max(80, Math.min(460, agent.deskPosition.y + randomOffset));
            if (Math.random() > 0.8) {
              newStatus = 'coffee_break';
            }
          } else {
            newStatus = agent.id.includes('dev') ? 'coding' : agent.id.includes('qa') ? 'testing' : 'reviewing';
          }

          return {
            ...agent,
            x: Math.round(newX),
            y: Math.round(newY),
            status: newStatus as any,
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'coding': return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800">CODING</span>;
      case 'architecting': return <span className="bg-purple-950 text-purple-300 border border-purple-800">ARCHITECTING</span>;
      case 'testing': return <span className="bg-rose-950 text-rose-300 border border-rose-800">TESTING</span>;
      case 'deploying': return <span className="bg-sky-950 text-sky-300 border border-sky-800">DEPLOYING</span>;
      case 'coffee_break': return <span className="bg-amber-950 text-amber-300 border border-amber-800">COFFEE BREAK</span>;
      default: return <span className="bg-indigo-950 text-indigo-300 border border-indigo-800">SYNCING</span>;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Top Header of Office Floor */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-bold text-xs sm:text-sm text-white">2D Virtual Operations Floor (Open Plan • Autonomous Squad)</h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-300">
          <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60 text-[10px] uppercase tracking-wider font-bold">
            8 Squad Agents Live
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 text-[10px]">Click desk to inspect</span>
        </div>
      </div>

      {/* The 2D Floor Plan Canvas Layout */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 select-none">
        {/* Isometric / Grid floor pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-25" />
        
        {/* Ambient floor zones */}
        {/* Zone 1: Executive Corner */}
        <div className="absolute top-4 left-4 w-64 h-36 rounded-xl border border-indigo-900/30 bg-indigo-950/10 p-2 pointer-events-none">
          <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-[0.2em]">
            Executive & Orchestration Suite
          </span>
        </div>

        {/* Zone 2: Discovery & Architecture Bay */}
        <div className="absolute top-4 right-4 w-60 h-36 rounded-xl border border-purple-900/30 bg-purple-950/10 p-2 pointer-events-none">
          <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-[0.2em]">
            Discovery & Systems Matrix
          </span>
        </div>

        {/* Zone 3: Core Engineering & UI/UX Floor */}
        <div className="absolute top-44 left-1/2 -translate-x-1/2 w-80 h-36 rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-2 pointer-events-none">
          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-[0.2em]">
            Autonomous Development Bay
          </span>
        </div>

        {/* Zone 4: Coffee Lounge & Server Bay */}
        <div className="absolute bottom-4 left-4 w-44 h-28 rounded-xl border border-amber-900/30 bg-amber-950/10 p-2 pointer-events-none flex items-center justify-center gap-1.5 text-amber-400 text-[10px] font-mono">
          <Coffee className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider text-[9px]">Barista Lounge</span>
        </div>

        <div className="absolute bottom-4 right-4 w-44 h-28 rounded-xl border border-sky-900/30 bg-sky-950/10 p-2 pointer-events-none flex items-center justify-center gap-1.5 text-sky-400 text-[10px] font-mono">
          <Server className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider text-[9px]">Edge Server Racks</span>
        </div>

        {/* Desks Stations Visual Furniture */}
        {agents.map((agent) => (
          <div
            key={`desk-${agent.id}`}
            style={{ left: `${(agent.deskPosition.x / 560) * 100}%`, top: `${(agent.deskPosition.y / 500) * 100}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-14 rounded-lg bg-slate-900/90 border border-slate-800 shadow-md flex flex-col items-center justify-center pointer-events-none"
          >
            {/* Monitor */}
            <div className="w-10 h-1.5 rounded-t bg-indigo-400/80 shadow-sm shadow-indigo-400/40 mb-1" />
            <div className="text-[8px] font-mono text-slate-400 font-bold uppercase tracking-wider truncate px-1">
              {agent.name.split(' ')[0]}'s Desk
            </div>
          </div>
        ))}

        {/* Dynamic Animated Agents */}
        {agents.map((agent) => {
          const member = TEAM_MEMBERS.find((m) => m.id === agent.memberId)!;
          const isSelected = selectedAgentId === agent.id;

          return (
            <div
              key={agent.id}
              onClick={() => {
                speechService.playSound('click');
                onSelectAgent(agent);
              }}
              style={{
                left: `${(agent.x / 560) * 100}%`,
                top: `${(agent.y / 500) * 100}%`,
                transition: 'all 2.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            >
              {/* Speech Bubble */}
              {agent.speechBubble && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-indigo-200 border border-indigo-500/60 text-[9px] font-mono px-2.5 py-1 rounded-lg shadow-xl pointer-events-none animate-fadeIn z-30">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    <span>{agent.speechBubble}</span>
                  </div>
                  {/* Small arrow down */}
                  <div className="w-2 h-2 bg-slate-950 border-r border-b border-indigo-500/60 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                </div>
              )}

              {/* Avatar Body & Pulsing Ring */}
              <div
                className={`relative w-11 h-11 rounded-xl overflow-hidden border transition-all ${
                  isSelected
                    ? 'border-indigo-400 ring-2 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-110'
                    : 'border-slate-800 group-hover:border-indigo-400 group-hover:scale-105'
                }`}
              >
                <img
                  referrerPolicy="no-referrer"
                  src={member?.avatarUrl}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />

                {/* Status Dot */}
                <span
                  className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950"
                  style={{ backgroundColor: agent.color }}
                />
              </div>

              {/* Agent Name & Role Badge */}
              <div className="mt-1 text-center whitespace-nowrap">
                <div className="text-[9px] font-bold text-white bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded border border-slate-800 inline-block shadow-md">
                  {agent.name.split(' ')[0]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
