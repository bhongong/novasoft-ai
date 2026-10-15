import React, { useState, useEffect, useRef } from 'react';
import { PRDDocument, ProjectSchedule, UserAuth, TeamMember } from '../../types';
import { speechService } from '../../lib/speech';
import { TEAM_MEMBERS } from '../../data/teamData';
import { 
  FileText, Calendar, Zap, CheckCircle2, ArrowRight, 
  Layers, ShieldCheck, Sparkles, Download, Code, Clock, User
} from 'lucide-react';

interface BaDebriefViewProps {
  userAuth: UserAuth;
  prd: PRDDocument;
  schedule: ProjectSchedule;
  onEnterDashboard: () => void;
  voiceEnabled: boolean;
}

export const BaDebriefView: React.FC<BaDebriefViewProps> = ({
  userAuth,
  prd,
  schedule,
  onEnterDashboard,
  voiceEnabled,
}) => {
  const ba: TeamMember = TEAM_MEMBERS.find((m) => m.id === 'ba') || TEAM_MEMBERS[2];
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'stories' | 'schedule'>('overview');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasSpokenDebriefRef = useRef(false);

  useEffect(() => {
    if (voiceEnabled && !hasSpokenDebriefRef.current) {
      hasSpokenDebriefRef.current = true;
      const speech = `Marcus Vance here, ${userAuth?.name || 'Partner'}. I've compiled our team's synthesized Product Requirements Document and delivery schedule for "${prd.title}". We're ready to dispatch our autonomous engineering squads to the live office floor!`;
      speechService.speak(speech, {
        speaker: 'Marcus Vance',
        voiceName: 'Fenrir',
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }

    return () => {
      speechService.stopSpeaking();
    };
  }, [voiceEnabled]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-200">
      {/* Top Banner: Debrief with Marcus */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 mb-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-indigo-500/40 flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <img referrerPolicy="no-referrer" src={ba.avatarUrl} alt="Marcus" className="w-full h-full object-cover" />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-0.5">
              Stage 3: Discovery Debrief & Schedule
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">PRD & Engineering Blueprint Ready</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Marcus Vance (Lead BA): "Your technical specifications are locked. Ready to dispatch the squad to the live floor."
            </p>
          </div>
        </div>

        {/* Enter Dashboard Action */}
        <button
          id="btn-enter-dashboard-floor"
          onClick={() => {
            speechService.playSound('complete');
            speechService.stopSpeaking();
            onEnterDashboard();
          }}
          className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all flex items-center justify-center gap-2.5"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>Enter 2D Live Operations Floor</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main PRD Document Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: PRD Summary & Quick Metrics */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm text-white">Document Meta</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 font-bold">
                {prd.version}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Product Title</span>
                <div className="text-white font-bold text-sm mt-0.5">{prd.title}</div>
              </div>

              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Authors & Orchestration</span>
                <div className="text-indigo-300 font-medium">{prd.author}</div>
              </div>

              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Estimated Delivery</span>
                <div className="text-emerald-400 font-mono font-bold">{prd.estimatedDelivery}</div>
              </div>

              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Velocity Multiplier</span>
                <div className="text-purple-300 font-mono font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{schedule.velocityMultiplier}</span>
                </div>
              </div>
            </div>

            {/* Tech Stack Chips */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                Approved Architecture Stack
              </span>
              <div className="flex flex-wrap gap-1.5">
                {prd.techStack?.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 text-[10px] font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive PRD Content Tabs */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-2xl space-y-5 backdrop-blur-md">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Executive Overview
            </button>

            <button
              onClick={() => setActiveTab('modules')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'modules'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Core Architecture Modules ({prd.coreModules?.length || 4})
            </button>

            <button
              onClick={() => setActiveTab('stories')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'stories'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              User Stories & Security
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'schedule'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sprint Delivery Schedule
            </button>
          </div>

          {/* Tab 1: Executive Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs animate-fadeIn">
              <div>
                <h4 className="font-bold text-sm text-white mb-1.5">Executive Summary</h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  {prd.executiveSummary}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-white mb-1.5">Target Audience & Personas</h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  {prd.targetAudience}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Core Modules */}
          {activeTab === 'modules' && (
            <div className="space-y-3 animate-fadeIn">
              {prd.coreModules?.map((mod, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-950 border border-indigo-800/60 text-indigo-400 flex items-center justify-center font-mono text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <h4 className="font-bold text-sm text-white">{mod.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 pl-7">{mod.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: User Stories */}
          {activeTab === 'stories' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="font-bold text-sm text-white mb-2">Validated User Stories</h4>
                <div className="space-y-2">
                  {prd.userStories?.map((story, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{story}</span>
                    </div>
                  ))}
                </div>
              </div>

              {prd.securityAndCompliance && (
                <div>
                  <h4 className="font-bold text-sm text-white mb-1.5 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    <span>Security & Compliance Guardrails</span>
                  </h4>
                  <p className="text-xs text-slate-300 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    {prd.securityAndCompliance}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Sprint Schedule Timeline */}
          {activeTab === 'schedule' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider">Sprint Kickoff:</span>
                  <div className="text-white font-bold">{schedule.kickoffDate || 'Immediate'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider">Target Handover:</span>
                  <div className="text-emerald-400 font-bold">{schedule.deliveryDate || '5 Days'}</div>
                </div>
              </div>

              <div className="space-y-2.5">
                {prd.milestones?.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800/60 text-indigo-300 flex items-center justify-center font-mono font-bold text-xs">
                        S{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white">{m.phase}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{m.duration}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold bg-indigo-950 border border-indigo-800/60 text-indigo-300">
                      {m.status || 'Queued'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
