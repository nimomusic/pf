import { ModelOption, ProviderType } from '../types';

export const OPTIMIZED_MODELS: ModelOption[] = [
  {
    id: 'gpt-5.4-mini',
    provider: 'gpt',
    name: 'GPT-5.4 mini',
    badge: '차세대 스마트 경량',
    description: 'OpenAI의 차세대 고성능 미니 모델. 최신 음악 트렌드와 복합적인 가사 구조 및 Suno 프롬프트를 초고속으로 정밀 기획합니다.',
    tokenCostTier: 'lowest',
    isRecommended: true,
    efficiencySummary: '차세대 지능 탑재, 음악 및 가사 기획 최적화',
    suitability: '고난도 테마 SOP 정밀 반영, 다국어 및 운율 최적화'
  },
  {
    id: 'gpt-4o-mini',
    provider: 'gpt',
    name: 'GPT-4o mini',
    badge: 'OpenAI 최고 가성비',
    description: 'OpenAI의 경량 플래그십 모델. gpt-4o 수준의 지능을 60% 이상 저렴한 토큰 비용으로 제공하여 음악 메타데이터 구조화에 최적입니다.',
    tokenCostTier: 'low',
    isRecommended: true,
    efficiencySummary: '저비용 고효율, JSON 및 포맷팅 정확도 최상',
    suitability: 'Suno 스타일 태그 작성, 유튜브 SEO 키워드 및 타임라인 최적화'
  },
  {
    id: 'gpt-4.1-mini',
    provider: 'gpt',
    name: 'GPT-4.1 mini',
    badge: '정밀 음악 기획',
    description: '개선된 추론과 높은 지시사항 준수율을 제공하는 경량 모델. 복잡한 섹션 분배와 보컬 디렉션에 최적화되었습니다.',
    tokenCostTier: 'low',
    isRecommended: false,
    efficiencySummary: '높은 SOP 준수율과 빠른 반응 속도',
    suitability: '세밀한 보컬 질감과 러닝타임 설계'
  },
  {
    id: 'gemini-3.1-flash-lite',
    provider: 'gemini',
    name: 'Gemini 3.1 Flash Lite',
    badge: '최소 토큰 · 초고속',
    description: '구글의 초경량 고효율 최신 모델. 긴 가사와 다량의 트랙 기획 시 API 토큰 비용이 가장 저렴하며 반응 속도가 압도적입니다.',
    tokenCostTier: 'lowest',
    isRecommended: true,
    efficiencySummary: '입력/출력 단가 최저, 토큰 대비 가성비 1위',
    suitability: '다량의 트랙 가사 생성, 일관성 높은 플레이리스트 기획'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    provider: 'claude',
    name: 'Claude 3.5 Haiku',
    badge: '감성 가사 · 초고속',
    description: 'Anthropic의 차세대 초경량 모델. 이전 세대 대비 3배 빠른 속도와 감성적이고 시적인 한국어 가사 생성 능력을 겸비했습니다.',
    tokenCostTier: 'low',
    isRecommended: false,
    efficiencySummary: '빠른 응답 속도, 문학적 어휘력 대비 낮은 토큰 소모',
    suitability: '운율과 라임이 살아있는 발라드/인디/재즈 가사 기획'
  },
  {
    id: 'gemini-3.8-flash',
    provider: 'gemini',
    name: 'Gemini 3.8 Flash',
    badge: '플래그십 표준',
    description: '속도와 창의적 지능의 완벽한 밸런스. 복합적인 음악 장르 믹스와 트렌디한 유튜브 플레이리스트 카피라이팅에 탁월합니다.',
    tokenCostTier: 'balanced',
    isRecommended: false,
    efficiencySummary: '중간 수준의 토큰 비용으로 최상급 한국어 창의력 발휘',
    suitability: '대규모 플레이리스트(5~10곡) 스토리라인 구성'
  },
  {
    id: 'gpt-4o',
    provider: 'gpt',
    name: 'GPT-4o (Omni)',
    badge: '프리미엄 퀄리티',
    description: '심도 있는 음악적 지식과 세련된 유튜브 SEO 패키지 생성이 필요한 전문 기획자를 위한 프리미엄 플래그십 모델입니다.',
    tokenCostTier: 'premium',
    isRecommended: false,
    efficiencySummary: '토큰 비용이 비교적 높으나 최고 수준의 완성도와 감성 묘사',
    suitability: '프리미엄 앨범 기획, 정교한 미드저니/DALL-E 프롬프트 도출'
  }
];

export const FULL_MODEL_CATALOG: {
  id: string;
  provider: ProviderType;
  name: string;
  category: string;
  tag: string;
  description: string;
}[] = [
  // Google Gemini
  {
    id: 'gemini-3.1-flash-lite',
    provider: 'gemini',
    name: 'Gemini 3.1 Flash Lite',
    category: '초경량/고효율',
    tag: '최소 토큰 권장',
    description: '초저비용 · 초고속 응답 · 다량의 트랙 기획과 가사 작성에 가장 최적화'
  },
  {
    id: 'gemini-3.8-flash',
    provider: 'gemini',
    name: 'Gemini 3.8 Flash',
    category: '플래그십',
    tag: '표준 추천',
    description: '최신 멀티모달 추론 및 균형잡힌 창의성 · 풍부한 한국어 표현'
  },
  {
    id: 'gemini-4-argon',
    provider: 'gemini',
    name: 'Gemini 4 Argon',
    category: '차세대 심층 추론',
    tag: '심층 추론',
    description: '복잡한 음악 이론, 정밀한 서사 구조, 고난도 스토리라인 기획'
  },
  {
    id: 'gemini-flash-latest',
    provider: 'gemini',
    name: 'Gemini Flash Latest',
    category: '에일리어스',
    tag: '최신 플래시',
    description: '구글 AI Studio 최신 플래시 모델 동적 지정'
  },

  // OpenAI GPT
  {
    id: 'gpt-5.4-mini',
    provider: 'gpt',
    name: 'GPT-5.4 mini',
    category: '차세대 스마트 경량',
    tag: '차세대 스마트',
    description: 'OpenAI의 차세대 고성능 미니 모델 · 음악 트렌드 및 가사 구조 정밀 기획'
  },
  {
    id: 'gpt-4.1-mini',
    provider: 'gpt',
    name: 'GPT-4.1 mini',
    category: '정밀 음악 기획',
    tag: '정밀 분석',
    description: '높은 SOP 준수율과 빠른 반응 속도 · 세밀한 보컬 질감과 러닝타임 설계'
  },
  {
    id: 'gpt-4o-mini',
    provider: 'gpt',
    name: 'GPT-4o mini',
    category: '초경량/고효율',
    tag: '최소 토큰 권장',
    description: 'OpenAI 최고의 가성비 모델 · 구조화 JSON 및 Suno 태그 추출 최상'
  },
  {
    id: 'gpt-4o',
    provider: 'gpt',
    name: 'GPT-4o (Omni)',
    category: '플래그십',
    tag: '고품질',
    description: '심층적인 음악 장르 분석 및 트렌디한 유튜브 SEO 패키지'
  },
  {
    id: 'o3-mini',
    provider: 'gpt',
    name: 'o3-mini',
    category: '추론 모델',
    tag: '논리적 추론',
    description: 'STEM 및 고차원적인 논리/운율 구조 분석에 특화된 차세대 모델'
  },
  {
    id: 'o1-mini',
    provider: 'gpt',
    name: 'o1-mini',
    category: '추론 모델',
    tag: '추론 경량',
    description: '복잡한 가사 운율과 음악적 테마 매핑'
  },
  {
    id: 'o1',
    provider: 'gpt',
    name: 'o1 (OpenAI o1)',
    category: '추론 플래그십',
    tag: '심층 추론',
    description: '장문 가사 및 심층적인 음악 서사 기획'
  },
  {
    id: 'gpt-4.5-preview',
    provider: 'gpt',
    name: 'GPT-4.5 Preview',
    category: '차세대 대형',
    tag: '최신 프리뷰',
    description: 'OpenAI 최신 거대 지능 모델'
  },
  {
    id: 'gpt-4-turbo',
    provider: 'gpt',
    name: 'GPT-4 Turbo',
    category: '고성능',
    tag: '터보 플래그십',
    description: '128k 컨텍스트 지원 고성능 모델'
  },

  // Anthropic Claude
  {
    id: 'claude-3-5-haiku-20241022',
    provider: 'claude',
    name: 'Claude 3.5 Haiku',
    category: '초경량/고효율',
    tag: '최소 토큰 권장',
    description: '초고속 감성 가사 생성 · 아름다운 어휘력 대비 낮은 토큰 소모'
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'claude',
    name: 'Claude 3.5 Sonnet',
    category: '플래그십',
    tag: '문학적 예술성',
    description: '시적이고 감동적인 가사 작성과 세련된 플레이리스트 카피라이팅'
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    provider: 'claude',
    name: 'Claude 3.7 Sonnet',
    category: '차세대 하이브리드',
    tag: '최신 소넷',
    description: '사고 모드(Thinking)와 일반 모드를 결합한 최고 지능 모델'
  },
  {
    id: 'claude-3-opus-20240229',
    provider: 'claude',
    name: 'Claude 3 Opus',
    category: '헤비 플래그십',
    tag: '심층 문학',
    description: '깊은 철학적 감성과 완성도 높은 문학적 작사'
  }
];

export const PROVIDER_AUTO_MODELS: Record<ProviderType, string> = {
  gemini: 'gemini-3.1-flash-lite',
  gpt: 'gpt-5.4-mini',
  claude: 'claude-3-5-haiku-20241022'
};

export const PROVIDER_LABELS: Record<ProviderType, { label: string; placeholder: string; icon: string }> = {
  gpt: {
    label: 'GPT API Key',
    placeholder: 'sk-... (OpenAI API 키를 입력하세요)',
    icon: '🤖'
  },
  gemini: {
    label: 'Gemini API Key',
    placeholder: 'AIza... (Google AI Studio 키 입력 혹은 기본 키 사용 가능)',
    icon: '✨'
  },
  claude: {
    label: 'Claude API Key',
    placeholder: 'sk-ant-... (Anthropic API 키를 입력하세요)',
    icon: '⚡'
  }
};

