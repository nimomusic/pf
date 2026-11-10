export type VocalType = 'random' | 'male' | 'female' | 'none';

export type ProviderType = 'gpt' | 'gemini' | 'claude';

export interface Theme {
  id: string;
  name: string;
  category: string;
  sop: string;
  createdAt?: string;
  updatedAt?: string;
  isDefault?: boolean;
}

export interface ModelOption {
  id: string;
  provider: ProviderType;
  name: string;
  badge: string;
  description: string;
  tokenCostTier: 'lowest' | 'low' | 'balanced' | 'premium';
  isRecommended?: boolean;
  efficiencySummary: string;
  suitability: string;
}

export interface TrackItem {
  trackNumber: number;
  title: string;
  mood?: string;
  metaInfo?: {
    vocal?: string;
    genre?: string;
    mood?: string;
    bpm?: string;
    targetLength?: string;
  };
  stylePrompt: string;
  fullLyrics: string;
}

export interface YoutubePackage {
  title: string;
  description: string;
  tracklist: string;
  hashtags: string;
  thumbnailPrompt: string;
  backgroundImagePrompt: string;
}

export interface PlaylistResult {
  themeId: string;
  themeName: string;
  modelUsed: string;
  vocal: VocalType;
  generatedAt: string;
  tracks: TrackItem[];
  youtube: YoutubePackage;
}

export interface LicenseInfo {
  licenseKey: string;
  tier?: string;
  userName?: string;
  isAdmin: boolean;
}

export type StepId = 'plan' | 'create' | 'produce' | 'complete';

export interface ProgressState {
  currentStep: StepId;
  stepIndex: number; // 0, 1, 2, 3
  progressPercent: number; // 0 to 100
  statusMessage: string;
  isRunning: boolean;
  error?: string | null;
}
