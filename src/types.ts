export interface UserAuth {
  isLoggedIn?: boolean;
  isAuthenticated?: boolean;
  uid?: string;
  name: string;
  email: string;
  company: string;
  avatarUrl: string;
  role: string;
  isAdmin?: boolean;
}

export type NavigationTab = 'home' | 'about' | 'contact' | 'hire' | 'dashboard' | 'admin';

export type HireWorkflowStage = 'auth' | 'ba_interview' | 'team_meet' | 'ba_debrief' | 'office_dashboard';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: 'Executive' | 'Product & BA' | 'Architecture' | 'Engineering' | 'Design' | 'Quality & Security' | 'DevOps & SRE' | 'Support';
  isHuman: boolean;
  avatarUrl: string;
  bio: string;
  specialties: string[];
  personality: string;
  deskId: string;
  voiceName: string;
  neuralModel?: string;
  glbModelUrl?: string;
  glbModelName?: string;
  glbModelData?: string; // base64 or blob URL
  preset3DType?: 'android' | 'executive' | 'architect' | 'developer' | 'sentinel' | 'drone' | 'hologram';
  updatedAt?: string;
  updatedBy?: string;
}

export interface InterviewNote {
  category: string;
  detail: string;
  timestamp: string;
}

export interface ProjectRequirements {
  appName: string;
  appDescription: string;
  category: string;
  targetAudience: string;
  keyFeatures: string[];
  techStackRecommendations: string[];
  themePreference: 'modern-dark' | 'corporate-light' | 'neon-cyber' | 'minimal-clean';
  urgency: string;
  notes: string[];
  completenessScore: number;
}

export interface PRDModule {
  name: string;
  description: string;
}

export interface PRDMilestone {
  phase: string;
  duration: string;
  status: 'Completed' | 'In Progress' | 'Queued';
}

export interface PRDDocument {
  title: string;
  version: string;
  author: string;
  executiveSummary: string;
  targetAudience: string;
  techStack: string[];
  coreModules: PRDModule[];
  userStories: string[];
  securityAndCompliance: string;
  milestones: PRDMilestone[];
  estimatedDelivery: string;
  budgetEstimate?: string;
}

export interface ProjectSchedule {
  kickoffDate: string;
  sprintCount?: number;
  totalSprints?: number;
  velocityMultiplier: string;
  deliveryDate: string;
}

export interface GoogleMeetDialogue {
  id: string;
  speakerId: string;
  speakerName: string;
  role: string;
  message: string;
  timestamp: string;
  avatarMood?: string;
}

export interface OfficeAgentState {
  id: string;
  memberId: string;
  name: string;
  role: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  status: 'coding' | 'architecting' | 'reviewing' | 'testing' | 'deploying' | 'speaking' | 'coffee_break';
  currentTask: string;
  progress: number;
  speechBubble?: string;
  color: string;
  deskPosition: { x: number; y: number };
}

export interface ActionLogItem {
  id: string;
  timestamp: string;
  agentId?: string;
  agentName: string;
  role: string;
  action: string;
  level: 'INFO' | 'SUCCESS' | 'BUILD' | 'SECURITY';
  codeSnippet?: string;
}
