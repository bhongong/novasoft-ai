import React, { useState, useEffect, useRef } from 'react';
import { ProjectRequirements, PRDDocument, ProjectSchedule, UserAuth, GoogleMeetDialogue } from '../../types';
import { TEAM_MEMBERS } from '../../data/teamData';
import { speechService } from '../../lib/speech';
import { 
  Mic, MicOff, Video, VideoOff, Hand, MessageSquare, PhoneOff, 
  Sparkles, FileText, Bot, Volume2, ShieldCheck, CheckCircle2, 
  Send, Users, HelpCircle, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TeamMeetRoomProps {
  userAuth: UserAuth;
  requirements: ProjectRequirements;
  onPrdGenerated: (prd: PRDDocument, schedule: ProjectSchedule) => void;
  voiceEnabled: boolean;
}

export const TeamMeetRoom: React.FC<TeamMeetRoomProps> = ({
  userAuth,
  requirements,
  onPrdGenerated,
  voiceEnabled,
}) => {
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('orchestrator');
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [showChatDrawer, setShowChatDrawer] = useState<boolean>(false);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  
  const [userQuery, setUserQuery] = useState<string>('');
  const [isGeneratingPrd, setIsGeneratingPrd] = useState<boolean>(false);
  const [isDiscussionLoading, setIsDiscussionLoading] = useState<boolean>(false);

  const [dialogueHistory, setDialogueHistory] = useState<GoogleMeetDialogue[]>([
    {
      id: '1',
      speakerId: 'orchestrator',
      speakerName: 'Aria Sterling (AI Orchestrator)',
      role: 'Executive Chief of Staff',
      message: `Welcome everyone to the sprint kickoff meeting for "${requirements.appName}". I have ingested Marcus's discovery interview notes. Dr. Sophia, please present the initial system topology.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: '2',
      speakerId: 'architect',
      speakerName: 'Dr. Sophia Chen',
      role: 'Chief Solutions Architect',
      message: `Thanks Aria. For ${requirements.appName}, I recommend an event-driven architecture using TypeScript, PostgreSQL for persistent relations, and an Express middleware gateway.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: '3',
      speakerId: 'uiux',
      speakerName: 'Elena Rostova',
      role: 'Creative UI/UX Director',
      message: `From the UX perspective, we're building a high-contrast dark/light responsive interface with fluid micro-interactions and strict WCAG AA accessibility compliance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: '4',
      speakerId: 'dev',
      speakerName: 'Leo Takahashi',
      role: 'Lead Full-Stack Engineer',
      message: `Engineering pipeline is primed. Vite React 19 components with reactive state synchronization ready to stream to the live operations floor.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [currentCaption, setCurrentCaption] = useState<string>(dialogueHistory[0].message);
  const chatDrawerEndRef = useRef<HTMLDivElement>(null);
  const hasSpokenEntranceRef = useRef(false);

  // Play Entrance Chime on mount once
  useEffect(() => {
    speechService.playSound('join_meet');
    if (voiceEnabled && !hasSpokenEntranceRef.current) {
      hasSpokenEntranceRef.current = true;
      speechService.speak(dialogueHistory[0].message, {
        speaker: 'Aria Sterling',
        voiceName: 'Kore',
        onStart: () => setActiveSpeakerId('orchestrator'),
      });
    }

    return () => {
      speechService.stopSpeaking();
    };
  }, [voiceEnabled]);

  useEffect(() => {
    chatDrawerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogueHistory]);

  const handleAskTeam = async (speakerTarget?: string) => {
    const text = userQuery.trim() || `What is the timeline and tech roadmap for ${requirements.appName}?`;
    speechService.playSound('message');
    setUserQuery('');
    setIsDiscussionLoading(true);

    const userDialogue: GoogleMeetDialogue = {
      id: Date.now().toString(),
      speakerId: 'user',
      speakerName: userAuth.name,
      role: userAuth.role,
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDialogueHistory((prev) => [...prev, userDialogue]);
    setActiveSpeakerId('user');

    try {
      const res = await fetch('/api/team-meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectDetails: requirements,
          userQuery: text,
          activeSpeaker: speakerTarget || 'All',
        }),
      });

      const data = await res.json();
      if (data.dialogues && Array.isArray(data.dialogues)) {
        const newDialogues: GoogleMeetDialogue[] = data.dialogues.map((d: any, idx: number) => ({
          id: (Date.now() + idx + 1).toString(),
          speakerId: d.speakerId || 'orchestrator',
          speakerName: d.speakerName || 'Squad Member',
          role: d.role || 'Engineering Lead',
          message: d.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        setDialogueHistory((prev) => [...prev, ...newDialogues]);

        // Speak the first speaker response
        if (newDialogues.length > 0) {
          const first = newDialogues[0];
          setActiveSpeakerId(first.speakerId);
          setCurrentCaption(`${first.speakerName}: "${first.message}"`);
          if (voiceEnabled) {
            speechService.speak(first.message, {
              speaker: first.speakerName,
              onStart: () => setActiveSpeakerId(first.speakerId),
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
      const fallbackMsg: GoogleMeetDialogue = {
        id: (Date.now() + 1).toString(),
        speakerId: 'orchestrator',
        speakerName: 'Aria Sterling (AI Orchestrator)',
        role: 'Executive Chief of Staff',
        message: `Consensus achieved across all squad disciplines. Ready to generate the formal PRD and Sprint Milestone specifications.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setDialogueHistory((prev) => [...prev, fallbackMsg]);
      setActiveSpeakerId('orchestrator');
      setCurrentCaption(`${fallbackMsg.speakerName}: "${fallbackMsg.message}"`);
    } finally {
      setIsDiscussionLoading(false);
    }
  };

  const handleGeneratePrd = async () => {
    speechService.playSound('complete');
    setIsGeneratingPrd(true);

    try {
      const res = await fetch('/api/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectDetails: requirements,
          interviewNotes: requirements.notes,
        }),
      });

      const data = await res.json();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        onPrdGenerated(data.prd, data.schedule);
      }, 1500);
    } catch (err) {
      console.error('Failed to generate PRD:', err);
      setIsGeneratingPrd(false);
    }
  };

  // Video tiles list
  const meetParticipants = [
    { id: 'ceo', member: TEAM_MEMBERS[0] }, // Calixto Ong
    { id: 'orchestrator', member: TEAM_MEMBERS[1] }, // Aria Sterling
    { id: 'ba', member: TEAM_MEMBERS[2] }, // Marcus Vance
    { id: 'architect', member: TEAM_MEMBERS[3] }, // Dr. Sophia Chen
    { id: 'uiux', member: TEAM_MEMBERS[4] }, // Elena Rostova
    { id: 'dev', member: TEAM_MEMBERS[5] }, // Leo Takahashi
    { id: 'qa', member: TEAM_MEMBERS[6] }, // Devon Miller
    { id: 'devops', member: TEAM_MEMBERS[7] }, // Maya Al-Mansoor
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-slate-200">
      {/* Top Meeting Status Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-800 mb-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-xs sm:text-sm text-white">Google Meet • Sprint Kickoff Sync</span>
          </div>
          <span className="hidden sm:inline text-[11px] text-slate-500 font-mono">
            meet.google.com/nova-{requirements.appName?.toLowerCase().replace(/\s+/g, '-').slice(0, 10) || 'sync-room'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 font-mono">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>9 Participants</span>
          </div>

          <button
            id="btn-generate-prd-meet"
            onClick={handleGeneratePrd}
            disabled={isGeneratingPrd}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isGeneratingPrd ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Compiling PRD & Schedule...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>Synthesize PRD & Sprints</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Google Meet Grid & Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: 3x3 Video Tile Matrix */}
        <div className={`transition-all ${showChatDrawer ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Squad Members Tiles */}
            {meetParticipants.map(({ id, member }) => {
              const isActive = activeSpeakerId === id;
              return (
                <div
                  key={id}
                  id={`tile-${id}`}
                  onClick={() => {
                    speechService.playSound('click');
                    handleAskTeam(member.name);
                  }}
                  className={`relative aspect-video rounded-xl overflow-hidden bg-slate-950 border transition-all cursor-pointer group shadow-lg ${
                    isActive
                      ? 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.35)] scale-[1.01]'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={member.avatarUrl}
                    alt={member.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      isActive ? 'scale-105 filter brightness-105' : 'scale-100'
                    }`}
                  />

                  {/* Gradient bottom overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />

                  {/* Speaking Waveform Badge */}
                  {isActive && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/90 border border-indigo-500/50 px-2 py-1 rounded-full text-[9px] font-mono text-indigo-300 shadow-md">
                      <span className="w-1.5 h-3 bg-indigo-400 rounded-full animate-pulse" />
                      <span className="w-1.5 h-5 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                      <span className="w-1.5 h-3.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                      <span className="uppercase tracking-wider">SPEAKING</span>
                    </div>
                  )}

                  {/* Name tag */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs pointer-events-none">
                    <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/80 flex items-center gap-1.5 max-w-[80%] truncate">
                      <span className="font-semibold text-white truncate text-[11px]">{member.name}</span>
                      <span className="text-[9px] text-indigo-400 font-mono hidden sm:inline">({member.role.split(' ')[0]})</span>
                    </div>

                    <div className="p-1 rounded bg-slate-950/80 text-emerald-400">
                      <Volume2 className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 9th Tile: User Video Tile */}
            <div
              id="tile-user"
              className={`relative aspect-video rounded-xl overflow-hidden bg-slate-950 border transition-all shadow-lg ${
                activeSpeakerId === 'user'
                  ? 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                  : 'border-slate-800'
              }`}
            >
              {isCameraOn ? (
                <img
                  referrerPolicy="no-referrer"
                  src={userAuth?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={userAuth?.name || 'Client'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                  <VideoOff className="w-8 h-8 mb-2" />
                  <span className="text-xs font-mono">Camera Off</span>
                </div>
              )}

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs">
                <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                  <span className="font-semibold text-white text-[11px]">You ({userAuth?.name || 'Client'})</span>
                  {isHandRaised && <Hand className="w-3 h-3 text-amber-400 animate-bounce" />}
                </div>

                <div className="p-1 rounded bg-slate-950/80 text-indigo-400">
                  {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-rose-400" />}
                </div>
              </div>
            </div>
          </div>

          {/* Live Captions Bar (Google Meet Style) */}
          {showCaptions && (
            <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 text-xs text-slate-200 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/60 text-indigo-400 text-[9px] font-mono font-bold uppercase tracking-wider">
                CC LIVE
              </span>
              <span className="truncate italic text-slate-400">{currentCaption}</span>
            </div>
          )}

          {/* Google Meet Bottom Controls Bar */}
          <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • NovaSoft Sync
            </div>

            {/* Center Buttons */}
            <div className="flex items-center gap-2 mx-auto">
              <button
                id="btn-meet-mic"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-2.5 rounded-full border transition-all ${
                  isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'
                }`}
                title={isMicOn ? 'Mute' : 'Unmute'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                id="btn-meet-cam"
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`p-2.5 rounded-full border transition-all ${
                  isCameraOn ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'
                }`}
                title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
              >
                {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                id="btn-meet-hand"
                onClick={() => setIsHandRaised(!isHandRaised)}
                className={`p-2.5 rounded-full border transition-all ${
                  isHandRaised ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Raise hand"
              >
                <Hand className="w-4 h-4" />
              </button>

              <button
                id="btn-meet-chat"
                onClick={() => setShowChatDrawer(!showChatDrawer)}
                className={`p-2.5 rounded-full border transition-all ${
                  showChatDrawer ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Meeting chat"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <button
                id="btn-meet-leave"
                onClick={handleGeneratePrd}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 ml-2 shadow-lg shadow-rose-600/30 uppercase tracking-wider"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Finalize PRD</span>
              </button>
            </div>

            {/* Right Question Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAskTeam();
                  }
                }}
                placeholder="Ask team a question..."
                className="hidden md:block w-48 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                id="btn-ask-team"
                onClick={() => handleAskTeam()}
                disabled={isDiscussionLoading}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                title="Send inquiry to squad"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: In-Call Meeting Chat Drawer */}
        {showChatDrawer && (
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 shadow-2xl flex flex-col h-[560px] backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-xs text-white">In-Call Dialogue & Transcripts</h3>
              </div>
              <button
                onClick={() => setShowChatDrawer(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {dialogueHistory.map((d) => (
                <div
                  key={d.id}
                  className={`p-2.5 rounded-xl text-xs ${
                    d.speakerId === 'user'
                      ? 'bg-indigo-950/60 border border-indigo-800/60 text-indigo-200'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 font-mono text-[10px] text-indigo-400">
                    <span className="font-bold">{d.speakerName}</span>
                    <span className="text-slate-500">{d.timestamp}</span>
                  </div>
                  <p className="leading-relaxed text-slate-300">{d.message}</p>
                </div>
              ))}
              {isDiscussionLoading && (
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <span>Squad is deliberating...</span>
                </div>
              )}
              <div ref={chatDrawerEndRef} />
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAskTeam();
                  }
                }}
                placeholder="Type question to team..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={() => handleAskTeam()}
                disabled={isDiscussionLoading || !userQuery.trim()}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
