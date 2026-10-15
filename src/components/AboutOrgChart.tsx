import React, { useState } from 'react';
import { TEAM_MEMBERS } from '../data/teamData';
import { TeamMember } from '../types';
import { Bot, User, Sparkles, Volume2, ArrowDown, Cpu, ShieldCheck, Code, Layers, Server, MessageSquare, Send, CheckCircle2, Box } from 'lucide-react';
import { speechService } from '../lib/speech';
import { NpcAvatar3DCanvas } from './ThreeD/NpcAvatar3DCanvas';

interface AboutOrgChartProps {
  onSelectMemberForInterview?: (member: TeamMember) => void;
  onStartHire?: () => void;
  voiceEnabled: boolean;
  teamMembers?: TeamMember[];
}

export const AboutOrgChart: React.FC<AboutOrgChartProps> = ({ 
  voiceEnabled, 
  onStartHire, 
  onSelectMemberForInterview,
  teamMembers 
}) => {
  const membersToUse = teamMembers && teamMembers.length > 0 ? teamMembers : TEAM_MEMBERS;
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(membersToUse[1] || membersToUse[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [memberResponse, setMemberResponse] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync selected member if teamMembers list updates
  React.useEffect(() => {
    if (selectedMember) {
      const updated = membersToUse.find((m) => m.id === selectedMember.id);
      if (updated) setSelectedMember(updated);
    }
  }, [teamMembers]);

  const ceo = membersToUse.find((m) => m.id === 'ceo') || membersToUse[0];
  const orchestrator = membersToUse.find((m) => m.id === 'orchestrator') || membersToUse[1];
  const leadership = membersToUse.filter((m) => m.id !== 'ceo' && m.id !== 'orchestrator');

  // Stop any speech when navigating away from Org Chart
  React.useEffect(() => {
    return () => {
      speechService.stopSpeaking();
    };
  }, []);

  const getMemberVoice = (member: TeamMember): 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' => {
    switch (member.id) {
      case 'orchestrator':
      case 'support':
        return 'Kore';
      case 'architect':
      case 'devops':
        return 'Zephyr';
      case 'uiux':
        return 'Puck';
      case 'dev':
        return 'Charon';
      case 'ceo':
      case 'ba':
      case 'qa':
      default:
        return 'Fenrir';
    }
  };

  const handleSelectMember = (member: TeamMember) => {
    speechService.playSound('click');
    speechService.stopSpeaking();
    setSelectedMember(member);
    setMemberResponse(null);
    setCustomQuestion('');

    if (voiceEnabled) {
      const greeting = member.isHuman
        ? `Hello, I'm ${member.name}, CEO of NovaSoft AI. Welcome to our virtual software organization.`
        : `Greetings. I'm ${member.name}, ${member.role} at NovaSoft AI. Ready to coordinate your engineering deliverables.`;

      speechService.speak(greeting, {
        speaker: member.name,
        voiceName: getMemberVoice(member),
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }
  };

  const handleAskMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !customQuestion.trim() || isAsking) return;

    speechService.stopSpeaking();
    setIsAsking(true);
    speechService.playSound('message');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: customQuestion,
          agentName: selectedMember.name,
          role: selectedMember.role,
        }),
      });
      const data = await res.json();
      const text = data.text || 'Understood. We will incorporate this into our engineering matrix.';
      setMemberResponse(text);

      if (voiceEnabled) {
        speechService.speak(text, {
          speaker: selectedMember.name,
          voiceName: getMemberVoice(selectedMember),
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }
    } catch (err) {
      setMemberResponse(`[${selectedMember.name}]: I have logged your technical query into our sprint planning matrix.`);
    } finally {
      setIsAsking(false);
    }
  };

  const getDepartmentIcon = (dept: string) => {
    switch (dept) {
      case 'Executive': return <Bot className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Product & BA': return <Layers className="w-3.5 h-3.5 text-amber-400" />;
      case 'Architecture': return <Server className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Engineering': return <Code className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Design': return <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />;
      case 'Quality & Security': return <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />;
      case 'DevOps & SRE': return <Cpu className="w-3.5 h-3.5 text-sky-400" />;
      default: return <Bot className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-200">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-2">
          Autonomous Hierarchy
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          The AI Software Roster & Org Chart
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Human CEO executive leadership fused with autonomous AI employees represented by human avatars. 
          Click on any team member to inspect their neural model, voice synthesis profile, or ask them a direct question.
        </p>
      </div>

      {/* Org Chart Visualization Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        {/* Left / Center: The Tree Structure */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Level 1: Human CEO */}
          <div className="relative flex flex-col items-center">
            <div
              id="node-ceo"
              onClick={() => handleSelectMember(ceo)}
              className={`cursor-pointer p-4 rounded-xl border transition-all w-72 bg-slate-900/60 shadow-xl ${
                selectedMember?.id === ceo.id
                  ? 'border-indigo-400 ring-2 ring-indigo-500/30 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                  : 'border-slate-800 hover:border-indigo-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-indigo-500/50 p-0.5 shadow-md">
                  <img referrerPolicy="no-referrer" src={ceo.avatarUrl} alt={ceo.name} className="w-full h-full rounded-md object-cover" />
                  <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-slate-950/90 text-[8px] font-bold text-indigo-300 uppercase tracking-widest">
                    HUMAN
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white">{ceo.name}</h3>
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <p className="text-xs text-indigo-300 font-medium">{ceo.role}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Product & Corporate Vision</p>
                </div>
              </div>
            </div>

            {/* Tree Branch Connector */}
            <div className="w-0.5 h-8 bg-indigo-500/60 my-1" />
            <ArrowDown className="w-3.5 h-3.5 text-indigo-400 -mt-2 mb-1" />
          </div>

          {/* Level 2: Executive Secretary & AI Orchestrator */}
          <div className="relative flex flex-col items-center">
            <div
              id="node-orchestrator"
              onClick={() => handleSelectMember(orchestrator)}
              className={`cursor-pointer p-4 rounded-xl border transition-all w-80 bg-slate-900/60 shadow-xl ${
                selectedMember?.id === orchestrator.id
                  ? 'border-indigo-400 ring-2 ring-indigo-500/30 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                  : 'border-slate-800 hover:border-indigo-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-indigo-500/50 p-0.5 shadow-md">
                  <img referrerPolicy="no-referrer" src={orchestrator.avatarUrl} alt={orchestrator.name} className="w-full h-full rounded-md object-cover" />
                  <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-indigo-950/90 text-[8px] font-bold text-indigo-300 uppercase tracking-widest">
                    AI ORCH
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white">{orchestrator.name}</h3>
                    <Bot className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  </div>
                  <p className="text-xs text-indigo-300 font-medium">{orchestrator.role}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Autonomous Workflow Synthesis</p>
                </div>
              </div>
            </div>

            {/* Tree Branch Connector Horizontal Spreader */}
            <div className="w-0.5 h-8 bg-indigo-500/60 my-1" />
            <div className="w-full max-w-xl h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mb-6" />
          </div>

          {/* Level 3: Department Squad Leads (Human Avatars of AI Employees) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 w-full">
            {leadership.map((member) => (
              <div
                key={member.id}
                id={`node-${member.id}`}
                onClick={() => handleSelectMember(member)}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all bg-slate-900/40 text-left ${
                  selectedMember?.id === member.id
                    ? 'border-indigo-400 ring-1 ring-indigo-500/40 bg-slate-900/80 scale-102 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-indigo-500/30 flex-shrink-0">
                    <img referrerPolicy="no-referrer" src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-xs text-white truncate">{member.name}</h4>
                      {getDepartmentIcon(member.department)}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{member.role}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1.5 border-t border-slate-800/80 uppercase tracking-wider">
                  <span className="truncate">{member.department}</span>
                  <span className="text-indigo-400 font-semibold">AI AVATAR</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Member Interactive Dossier */}
        <div className="lg:col-span-5 sticky top-24">
          {selectedMember && (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 shadow-2xl text-left space-y-4 backdrop-blur-md">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-indigo-500/50 p-0.5">
                    <img referrerPolicy="no-referrer" src={selectedMember.avatarUrl} alt={selectedMember.name} className="w-full h-full rounded-lg object-cover" />
                    <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{selectedMember.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 uppercase tracking-wider">
                        {selectedMember.isHuman ? 'Human Leader' : 'Autonomous AI'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-300">{selectedMember.role}</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">{selectedMember.department} Department</p>
                  </div>
                </div>

                {/* Voice Speaker button */}
                <button
                  onClick={() => {
                    speechService.playSound('click');
                    if (isSpeaking) {
                      speechService.stopSpeaking();
                      setIsSpeaking(false);
                    } else {
                      speechService.speak(`I am ${selectedMember.name}, ${selectedMember.role}. How may I assist your engineering initiative?`, {
                        speaker: selectedMember.name,
                        voiceName: getMemberVoice(selectedMember),
                        onStart: () => setIsSpeaking(true),
                        onEnd: () => setIsSpeaking(false),
                      });
                    }
                  }}
                  className={`p-2 rounded-lg border transition-all ${
                    isSpeaking
                      ? 'bg-indigo-600/80 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)] animate-pulse'
                      : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:text-white'
                  }`}
                  title={isSpeaking ? 'Stop Avatar Voice' : 'Hear Avatar Voice'}
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
                </button>
              </div>

              {/* Interactive 3D Model Viewport */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase tracking-wider">
                    <Box className="w-3.5 h-3.5 text-indigo-400" />
                    <span>3D Hologram Avatar</span>
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {selectedMember.glbModelName ? (
                      <span className="text-emerald-400 font-bold">GLB: {selectedMember.glbModelName}</span>
                    ) : (
                      'Interactive 3D Mesh'
                    )}
                  </span>
                </div>
                <div className="h-56 sm:h-64 w-full rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                  <NpcAvatar3DCanvas
                    member={selectedMember}
                    isSpeaking={isSpeaking}
                    className="w-full h-full"
                    enableControls={true}
                    autoRotate={true}
                    interactive={true}
                  />
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
                {selectedMember.bio}
              </p>

              {/* Specialties */}
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-widest mb-2">
                  Specialties & Technical Domains
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMember.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-indigo-300 text-[10px] font-mono"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Model & Desk Details */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider">COGNITIVE ENGINE:</span>
                  <div className="text-indigo-300 font-semibold truncate text-[11px]">{selectedMember.neuralModel || 'Human Leadership'}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider">OFFICE STATION:</span>
                  <div className="text-emerald-400 font-semibold text-[11px]">{selectedMember.deskId}</div>
                </div>
              </div>

              {/* Interactive Direct Dialogue */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Direct Inquiry with {selectedMember.name.split(' ')[0]}:</span>
                </div>

                <form onSubmit={handleAskMember} className="flex gap-2">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder={`e.g. How do you approach micro-service architecture, ${selectedMember.name.split(' ')[0]}?`}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAsking}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {isAsking ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </form>

                {memberResponse && (
                  <div className="mt-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200 animate-fadeIn">
                    <div className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{selectedMember.name}:</span>
                    </div>
                    <p className="leading-relaxed text-slate-300">{memberResponse}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
