import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, Send, Volume2, VolumeX, PhoneCall, PhoneOff, Sparkles, MessageSquare, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { speechService } from '../lib/speech';
import { TEAM_MEMBERS } from '../data/teamData';

interface ContactVoiceAvatarProps {
  onStartHire: () => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'avatar';
  text: string;
  timestamp: string;
}

export const ContactVoiceAvatar: React.FC<ContactVoiceAvatarProps> = ({
  onStartHire,
  voiceEnabled,
  setVoiceEnabled,
}) => {
  const avatar = TEAM_MEMBERS.find((m) => m.id === 'support') || TEAM_MEMBERS[1];
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'avatar',
      text: `Hello! I'm Chloe, your 24/7 AI Customer Care Concierge at NovaSoft AI. Whether you're exploring autonomous software development, looking for project pricing, or ready to launch your dream web application, I'm here to guide you. You can talk to me directly via voice or type below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
    };
  }, []);

  // Handle Voice Synthesis speaking state tracking
  const speakAvatarResponse = (text: string) => {
    if (!voiceEnabled) return;
    setIsSpeaking(true);
    speechService.speak(text, {
      speaker: 'Chloe Diaz',
      voiceName: 'Kore',
      style: 'Warm, hospitable, concise customer care concierge with natural pacing',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    speechService.playSound('message');
    setInputVal('');
    setMicError(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          agentName: 'Chloe Diaz',
          role: 'AI Customer Care & Concierge',
        }),
      });

      const data = await res.json();
      const replyText = data.text || "I'd be glad to help you get connected with our Lead BA for a discovery session.";

      const avatarMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'avatar',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, avatarMsg]);
      speakAvatarResponse(replyText);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'avatar',
        text: "NovaSoft AI squads are ready to build. You can initiate your project discovery session anytime by clicking 'Start Autonomous Onboarding'.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakAvatarResponse(fallbackMsg.text);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMicListening = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setMicError(null);
      const success = speechService.startListening(
        (transcript, isFinal) => {
          setInputVal(transcript);
          if (isFinal) {
            handleSendMessage(transcript);
            speechService.stopListening();
            setIsListening(false);
          }
        },
        (error) => {
          setMicError(`Mic Error: ${error}`);
          setIsListening(false);
        },
        () => setIsListening(false)
      );

      if (success) {
        setIsListening(true);
        speechService.playSound('chime');
      }
    }
  };

  const toggleCallMode = () => {
    speechService.playSound('click');
    if (isCalling) {
      setIsCalling(false);
      speechService.stopListening();
      speechService.stopSpeaking();
      setIsSpeaking(false);
      setIsListening(false);
    } else {
      setIsCalling(true);
      setVoiceEnabled(true);
      const greeting = "Hi there! Real-time voice line is now connected. What software product are you looking to build today?";
      speakAvatarResponse(greeting);
    }
  };

  const sampleQuestions = [
    'How fast can your AI squad ship a full-stack SaaS?',
    'What happens during the Lead BA interview and Google Meet?',
    'How do human CEO vision and AI agents work together?',
    'Can I monitor the code build live on the 2D office floor?',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      {/* Top Banner */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-2">
          Voice Concierge
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">Contact AI Customer Care</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Engage in real-time interactive voice or text dialogue with Chloe Diaz, our AI Client Support Avatar.
        </p>
      </div>

      {/* Main Grid: Left Avatar Stage / Right Interactive Chat & Call */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Talking Avatar Card */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-2xl space-y-5 backdrop-blur-md">
          {/* Avatar Video / Portrait Stage */}
          <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-950 shadow-inner flex items-center justify-center group">
            {/* Background Studio Lighting */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

            {/* Avatar Human Image */}
            <img
              referrerPolicy="no-referrer"
              src={avatar.avatarUrl}
              alt="Chloe Diaz"
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isSpeaking ? 'scale-105 filter brightness-110' : 'scale-100'
              }`}
            />

            {/* Speaking Waveform Overlay */}
            {isSpeaking && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-indigo-500/50 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20">
                <span className="w-1.5 h-4 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-7 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                <span className="w-1.5 h-8 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
                <span className="w-1.5 h-3 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="text-[10px] font-mono font-bold text-indigo-300 ml-2 uppercase tracking-wider">Chloe Speaking</span>
              </div>
            )}

            {/* Listening Pulse Overlay */}
            {isListening && (
              <div className="absolute top-4 left-4 bg-rose-950/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-rose-500/80 flex items-center gap-2 text-rose-300 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] uppercase tracking-wider">Listening to you</span>
              </div>
            )}

            {/* Online Badge */}
            <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE CONCIERGE</span>
            </div>
          </div>

          {/* Avatar Information & Controls */}
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <span>{avatar.name}</span>
              <Bot className="w-4 h-4 text-indigo-400" />
            </h3>
            <p className="text-xs text-indigo-400 font-medium">{avatar.role}</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Latency: ~180ms • Neural Model: Gemini Live Dialogue</p>
          </div>

          {/* Real-time Call Toggle Bar */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              id="btn-toggle-voice-call"
              onClick={toggleCallMode}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                isCalling
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 uppercase tracking-wider'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)] uppercase tracking-wider'
              }`}
            >
              {isCalling ? (
                <>
                  <PhoneOff className="w-4 h-4" />
                  <span>End Voice Call</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4" />
                  <span>Start Voice Call</span>
                </>
              )}
            </button>

            <button
              id="btn-avatar-speak-test"
              onClick={() => {
                speechService.playSound('click');
                speakAvatarResponse("Hello! How can our autonomous AI engineering squad help bring your vision to life?");
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Test Voice Playback"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Route to Hire Us */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2.5">
            <div className="text-xs font-medium text-slate-300">Ready to build your custom application?</div>
            <button
              id="btn-contact-start-hire"
              onClick={() => {
                speechService.playSound('click');
                onStartHire();
              }}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Launch Discovery Interview</span>
            </button>
          </div>
        </div>

        {/* Right Column: Real-time Interactive Chat & Voice Transcription */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-2xl flex flex-col h-[600px] backdrop-blur-md">
          {/* Chat Window Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-sm text-white">Live Dialogue Stream</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Real-time Sync</span>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'avatar' && (
                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-500/40 flex-shrink-0">
                    <img referrerPolicy="no-referrer" src={avatar.avatarUrl} alt="Chloe" className="w-full h-full object-cover" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-70">
                    <span className="font-bold">{msg.sender === 'user' ? 'You' : 'Chloe Diaz (Customer Care)'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-500/40 flex-shrink-0">
                  <img referrerPolicy="no-referrer" src={avatar.avatarUrl} alt="Chloe" className="w-full h-full object-cover" />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl rounded-bl-none px-4 py-3 text-xs text-indigo-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <span>Chloe is synthesizing response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Prompts */}
          <div className="pt-2 pb-3 border-t border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
              Suggested Questions:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-400 hover:text-slate-200 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Voice Controls */}
          {micError && (
            <div className="mb-2 p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]">
              {micError}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            {/* Microphone Button for Real-time Voice Chat */}
            <button
              id="btn-mic-toggle"
              type="button"
              onClick={toggleMicListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-lg shadow-rose-600/40'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-indigo-400 hover:text-indigo-300'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak into Microphone'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              id="input-chat-message"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? 'Listening to your voice...' : 'Type message or press mic to speak...'}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
            />

            {/* Send Button */}
            <button
              id="btn-send-chat"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputVal.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
