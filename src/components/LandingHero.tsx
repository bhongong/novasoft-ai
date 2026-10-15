import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Play, Cpu, ShieldCheck, Zap, Bot, Terminal, Code2, Users, Layers, Activity } from 'lucide-react';
import { COMPANY_STATS, SAMPLE_PROJECT_IDEAS } from '../data/teamData';
import { speechService } from '../lib/speech';

interface LandingHeroProps {
  onStartHire: (initialIdea?: string) => void;
  onExploreOrgChart?: () => void;
  onExploreTeam?: () => void;
  onOpenLiveFloor?: () => void;
  onContactCare?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartHire,
  onExploreOrgChart,
  onExploreTeam,
  onOpenLiveFloor,
  onContactCare,
}) => {
  const [activeCodeLine, setActiveCodeLine] = useState(0);
  const [videoFilter, setVideoFilter] = useState<'hologram' | 'neural' | 'clean'>('hologram');

  const handleStartHire = (initialIdea?: string) => {
    speechService.playSound('click');
    if (onStartHire) onStartHire(initialIdea);
  };

  const handleExploreTeam = () => {
    speechService.playSound('click');
    if (onExploreOrgChart) {
      onExploreOrgChart();
    } else if (onExploreTeam) {
      onExploreTeam();
    }
  };

  const handleOpenLiveFloor = () => {
    speechService.playSound('click');
    if (onOpenLiveFloor) {
      onOpenLiveFloor();
    }
  };

  const simulatedStreams = [
    { agent: 'Aria (AI Orchestrator)', role: 'Exec Chief of Staff', action: 'Synthesized 14 micro-service endpoints for high-throughput pipeline' },
    { agent: 'Dr. Sophia (Architect)', role: 'Chief Solutions Architect', action: 'Provisioned distributed Postgres schema with automatic indexing' },
    { agent: 'Elena (Creative Director)', role: 'UI/UX Director', action: 'Rendered responsive dark/light theme tokens and animated state transitions' },
    { agent: 'Leo (Lead Engineer)', role: 'Senior Full-Stack', action: 'Compiled Vite React 19 bundle with sub-millisecond hot execution' },
    { agent: 'Devon (QA Specialist)', role: 'Security & QA Lead', action: 'Ran 128 automated fuzz tests: 0 vulnerabilities, 100% test pass' },
    { agent: 'Maya (Cloud DevOps)', role: 'SRE & CI/CD Lead', action: 'Cloud container deployed to edge cluster with 99.99% uptime guarantee' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCodeLine((prev) => (prev + 1) % simulatedStreams.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] text-slate-200 overflow-hidden bg-carbon-pattern">
      {/* Background Subtle Gradient Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        {/* Top Announcement Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-indigo-300 text-xs font-medium backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Autonomous Agency</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-[11px]">Human CEO + Autonomous AI Engineering Squad</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-10">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.12]">
            The AI-Powered Software Agency{' '}
            <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              That Never Sleeps.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Led by human executive leadership and orchestrated by specialized AI avatars. 
            From real-time voice interview with our Lead BA to interactive Google Meet rooms and live-monitored office floor builds.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              id="btn-hero-hire"
              onClick={() => handleStartHire()}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.35)] flex items-center gap-2.5 group"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Start Autonomous Onboarding</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="btn-hero-explore-team"
              onClick={handleExploreTeam}
              className="py-3 px-5 rounded-lg font-bold text-xs uppercase tracking-widest bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-2"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Team & Org Chart</span>
            </button>

            <button
              id="btn-hero-live-floor"
              onClick={handleOpenLiveFloor}
              className="py-3 px-5 rounded-lg font-bold text-xs uppercase tracking-widest bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-2"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>2D Live Office Floor</span>
            </button>
          </div>
        </div>

        {/* Animated Corporate Office Video Simulation View */}
        <div className="relative max-w-5xl mx-auto rounded-xl border border-slate-800/80 bg-slate-950/80 p-2 shadow-2xl overflow-hidden mb-16">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[10px] text-indigo-300 uppercase tracking-widest">NOVASOFT_HQ_VIRTUAL_FLOOR.LIVE_FEED</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                8 AVATARS ACTIVE
              </span>
              <div className="flex bg-slate-900/80 rounded-md p-0.5 border border-slate-800">
                <button
                  onClick={() => setVideoFilter('hologram')}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider transition-colors ${videoFilter === 'hologram' ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' : 'text-slate-500'}`}
                >
                  HOLO-CAM
                </button>
                <button
                  onClick={() => setVideoFilter('neural')}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider transition-colors ${videoFilter === 'neural' ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' : 'text-slate-500'}`}
                >
                  NEURAL
                </button>
                <button
                  onClick={() => setVideoFilter('clean')}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider transition-colors ${videoFilter === 'clean' ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' : 'text-slate-500'}`}
                >
                  HQ-CLEAN
                </button>
              </div>
            </div>
          </div>

          {/* Animated Office Video Simulation Container */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-75 transition-all duration-700 scale-105"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80')`,
                filter: videoFilter === 'hologram' ? 'contrast(1.15) brightness(0.6) hue-rotate(200deg)' : videoFilter === 'neural' ? 'contrast(1.3) brightness(0.55) hue-rotate(250deg)' : 'brightness(0.7)',
              }}
            />

            <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/70" />

            {/* Dynamic Simulated Floating Telemetry */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 pointer-events-none">
              <div className="flex items-center justify-between">
                <div className="bg-slate-950/85 backdrop-blur-md border border-indigo-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-white">NovaSoft Orchestration Engine</div>
                    <div className="text-[9px] text-indigo-300 font-mono">Autonomous Squad Grid Synchronized</div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-emerald-500/30 rounded-lg px-3 py-1 text-xs text-emerald-300 font-mono">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px]">LATENCY: 3.4ms</span>
                </div>
              </div>

              {/* Center Live Agent Activity Stream Card */}
              <div className="max-w-xl mx-auto w-full bg-slate-950/90 backdrop-blur-lg border border-slate-800 rounded-lg p-3 shadow-xl text-left pointer-events-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300 font-mono">
                      Live Squad Action Stream
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">Real-time Event</span>
                </div>

                <div className="p-2.5 rounded-md bg-slate-900/80 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-semibold text-white mb-0.5">
                    <span className="text-indigo-300 font-mono text-[11px]">[{simulatedStreams[activeCodeLine].agent}]</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">{simulatedStreams[activeCodeLine].role}</span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] flex items-center gap-2">
                    <Code2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span>{simulatedStreams[activeCodeLine].action}</span>
                  </p>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-[11px]">
                  <Terminal className="w-3 h-3 text-indigo-400" />
                  <span>CI/CD Loop • Continuous Security Audits</span>
                </div>

                <button
                  id="btn-stream-interview-trigger"
                  onClick={() => onStartHire()}
                  className="px-3.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 uppercase tracking-wider text-[10px]"
                >
                  <Play className="w-2.5 h-2.5 fill-indigo-400 text-indigo-400" />
                  <span>Simulate Your App Build</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Company Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {COMPANY_STATS.map((stat, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 transition-all text-center group"
            >
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent mb-1 group-hover:scale-105 transition-transform">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-[11px] text-slate-500">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Sample Software Products Presets */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-1">Architecture Blueprints</h2>
            <p className="text-2xl font-bold text-white">Select a Vision to Scaffold With Our Squad</p>
            <p className="text-xs text-slate-400 mt-1">Click any preset or enter your custom app concept in the BA Discovery Interview.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SAMPLE_PROJECT_IDEAS.map((idea, index) => (
              <div
                key={index}
                onClick={() => {
                  speechService.playSound('click');
                  onStartHire(idea.title + ': ' + idea.desc);
                }}
                className="cursor-pointer p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/70 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 font-bold tracking-wider">
                      {idea.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{idea.badge}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-indigo-300 transition-colors mb-1.5">
                    {idea.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{idea.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-bold uppercase tracking-wider group-hover:text-indigo-300">
                  <span className="text-[10px]">Start Interview</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-4">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-2">Human Leadership + AI Avatars</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Human intuition guides vision and executive decisions, while autonomous AI avatars execute architecture, coding, testing, and deployment.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-4">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-2">Zero-Loss PRD Generation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our Lead BA interviews you naturally via voice or text, immediately convening a multi-agent Google Meet to compile comprehensive PRD specifications.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-4">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-2">2D Live Office Operations Floor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Watch your software squad work in an unpartitioned 2D virtual office floor, generating code, running tests, and updating your live interactive app preview.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
