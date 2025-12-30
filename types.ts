
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

export type AppTheme = 'nexus' | 'obsidian' | 'aether' | 'vertex' | 'crimson' | 'midnight' | 'cyber' | 'aurora' | 'solaris' | 'royale' | 'terminal' | 'custom';

export interface CustomThemeConfig {
    base: string;
    surface: string;
    accent: string;
    text: string;
    muted: string;
}

export interface VoiceDNA {
    paceRange: [number, number];   
    warmthRange: [number, number]; 
    energyRange: [number, number]; 
    imperfectionTolerance: 'low' | 'high'; 
    defaultPersonaBias: string; 
}

export interface AdminPolicy {
    allowVoiceMemory: boolean;       
    maxImperfectionLevel: 'off' | 'low' | 'natural'; 
    lockedPersonas: string[];        
    allowExport: boolean;            
    allowSharing: boolean;           
}

export type VoiceTrait = 'pace' | 'warmth' | 'firmness' | 'brevity';

export interface UserVoiceMemory {
    paceBias: number;           
    warmthBias: number;         
    firmnessBias: number;       
    pauseTolerance: 'low' | 'neutral' | 'high';
    imperfectionPreference: 'low' | 'neutral' | 'high';
    sessionCount: number;
    avgSessionLength: number; 
    interruptionRate: number; 
    lastStableTimestamp: number;
    lockedTraits: VoiceTrait[]; 
}

export interface WorkspaceVoiceMemory {
    id: string;
    name: string;
    description: string;
    defaults: Partial<UserVoiceMemory>;
    lockedTraits: VoiceTrait[]; 
}

export interface VoicePreset {
    id: string;
    name: string;
    description: string;
    author: string;
    tags: string[];
    settings: Partial<VoiceProfile>; 
    createdAt: Date;
}

export interface MarketplaceProfile {
    id: string;
    name: string;
    description: string;
    voiceName: VoiceName;
    dna: VoiceDNA;
    price: number; 
    author: string;
    rating: number;
    downloads: number;
    tags: string[];
    previewAudioUrl?: string; 
    isOwned?: boolean;
    defaultConfig: Partial<VoiceProfile>;
}

export interface VoiceProfile {
  id: string;
  name: string;
  voiceName: VoiceName;
  dna?: VoiceDNA; 
  pace: number; 
  warmth: number; 
  energy: number; 
  brevity: number; 
  formality: number; 
  firmness: number; 
  challengeLevel: number; 
  emotionalDrift: boolean; 
  pauseDensity: number; 
  microHesitation: 'off' | 'low' | 'natural';
  selfCorrection: boolean;
  sentenceCompletionVariability: boolean;
  thoughtDelay: 'off' | 'short' | 'variable';
  midResponseAdaptation: boolean;
  breathPlacement: 'off' | 'subtle';
  prosodicDrift: boolean;
  emphasisDecay: boolean;
  naturalFillers: 'off' | 'rare' | 'contextual';
  laughter: 'off' | 'rare';
  falseStartAllowance: boolean;
}

export interface MemoryLayer {
  session: string[]; 
  user: { 
    name: string;
    pacePreference: string; 
    tonePreference: string; 
  };
  voiceMemory: UserVoiceMemory; 
  workspace: string[]; 
  activeWorkspaceId?: string; 
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

// --- Teaching Logic Types ---
export interface TeachingUnit {
    title: string;
    coreConcept: string;
    analogy?: string;
    realWorldExample: string;
    checkpointQuestion: string;
}

// NEW: Interactive Teaching Beats
export interface TeachingBeat {
    id: string;
    timestamp: number; // Seconds from start
    conceptId: string;
    prompt: string; // e.g. "Do you want to review [Concept]?"
    suggestedActions: string[]; // ["Explain Simply", "Quiz Me"]
}

export interface TeachingMap {
    topic: string;
    targetAudience: string;
    units: TeachingUnit[];
    beats?: TeachingBeat[]; // Optional: Generated later or during map creation
    summary: string;
}

// --- Host Configuration Types ---
export interface HostConfig {
    voiceName: VoiceName;
    personality: 'Professional' | 'Energetic' | 'Empathetic' | 'Socratic';
    pace: number; // 0.8 - 1.2
    warmth: number; // 1-10
    imperfections: 'off' | 'low' | 'high';
    dualHost: boolean;
    audienceMode: 'off' | 'light' | 'normal' | 'heavy'; // NEW: Audience Q&A
}

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

// NEW: Export & Publishing
export interface ExportArtifacts {
    slidesMarkdown?: string;
    studyPdfUrl?: string; // Blob URL
    lastGeneratedAt?: Date;
}

export interface PublishingMetadata {
    rssUrl?: string; // Blob URL acting as feed
    publicPageUrl?: string; // Mock URL
    isPublished: boolean;
    feedTitle?: string;
    feedDescription?: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  topic: string;
  type: PodcastType;
  style: string;
  script: PodcastScriptLine[];
  
  // Enhanced Metadata
  teachingMap?: TeachingMap;
  hostConfig?: HostConfig;
  
  // New Sections
  exports?: ExportArtifacts;
  publishing?: PublishingMetadata;

  blueprint?: PodcastBlueprint;
  chapters?: PodcastChapter[];
  moments?: LearningMoment[];
  audioBase64?: string;
  coverImageBase64?: string;
  sourceIds: string[];
  createdAt: Date;
  durationSeconds?: number;
}

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
  godMode: boolean; 
  forceMonetization: boolean; 
  debugLatency: boolean; 
  safetyFilters: 'strict' | 'relaxed' | 'off'; 
  temperature: number; 
  maintenanceMode: boolean; 
  systemBroadcast?: string; 
}
