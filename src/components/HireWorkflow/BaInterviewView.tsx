import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, Send, Volume2, Sparkles, CheckCircle2, ClipboardList, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { ProjectRequirements, TeamMember, UserAuth } from '../../types';
import { speechService } from '../../lib/speech';
import { TEAM_MEMBERS } from '../../data/teamData';

interface BaInterviewViewProps {
  userAuth: UserAuth;
  initialIdea?: string;
  onFinishInterview: (requirements: ProjectRequirements) => void;
  voiceEnabled: boolean;
}

interface InterviewDialogue {
  id: string;
  sender: 'marcus' | 'user';
  text: string;
  timestamp: string;
}

export const BaInterviewView: React.FC<BaInterviewViewProps> = ({
  userAuth,
  initialIdea,
  onFinishInterview,
  voiceEnabled,
}) => {
  const ba: TeamMember = TEAM_MEMBERS.find((m) => m.id === 'ba') || TEAM_MEMBERS[2];

  const [dialogues, setDialogues] = useState<InterviewDialogue[]>([
    {
      id: '1',
      sender: 'marcus',
      text: `Hello ${userAuth?.name || 'Partner'}! I'm Marcus Vance, Lead Business Analyst at NovaSoft AI. I'll be conducting your discovery interview to understand your dream software application and extract full technical specifications. Let's start: What is the core purpose of the web application or product you would like us to build?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputVal, setInputVal] = useState(initialIdea || '');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completenessScore, setCompletenessScore] = useState(25);
  const [readyForTeamMeet, setReadyForTeamMeet] = useState(false);

  const [extractedNotes, setExtractedNotes] = useState<string[]>([
    `Client: ${userAuth.name} (${userAuth.company})`,
    'Session: Initial Scope Discovery & Requirements Gathering',
    'Goal: Multi-agent squad sprint alignment',
  ]);

  const [projectSummary, setProjectSummary] = useState<Partial<ProjectRequirements>>({
    appName: initialIdea ? initialIdea.split(':')[0] : 'Next-Gen Web Platform',
    appDescription: initialIdea || 'Modern digital application',
    category: 'Enterprise SaaS',
    keyFeatures: ['Intuitive User Authentication', 'Responsive Interactive UI', 'Real-time Data Processing'],
    techStackRecommendations: ['React 19', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
    targetAudience: 'Professionals & Enterprise Clients',
    themePreference: 'modern-dark',
    urgency: 'High Velocity (18.5x AI Squad)',
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasSpokenGreetingRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogues, isLoading]);

  // Read initial greeting once if voice is enabled, with cleanup on unmount
  useEffect(() => {
    if (voiceEnabled && !hasSpokenGreetingRef.current) {
      hasSpokenGreetingRef.current = true;
      const greeting = `Hello ${userAuth?.name || 'Partner'}! I'm Marcus Vance, Lead Business Analyst. What is the core purpose of the web application you want our squad to build?`;
      speechService.speak(greeting, {
        speaker: 'Marcus Vance',
        voiceName: 'Fenrir',
        style: 'Articulate, encouraging, consultative business analyst',
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }

    return () => {
      speechService.stopSpeaking();
    };
  }, [voiceEnabled]);

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputVal).trim();
    if (!text || isLoading) return;

    speechService.playSound('message');
    setInputVal('');

    const userMsg: InterviewDialogue = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDialogues((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyPayload = dialogues.map((d) => ({
        role: d.sender === 'user' ? 'user' : 'model',
        content: d.text,
      }));

      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          history: historyPayload,
          currentProjectInfo: projectSummary,
        }),
      });

      const data = await res.json();
      const marcusReply = data.reply || "Understood! I've noted those specifications. What specific data models or user permissions will this application require?";

      const marcusMsg: InterviewDialogue = {
        id: (Date.now() + 1).toString(),
        sender: 'marcus',
        text: marcusReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setDialogues((prev) => [...prev, marcusMsg]);

      if (data.extractedNotes && Array.isArray(data.extractedNotes)) {
        setExtractedNotes((prev) => Array.from(new Set([...prev, ...data.extractedNotes])));
      }

      if (data.projectSummary) {
        setProjectSummary((prev) => ({ ...prev, ...data.projectSummary }));
      }

      const score = Math.min(100, Math.max(data.completenessScore || (completenessScore + 25), 35));
      setCompletenessScore(score);

      if (score >= 65 || data.readyForTeamMeet) {
        setReadyForTeamMeet(true);
      }

      if (voiceEnabled) {
        speechService.speak(marcusReply, {
          speaker: 'Marcus Vance',
          voiceName: 'Fenrir',
          style: 'Analytical, friendly, focused business analyst asking discovery questions',
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }
    } catch (err) {
      console.error(err);
      const fallbackReply = "Got it. I've recorded these architecture requirements and user stories into our system backlog.";
      const marcusMsg: InterviewDialogue = {
        id: (Date.now() + 1).toString(),
        sender: 'marcus',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setDialogues((prev) => [...prev, marcusMsg]);
      setCompletenessScore((prev) => Math.min(100, prev + 25));
      setReadyForTeamMeet(true);

      if (voiceEnabled) {
        speechService.speak(fallbackReply, {
          speaker: 'Marcus Vance',
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMicListening = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      const success = speechService.startListening(
        (transcript, isFinal) => {
          setInputVal(transcript);
          if (isFinal) {
            handleSendMessage(transcript);
            speechService.stopListening();
            setIsListening(false);
          }
        },
        () => setIsListening(false),
        () => setIsListening(false)
      );

      if (success) {
        setIsListening(true);
        speechService.playSound('chime');
      }
    }
  };

  const handleConfirmAndProceed = () => {
    speechService.playSound('complete');
    speechService.stopSpeaking();
    speechService.stopListening();

    const fullRequirements: ProjectRequirements = {
      appName: projectSummary.appName || 'Custom Autonomous Application',
      appDescription: projectSummary.appDescription || 'Full stack web application engineered with modern React and TypeScript.',
      category: projectSummary.category || 'Enterprise SaaS',
      targetAudience: projectSummary.targetAudience || 'Digital users & enterprise teams',
      keyFeatures: projectSummary.keyFeatures || ['Role-Based Authentication', 'Interactive Live Dashboard', 'High-Throughput APIs'],
      techStackRecommendations: projectSummary.techStackRecommendations || ['React 19', 'TypeScript', 'Tailwind', 'Express API'],
      themePreference: projectSummary.themePreference || 'modern-dark',
      urgency: 'Accelerated Sprint',
      notes: extractedNotes,
      completenessScore: completenessScore,
    };

    onFinishInterview(fullRequirements);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-200">
      {/* Top Header / Progress Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-1">
            Stage 1 of 4: Discovery Interview
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">1-on-1 Interview With Lead BA</h2>
        </div>

        {/* Completeness Meter */}
        <div className="flex items-center gap-3 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur-md">
          <div className="text-right">
            <div className="text-xs font-bold text-white">Scope Completeness</div>
            <div className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">{completenessScore}% Captured</div>
          </div>
          <div className="w-24 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${completenessScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left BA Virtual Room / Right Live Notes & Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Marcus Video Avatar & Interview Chat Room */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex flex-col h-[640px] backdrop-blur-md">
          {/* Top Video Stage of Marcus */}
          <div className="relative h-44 rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-950 flex items-center justify-between p-4 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent z-10" />

            {/* Marcus Avatar Photo */}
            <img
              referrerPolicy="no-referrer"
              src={ba.avatarUrl}
              alt="Marcus Vance"
              className={`absolute right-0 top-0 h-full w-48 object-cover transition-transform duration-700 ${
                isSpeaking ? 'scale-105 filter brightness-110' : 'scale-100'
              }`}
            />

            {/* Stage Info */}
            <div className="relative z-20 space-y-1 max-w-xs">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-[9px] font-mono text-indigo-300 font-bold uppercase tracking-wider">
                <Bot className="w-3 h-3 text-indigo-400" />
                <span>LEAD BA AVATAR</span>
              </div>
              <h3 className="font-bold text-base text-white">{ba.name}</h3>
              <p className="text-xs text-indigo-400 font-medium">{ba.role}</p>
              <p className="text-[11px] text-slate-400 italic">"I translate your vision into precise technical execution."</p>
            </div>

            {/* Audio wave indicator */}
            {isSpeaking && (
              <div className="relative z-20 flex items-center gap-1 bg-slate-950/90 border border-indigo-500/50 px-3 py-1.5 rounded-full text-[10px] font-mono text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                <span className="w-1.5 h-3.5 bg-indigo-400 rounded-full animate-pulse" />
                <span className="w-1.5 h-6 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                <span className="w-1.5 h-4 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="uppercase tracking-wider text-[9px]">SPEAKING</span>
              </div>
            )}
          </div>

          {/* Chat / Interview Transcript */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
            {dialogues.map((d) => (
              <div
                key={d.id}
                className={`flex gap-3 ${d.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {d.sender === 'marcus' && (
                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-500/40 flex-shrink-0">
                    <img referrerPolicy="no-referrer" src={ba.avatarUrl} alt="Marcus" className="w-full h-full object-cover" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                    d.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-70 font-mono">
                    <span>{d.sender === 'user' ? userAuth.name : 'Marcus Vance (Lead BA)'}</span>
                    <span>{d.timestamp}</span>
                  </div>
                  <p>{d.text}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-500/40 flex-shrink-0">
                  <img referrerPolicy="no-referrer" src={ba.avatarUrl} alt="Marcus" className="w-full h-full object-cover" />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl rounded-bl-none px-4 py-3 text-xs text-indigo-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <span>Marcus is analyzing requirements & updating backlog...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input & Voice Controls */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
            <button
              id="btn-interview-mic"
              type="button"
              onClick={toggleMicListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-lg shadow-rose-600/40'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-indigo-400 hover:text-indigo-300'
              }`}
              title={isListening ? 'Stop Mic' : 'Speak Requirements'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              id="input-interview-message"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? 'Listening to your voice...' : 'Type requirements or answers to Marcus...'}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
            />

            <button
              id="btn-interview-send"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputVal.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Live BA Clipboard Notes & Confirmation Ready */}
        <div className="lg:col-span-5 space-y-4">
          {/* Notes Clipboard Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Live Discovery Clipboard</h3>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 uppercase tracking-wider">
                Auto-Extracted
              </span>
            </div>

            {/* Extracted Notes List */}
            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
              {extractedNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            {/* App Specification Preview */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span className="text-[10px] uppercase tracking-wider">Proposed App:</span>
                <span className="text-white font-bold">{projectSummary.appName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="text-[10px] uppercase tracking-wider">Category:</span>
                <span className="text-indigo-300">{projectSummary.category}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="text-[10px] uppercase tracking-wider">Stack:</span>
                <span className="text-purple-300">{projectSummary.techStackRecommendations?.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Confirmation & Proceed Action Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 shadow-xl text-center space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-center gap-2 text-indigo-300 font-bold text-sm">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Ready for Multi-Agent Google Meet?</span>
            </div>
            <p className="text-xs text-slate-400">
              Once you confirm, the entire engineering squad (Solutions Architect, UI/UX Lead, Senior Dev, QA, DevOps) will convene in a simulated Google Meet to synthesize the PRD.
            </p>

            <button
              id="btn-confirm-requirements-meet"
              onClick={handleConfirmAndProceed}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all flex items-center justify-center gap-2"
            >
              <span>Confirm Requirements & Join Team Meet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
