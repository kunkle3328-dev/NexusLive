
export interface AudioConfig {
  inputSampleRate: number;
  outputSampleRate: number;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

// NEW: Granular Voice State Machine
export enum VoiceState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  INTERRUPTED = 'INTERRUPTED',
  RESUMING = 'RESUMING'
}

export interface TranscriptionItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  isFinal?: boolean;
}

export interface VisualizerData {
  volume: number; // 0.0 to 1.0
  isSpeaking: boolean;
}

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Orus' | 'Aoede';

// Theme Definition
export type AppTheme = 'nexus' | 'obsidian' | 'aether' | 'vertex' | 'crimson' | 'midnight' | 'cyber' | 'aurora' | 'solaris' | 'royale' | 'terminal' | 'custom';

export interface CustomThemeConfig {
    base: string;
    surface: string;
    accent: string;
    text: string;
    muted: string;
}

// --- NEW: Voice DNA (Immutable constraints for a voice model) ---
export interface VoiceDNA {
    baselinePace: number; // 0.8 - 1.2
    minWarmth: number;
    maxWarmth: number;
    imperfectionTolerance: 'low' | 'high'; // Can this voice handle stutters?
}

// --- NEW: Trait Locking Support ---
export type VoiceTrait = 'pace' | 'warmth' | 'firmness' | 'brevity';

// --- NEW: User Voice Memory (Learned Preferences) ---
export interface UserVoiceMemory {
    // Delivery Preferences (The "What")
    paceBias: number;           // +/- 0.0 to 0.5 (Learned offset from base)
    warmthBias: number;         // +/- 0 to 5
    firmnessBias: number;       // +/- 0 to 5
    pauseTolerance: 'low' | 'neutral' | 'high';
    imperfectionPreference: 'low' | 'neutral' | 'high';
    
    // Learning Signals (The "Why")
    sessionCount: number;
    avgSessionLength: number; // seconds
    interruptionRate: number; // interruptions per minute (moving average)
    
    // Metadata
    lastStableTimestamp: number;
    lockedTraits: VoiceTrait[]; // Array of locked traits
}

export interface WorkspaceVoiceMemory {
    id: string;
    name: string;
    description: string;
    // Workspaces define defaults, but usually don't have "bias" in the same way, 
    // they act as a baseline layer. For simplicity, we reuse the memory structure 
    // but treat it as an override layer.
    defaults: Partial<UserVoiceMemory>;
    lockedTraits: VoiceTrait[]; // Traits forced by the workspace (Admin control)
}

// --- NEW: Voice Preset (Portable/Shareable Config) ---
export interface VoicePreset {
    id: string;
    name: string;
    description: string;
    author: string;
    tags: string[];
    // The specific settings this preset applies
    settings: Partial<VoiceProfile>; 
    createdAt: Date;
}

// --- NEW: Marketplace Profile (Sellable Asset) ---
export interface MarketplaceProfile {
    id: string;
    name: string;
    description: string;
    voiceName: VoiceName;
    dna: VoiceDNA;
    price: number; // 0 for free
    author: string;
    rating: number;
    downloads: number;
    tags: string[];
    previewAudioUrl?: string; // Mock url
    isOwned?: boolean;
    defaultConfig: Partial<VoiceProfile>;
}

// ENHANCED: Voice Profile with Behavioral Traits
export interface VoiceProfile {
  id: string;
  name: string;
  voiceName: VoiceName;
  dna?: VoiceDNA; // Optional reference to DNA constraints
  
  // Vocal Characteristics
  pace: number; // 0.8 to 1.2
  warmth: number; // 0-10
  energy: number; // 0-10
  
  // Behavioral Traits (Tier 3-6)
  brevity: number; // 0-10
  formality: number; // 0-10
  firmness: number; // 0-10
  challengeLevel: number; // 0-10 
  emotionalDrift: boolean; 
  pauseDensity: number; // 0-10
  
  // Advanced Realism Controls
  microHesitation: 'off' | 'low' | 'natural';
  selfCorrection: boolean;
  sentenceCompletionVariability: boolean;
  
  // Cognitive Timing
  thoughtDelay: 'off' | 'short' | 'variable';
  midResponseAdaptation: boolean;
  
  // Acoustic Nuance
  breathPlacement: 'off' | 'subtle';
  prosodicDrift: boolean;
  emphasisDecay: boolean;
  
  // Human Imperfection
  naturalFillers: 'off' | 'rare' | 'contextual';
  laughter: 'off' | 'rare';
  falseStartAllowance: boolean;
}

// NEW: Multi-Layer Memory System
export interface MemoryLayer {
  session: string[]; // Facts from this session
  user: { // Long-term preferences
    name: string;
    pacePreference: string; // Deprecated in favor of voiceMemory but kept for compat
    tonePreference: string; // Deprecated in favor of voiceMemory but kept for compat
  };
  voiceMemory: UserVoiceMemory; // Persistent voice preferences (NEW)
  workspace: string[]; // Shared domain knowledge
  activeWorkspaceId?: string; // ID of currently active workspace context
}

// --- LEARNING & PODCAST ---

export interface LearningSource {
  id: string;
  title: string;
  type: 'text' | 'url' | 'pdf' | 'youtube';
  content: string;
  url?: string;
  tags: string[];
  createdAt: Date;
  status: 'processing' | 'ready' | 'error';
}

export interface PodcastScriptLine {
  speaker: 'Host' | 'Expert';
  text: string;
}

export type PodcastType = 'Standard' | 'Teaching';

export interface PodcastChapter {
  id: string;
  title: string;
  startTime: number; // seconds
  endTime?: number;
  objective: string;
  keyTakeaways: string[];
  summary?: string;
}

export type MomentType = 'KeyTakeaway' | 'Reflection' | 'Quiz' | 'Definition';
export interface LearningMoment {
  id: string;
  chapterId?: string;
  timestamp: number;
  type: MomentType;
  content: string;
  action?: string;
}

export interface PodcastBlueprint {
  learningObjectives: string[];
  targetAudience: string;
  teachingStyle: string;
  chapters: {
    title: string;
    objective: string;
    keyPoints: string[];
  }[];
  glossary: { term: string; definition: string }[];
  checkpoints?: string[];
  misconceptions?: string[];
}

export interface PodcastEpisode {
  id: string;
  title: string;
  topic: string;
  type: PodcastType;
  style: string;
  script: PodcastScriptLine[];
  blueprint?: PodcastBlueprint;
  chapters?: PodcastChapter[];
  moments?: LearningMoment[];
  audioBase64?: string;
  coverImageBase64?: string;
  sourceIds: string[];
  createdAt: Date;
  durationSeconds?: number;
}

// --- FEATURE 1 & 3: PRODUCER & CALLS ---

export type CallStatus = 'queued' | 'screening' | 'live' | 'declined' | 'ended';

export interface AnswerCard {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  pitfalls: string[];
  nextActions: string[];
  createdAt: Date;
}

export interface CallRequest {
  id: string;
  callerName: string;
  topic: string;
  rawPromptOrText: string;
  status: CallStatus;
  createdAt: Date;
  transcript?: TranscriptionItem[];
  answerCards?: AnswerCard[];
  aiSummary?: string; 
  suggestedResponses?: string[];
}

// --- FEATURE 4: TELEMETRY & ADMIN ---

export type TelemetryLevel = 'info' | 'warn' | 'error' | 'debug';
export type TelemetryCategory = 'audio' | 'network' | 'producer' | 'system' | 'drift';

export interface AudioTelemetryEvent {
  id: string;
  timestamp: number;
  level: TelemetryLevel;
  category: TelemetryCategory;
  message: string;
  data?: any;
}

export interface AdminConfig {
  godMode: boolean; // Disables safety filters and system prompt constraints
  forceMonetization: boolean; // Simulates free tier limits
  debugLatency: boolean; // Shows latency graphs
  safetyFilters: 'strict' | 'relaxed' | 'off'; // Controls LLM safety settings
  temperature: number; // 0.0 to 2.0
  maintenanceMode: boolean; // Simulates system downtime
  systemBroadcast?: string; // Message to display to all users
}
