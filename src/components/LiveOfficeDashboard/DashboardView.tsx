import React, { useState, useEffect } from 'react';
import { ProjectRequirements, PRDDocument, ProjectSchedule, UserAuth, OfficeAgentState, ActionLogItem } from '../../types';
import { OfficeFloor2D } from './OfficeFloor2D';
import { ActionLogsStream } from './ActionLogsStream';
import { LiveAppPreviewOverlay } from './LiveAppPreviewOverlay';
import { TEAM_MEMBERS } from '../../data/teamData';
import { speechService } from '../../lib/speech';
import { 
  Bot, LayoutDashboard, Terminal, Laptop, Zap, 
  Sparkles, RefreshCw, Send, ShieldCheck, CheckCircle2, 
  Volume2, Play, Users, Layers, Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  userAuth: UserAuth;
  requirements: ProjectRequirements;
  prd: PRDDocument;
  schedule: ProjectSchedule;
  voiceEnabled: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userAuth,
  requirements,
  prd,
  schedule,
  voiceEnabled,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<OfficeAgentState | null>(null);
  const [isOverlayMaximized, setIsOverlayMaximized] = useState<boolean>(false);
  const [agentPrompt, setAgentPrompt] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Streaming Action Logs
  const [actionLogs, setActionLogs] = useState<ActionLogItem[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agentName: 'Aria Sterling',
      role: 'AI Orchestrator',
      action: `Initialized sprint execution topology for project "${prd.title}".`,
      level: 'INFO',
    },
    {
      id: '2',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agentName: 'Dr. Sophia Chen',
      role: 'Solutions Architect',
      action: 'Generated distributed schema migrations and relational constraints.',
      level: 'BUILD',
      codeSnippet: `// Schema Auto-generation
export const schema = {
  appName: "${prd.title}",
  tables: ["users", "sessions", "analytics", "backlog"],
  driver: "postgres"
};`,
    },
    {
      id: '3',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agentName: 'Leo Takahashi',
      role: 'Senior Full-Stack',
      action: 'Rendered React 19 component structure into live overlay staging container.',
      level: 'BUILD',
    },
    {
      id: '4',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agentName: 'Devon Miller',
      role: 'QA & Security',
      action: 'Executed OWASP automated dependency scan — 0 vulnerabilities detected.',
      level: 'SECURITY',
    },
  ]);

  // Periodic autonomous squad log generation
  useEffect(() => {
    const autonomousActions = [
      {
        agentName: 'Leo Takahashi',
        role: 'Senior Full-Stack',
        action: 'Optimized server-side Gemini streaming response buffer with 12ms latency.',
        level: 'BUILD' as const,
        codeSnippet: `const stream = await gemini.models.generateContentStream({\n  model: 'gemini-2.5-flash',\n  contents: userPrompt\n});`,
      },
      {
        agentName: 'Elena Rostova',
        role: 'Creative UI/UX',
        action: 'Compiled responsive layout tokens and motion spring animations.',
        level: 'SUCCESS' as const,
      },
      {
        agentName: 'Maya Al-Mansoor',
        role: 'DevOps Lead',
        action: 'Edge container cluster synced across multi-region pods with zero downtime.',
        level: 'SUCCESS' as const,
      },
      {
        agentName: 'Devon Miller',
        role: 'QA & Security',
        action: 'All 64 unit test suites passed with 100% assertion coverage.',
        level: 'SUCCESS' as const,
      },
      {
        agentName: 'Aria Sterling',
        role: 'AI Orchestrator',
        action: 'Calculated sprint velocity: running at 18.5x human engineering benchmark.',
        level: 'INFO' as const,
      },
    ];

    let index = 0;
    const interval = setInterval(() => {
      const template = autonomousActions[index % autonomousActions.length];
      const newLog: ActionLogItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        agentName: template.agentName,
        role: template.role,
        action: template.action,
        level: template.level,
        codeSnippet: template.codeSnippet,
      };

      setActionLogs((prev) => [...prev.slice(-30), newLog]);
      index++;
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleDispatchAgentTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentPrompt.trim() || isDispatching) return;

    speechService.playSound('message');
    setIsDispatching(true);

    const targetAgent = selectedAgent?.name || 'Leo Takahashi';
    const targetRole = selectedAgent?.role || 'Lead Engineer';

    try {
      const res = await fetch('/api/agent-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: targetAgent,
          role: targetRole,
          taskPrompt: agentPrompt.trim(),
          projectContext: prd,
        }),
      });

      const data = await res.json();
      
      const newLog: ActionLogItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        agentName: targetAgent,
        role: targetRole,
        action: `Dispatched Custom Task: "${agentPrompt.trim()}" -> Result: ${data.result || 'Executed successfully'}`,
        level: 'BUILD',
        codeSnippet: data.codeSnippet,
      };

      setActionLogs((prev) => [...prev, newLog]);
      setAgentPrompt('');

      if (voiceEnabled) {
        speechService.speak(`Task acknowledged by ${targetAgent}. Executing code generation.`, {
          speaker: targetAgent,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-200 space-y-6">
      {/* Top Banner: Dashboard Header & Sprints Control */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">
                Active Sprint Monitoring
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{prd.title}</h2>
            <p className="text-xs text-slate-400">
              Welcome {userAuth.name} ({userAuth.company}) • Continuous 24/7 Autonomous Engineering Stream
            </p>
          </div>
        </div>

        {/* Squad Status Metrics */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl text-center">
            <div className="text-slate-500 text-[9px] uppercase tracking-wider">Squad Status</div>
            <div className="text-emerald-400 font-bold">8/8 Online</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl text-center">
            <div className="text-slate-500 text-[9px] uppercase tracking-wider">Velocity</div>
            <div className="text-indigo-300 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>18.5x Speed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2D Virtual Office Floor (Top View Without Walls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Upper Section: The 2D Office Floor */}
        <div className="lg:col-span-7 space-y-4">
          <OfficeFloor2D
            onSelectAgent={(agent) => setSelectedAgent(agent)}
            selectedAgentId={selectedAgent?.id}
          />

          {/* Quick Agent Dispatch Command Console */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 shadow-xl space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white">
                  Dispatch Command to {selectedAgent ? `${selectedAgent.name} (${selectedAgent.role})` : 'Engineering Squad'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">Live Agent IPC</span>
            </div>

            <form onSubmit={handleDispatchAgentTask} className="flex gap-2">
              <input
                type="text"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder={
                  selectedAgent
                    ? `Instruct ${selectedAgent.name.split(' ')[0]} (e.g., 'Add dark mode toggle' or 'Write unit tests')...`
                    : "Instruct squad (e.g., 'Implement user export to CSV' or 'Add analytics widget')..."
                }
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isDispatching || !agentPrompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-1.5"
              >
                {isDispatching ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Dispatch</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Section: Action Logs Stream */}
        <div className="lg:col-span-5">
          <ActionLogsStream
            logs={actionLogs}
            onClearLogs={() => setActionLogs([])}
          />
        </div>
      </div>

      {/* Bottom Section: Live Web App Overlay Staging Container */}
      <div className="pt-2">
        <LiveAppPreviewOverlay
          userAuth={userAuth}
          prd={prd}
          requirements={requirements}
          isMaximized={isOverlayMaximized}
          onToggleMaximize={() => setIsOverlayMaximized(!isOverlayMaximized)}
        />
      </div>
    </div>
  );
};
