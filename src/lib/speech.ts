/**
 * Audio and Voice Management: Web Speech API & Web Audio Synthesis
 */

class SpeechService {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private recognition: any = null;
  private isListening = false;
  private audioCtx: AudioContext | null = null;
  private currentTtsEngine: 'gemini-3.8-flash-lite-tts' | 'browser-fallback' = 'gemini-3.8-flash-lite-tts';
  private activeRequestId = 0;
  private abortController: AbortController | null = null;
  private clientQuotaCooldownUntil = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play subtle futuristic UI sound effects using Web Audio API
  public playSound(type: 'click' | 'join_meet' | 'message' | 'complete' | 'chime' | 'alert') {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'join_meet') {
        // Google Meet style entrance chord (Do-Mi-Sol-Do)
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + index * 0.09;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);
          gain.gain.setValueAtTime(0.15, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteTime);
          osc.stop(noteTime + 0.3);
        });
      } else if (type === 'message') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'complete') {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.1;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.45);
        });
      } else if (type === 'chime') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio context might be restricted before gesture
    }
  }

  // Fallback to browser SpeechSynthesis API with strict request ownership check
  private fallbackSpeak(
    cleanText: string,
    options?: {
      speaker?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
    },
    requestId?: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        options?.onEnd?.();
        resolve();
        return;
      }

      if (requestId !== undefined && requestId !== this.activeRequestId) {
        resolve();
        return;
      }

      // Ensure any previous speech synthesis is fully cancelled
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }

      this.currentTtsEngine = 'browser-fallback';
      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;

      const voices = window.speechSynthesis.getVoices();

      if (options?.speaker) {
        const speakerLower = options.speaker.toLowerCase();
        let targetVoice = null;
        if (speakerLower.includes('marcus') || speakerLower.includes('david') || speakerLower.includes('leo') || speakerLower.includes('devon')) {
          targetVoice = voices.find(v => (v.name.includes('Male') || v.name.includes('David') || v.name.includes('George') || v.name.includes('Natural')) && v.lang.startsWith('en'));
        } else {
          targetVoice = voices.find(v => (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google UK English Female') || v.name.includes('Natural')) && v.lang.startsWith('en'));
        }
        if (targetVoice) utterance.voice = targetVoice;
      }

      utterance.rate = options?.rate || 1.05;
      utterance.pitch = options?.pitch || 1.0;

      utterance.onstart = () => {
        if (requestId !== undefined && requestId !== this.activeRequestId) {
          try {
            window.speechSynthesis.cancel();
          } catch (e) {}
          return;
        }
        this.isSpeaking = true;
        options?.onStart?.();
      };

      utterance.onend = () => {
        if (requestId === undefined || requestId === this.activeRequestId) {
          this.isSpeaking = false;
          this.currentUtterance = null;
          options?.onEnd?.();
        }
        resolve();
      };

      utterance.onerror = (e) => {
        if (requestId === undefined || requestId === this.activeRequestId) {
          this.isSpeaking = false;
          this.currentUtterance = null;
          options?.onEnd?.();
        }
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // Updated Neural Voice synthesis with Gemini 3.8 Flash Lite TTS + Browser Fallback
  public async speak(
    text: string,
    options?: {
      speaker?: string;
      voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
      style?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
    }
  ): Promise<void> {
    // Stop all playing audio, cancel speech synthesis, and abort previous in-flight requests
    this.stopSpeaking();

    // Assign new unique request ID
    const requestId = ++this.activeRequestId;
    this.abortController = new AbortController();

    // Clean text of markdown or bracket tags
    const cleanText = text
      .replace(/\[.*?\]/g, '')
      .replace(/[*_#`~]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    // If quota cooldown is currently active, seamlessly use high-fidelity browser speech synthesis
    if (Date.now() < this.clientQuotaCooldownUntil) {
      return this.fallbackSpeak(cleanText, options, requestId);
    }

    // Attempt Gemini 3.8 Neural TTS via server endpoint
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          speaker: options?.speaker,
          voiceName: options?.voiceName,
          style: options?.style,
        }),
        signal: this.abortController.signal,
      });

      // If a newer speak() call has been initiated, discard this response immediately
      if (requestId !== this.activeRequestId) {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (requestId !== this.activeRequestId) {
          return;
        }

        if (data.quotaExceeded) {
          this.clientQuotaCooldownUntil = Date.now() + 3.5 * 60 * 60 * 1000;
        }

        if (data.audio) {
          return new Promise<void>((resolve) => {
            const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audio}`);
            this.currentAudio = audio;
            this.currentTtsEngine = 'gemini-3.8-flash-lite-tts';

            audio.onplay = () => {
              if (requestId !== this.activeRequestId) {
                audio.pause();
                return;
              }
              this.isSpeaking = true;
              options?.onStart?.();
            };

            audio.onended = () => {
              if (requestId === this.activeRequestId) {
                this.isSpeaking = false;
                this.currentAudio = null;
                options?.onEnd?.();
              }
              resolve();
            };

            audio.onerror = (err) => {
              if (requestId !== this.activeRequestId) {
                resolve();
                return;
              }
              console.warn('Audio playback error, falling back to browser synthesis:', err);
              this.currentAudio = null;
              this.fallbackSpeak(cleanText, options, requestId).then(resolve);
            };

            audio.play().catch((playErr: any) => {
              // AbortError indicates it was intentionally stopped or superseded by another speak()
              if (playErr?.name === 'AbortError' || requestId !== this.activeRequestId) {
                resolve();
                return;
              }
              console.warn('Audio play restricted or failed, falling back:', playErr);
              this.currentAudio = null;
              this.fallbackSpeak(cleanText, options, requestId).then(resolve);
            });
          });
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || requestId !== this.activeRequestId) {
        return;
      }
      console.warn('Gemini 3.8 TTS request failed, activating browser synthesis fallback:', err);
    }

    // Only fallback if this is still the active request
    if (requestId === this.activeRequestId) {
      return this.fallbackSpeak(cleanText, options, requestId);
    }
  }

  public stopSpeaking() {
    // Invalidate any in-flight async speak calls
    this.activeRequestId++;

    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (e) {
        // ignore
      }
      this.abortController = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onplay = null;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.src = '';
      } catch (e) {
        // Ignore audio stop errors
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
      this.currentUtterance = null;
    }

    this.isSpeaking = false;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getTtsEngine(): 'gemini-3.8-flash-lite-tts' | 'browser-fallback' {
    return this.currentTtsEngine;
  }

  // Voice Recognition (Speech-to-Text)
  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      onError?.('Speech recognition is not supported in this browser. You can type your response instead.');
      return false;
    }

    try {
      this.stopListening();

      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript, true);
        } else if (interimTranscript) {
          onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        onError?.(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      onError?.(err.message || 'Could not start microphone.');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechService();
