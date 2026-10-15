/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAuth, NavigationTab, ProjectRequirements, PRDDocument, ProjectSchedule } from './types';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LandingHero } from './components/LandingHero';
import { AboutOrgChart } from './components/AboutOrgChart';
import { ContactVoiceAvatar } from './components/ContactVoiceAvatar';
import { BaInterviewView } from './components/HireWorkflow/BaInterviewView';
import { TeamMeetRoom } from './components/HireWorkflow/TeamMeetRoom';
import { BaDebriefView } from './components/HireWorkflow/BaDebriefView';
import { DashboardView } from './components/LiveOfficeDashboard/DashboardView';
import { speechService } from './lib/speech';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Authenticated User State
  const [userAuth, setUserAuth] = useState<UserAuth>({
    isAuthenticated: true,
    name: 'Alex Mercer',
    email: 'alex.mercer@innovatecorp.io',
    company: 'Apex Technologies',
    role: 'Product Lead / Founder',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  });

  // Hire Workflow Stages: 'interview' | 'meet' | 'debrief'
  const [hireStage, setHireStage] = useState<'interview' | 'meet' | 'debrief'>('interview');
  const [projectIdea, setProjectIdea] = useState<string>('AI Analytics Workspace for Enterprise Teams');

  // Collected Project Requirements
  const [requirements, setRequirements] = useState<ProjectRequirements>({
    appName: 'NovaCloud AI Operations Suite',
    appDescription: 'Autonomous enterprise dashboard for continuous monitoring, telemetry, and automated cloud workflows.',
    category: 'Enterprise SaaS',
    targetAudience: 'Enterprise Engineering Teams & CTOs',
    keyFeatures: ['Live Autonomous Task Dispatcher', 'Real-Time Voice Concierge', 'Multi-Agent PRD Synthesis', '2D Open-Plan Floor View'],
    techStackRecommendations: ['React 19', 'TypeScript', 'Tailwind CSS', 'Node.js Express', 'Gemini 3.8 Flash', 'Gemini 3.8 Neural TTS'],
    themePreference: 'modern-dark',
    urgency: '18.5x Velocity Sprint',
    notes: [
      'Discovered via Lead BA Marcus Vance discovery session',
      'Client: Alex Mercer (Apex Technologies)',
      'Security: Zero-trust RBAC tokens required',
    ],
    completenessScore: 85,
  });

  // Synthesized PRD & Schedule
  const [prd, setPrd] = useState<PRDDocument>({
    title: 'NovaCloud AI Operations Suite',
    version: '1.0.0-PROD',
    author: 'Aria Sterling & Marcus Vance (AI Squad)',
    executiveSummary: 'NovaCloud AI is a high-velocity enterprise platform allowing engineering leads to orchestrate autonomous AI squads in real-time with continuous verification and 2D floor observability.',
    targetAudience: 'Product Leaders, Software Founders, and Enterprise Engineering Managers',
    coreModules: [
      { name: 'Autonomous Dispatch Engine', description: 'Zero-latency event pipeline distributing engineering tasks to specialized AI roles.' },
      { name: 'Multi-Agent Meet Synthesizer', description: 'Simulated multi-perspective Google Meet room converting natural conversations into formal PRDs.' },
      { name: '2D Open-Plan Floor Monitor', description: 'Wall-less top-down virtual office visualizing active agent statuses, coffee breaks, and code generation in real-time.' },
      { name: 'Live Overlay Staging Sandbox', description: 'Interactive functional client application hot-reloading code in the background.' },
    ],
    techStack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Express.js', 'Google GenAI SDK', 'Playwright E2E'],
    userStories: [
      'As an executive, I want to interview with an AI BA so my technical requirements are captured with 100% precision.',
      'As a client, I want to join a simulated Google Meet with all squad leads to deliberate architecture before coding begins.',
      'As a project manager, I want to monitor the team working on a 2D virtual office floor with live terminal logs.',
    ],
    milestones: [
      { phase: 'Sprint 1: Architecture & Topology', duration: 'Day 1', status: 'Completed' },
      { phase: 'Sprint 2: Core Engineering & Staging', duration: 'Day 2-3', status: 'In Progress' },
      { phase: 'Sprint 3: QA & OWASP Hardening', duration: 'Day 4', status: 'Queued' },
      { phase: 'Sprint 4: Edge Deployment & Handover', duration: 'Day 5', status: 'Queued' },
    ],
    estimatedDelivery: '5 Days Accelerated Sprint',
    securityAndCompliance: 'Strict OWASP Top 10 compliance with automated continuous dependency analysis and sanitized input buffers.',
  });

  const [schedule, setSchedule] = useState<ProjectSchedule>({
    kickoffDate: 'Immediate Dispatch',
    deliveryDate: '5 Days Sprint',
    totalSprints: 4,
    velocityMultiplier: '18.5x Human Benchmark',
  });

  // Handler to switch tabs cleanly with speech cutoff
  const handleTabSwitch = (tab: NavigationTab) => {
    speechService.stopSpeaking();
    speechService.playSound('click');
    setActiveTab(tab);
  };

  // Handler to start Hire Us flow from Landing Hero or Contact Us
  const handleStartHire = (initialIdeaText?: string) => {
    speechService.stopSpeaking();
    speechService.playSound('click');
    if (initialIdeaText) {
      setProjectIdea(initialIdeaText);
      setRequirements((prev) => ({
        ...prev,
        appName: initialIdeaText.split(':')[0] || 'Next-Gen Autonomous App',
        appDescription: initialIdeaText,
      }));
    }
    setHireStage('interview');
    setActiveTab('hire');
  };

  // Handler when BA Interview is completed -> Move to Team Google Meet
  const handleFinishInterview = (capturedReqs: ProjectRequirements) => {
    speechService.stopSpeaking();
    setRequirements(capturedReqs);
    setHireStage('meet');
  };

  // Handler when PRD is generated during Team Google Meet -> Move to BA Debrief
  const handlePrdGenerated = (generatedPrd: PRDDocument, generatedSchedule: ProjectSchedule) => {
    speechService.stopSpeaking();
    setPrd(generatedPrd);
    setSchedule(generatedSchedule);
    setHireStage('debrief');
  };

  // Handler when Debrief is finished -> Enter 2D Live Office Dashboard
  const handleEnterDashboard = () => {
    speechService.stopSpeaking();
    setActiveTab('dashboard');
  };

  // Handler for user login / registration
  const handleLogin = (newUser: UserAuth) => {
    setUserAuth(newUser);
    setIsAuthModalOpen(false);
    speechService.playSound('complete');
  };

  const handleLogout = () => {
    setUserAuth({
      isAuthenticated: false,
      name: '',
      email: '',
      company: '',
      role: '',
      avatarUrl: '',
    });
    speechService.playSound('click');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Background Ambient Cyber Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-fuchsia-900/5 blur-[140px]" />
      </div>

      {/* Top Main Navigation Bar */}
      <div className="relative z-40">
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabSwitch}
          onTabChange={handleTabSwitch}
          userAuth={userAuth}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onStartHire={() => handleStartHire()}
          onLogout={handleLogout}
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
          onToggleVoice={() => {
            const next = !voiceEnabled;
            setVoiceEnabled(next);
            if (!next) speechService.stopSpeaking();
          }}
        />
      </div>

      {/* Main Dynamic View Routing */}
      <main className="flex-1 relative z-10">
        {/* VIEW 1: HOME / LANDING PAGE */}
        {activeTab === 'home' && (
          <LandingHero
            onStartHire={handleStartHire}
            onExploreOrgChart={() => handleTabSwitch('about')}
            onExploreTeam={() => handleTabSwitch('about')}
            onOpenLiveFloor={() => handleTabSwitch('dashboard')}
            onContactCare={() => handleTabSwitch('contact')}
          />
        )}

        {/* VIEW 2: ABOUT US (TEAM ORG CHART) */}
        {activeTab === 'about' && (
          <AboutOrgChart
            onStartHire={() => handleStartHire('Custom AI Enterprise Platform')}
            voiceEnabled={voiceEnabled}
          />
        )}

        {/* VIEW 3: CONTACT US (AI AVATAR VOICE CARE) */}
        {activeTab === 'contact' && (
          <ContactVoiceAvatar
            onStartHire={() => handleStartHire('High-Throughput SaaS Application')}
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
          />
        )}

        {/* VIEW 4: HIRE US WORKFLOW (MULTI-STAGE EXPERIENCE) */}
        {activeTab === 'hire' && (
          <div>
            {hireStage === 'interview' && (
              <BaInterviewView
                userAuth={userAuth}
                initialIdea={projectIdea}
                onFinishInterview={handleFinishInterview}
                voiceEnabled={voiceEnabled}
              />
            )}

            {hireStage === 'meet' && (
              <TeamMeetRoom
                userAuth={userAuth}
                requirements={requirements}
                onPrdGenerated={handlePrdGenerated}
                voiceEnabled={voiceEnabled}
              />
            )}

            {hireStage === 'debrief' && (
              <BaDebriefView
                userAuth={userAuth}
                prd={prd}
                schedule={schedule}
                onEnterDashboard={handleEnterDashboard}
                voiceEnabled={voiceEnabled}
              />
            )}
          </div>
        )}

        {/* VIEW 5: DASHBOARD (2D VIRTUAL OFFICE FLOOR + OVERLAY + LOGS) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            userAuth={userAuth}
            requirements={requirements}
            prd={prd}
            schedule={schedule}
            voiceEnabled={voiceEnabled}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-mono">
          <span className="text-cyan-400 font-bold">NovaSoft AI</span>
          <span>•</span>
          <span>Virtual Autonomous Software Engineering Corporation</span>
        </div>
        <p className="text-[11px] text-slate-600">
          Human CEO: Calixto Ong • AI Orchestrator: Aria Sterling • Powered by Server-Side Gemini 3.8 Flash & Gemini 3.8 Neural TTS
        </p>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userAuth={userAuth}
        onSaveAuth={handleLogin}
        onLogin={handleLogin}
      />
    </div>
  );
}
