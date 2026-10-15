import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Track quota exhaustion cooldown to avoid repeated 429 error loops
  let ttsCooldownUntil = 0;

  // Updated Neural TTS Endpoint powered by Gemini 3.8 Flash Lite TTS with automatic fallback
  app.post("/api/tts", async (req, res) => {
    // If quota was previously exhausted, immediately return fallback indicator without error
    if (Date.now() < ttsCooldownUntil) {
      return res.json({
        isFallback: true,
        quotaExceeded: true,
        error: "Gemini TTS quota cooldown active, using browser synthesis fallback",
      });
    }

    try {
      const { text, speaker = "Aria Sterling", voiceName, style } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({ error: "Gemini API client not configured", isFallback: true });
      }

      // Map squad avatar personalities to official Gemini 3.8 prebuilt voices:
      // Options: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      let selectedVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore';
      if (voiceName && ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voiceName)) {
        selectedVoice = voiceName;
      } else {
        const spk = (speaker || "").toLowerCase();
        if (spk.includes('marcus') || spk.includes('devon') || spk.includes('calixto')) {
          selectedVoice = 'Fenrir';
        } else if (spk.includes('leo') || spk.includes('takahashi')) {
          selectedVoice = 'Charon';
        } else if (spk.includes('sophia') || spk.includes('maya')) {
          selectedVoice = 'Zephyr';
        } else if (spk.includes('elena') || spk.includes('puck')) {
          selectedVoice = 'Puck';
        } else {
          selectedVoice = 'Kore'; // Aria Sterling & Chloe Diaz
        }
      }

      const cleanText = (text || "")
        .replace(/\[.*?\]/g, '')
        .replace(/[*_#`~]/g, '')
        .trim();

      if (!cleanText) {
        return res.status(400).json({ error: "Text is required for TTS" });
      }

      // Call Gemini 3.8 Flash Lite TTS (official standard audio model)
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: style || `Natural, expressive, articulate corporate tech leader delivery as ${speaker}`,
                },
              } as any,
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        } as any,
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.json({ error: "No audio data received from Gemini TTS", isFallback: true });
      }

      // Unary generateContent returns a complete 24kHz 16-bit mono WAV file with RIFF header
      res.json({
        audio: base64Audio,
        mimeType: "audio/wav",
        voiceName: selectedVoice,
        model: "gemini-3.8-flash-lite-tts",
      });
    } catch (error: any) {
      const errStr = String(error?.message || error || "");
      const isQuota =
        error?.status === 429 ||
        error?.code === 429 ||
        errStr.includes("429") ||
        errStr.includes("quota") ||
        errStr.includes("RESOURCE_EXHAUSTED") ||
        errStr.includes("limit: 10");

      if (isQuota) {
        // Set 3.5 hour cooldown matching the Google API retryDelay
        ttsCooldownUntil = Date.now() + 3.5 * 60 * 60 * 1000;
        console.warn("Gemini TTS daily quota reached (10 requests/day). Seamlessly activated browser voice synthesis.");
        return res.json({
          isFallback: true,
          quotaExceeded: true,
          error: "Gemini TTS quota exceeded. Automatic browser voice synthesis active.",
        });
      }

      console.warn("Gemini TTS service notice:", errStr);
      res.json({ isFallback: true, error: errStr || "Failed to generate speech" });
    }
  });

  // Customer Care / General Avatar Voice & Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], agentName = "Chloe", role = "Customer Care Specialist" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          text: `[${agentName} - ${role}]: Thank you for reaching out to NovaSoft AI! I'm here to assist you with our AI-driven software development services, project estimates, or booking an onboarding session with our Lead BA. How can I help power your vision today?`,
          isFallback: true,
        });
      }

      const systemInstruction = `You are ${agentName}, the ${role} at NovaSoft AI - a premier next-generation virtual software agency operated by human leadership and hyper-specialized autonomous AI engineering avatars. 
Your tone is professional, warm, articulate, and confident. Keep your verbal/written responses engaging and concise (2-4 sentences max unless detailed tech specs are requested), perfectly suited for interactive voice conversation and visual avatars.
Company Core Capabilities:
- Full-stack Web & Mobile Applications with React, Next.js, Python, Node, Cloud Native.
- Rapid Autonomous Development Squads (CEO, AI Orchestrator, Lead BA, Solutions Architect, UI/UX Lead, Senior Devs, QA Automators, DevOps SRE).
- From user voice interview to full PRD, sprint schedule, and live monitored dashboard in minutes.`;

      const contents = [
        ...history.map((h: { role: string; content: string }) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: message || "Hello" }] },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text || "I'm here to help you get started with NovaSoft AI." });
    } catch (error: any) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  });

  // Business Analyst Interview Endpoint
  app.post("/api/interview", async (req, res) => {
    try {
      const { userMessage, history = [], currentProjectInfo = {} } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          reply: "Got it! That sounds like an exciting software initiative. What key features, user roles, and design aesthetic would you envision for the initial release?",
          notes: [
            "User project: Modern digital application",
            "Focus: Scalable performance and responsive UI",
            "Next step: Defining core database schema and integrations",
          ],
          completenessScore: 40,
          readyForTeamMeet: false,
          isFallback: true,
        });
      }

      const systemInstruction = `You are Marcus Vance, Lead Business Analyst at NovaSoft AI. 
You are conducting a friendly, sharp, structured Discovery & Requirements Gathering interview with the client.
Your goal is to understand what software/web app they want to build (purpose, target audience, core features, auth/database needs, UI theme, target timeline).

Return ONLY a valid JSON object matching this schema:
{
  "reply": "Marcus's conversational spoken response to the user. Acknowledge what they said, validate it, and ask 1 focused clarification question.",
  "extractedNotes": ["Bullet point notes of what requirements Marcus has gathered so far"],
  "projectSummary": {
    "appName": "Proposed concise app name or concept",
    "category": "E.g. E-Commerce / SaaS / Social / Health / FinTech",
    "keyFeatures": ["feature 1", "feature 2"],
    "techStackRecommendations": ["React", "Tailwind", "Node.js", "PostgreSQL"],
    "targetAudience": "Target user description"
  },
  "completenessScore": 0 to 100, // Score representing how complete the requirements are
  "readyForTeamMeet": boolean // Set to true if completenessScore >= 70 or user provided sufficient app scope
}`;

      const contents = [
        ...history.map((h: { role: string; content: string }) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        })),
        {
          role: "user",
          parts: [{ text: `Client response: "${userMessage}". Current info so far: ${JSON.stringify(currentProjectInfo)}` }],
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Interview API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Team Google Meet Room Deliberation
  app.post("/api/team-meet", async (req, res) => {
    try {
      const { projectDetails, userQuery, activeSpeaker } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          dialogues: [
            {
              speakerId: "orchestrator",
              speakerName: "Aria Sterling (AI Orchestrator)",
              role: "Executive Chief of Staff",
              message: `I have synthesized the requirements for "${projectDetails?.appName || 'the Project'}". Coordinating sprint allocations across architecture, frontend, backend, and security squads.`,
            },
            {
              speakerId: "architect",
              speakerName: "Dr. Sophia Chen",
              role: "Chief Solutions Architect",
              message: "I recommend a decoupled modular architecture with TypeScript, event-driven state sync, and secure microservices.",
            },
            {
              speakerId: "uiux",
              speakerName: "Elena Rostova",
              role: "Creative UI/UX Director",
              message: "We're crafting a sleek, high-contrast dark/light design system with fluid motion transitions and accessibility AA compliance.",
            },
            {
              speakerId: "dev",
              speakerName: "Leo Takahashi",
              role: "Lead Full-Stack Engineer",
              message: "Setting up Vite + React components, state hooks, and API bridges. Ready to stream live builds to the operations floor.",
            },
            {
              speakerId: "qa",
              speakerName: "Devon Miller",
              role: "Lead QA & Security Specialist",
              message: "Automated test suites and OWASP security sanitization hooks are queued for continuous validation.",
            },
            {
              speakerId: "devops",
              speakerName: "Maya Al-Mansoor",
              role: "Cloud DevOps & SRE Lead",
              message: "Container registry prepared with automated CI/CD pipelines for sub-second hot redeployments.",
            },
          ],
          isFallback: true,
        });
      }

      const prompt = `You are orchestrating a real-time Google Meet engineering sync for NovaSoft AI regarding the client's project:
Project Data: ${JSON.stringify(projectDetails)}
User input/inquiry in the meeting: "${userQuery || 'Kickoff meeting and team analysis'}"
Specific member requested (if any): "${activeSpeaker || 'All'}"

Generate a realistic, vibrant discussion from team members:
1. Aria Sterling (AI Orchestrator & Exec Chief of Staff) - orchestrates work & deliverables
2. Dr. Sophia Chen (Chief Solutions Architect) - deep database, scalability, cloud design
3. Elena Rostova (Creative UI/UX Director) - aesthetics, user flows, motion design
4. Leo Takahashi (Lead Full-Stack Engineer) - frontend/backend code structure & execution speed
5. Devon Miller (Lead QA & Security) - automated tests, edge cases, vulnerabilities
6. Maya Al-Mansoor (DevOps & SRE Lead) - containerization, deployment speed, reliability

Return ONLY valid JSON matching this schema:
{
  "dialogues": [
    {
      "speakerId": "orchestrator" | "architect" | "uiux" | "dev" | "qa" | "devops",
      "speakerName": "Full Name",
      "role": "Role Title",
      "message": "Direct, punchy statement (1-3 sentences) showing distinct technical mastery and commitment to the user's project.",
      "avatarMood": "confident" | "excited" | "analytical" | "focused"
    }
  ],
  "consensus": "Quick 1-sentence summary of team alignment"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Team meet API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate Comprehensive PRD (Product Requirements Document) & Schedule
  app.post("/api/generate-prd", async (req, res) => {
    try {
      const { projectDetails, interviewNotes } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          prd: {
            title: projectDetails?.appName || "Next-Gen Enterprise Web Platform",
            version: "1.0.0-PROD",
            author: "Aria Sterling (AI Orchestrator) & Marcus Vance (Lead BA)",
            executiveSummary: "A modern, high-performance web application designed for rapid adoption, dynamic interactivity, and cloud-native resilience.",
            targetAudience: "Global digital users, professionals, and enterprise clients seeking fluid workflows.",
            techStack: ["React 19", "TypeScript", "Tailwind CSS", "Express API", "Google Gemini AI Engine", "Cloud Run"],
            coreModules: [
              { name: "Authentication & User Management", description: "Secure session tokens and role-based access control." },
              { name: "Core Business Logic Engine", description: "High-throughput data processing and real-time state synchronization." },
              { name: "Interactive Visual Dashboard", description: "Responsive analytics with high-contrast data visualizers." },
              { name: "Autonomous Event Pipeline", description: "Background workers executing continuous optimization." }
            ],
            userStories: [
              "As an end user, I want instant response times and intuitive layouts so I can complete workflows in seconds.",
              "As an administrator, I want real-time telemetry logs and role management."
            ],
            milestones: [
              { phase: "Sprint 1: Architecture & UI Scaffolding", duration: "Day 1-2", status: "In Progress" },
              { phase: "Sprint 2: Core Engine & API Services", duration: "Day 3-4", status: "Queued" },
              { phase: "Sprint 3: QA Automated Auditing & Security", duration: "Day 5", status: "Queued" },
              { phase: "Sprint 4: DevOps Cloud Deployment & Handover", duration: "Day 6", status: "Queued" }
            ],
            estimatedDelivery: "6 Business Days (AI Accelerated)",
            budgetEstimate: "$14,500 USD (Value Packaged)"
          },
          schedule: {
            kickoffDate: new Date().toLocaleDateString(),
            sprintCount: 4,
            velocityMultiplier: "18.5x (AI Workforce)",
            deliveryDate: new Date(Date.now() + 6 * 86400000).toLocaleDateString()
          },
          isFallback: true
        });
      }

      const prompt = `Generate a rigorous, professional Product Requirements Document (PRD) and sprint delivery schedule for this project:
Project Details: ${JSON.stringify(projectDetails)}
Interview Notes: ${JSON.stringify(interviewNotes)}

Return ONLY a valid JSON object matching this schema:
{
  "prd": {
    "title": "Comprehensive Title",
    "version": "1.0.0-DRAFT",
    "author": "Aria Sterling (AI Orchestrator) & Marcus Vance (Lead BA)",
    "executiveSummary": "Concise executive overview of vision and objectives",
    "targetAudience": "Detailed demographic and persona description",
    "techStack": ["List", "of", "Technologies"],
    "coreModules": [
      { "name": "Module Title", "description": "Technical specification" }
    ],
    "userStories": ["Story 1", "Story 2", "Story 3"],
    "securityAndCompliance": "Security and performance guidelines",
    "milestones": [
      { "phase": "Sprint Phase Name", "duration": "Duration", "status": "In Progress" | "Queued" }
    ],
    "estimatedDelivery": "e.g. 5 Business Days",
    "budgetEstimate": "e.g. $12,800 USD (AI-Optimized Fixed Scope)"
  },
  "schedule": {
    "kickoffDate": "String date",
    "sprintCount": 4,
    "velocityMultiplier": "20x Human Equivalent",
    "deliveryDate": "String date"
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("PRD API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Autonomous Floor Agent Live Action Generator
  app.post("/api/agent-task", async (req, res) => {
    try {
      const { agentRole, currentTask, projectContext } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          actionDescription: `${agentRole} executed unit test pass with 100% test coverage.`,
          codeSnippet: `// Auto-generated module by ${agentRole}\nexport const serviceWorker = async () => {\n  return { status: 'ONLINE', latency: '4ms' };\n};`,
          metricChange: { testsPassed: 42, cpuLoad: "3.2%", buildStatus: "SUCCESS" }
        });
      }

      const prompt = `You are simulating a live agent action on an autonomous software floor.
Agent Role: ${agentRole}
Current Task: ${currentTask}
Project Context: ${JSON.stringify(projectContext)}

Generate a real-time engineering work item executed right now.
Return ONLY valid JSON:
{
  "actionDescription": "Concrete action sentence (e.g. 'Optimized IndexedDB cache layers with memoized React hooks')",
  "codeSnippet": "Realistic 3-8 lines of clean TypeScript/CSS/React code",
  "logLevel": "INFO" | "SUCCESS" | "BUILD",
  "metricDelta": { "testsPassed": 1, "coverage": "+0.4%" }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Agent task error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite Middleware for Dev vs Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NovaSoft AI Server running on port ${PORT}`);
  });
}

startServer();
