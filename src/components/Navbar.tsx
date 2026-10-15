import React from 'react';
import { NavigationTab, UserAuth } from '../types';
import { Bot, Users, PhoneCall, Sparkles, LayoutDashboard, Volume2, VolumeX, LogIn, UserCheck, ShieldCheck } from 'lucide-react';
import { speechService } from '../lib/speech';
import { isAdminEmail } from '../lib/firebase';

interface NavbarProps {
  activeTab: NavigationTab;
  setActiveTab?: (tab: NavigationTab) => void;
  onTabChange?: (tab: NavigationTab) => void;
  userAuth?: UserAuth;
  onOpenAuth: () => void;
  onStartHire?: () => void;
  onLogout?: () => void;
  voiceEnabled: boolean;
  setVoiceEnabled?: (enabled: boolean) => void;
  onToggleVoice?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onTabChange,
  userAuth,
  onOpenAuth,
  onStartHire,
  onLogout,
  voiceEnabled,
  setVoiceEnabled,
  onToggleVoice,
}) => {
  const handleNavClick = (tab: NavigationTab) => {
    speechService.playSound('click');
    if (setActiveTab) setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const handleHireClick = () => {
    speechService.playSound('click');
    if (onStartHire) {
      onStartHire();
    } else {
      handleNavClick('hire');
    }
  };

  const toggleVoice = () => {
    speechService.playSound('click');
    if (onToggleVoice) {
      onToggleVoice();
    } else if (setVoiceEnabled) {
      const newState = !voiceEnabled;
      setVoiceEnabled(newState);
      if (!newState) {
        speechService.stopSpeaking();
      }
    }
  };

  const isUserLoggedIn = Boolean(userAuth && (userAuth.isLoggedIn || userAuth.isAuthenticated));
  const isUserAdmin = Boolean(userAuth?.isAdmin || isAdminEmail(userAuth?.email));

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#020617]/80 border-b border-slate-800/50 text-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white italic shadow-[0_0_12px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                NOVASOFT AI
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 font-bold uppercase tracking-widest">
                Autonomous Squads
              </span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Virtual Software Agency</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-[0.2em] font-semibold text-slate-400">
          <button
            id="nav-home"
            onClick={() => handleNavClick('home')}
            className={`pb-1 transition-all flex items-center gap-1.5 ${
              activeTab === 'home'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'hover:text-white transition-colors'
            }`}
          >
            <span>Overview</span>
          </button>

          <button
            id="nav-about"
            onClick={() => handleNavClick('about')}
            className={`pb-1 transition-all flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'hover:text-white transition-colors'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team & 3D</span>
          </button>

          <button
            id="nav-contact"
            onClick={() => handleNavClick('contact')}
            className={`pb-1 transition-all flex items-center gap-1.5 ${
              activeTab === 'contact'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'hover:text-white transition-colors'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Voice Care</span>
          </button>

          <button
            id="nav-dashboard"
            onClick={() => handleNavClick('dashboard')}
            className={`pb-1 transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'hover:text-white transition-colors'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>2D Office Floor</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </button>

          {/* Admin Dashboard Tab */}
          <button
            id="nav-admin"
            onClick={() => handleNavClick('admin')}
            className={`pb-1 transition-all flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'hover:text-amber-300 transition-colors'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin</span>
            {isUserAdmin && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[8px] font-mono font-bold">
                ACTIVE
              </span>
            )}
          </button>
        </nav>

        {/* Right CTA & Voice Control */}
        <div className="flex items-center gap-3">
          {/* Voice Toggle Button */}
          <button
            id="btn-toggle-voice"
            onClick={toggleVoice}
            title={voiceEnabled ? 'Mute AI Voice Synthesis' : 'Enable AI Voice Synthesis'}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              voiceEnabled
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="hidden sm:inline text-[10px] font-mono tracking-wider font-semibold">GEMINI 3.8 TTS</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px] font-mono tracking-wider">MUTED</span>
              </>
            )}
          </button>

          {/* User Auth Profile */}
          <button
            id="btn-auth-user"
            onClick={onOpenAuth}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all text-xs"
          >
            {isUserLoggedIn && userAuth ? (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">{userAuth.role || 'Member'}</p>
                  <p className="text-xs font-medium leading-tight text-slate-200">{userAuth.name || 'User'}</p>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500/50 p-0.5">
                  <img
                    referrerPolicy="no-referrer"
                    src={userAuth.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                    alt={userAuth.name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">Sign In</span>
              </>
            )}
          </button>

          {/* Primary Hire Us Button */}
          <button
            id="btn-hire-squad"
            onClick={handleHireClick}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(99,102,241,0.35)] flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Hire Squad</span>
          </button>
        </div>
      </div>
    </header>
  );
};
