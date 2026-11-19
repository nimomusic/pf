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

export interface CraftAuditCriterion {
  item: string;
  result: '우수' | '양호' | '보통' | '미흡';
  judgment: string;
}

export interface TrackCraftAudit {
  archetypeLabel: string;
  refined: boolean;
  signatureTags: {
    bass: string;
    drum: string;
    hihat: string;
    interaction: string;
    vocalPhrasing: string;
    harmony: string;
  };
  criteria: CraftAuditCriterion[];
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
  craftAudit?: TrackCraftAudit;
}

export interface YoutubePackage {
  title: string;
  titleKo?: string;
  titleEn?: string;
  description: string;
  descriptionKo?: string;
  descriptionEn?: string;
  tracklist: string;
  hashtags: string;
  thumbnailPrompt: string;
}

export interface PlaylistResult {
  themeId: string;
  themeName: string;
  lyricConcept?: string;
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
