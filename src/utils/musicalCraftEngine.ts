import type { CraftAuditCriterion, Theme, TrackCraftAudit, TrackItem, VocalType } from '../types.ts';

export type MusicArchetype =
  | 'groove_pop'
  | 'vintage_soul_funk'
  | 'korean_rnb_hiphop'
  | 'jpop_electronic_rnb'
  | 'vintage_1940s_50s'
  | 'west_coast_rap'
  | 'cinematic_ost'
  | 'ballad_intimate'
  | 'acoustic_indie'
  | 'general_custom';

export type ArrangementMode =
  | 'full_rhythm'
  | 'bassless_percussive'
  | 'drumless_melodic'
  | 'stripped_ballad';

export interface SopArrangementConstraints {
  forbidsOrchestra: boolean;
  forbidsStrings: boolean;
  forbidsBrass: boolean;
  forbidsTimpani: boolean;
  forbidsBass: boolean;
  forbidsDrums: boolean;
  forbidsHihat: boolean;
  isStrippedSoloSetting: boolean;
  isBalladTheme: boolean;
  explicitExcludeTokens: string[];
}

export type ResolvedVocalGender = 'male' | 'female' | 'none';

export interface InnovationPlan {
  trackNumber: number;
  vocalGender: ResolvedVocalGender;
  archetype: MusicArchetype;
  archetypeLabel: string;
  arrangementMode: ArrangementMode;
  arrangementLabel: string;
  hasBass: boolean;
  hasDrums: boolean;
  hasHihat: boolean;
  constraints: SopArrangementConstraints;
  bpmSuggestion: string;
  keyColor: string;
  bassKo: string;
  bassSuno: string;
  drumKo: string;
  drumSuno: string;
  hihatKo: string;
  hihatSuno: string;
  interactionKo: string;
  interactionSuno: string;
  harmonyKo: string;
  harmonySuno: string;
  vocalPhrasingKo: string;
  vocalPhrasingSuno: string;
  dynamicKo: string;
  dynamicSuno: string;
  verseGuideHint: string;
  chorusGuideHint: string;
  bridgeGuideHint: string;
}

interface ArchetypePool {
  label: string;
  bpmPool: string[];
  keyColors: string[];
  bassOptions: Array<{ ko: string; suno: string }>;
  drumOptions: Array<{ ko: string; suno: string }>;
  hihatOptions: Array<{ ko: string; suno: string }>;
  interactionOptions: Array<{ ko: string; suno: string }>;
  harmonyOptions: Array<{ ko: string; suno: string }>;
  vocalPhrasingOptions: Array<{ ko: string; suno: string }>;
  dynamicOptions: Array<{ ko: string; suno: string }>;
}

// Stripped/Bassless/Drumless accompaniment pools used when a ballad, acoustic, or minimal SOP omits bass and/or drums
const BASSLESS_LEFT_HAND_POOL: Array<{ ko: string; suno: string }> = [
  {
    ko: '베이스 없이 4마디마다 보이싱·진행이 따뜻하게 흐르는 피아노 왼손 아르페지오',
    suno: 'warm piano left-hand melodic arpeggio and rich open-fifth resonance with zero bass instrument',
  },
  {
    ko: '어쿠스틱 기타 저음현 엄지 아르페지오가 부드럽게 곡을 받쳐주는 독립 반주',
    suno: 'warm fingerpicked acoustic lower-string thumb arpeggio carrying low-end warmth organically',
  },
  {
    ko: '펠트 피아노 저역 공명과 부드러운 코드 전위로 서정미를 살린 피아노 반주',
    suno: 'warm felt-piano lower-register resonance and smooth chord inversions supporting the vocal',
  },
];

const DRUMLESS_PULSE_POOL: Array<{ ko: string; suno: string }> = [
  {
    ko: '드럼 없이 반주 아르페지오와 보컬 호흡이 자연스럽게 어우러지는 서정적 템포',
    suno: 'drumless intimate accompaniment following natural vocal flow and expressive piano dynamics',
  },
  {
    ko: '타악기 없이 피아노/기타 리듬 결로 안정감 있게 흐르는 어쿠스틱 펄스',
    suno: 'no percussion pulse led by gentle steady accompaniment arpeggios and natural phrasing',
  },
];

const HIHATLESS_SPACE_POOL: Array<{ ko: string; suno: string }> = [
  {
    ko: '하이햇 대신 프레이즈 끝 자연스러운 숨결 여백과 피아노 잔향 공간 설계',
    suno: 'natural vocal breath space and lingering warm acoustic decay between phrases',
  },
  {
    ko: '심벌/하이햇 없이 보컬 선율과 반주 여운의 조화로운 밸런스',
    suno: 'clean uncrowded rhythmic space highlighting pure vocal clarity and natural room resonance',
  },
];

// All Suno directives below are carefully crafted to stay LOCKED ON BEAT, IN TUNE, MELODICALLY CATCHY,
// and VOCALLY NATURAL — strictly avoiding timing/pitch-sabotaging keywords like "ahead-of-beat",
// "behind-the-beat", "breaking 4/4", "displaced off-grid", "irregular", "voice crack", or "diminished".
const ARCHETYPE_POOLS: Record<MusicArchetype, ArchetypePool> = {
  groove_pop: {
    label: 'Groove Pop / Retail Feel-Good Pop',
    bpmPool: ['102 BPM', '106 BPM', '98 BPM', '110 BPM', '104 BPM', '108 BPM'],
    keyColors: ['Dbmaj9', 'Fmaj9', 'Abmaj9', 'Gmaj9', 'Ebmaj9', 'Bbm9'],
    bassOptions: [
      {
        ko: '단단한 포켓 위에 매끄러운 턴어라운드가 살아있는 멜로딕 팝 베이스',
        suno: 'warm locked melodic P-bass groove with smooth octave bounce and clean bar-4 turnaround',
      },
      {
        ko: '보컬 여백을 부드럽게 감싸며 그루브를 이끄는 핑거스타일 베이스 라인',
        suno: 'infectious locked fingerstyle bassline with melodic movement supporting the vocal hook',
      },
      {
        ko: '일렉 베이스와 따뜻한 아날로그 신스 베이스가 조화를 이루는 그루브 훅',
        suno: 'punchy warm analog synth bass layered with tight muted electric bass groove',
      },
    ],
    drumOptions: [
      {
        ko: '안정적인 백비트를 중심으로 경쾌한 고스트 노트가 어우러진 락인(Locked-in) 드럼 포켓',
        suno: 'tight locked-in pop drum pocket with crisp dry snare backbeat and subtle tasteful ghost notes',
      },
      {
        ko: '탄력 있는 바운스 킥과 깔끔한 림샷이 살아있는 모던 그루브 드럼',
        suno: 'bouncy steady kick drum pattern anchored to tight rimshot backbeat groove',
      },
      {
        ko: '프레이즈 전환이 매끄러운 경쾌한 4/4 스윙 팝 드럼 포켓',
        suno: 'crisp 4/4 pocket groove with warm kick punch and smooth pre-chorus snare fill transitions',
      },
    ],
    hihatOptions: [
      {
        ko: '경쾌한 16분음표 스윙 하이햇과 부드러운 셰이커 질감의 조화',
        suno: 'crisp airy swung hi-hats and warm shaker pocket lifting effortlessly into the chorus',
      },
      {
        ko: '코러스에서 자연스럽게 열리는 오픈 하이햇 악센트와 깔끔한 톤 밸런스',
        suno: 'tight closed hi-hat verse pocket opening into breezy open-hat chorus lift',
      },
    ],
    interactionOptions: [
      {
        ko: '보컬 프레이즈 사이를 산뜻하게 채우는 뮤트 펑크 기타와 로즈 건반 필인',
        suno: 'clean muted rhythm guitar chops and warm Rhodes fills weaving tastefully around vocal phrases',
      },
      {
        ko: '로즈 9화음 컴핑과 클린 기타 리프가 베이스 포켓 위에서 조화롭게 어우러지는 편곡',
        suno: 'warm Rhodes electric piano chords and crisp clean electric guitar licks locked with the bassline',
      },
    ],
    harmonyOptions: [
      {
        ko: '따뜻한 maj9·add9 텐션과 한번 들으면 기억나는 산뜻한 훅 멜로디',
        suno: 'memorable singable vocal melody over warm maj9 and add9 pop chord progressions',
      },
      {
        ko: '매력적인 프리코러스 상행 코드 진행과 시원하게 꽂히는 코러스 훅',
        suno: 'uplifting pre-chorus harmonic lift resolving into an earworm melodic chorus hook',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '안정된 음정과 경쾌한 리듬감이 살아있는 내추럴 대화형 보컬 프레이징',
        suno: 'pitch-true expressive lead vocal with crisp natural phrasing and smooth breathless chorus lift',
      },
      {
        ko: '담백한 1절 톤에서 맑고 시원하게 열리는 후렴 멜로디 대비',
        suno: 'intimate relaxed verse vocal opening into a bright resonant memorable chorus melody',
      },
    ],
    dynamicOptions: [
      {
        ko: '미니멀한 벌스에서 풍성한 화음의 코러스로 매끄럽게 고조되는 입체적 전개',
        suno: 'smooth verse-to-chorus arrangement build with warm layered harmonies and clean bridge lift',
      },
    ],
  },

  vintage_soul_funk: {
    label: "1970s Vintage Soul & Funk / Retro Groove",
    bpmPool: ['96 BPM', '102 BPM', '108 BPM', '94 BPM', '104 BPM', '112 BPM'],
    keyColors: ['Em9', 'Am7', 'Dm9', 'Gm7', 'Cm9', 'Fmaj7'],
    bassOptions: [
      {
        ko: '70년대 빈티지 P-베이스의 쫀득한 핑거스타일 멜로딕 펑크 베이스 포켓',
        suno: 'authentic 1970s warm Fender Precision bass groove with melodic syncopated fills locked to the kick',
      },
      {
        ko: '따뜻한 로우엔드 서스테인과 4마디 슬라이드 턴어라운드가 돋보이는 소울 베이스',
        suno: 'fat round vintage soul bassline with smooth octave slides and classic bar-4 Motown turnaround',
      },
    ],
    drumOptions: [
      {
        ko: '아날로그 테이프 질감의 묵직하고 쫀득한 70년대 소울 펑크 드럼 포켓',
        suno: 'authentic 1970s tight dry vintage drum kit pocket, snappy wood snare backbeat and warm analog kick',
      },
      {
        ko: '자연스러운 휴먼 스윙과 탬버린 백비트가 어우러진 레트로 소울 리듬',
        suno: 'locked retro soul-funk pocket drums with crisp tambourine backbeat lift in the chorus',
      },
    ],
    hihatOptions: [
      {
        ko: '바삭하고 따뜻한 빈티지 16분음표 하이햇과 미세한 바운스 그루브',
        suno: 'crisp warm vintage closed hi-hat 16th-note pocket with tasteful bar-end open-hat shimmer',
      },
    ],
    interactionOptions: [
      {
        ko: '클라비넷·펜더 로즈 컴핑과 펑키 와우 기타·혼 섹션이 주고받는 클래식 소울 편곡',
        suno: 'interlocking warm Rhodes electric piano, percussive Clavinet stabs, clean wah funk guitar, and warm vintage horn swells',
      },
      {
        ko: '보컬 코러스 뒤를 따뜻하게 받쳐주는 70년대 브라스·스트링 패드와 클린 기타 리프',
        suno: 'classic 1970s soul guitar rhythm chops paired with warm brass horn accents answering vocal lines',
      },
    ],
    harmonyOptions: [
      {
        ko: '도리안·도미넌트 9화음 기반의 진한 소울풀 코드 진행과 중독성 있는 훅 멜로디',
        suno: 'rich soulful 7th and 9th chord changes with an unforgettable singable 1970s soul chorus melody',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '풍부한 소울 그루브와 안정된 벨팅·팔세토 전환이 돋보이는 정통 소울 보컬',
        suno: 'rich warm soulful lead vocal with authentic 1970s phrasing, clear pitch control, and lush chorus harmonies',
      },
      {
        ko: '따뜻한 흉성과 부드러운 애드리브가 리듬에 정확히 얹히는 클래식 소울 창법',
        suno: 'expressive pocket-locked vintage soul vocal blending warm chest voice with smooth silky falsetto lifts',
      },
    ],
    dynamicOptions: [
      {
        ko: '절제된 그루브 벌스에서 브라스·백킹 하모니가 터지는 정통 소울 클라이맥스',
        suno: 'tight groovy verse pocket opening into rich full-band horn and backing-vocal chorus lift',
      },
    ],
  },

  korean_rnb_hiphop: {
    label: 'Korean Aesthetic R&B / Chill Trap Hip-Hop',
    bpmPool: ['78 BPM', '82 BPM', '85 BPM', '88 BPM', '76 BPM', '90 BPM'],
    keyColors: ['F#m9', 'Cm11', 'Amaj9', 'Dm9', 'Ebmaj7', 'Bbm9'],
    bassOptions: [
      {
        ko: '안정적인 루트 위에서 부드러운 글라이드로 멜로디를 돕는 딥 808 서브 베이스',
        suno: 'warm melodic 808 sub-bass groove with smooth controlled octave pitch-glides locking the pocket',
      },
      {
        ko: '로즈 피아노 화음을 따뜻하게 받쳐주는 묵직하고 깔끔한 아날로그 서브 베이스',
        suno: 'clean deep analog sub-bass pulse moving smoothly beneath Rhodes chord voicings',
      },
    ],
    drumOptions: [
      {
        ko: '모던 R&B 림샷 백비트와 깔끔한 808 킥 바운스가 어우러진 레이드백 포켓',
        suno: 'smooth nocturnal R&B drum pocket with crisp rimshot backbeat and clean bouncy kick groove',
      },
      {
        ko: '하프타임 그루브가 매끄럽게 유지되는 세련된 칠 트랩 드럼 패턴',
        suno: 'chill half-time trap drum groove with tight punchy snare and warm low-end pocket clarity',
      },
    ],
    hihatOptions: [
      {
        ko: '부드러운 스윙감의 32분음표 하이햇 롤과 정갈한 공간 여백',
        suno: 'tasteful soft swung hi-hat rolls and clean airy percussion texture leaving room for vocals',
      },
    ],
    interactionOptions: [
      {
        ko: '트레몰로 로즈 피아노와 보컬 찹·클린 기타가 808 위에서 부드럽게 어우러지는 편곡',
        suno: 'warm tremolo Rhodes chords, subtle filtered vocal chops, and clean guitar fills around vocal spaces',
      },
    ],
    harmonyOptions: [
      {
        ko: '몽환적인 마이너 9th/11th 보이싱과 귀에 감기는 서정적 R&B 탑라인',
        suno: 'lush minor 9th and maj7 chord voicings carrying a smooth, catchy nocturnal R&B vocal melody',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '근접 마이크의 섬세한 숨결에서 부드러운 팔세토 코러스로 자연스럽게 이어지는 보컬',
        suno: 'intimate close-mic singing-rap phrasing flowing smoothly into a silky pitch-true falsetto chorus melody',
      },
      {
        ko: '리듬을 여유롭게 타면서도 멜로디 윤곽이 선명한 한국형 R&B 보컬 프레이징',
        suno: 'effortless smooth Korean R&B vocal delivery with clear melodic line and tender expressive ad-libs',
      },
    ],
    dynamicOptions: [
      {
        ko: '잔잔한 로즈 인트로에서 딥 808 코러스로 부드럽게 확장되는 세련된 다이내믹',
        suno: 'intimate Rhodes verse texture opening warmly into rich bass-supported chorus harmonies',
      },
    ],
  },

  jpop_electronic_rnb: {
    label: 'Electronic R&B J-POP / Cinematic Alt-Pop',
    bpmPool: ['90 BPM', '93 BPM', '95 BPM', '92 BPM', '96 BPM', '89 BPM'],
    keyColors: ['Em9', 'Bm11', 'Gmaj9', 'C#m9', 'Am9', 'Fmaj9'],
    bassOptions: [
      {
        ko: '유리 같은 신스 키를 탄탄하게 받쳐주는 멜로딕 딥 서브 베이스',
        suno: 'warm melodic Moog sub-bass line supporting glassy synth keys with clean low-end definition',
      },
      {
        ko: '세련된 싱코페이션과 안정적인 그루브를 겸비한 일렉트로닉 R&B 베이스',
        suno: 'smooth locked synth-bass groove weaving gracefully beneath ambient electric piano chords',
      },
    ],
    drumOptions: [
      {
        ko: '정교하고 깔끔한 미니멀 전자 킥과 드라이 림샷의 도회적 4/4 포켓',
        suno: 'clean minimal electronic 4/4 drum pocket with soft tight kick and crisp dry rimshot snare',
      },
    ],
    hihatOptions: [
      {
        ko: '섬세한 일렉트로닉 하이햇과 맑은 공간 여운이 어우러진 세련된 퍼커션',
        suno: 'crisp restrained electronic hi-hats with clean ambient air and subtle texture',
      },
    ],
    interactionOptions: [
      {
        ko: '클린 기타 프래그먼트와 빈티지 일렉 피아노가 보컬 여백을 감싸는 입체적 편곡',
        suno: 'delicate clean electric guitar fragments and warm electric piano answering vocal phrase endings',
      },
    ],
    harmonyOptions: [
      {
        ko: 'J-POP 특유의 서정적 분수 코드·서스펜디드 9화음 기반의 아름다운 멜로디 진행',
        suno: 'sophisticated Japanese alt-pop slash chords and warm 9th voicings supporting a clear unforgettable vocal melody',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '차분한 저음역 낭독조에서 맑고 넓은 코러스 톤으로 확장되는 정교한 보컬',
        suno: 'clear low-register intimate Japanese vocal opening gracefully into wide resonant pitch-true chorus sustain',
      },
    ],
    dynamicOptions: [
      {
        ko: '고독한 실내 공간 여백에서 넓은 스테레오 입체감으로 열리는 세련된 다이내믹',
        suno: 'quiet close-room verse airiness expanding smoothly into lush wide-stereo chorus emotion',
      },
    ],
  },

  vintage_1940s_50s: {
    label: '1940s–1950s Shellac Vintage Pop / Lounge',
    bpmPool: ['74 BPM', '78 BPM', '82 BPM', '72 BPM', '80 BPM', '86 BPM'],
    keyColors: ['Ebmaj7', 'Ab6', 'Bbmaj7', 'C6/9', 'Fmaj7', 'Dm7'],
    bassOptions: [
      {
        ko: '부드럽고 따뜻한 4비트 워킹 라인을 그리는 어쿠스틱 업라이트 콘트라베이스',
        suno: 'warm woody acoustic double bass playing a smooth melodic walking line in steady pocket',
      },
    ],
    drumOptions: [
      {
        ko: '포근한 브러쉬 스네어 스윙과 절제된 킥으로 만든 1940~50년대 올드 스윙 포켓',
        suno: 'gentle warm brushed snare swing groove with soft feather kick keeping steady mid-century flow',
      },
    ],
    hihatOptions: [
      {
        ko: '부드럽게 스치는 브러쉬 심벌 스윕과 아날로그 라운지 공간감',
        suno: 'soft vintage brushed ride cymbal swing with natural warm room breath',
      },
    ],
    interactionOptions: [
      {
        ko: '벨벳 뮤트 트럼펫·클라리넷이 펠트 피아노와 보컬 사이를 따뜻하게 채우는 편곡',
        suno: 'intimate call-and-response between velvet Harmon-muted trumpet, warm clarinet counter-lines, and felt upright piano',
      },
    ],
    harmonyOptions: [
      {
        ko: '1940~50년대 클래식 팝 스탠다드 특유의 6/9·메이저7th 로맨틱 선율 진행',
        suno: 'classic mid-century 6/9 and maj7 standard chord progression with a sweet nostalgic singable melody',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '자연스러운 비브라토와 진정성 있는 클래식 크루너 보컬 프레이징',
        suno: 'sincere vintage crooner vocal delivery with warm natural vibrato, clear pitch, and intimate warmth',
      },
    ],
    dynamicOptions: [
      {
        ko: '잔잔한 축음기 도입부에서 따뜻한 금관 하모니가 피어오르는 클래식 다이내믹',
        suno: 'intimate parlor opening swelling warmly into a heartfelt mid-century vocal and horn chorus',
      },
    ],
  },

  west_coast_rap: {
    label: 'West Coast Freestyle Rap / G-Funk Hip-Hop',
    bpmPool: ['92 BPM', '96 BPM', '89 BPM', '94 BPM', '98 BPM', '90 BPM'],
    keyColors: ['Cm7', 'Gm7', 'Fm7', 'Bbm7', 'Dm7', 'Ebm7'],
    bassOptions: [
      {
        ko: '묵직하고 탄력 있는 미니무그 스타일 G-Funk 웜 펑크 베이스 훅',
        suno: 'heavy rubbery Minimoog G-Funk synth bass hook with clean octave bounce locked to the kick',
      },
      {
        ko: '90년대/현대 웨스트코스트 특유의 그루브가 살아있는 펀치감 있는 펑크 베이스',
        suno: 'punchy West Coast funk bassline anchoring the groove with smooth pitch-bend fills',
      },
    ],
    drumOptions: [
      {
        ko: '웨스트코스트 특유의 묵직한 킥과 딱 떨어지는 클랩-스네어 백비트 포켓',
        suno: 'hard-hitting West Coast hip-hop drum pocket with punchy low kick and crisp dry clap-snare backbeat',
      },
    ],
    hihatOptions: [
      {
        ko: '바운스감이 살아있는 스윙 하이햇과 타이트한 셰이커 리듬',
        suno: 'crisp swung West Coast hi-hats and tight shaker groove keeping effortless bounce',
      },
    ],
    interactionOptions: [
      {
        ko: '시그니처 G-Funk 하이 신스 리드와 로즈·와우 기타가 비트 위에서 주고받는 대화',
        suno: 'iconic West Coast high sine-synth whistle melody and clean wah-guitar chords weaving around vocal flow',
      },
    ],
    harmonyOptions: [
      {
        ko: '세련된 도리안 마이너 펑크 코드와 귀에 꽂히는 훅 멜로디 라인',
        suno: 'sleek Dorian minor funk chord stabs and soulful Rhodes turnarounds with catchy hook phrasing',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '여유롭고 또렷한 딕션으로 비트를 타는 자신감 넘치는 웨스트코스트 랩 플로우',
        suno: 'confident rhythmic West Coast rap delivery locked tightly in the groove with crisp diction and relaxed poise',
      },
    ],
    dynamicOptions: [
      {
        ko: '펀치라인 구간의 깔끔한 비트 브레이크 후 묵직한 풀 그루브로 돌아오는 대비',
        suno: 'clean rhythmic bar breaks spotlighting vocals before slamming back into full G-funk groove impact',
      },
    ],
  },

  cinematic_ost: {
    label: 'Cinematic Movie OST Ballad',
    bpmPool: ['68 BPM', '72 BPM', '74 BPM', '66 BPM', '76 BPM', '70 BPM'],
    keyColors: ['Dm9', 'Cm9', 'Am(add9)', 'Gm9', 'Bbmaj7', 'Em9'],
    bassOptions: [
      {
        ko: '절제된 딥 서브/업라이트 베이스가 펠트 피아노와 함께 서정적 저역을 받치는 편성',
        suno: 'warm restrained upright bass or clean sub-bass supporting emotional felt piano chords smoothly',
      },
      {
        ko: '베이스 악기 없이 펠트 피아노 왼손 공명으로 따뜻하게 저역을 채우는 독립 반주',
        suno: 'warm felt-piano left-hand open-fifth resonance and melodic lower-register arpeggios without bass instrument',
      },
    ],
    drumOptions: [
      {
        ko: '후렴에서 부드럽게 합류해 감정을 받쳐주는 절제된 브러쉬/시네마틱 펄스',
        suno: 'restrained warm brushed pulse entering gently in chorus to lift emotional momentum smoothly',
      },
      {
        ko: '드럼 없이 보컬과 피아노 선율이 자연스럽게 숨 쉬며 흐르는 서정적 루바토 펄스',
        suno: 'drumless expressive ballad accompaniment flowing seamlessly with the lead vocal melody',
      },
    ],
    hihatOptions: [
      {
        ko: '과도한 퍼커션을 비우고 보컬 숨결과 선율 여운을 극대화한 공간 설계',
        suno: 'spacious vocal breath intervals and warm natural hall decay replacing busy hi-hat ticks',
      },
    ],
    interactionOptions: [
      {
        ko: '피아노/어쿠스틱 기타 아르페지오가 보컬 프레이즈 끝을 감싸는 영화적 문답',
        suno: 'delicate felt piano or fingerpicked acoustic guitar fills answering tenderly between vocal lines',
      },
    ],
    harmonyOptions: [
      {
        ko: '서정적인 add9·메이저7th 진행과 가슴에 와닿는 서사적 코러스 멜로디',
        suno: 'poignant film-ballad add9 and maj7 chord progressions carrying a deeply memorable vocal melody',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '친밀하게 속삭이는 1절에서 힘차고 맑게 뻗어 오르는 후렴의 서사적 보컬',
        suno: 'intimate clear close-mic storytelling verse building smoothly into a soaring pitch-true emotional chorus belt',
      },
    ],
    dynamicOptions: [
      {
        ko: '담백한 단독 피아노 도입에서 점진적 크레센도로 감동이 터지는 시네마틱 전개',
        suno: 'gradual heartfelt dynamic swell from bare intimate verse to full emotional final chorus climax',
      },
    ],
  },

  ballad_intimate: {
    label: 'Intimate Ballad / Piano & Acoustic Vocal-Led',
    bpmPool: ['66 BPM', '70 BPM', '72 BPM', '64 BPM', '74 BPM', '68 BPM'],
    keyColors: ['Abmaj7', 'Fmaj9', 'Ebmaj7', 'C#m9', 'Bbmaj9', 'Dmaj9'],
    bassOptions: [
      {
        ko: '베이스 악기 없이 피아노 왼손 옥타브·대선율 아르페지오로 채운 따뜻한 저역',
        suno: 'warm piano left-hand arpeggio and rich lower-register voicings carrying low-end warmth without bass guitar',
      },
      {
        ko: '어쿠스틱 기타 엄지 저음현 아르페지오가 보컬 선율을 받쳐주는 섬세한 반주',
        suno: 'gentle fingerpicked acoustic thumb-bass arpeggio moving musically beneath the lead vocal',
      },
    ],
    drumOptions: [
      {
        ko: '드럼 없이 보컬의 자연스러운 호흡과 피아노 강약을 따라가는 서정적 템포',
        suno: 'drumless intimate ballad tempo following natural vocal phrasing and tender piano dynamics',
      },
    ],
    hihatOptions: [
      {
        ko: '퍼커션 없이 보컬 프레이즈 끝의 정갈한 숨결 여백으로 여운을 남기는 설계',
        suno: 'natural unhurried vocal breath spaces and soft sustained room resonance without hi-hats',
      },
    ],
    interactionOptions: [
      {
        ko: '보컬 프레이즈 사이 여백을 피아노/기타 선율 필인이 섬세하게 잇는 문답',
        suno: 'tender piano motifs and acoustic guitar fills answering gracefully inside vocal pauses',
      },
    ],
    harmonyOptions: [
      {
        ko: '부드러운 add9·분수 코드 전위와 선명하고 애절한 코러스 멜로디 라인',
        suno: 'warm slash-chord voice leading and add9 voicings supporting an unforgettable, singable ballad chorus melody',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '가까이 말하는 듯한 1절과 맑고 호소력 짙게 뻗는 후렴의 자연스러운 음색 전환',
        suno: 'warm intimate close-mic verse delivery rising smoothly into emotionally resonant pitch-true chorus singing',
      },
    ],
    dynamicOptions: [
      {
        ko: '속삭이듯 잔잔한 도입에서 진심이 폭발하는 마지막 후렴까지의 자연스러운 감정 아크',
        suno: 'organic emotional dynamic swell from whisper-quiet verse to heartfelt resonant chorus peak',
      },
    ],
  },

  acoustic_indie: {
    label: 'Acoustic Indie Pop / Warm Cafe Folk',
    bpmPool: ['94 BPM', '98 BPM', '90 BPM', '100 BPM', '88 BPM', '96 BPM'],
    keyColors: ['Gmaj7', 'Dmaj9', 'Amaj7', 'Cmaj9', 'Fmaj7', 'Em9'],
    bassOptions: [
      {
        ko: '어쿠스틱 기타와 조화롭게 어우러지는 따뜻하고 멜로딕한 우드 베이스 라인',
        suno: 'warm round acoustic upright or P-bass line moving melodically alongside bright acoustic guitar strums',
      },
      {
        ko: '베이스 없이 핑거스타일 어쿠스틱 기타의 따뜻한 저음현 패턴으로 채운 편성',
        suno: 'warm bassless fingerpicked acoustic guitar alternating thumb-bass pattern carrying both groove and harmony',
      },
    ],
    drumOptions: [
      {
        ko: '부드러운 우드 림클릭과 포근한 브러쉬 스네어가 중심을 잡는 산뜻한 포켓',
        suno: 'organic brushed drum kit and soft wood rim-click pocket keeping a sunny relaxed indie bounce',
      },
    ],
    hihatOptions: [
      {
        ko: '산뜻한 셰이커 질감과 자연스러운 어쿠스틱 리듬 호흡',
        suno: 'warm natural shaker groove and light brushed hats blending cleanly with acoustic strings',
      },
    ],
    interactionOptions: [
      {
        ko: '핑거피킹 어쿠스틱 기타와 따뜻한 건반 필인이 보컬과 어우러지는 포근한 편곡',
        suno: 'interplay between warm fingerpicked acoustic guitar, soft Wurlitzer chords, and bright vocal harmonies',
      },
    ],
    harmonyOptions: [
      {
        ko: '개방현의 맑은 울림과 메이저7th/add9 화음이 만든 기분 좋은 멜로디',
        suno: 'sunlit maj7 and open-string add9 acoustic chord progressions with a catchy hum-worthy melody',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '미소 짓듯 편안하고 자연스러운 스토리텔링 보컬 프레이징',
        suno: 'warm conversational acoustic vocal phrasing with clear natural pitch and charming lightness',
      },
    ],
    dynamicOptions: [
      {
        ko: '친밀한 어쿠스틱 도입에서 다정한 코러스 하모니가 겹쳐지는 포근한 전개',
        suno: 'cozy intimate acoustic verse blossoming smoothly into warm layered chorus harmonies',
      },
    ],
  },

  general_custom: {
    label: 'Custom SOP Theme',
    bpmPool: ['96 BPM', '102 BPM', '88 BPM', '108 BPM', '92 BPM', '100 BPM'],
    keyColors: ['Fmaj9', 'Dm9', 'Amaj9', 'Cm9', 'Ebmaj9', 'Gm9'],
    bassOptions: [
      {
        ko: '장르 리듬에 정확히 맞물려 멜로디와 그루브를 받쳐주는 따뜻한 독립 베이스 라인',
        suno: 'warm locked melodic bassline anchoring the groove with clean bar-4 harmonic turnarounds',
      },
      {
        ko: '보컬과 메인 악기를 안정적으로 받쳐주는 탄탄한 포켓 베이스 그루브',
        suno: 'clean punchy bass groove supporting the vocal hook and chord changes naturally',
      },
    ],
    drumOptions: [
      {
        ko: '장르 본연의 백비트가 흔들리지 않고 탄력 있게 살아있는 락인(Locked-in) 드럼 포켓',
        suno: 'locked-in steady drum pocket with crisp backbeat snare and tasteful organic fills',
      },
    ],
    hihatOptions: [
      {
        ko: '과하지 않고 선명한 하이햇 밸런스와 자연스러운 프레이즈 호흡',
        suno: 'balanced crisp hi-hats and natural groove breathing space supporting vocal clarity',
      },
    ],
    interactionOptions: [
      {
        ko: '메인 건반·기타 리프가 보컬 여백 사이에서 조화롭게 주고받는 세련된 편곡',
        suno: 'clean guitar and keyboard fills answering tastefully in spaces around the lead vocal',
      },
    ],
    harmonyOptions: [
      {
        ko: '세련된 9화음 색채와 귀에 쏙 들어오는 선명한 코러스 멜로디 훅',
        suno: 'warm 9th chord extensions supporting a clear, memorable, singable chorus melody hook',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '음정이 안정적이고 감정 전달이 선명한 자연스러운 보컬 프레이징',
        suno: 'natural pitch-accurate expressive vocal phrasing with clear diction and memorable hook delivery',
      },
    ],
    dynamicOptions: [
      {
        ko: '섹션별 악기 밀도와 감정이 매끄럽게 고조되는 완성도 높은 다이내믹 아크',
        suno: 'balanced dynamic build from clean verse pocket to rich expansive chorus climax',
      },
    ],
  },
};

export function parseSopArrangementConstraints(theme: Partial<Theme>, archetype: MusicArchetype): SopArrangementConstraints {
  const fullText = `${theme.name || ''} ${theme.category || ''} ${theme.sop || ''}`;
  const lower = fullText.toLowerCase();

  // Extract explicit negative clauses (Exclude: ..., -term, forbidden, 금지, 제외)
  const negativeChunks: string[] = [];
  const excludeMatches = fullText.match(/exclude\s*:[^\n\r]*/gi) || [];
  negativeChunks.push(...excludeMatches.map((s) => s.toLowerCase()));
  const forbiddenMatches = fullText.match(/(?:forbidden|금지|제외|never\s*use|without|no\s+)[^.\n\r]*/gi) || [];
  negativeChunks.push(...forbiddenMatches.map((s) => s.toLowerCase()));

  const negativeText = negativeChunks.join(' ');
  const explicitExcludeTokens: string[] = [];
  const dashTokens = negativeText.match(/-[a-z0-9][a-z0-9\s-]*/gi) || [];
  for (const tok of dashTokens) {
    explicitExcludeTokens.push(tok.replace(/^-/, '').trim().toLowerCase());
  }

  const forbidsOrchestra = /\b(orchestra|orchestral|symphonic)\b|오케스트라/i.test(negativeText);
  const forbidsStrings = forbidsOrchestra || /\b(string\s*section|strings|cello|violin|viola|contrabass)\b|현악|스트링|첼로/i.test(negativeText);
  const forbidsBrass = /\b(brass|trumpet|saxophone|horn\s*section)\b|브라스|금관/i.test(negativeText);
  const forbidsTimpani = /\b(timpani|orchestral\s*percussion|floor-?tom)\b|팀파니/i.test(negativeText);

  const forbidsBass =
    /\b(no\s*bass|without\s*bass|bassless|bass\s*forbidden)\b|(?:^|[\s,])-bass\b|(?:^|[\s,])-sub-?bass\b|베이스\s*(?:없|제외|금지)|베이스리스/i.test(fullText) ||
    /\bsolo\s*piano\b|\bpiano\s*(?:and|&|\+)\s*vocal\s*only\b|\bacoustic\s*guitar\s*(?:and|&|\+)\s*vocal\s*only\b|피아노와\s*보컬만/i.test(lower);

  const forbidsDrums =
    /\b(no\s*drums?|without\s*drums?|drumless|unaccompanied|no\s*percussion|no\s*beats?)\b|(?:^|[\s,])-drums?\b|(?:^|[\s,])-percussion\b|드럼\s*(?:없|제외|금지)|무반주|퍼커션\s*(?:없|제외)/i.test(fullText) ||
    /\bsolo\s*piano\b|\bpiano\s*(?:and|&|\+)\s*vocal\s*only\b|\bacoustic\s*guitar\s*(?:and|&|\+)\s*vocal\s*only\b|피아노와\s*보컬만/i.test(lower);

  const forbidsHihat =
    forbidsDrums || /\b(no\s*hi-?hat|without\s*hi-?hat)\b|(?:^|[\s,])-hi-?hat\b|(?:^|[\s,])-trap\s*hi-?hat\b|하이햇\s*(?:없|제외|금지)/i.test(fullText);

  const positiveText = lower
    .replace(/exclude\s*:[^\n\r]*/gi, '')
    .replace(/금지[^\n\r]*/g, '')
    .replace(/제외[^\n\r]*/g, '');

  const isBalladTheme =
    archetype === 'ballad_intimate' ||
    archetype === 'cinematic_ost' ||
    /\b(ballad|lullaby|piano\s*ballad|acoustic\s*ballad)\b|발라드/i.test(positiveText);

  const isStrippedSoloSetting =
    forbidsBass ||
    forbidsDrums ||
    /\b(solo\s*piano|piano\s*only|felt\s*piano\s*and\s*vocal|unplugged\s*solo|stripped-?down\s*ballad)\b|피아노\s*반주만|어쿠스틱\s*솔로|피아노와\s*보컬만/i.test(positiveText);

  return {
    forbidsOrchestra,
    forbidsStrings,
    forbidsBrass,
    forbidsTimpani,
    forbidsBass,
    forbidsDrums,
    forbidsHihat,
    isStrippedSoloSetting,
    isBalladTheme,
    explicitExcludeTokens,
  };
}

function isTagCompatibleWithConstraints(text: string, c: SopArrangementConstraints): boolean {
  const l = text.toLowerCase();
  if (c.forbidsOrchestra && /\b(orchestra|orchestral|symphonic)\b/.test(l)) return false;
  if (c.forbidsStrings && /\b(cello|contrabass|violin|viola|string\s*section|soaring\s*strings)\b/.test(l)) return false;
  if (c.forbidsBrass && /\b(brass|trumpet|clarinet|horn)\b/.test(l)) return false;
  if (c.forbidsTimpani && /\b(timpani|floor-?tom)\b/.test(l)) return false;
  if (c.forbidsBass && /\b(sub-?bass|808|bassline|bass\s*riff|bass\s*hook|upright\s*bass|p-bass|precision\s*bass|synth\s*bass|moog\s*sub)\b/.test(l)) return false;
  if (c.forbidsDrums && /\b(kick|snare|drum|rimshot|brushed\s*kit|percussion|boom-?bap|trap\s*kick)\b/.test(l)) return false;
  if (c.forbidsHihat && /\b(hi-?hat|shaker|ride\s*cymbal)\b/.test(l)) return false;
  return true;
}

export function detectMusicArchetype(
  theme: Partial<Theme>,
  sopSpecs: {
    isJapanese?: boolean;
    isShellacVintage?: boolean;
    isCinematic?: boolean;
    isKoreanHipHopRnb?: boolean;
    isKorEngMixed?: boolean;
    isEnglishOnly?: boolean;
  }
): MusicArchetype {
  const combined = `${theme.name || ''} ${theme.category || ''} ${theme.sop || ''}`
    .toLowerCase()
    .replace(/exclude\s*:[^\n\r]*/gi, '')
    .replace(/금지[^\n\r]*/g, '')
    .replace(/제외[^\n\r]*/g, '');

  const titleAndCat = `${theme.name || ''} ${theme.category || ''}`.toLowerCase();

  // Check 1970s Soul / Funk / Motown / Disco Funk cleanly before 1940s-50s or generic custom
  if (
    /\b(1970|1970s|70s|70's|soul\s*funk|vintage\s*soul|motown|disco\s*funk|neo-?soul|boogie)\b/i.test(titleAndCat) ||
    /\b(1970s|70's\s*vintage\s*soul|soul\s*funk|clavinet|motown\s*groove)\b/i.test(combined) ||
    /소울\s*펑크|70년대/.test(combined)
  ) {
    return 'vintage_soul_funk';
  }

  if (sopSpecs.isShellacVintage || /\b(1940|1950|shellac|phonograph|vintage\s*pop|78\s*rpm)\b/i.test(combined)) {
    return 'vintage_1940s_50s';
  }
  if (sopSpecs.isJapanese || /\b(j-pop|jpop|electronic\s*r&b\s*j-pop)\b/i.test(combined)) {
    return 'jpop_electronic_rnb';
  }
  if (/\b(west\s*coast|freestyle\s*rap|g-funk|westside|lowrider)\b/i.test(combined)) {
    return 'west_coast_rap';
  }
  if (sopSpecs.isCinematic || /\b(ost|cinematic|film\s*soundtrack|movie\s*ballad|film-music)\b/i.test(combined)) {
    return 'cinematic_ost';
  }
  if (sopSpecs.isKoreanHipHopRnb || sopSpecs.isKorEngMixed) {
    return 'korean_rnb_hiphop';
  }
  if (/\b(groove|retail\s*groove|chill\s*pop|feel-?good|sunday|cafe\s*pop|disco\s*pop|city\s*groove)\b/i.test(combined) || combined.includes('그루브')) {
    return 'groove_pop';
  }
  if (/\b(ballad|piano\s*ballad|acoustic\s*ballad|torch\s*song)\b/i.test(titleAndCat) || titleAndCat.includes('발라드') || /\b(piano\s*ballad|power\s*ballad|stripped\s*ballad|vocal-led\s*ballad)\b/i.test(combined)) {
    return 'ballad_intimate';
  }
  if (/\b(acoustic|folk|indie\s*pop|coffee\s*house)\b/i.test(combined) || combined.includes('어쿠스틱')) {
    return 'acoustic_indie';
  }
  if (combined.includes('발라드') || /\bballad\b/i.test(combined)) {
    return 'ballad_intimate';
  }
  return 'general_custom';
}

export function resolvePerTrackVocalGenders(
  vocal: VocalType | string = 'random',
  trackCount: number = 1,
  seedOffset?: number
): ResolvedVocalGender[] {
  const count = Math.max(1, trackCount);
  if (vocal === 'male') return Array.from({ length: count }, () => 'male');
  if (vocal === 'female') return Array.from({ length: count }, () => 'female');
  if (vocal === 'none') return Array.from({ length: count }, () => 'none');

  // For 'random', lock each individual track deterministically/balanced to a single gender
  // so Suno never switches vocal gender mid-song within a track.
  const startParity = typeof seedOffset === 'number' ? Math.abs(seedOffset) % 2 : Math.floor(Math.random() * 2);
  return Array.from({ length: count }, (_, i) => ((startParity + i) % 2 === 0 ? 'male' : 'female'));
}

export function generateTrackInnovationPlans(
  theme: Partial<Theme>,
  sopSpecs: any,
  trackCount: number,
  vocal: VocalType | string = 'random',
  seedOffset?: number
): InnovationPlan[] {
  const archetype = detectMusicArchetype(theme, sopSpecs);
  const constraints = parseSopArrangementConstraints(theme, archetype);
  const pool = ARCHETYPE_POOLS[archetype];
  const baseSeed = typeof seedOffset === 'number' ? seedOffset : Math.floor(Math.random() * 97);
  const resolvedGenders = resolvePerTrackVocalGenders(vocal, trackCount, baseSeed);

  // Extract explicit BPM range from SOP if provided so we strictly stay inside SOP BPM!
  const sopText = `${theme.sop || ''}`;
  const bpmRangeMatch = sopText.match(/(\d{2,3})\s*(?:~|-|to)\s*(\d{2,3})\s*bpm/i);
  const singleBpmMatch = sopText.match(/(\d{2,3})\s*bpm/i);

  const plans: InnovationPlan[] = [];
  for (let i = 0; i < trackCount; i++) {
    const vocalGender = resolvedGenders[i] || 'female';

    let bpmSuggestion = pool.bpmPool[(baseSeed + i) % pool.bpmPool.length];
    if (bpmRangeMatch) {
      const minBpm = parseInt(bpmRangeMatch[1], 10);
      const maxBpm = parseInt(bpmRangeMatch[2], 10);
      if (minBpm >= 55 && maxBpm <= 180 && maxBpm >= minBpm) {
        const span = maxBpm - minBpm + 1;
        bpmSuggestion = `${minBpm + ((baseSeed + i * 3) % span)} BPM`;
      }
    } else if (singleBpmMatch) {
      const baseBpm = parseInt(singleBpmMatch[1], 10);
      if (baseBpm >= 55 && baseBpm <= 180) {
        const offsets = [0, 2, -2, 3, -1, 1];
        bpmSuggestion = `${baseBpm + offsets[(baseSeed + i) % offsets.length]} BPM`;
      }
    }

    // Decide whether this track uses bass/drums/hihat based on SOP rules AND theme musical diversity
    let hasBass = !constraints.forbidsBass;
    let hasDrums = !constraints.forbidsDrums;
    let hasHihat = !constraints.forbidsHihat && hasDrums;

    if (constraints.isStrippedSoloSetting) {
      hasBass = false;
      hasDrums = false;
      hasHihat = false;
    } else if (archetype === 'ballad_intimate') {
      const pattern = (baseSeed + i) % 3;
      if (pattern === 0) {
        hasBass = false;
        hasDrums = false;
        hasHihat = false;
      } else if (pattern === 1) {
        hasBass = !constraints.forbidsBass;
        hasDrums = false;
        hasHihat = false;
      }
    } else if (archetype === 'cinematic_ost') {
      const pattern = (baseSeed + i) % 3;
      if (pattern === 0) {
        hasBass = false;
        hasDrums = false;
        hasHihat = false;
      } else if (pattern === 1) {
        hasBass = !constraints.forbidsBass;
        hasDrums = !constraints.forbidsDrums;
        hasHihat = false;
      }
    } else if (archetype === 'acoustic_indie' && i % 2 === 1 && !/upright bass|drum/i.test(`${theme.name || ''}`)) {
      hasBass = false;
      hasDrums = false;
      hasHihat = false;
    }

    const arrangementMode: ArrangementMode =
      !hasBass && !hasDrums
        ? 'stripped_ballad'
        : !hasBass && hasDrums
        ? 'bassless_percussive'
        : hasBass && !hasDrums
        ? 'drumless_melodic'
        : 'full_rhythm';

    const arrangementLabel =
      arrangementMode === 'stripped_ballad'
        ? '미니멀·베이스리스 편성 (피아노/어쿠스틱 중심)'
        : arrangementMode === 'drumless_melodic'
        ? '드럼리스 서정 편성 (저역·선율 중심)'
        : arrangementMode === 'bassless_percussive'
        ? '베이스리스 리듬 편성 (타악·코드 중심)'
        : '풀 리듬 섹션 편성';

    // Filter pools by SOP constraints to NEVER emit forbidden instruments
    const validBassPool = hasBass
      ? pool.bassOptions.filter((o) => isTagCompatibleWithConstraints(o.suno, constraints))
      : BASSLESS_LEFT_HAND_POOL;
    const validDrumPool = hasDrums
      ? pool.drumOptions.filter((o) => isTagCompatibleWithConstraints(o.suno, constraints))
      : DRUMLESS_PULSE_POOL;
    const validHihatPool = hasHihat
      ? pool.hihatOptions.filter((o) => isTagCompatibleWithConstraints(o.suno, constraints))
      : HIHATLESS_SPACE_POOL;
    const validInteractionPool = pool.interactionOptions.filter((o) =>
      isTagCompatibleWithConstraints(o.suno, constraints)
    );

    const bassPoolToUse = validBassPool.length > 0 ? validBassPool : BASSLESS_LEFT_HAND_POOL;
    const drumPoolToUse = validDrumPool.length > 0 ? validDrumPool : DRUMLESS_PULSE_POOL;
    const hihatPoolToUse = validHihatPool.length > 0 ? validHihatPool : HIHATLESS_SPACE_POOL;
    const interactionPoolToUse =
      validInteractionPool.length > 0
        ? validInteractionPool
        : [
            {
              ko: '피아노/어쿠스틱 기타 선율 필인이 보컬 여백 사이에서 조화롭게 응답하는 문답',
              suno: 'delicate piano or clean acoustic guitar fills answering tastefully between vocal lines',
            },
          ];

    const bass = bassPoolToUse[(baseSeed + i * 1) % bassPoolToUse.length];
    const drum = drumPoolToUse[(baseSeed + i * 2 + 1) % drumPoolToUse.length];
    const hihat = hihatPoolToUse[(baseSeed + i * 3 + 2) % hihatPoolToUse.length];
    const interaction = interactionPoolToUse[(baseSeed + i * 1 + 2) % interactionPoolToUse.length];
    const harmony = pool.harmonyOptions[(baseSeed + i * 2) % pool.harmonyOptions.length];
    const rawVocalPhrasing =
      vocalGender === 'none'
        ? {
            ko: '보컬 없는 인스트루멘털 리드 멜로디의 자연스러운 호흡 및 선율 변주',
            suno: 'expressive instrumental lead melody with clear lyrical phrasing, pure instrumental, no vocals',
          }
        : pool.vocalPhrasingOptions[(baseSeed + i * 3 + 1) % pool.vocalPhrasingOptions.length];
    const genderKoPrefix =
      vocalGender === 'male' ? '[남성 보컬] ' : vocalGender === 'female' ? '[여성 보컬] ' : '';
    const genderSunoPrefix =
      vocalGender === 'male'
        ? 'solo male lead vocal, '
        : vocalGender === 'female'
        ? 'solo female lead vocal, '
        : '';
    const vocalPhrasing = {
      ko: `${genderKoPrefix}${rawVocalPhrasing.ko}`,
      suno: `${genderSunoPrefix}${rawVocalPhrasing.suno}`,
    };
    const dynamic = pool.dynamicOptions[(baseSeed + i) % pool.dynamicOptions.length];
    const keyColor = pool.keyColors[(baseSeed + i * 2) % pool.keyColors.length];

    const verseGenderHint =
      vocalGender === 'male'
        ? 'solo male lead vocal'
        : vocalGender === 'female'
        ? 'solo female lead vocal'
        : 'instrumental lead melody';
    const chorusGenderHint =
      vocalGender === 'male'
        ? 'full male lead vocal'
        : vocalGender === 'female'
        ? 'full female lead vocal'
        : 'full instrumental arrangement';

    plans.push({
      trackNumber: i + 1,
      vocalGender,
      archetype,
      archetypeLabel: pool.label,
      arrangementMode,
      arrangementLabel,
      hasBass,
      hasDrums,
      hasHihat,
      constraints,
      bpmSuggestion,
      keyColor,
      bassKo: bass.ko,
      bassSuno: bass.suno,
      drumKo: drum.ko,
      drumSuno: drum.suno,
      hihatKo: hihat.ko,
      hihatSuno: hihat.suno,
      interactionKo: interaction.ko,
      interactionSuno: interaction.suno,
      harmonyKo: harmony.ko,
      harmonySuno: harmony.suno,
      vocalPhrasingKo: vocalPhrasing.ko,
      vocalPhrasingSuno: vocalPhrasing.suno,
      dynamicKo: dynamic.ko,
      dynamicSuno: dynamic.suno,
      verseGuideHint: `${verseGenderHint}, ${rawVocalPhrasing.suno.split(',')[0]}, ${bass.suno.split(',')[0]}`,
      chorusGuideHint: `${chorusGenderHint}, catchy memorable hook, ${interaction.suno.split(',')[0]}`,
      bridgeGuideHint: `${verseGenderHint}, stripped arrangement, ${harmony.suno.split(',')[0]}`,
    });
  }

  return plans;
}

export function formatInnovationPromptSection(plans: InnovationPlan[]): string {
  if (plans.length === 0) return '';
  const blocks = plans.map((p) => {
    const bassTitle = p.hasBass
      ? 'Melodic Bass Pocket'
      : 'Low-Register Left-Hand Accompaniment (NO dedicated bass instrument)';
    const drumTitle = p.hasDrums
      ? 'Locked Rhythm Pocket'
      : 'Natural Flow Accompaniment (NO drums)';
    const hihatTitle = p.hasHihat
      ? 'Hi-Hat & Percussion Texture'
      : 'Clean Breathing Space (NO hi-hat)';
    const lockedGenderLine =
      p.vocalGender === 'male'
        ? 'SOLO MALE LEAD VOCAL ONLY (MUST explicitly write "solo male lead vocal, male voice" in stylePrompt & section guides + "-female vocals" in Exclude; ZERO female voice cues)'
        : p.vocalGender === 'female'
        ? 'SOLO FEMALE LEAD VOCAL ONLY (MUST explicitly write "solo female lead vocal, female voice" in stylePrompt & section guides + "-male vocals" in Exclude; ZERO male voice cues)'
        : 'PURE INSTRUMENTAL ONLY (MUST write "instrumental only, no vocals" + "-vocals, -singing"; ZERO sung lyrics)';

    return `Track ${p.trackNumber} Musical Character [${p.arrangementLabel}] (${p.bpmSuggestion}, Key Color: ${p.keyColor}):
  - LOCKED VOCAL GENDER: ${lockedGenderLine}
  - ${bassTitle}: ${p.bassSuno}
  - ${drumTitle}: ${p.drumSuno}
  - ${hihatTitle}: ${p.hihatSuno}
  - Instrument Interplay: ${p.interactionSuno}
  - Catchy Harmony & Melody: ${p.harmonySuno}
  - Vocal Clarity & Phrasing: ${p.vocalPhrasingSuno}
  - Dynamic Lift: ${p.dynamicSuno}`;
  });

  const c = plans[0].constraints;
  const exclusionReminders: string[] = [];
  if (c.forbidsOrchestra || c.forbidsStrings || c.forbidsTimpani) {
    exclusionReminders.push('STRICT SOP RESPECT: NEVER add orchestral strings, cello, brass, choir, or timpani if forbidden by the SOP.');
  }
  if (c.forbidsBass) {
    exclusionReminders.push('STRICT SOP RESPECT: This theme omits bass instruments — NEVER add bass guitar, 808, or sub-bass; achieve low-end warmth via piano left-hand voicings or acoustic guitar lower strings.');
  }
  if (c.forbidsDrums) {
    exclusionReminders.push('STRICT SOP RESPECT: This theme omits drums — NEVER add drum kits, kick, snare, or hi-hats.');
  }

  return `
================================================================================
THEME-FAITHFUL MELODIC & GROOVE VARIETY MATRIX (테마 맞춤 멜로디·보컬 안정화 사운드 설계)
================================================================================
Give each track distinct musical color while strictly locking each track's assigned vocal gender and protecting rhythmic stability, pitch accuracy, and a memorable singable melody (NEVER use jarring timing terms like "ahead-of-beat", "behind-the-beat", "breaking 4/4", "off-grid", "irregular", or "voice crack" that cause Suno to sing out of tune or off time!):
${exclusionReminders.length > 0 ? '\n' + exclusionReminders.map((r) => `- ${r}`).join('\n') + '\n' : ''}
${blocks.join('\n\n')}`;
}

function stripExcludeTail(styleLower: string): string {
  return styleLower
    .replace(/\bexclude\s*:.*$/is, '')
    .replace(/(?:,\s*-[a-z0-9][a-z0-9\s-]*)+$/is, '')
    .trim();
}

function resolveEffectiveTrackInstrumentation(track: Partial<TrackItem>, plan: InnovationPlan): {
  usesBass: boolean;
  usesDrums: boolean;
  usesHihat: boolean;
  modeLabel: string;
} {
  const styleRaw = (track.stylePrompt || '').toLowerCase();
  const bodyWithoutExclude = stripExcludeTail(styleRaw);

  const explicitlyBassless =
    plan.constraints.forbidsBass ||
    /\b(no\s*bass|without\s*bass|bassless|zero\s*bass|solo\s*piano|piano\s*(?:and|&)\s*vocal\s*only|acoustic\s*guitar\s*(?:and|&)\s*vocal\s*only|stripped\s*piano)\b/i.test(bodyWithoutExclude);
  const explicitlyDrumless =
    plan.constraints.forbidsDrums ||
    /\b(no\s*drums?|without\s*drums?|drumless|no\s*percussion|solo\s*piano|rubato|unaccompanied)\b/i.test(bodyWithoutExclude);

  const mentionsBass = /\b(bass|sub-?bass|808|contrabass|moog\s*sub|p-bass|precision\s*bass|upright\s*bass|bassline|fretless|double\s*bass)\b/i.test(bodyWithoutExclude);
  const mentionsDrums = /\b(drum|drums|kick|snare|rimshot|brushed\s*kit|beat|percussion|boom-?bap|trap)\b/i.test(bodyWithoutExclude);
  const mentionsHihat = /\b(hi-?hat|cymbal|shaker|ride)\b/i.test(bodyWithoutExclude);

  const isBalladOrMinimal =
    plan.archetype === 'ballad_intimate' ||
    plan.archetype === 'cinematic_ost' ||
    plan.archetype === 'acoustic_indie' ||
    plan.constraints.isBalladTheme ||
    plan.constraints.isStrippedSoloSetting;

  let usesBass = plan.hasBass;
  let usesDrums = plan.hasDrums;
  let usesHihat = plan.hasHihat;

  if (explicitlyBassless) usesBass = false;
  else if (isBalladOrMinimal && !mentionsBass && !plan.hasBass) usesBass = false;
  else if (isBalladOrMinimal && !mentionsBass && !plan.constraints.forbidsBass && styleRaw.length > 200) {
    usesBass = false;
  }

  if (explicitlyDrumless) {
    usesDrums = false;
    usesHihat = false;
  } else if (isBalladOrMinimal && !mentionsDrums && styleRaw.length > 200) {
    usesDrums = false;
    usesHihat = false;
  } else if (isBalladOrMinimal && usesDrums && !mentionsHihat) {
    usesHihat = false;
  }

  const modeLabel =
    !usesBass && !usesDrums
      ? '베이스·드럼 없는 미니멀 발라드/어쿠스틱 편성'
      : !usesBass && usesDrums
      ? '베이스리스 퍼커시브 편성'
      : usesBass && !usesDrums
      ? '드럼리스 멜로딕 편성'
      : '풀 리듬 섹션 편성';

  return { usesBass, usesDrums, usesHihat, modeLabel };
}

export function evaluateTrackMusicalCraft(
  track: Partial<TrackItem>,
  plan: InnovationPlan,
  siblingPrompts: string[] = []
): TrackCraftAudit {
  const style = (track.stylePrompt || '').toLowerCase();
  const styleBody = stripExcludeTail(style);
  const lyrics = (track.fullLyrics || '').toLowerCase();
  const combined = `${styleBody} ${lyrics}`;

  const { usesBass, usesDrums, usesHihat, modeLabel } = resolveEffectiveTrackInstrumentation(track, plan);

  const hasGrooveOrFlow = usesDrums
    ? /(groove|pocket|swing|bounce|rhythm|laid-?back|tight|locked|organic|driving|pulse|snare|kick)/i.test(combined)
    : /(flow|breathing|organic|lyricism|phrase|sway|unhurried|pulse|swell|intimate|rubato|accompaniment)/i.test(combined);

  const hasBassPresence = usesBass
    ? /(bass|sub-?bass|808|low-?end|moog|p-bass|precision bass|upright bass|double bass|fretless)/i.test(styleBody)
    : /(left-?hand|low-?register|lower-?register|lower-?string|open-?fifth|octave|felt piano|felt-piano|acoustic piano|nylon|fingerpick|thumb|warm low|pedal|resonance|voicing)/i.test(styleBody);

  const hasIndependentMotif = usesBass
    ? /(melodic|groove|pocket|turnaround|walking|pitch-?glide|octave|counter|syncopat|hook|bassline|riff|4-bar|bounce)/i.test(styleBody)
    : /(arpeggio|voicing|counter|fingerpick|turnaround|inversion|resonance|motif|chord)/i.test(styleBody);

  const hasSyncopationOrSpace = usesDrums
    ? /(syncopat|pocket|swing|ghost|backbeat|bounce|groove|fill|open-?hat|shaker|rimshot|tight)/i.test(styleBody)
    : /(breath|space|pause|flow|phrasing|arpeggio|swell|intimate|decay|dynamics)/i.test(combined);

  const hasInteraction = /(guitar|rhodes|clavinet|keys|piano|horn|brass|chops|fills|comping|answer|interplay|dialogue|chords|pad|vocal)/i.test(styleBody);
  const hasVocalPhrasing = /(vocal|phrasing|delivery|tone|falsetto|chest|breath|vibrato|belt|singing|hook|melody|pitch)/i.test(combined);
  const hasDynamic = /(dynamic|crescendo|climax|stripped|contrast|lift|swell|chorus|verse|bridge|warm|build|opening)/i.test(combined);

  // Check similarity against sibling tracks in the same playlist
  const myTokens = new Set(styleBody.split(/[^a-z0-9-]+/).filter((w) => w.length > 3));
  let maxOverlap = 0;
  for (const sib of siblingPrompts) {
    if (!sib || sib === track.stylePrompt) continue;
    const sibBody = stripExcludeTail(sib.toLowerCase());
    const sibTokens = new Set(sibBody.split(/[^a-z0-9-]+/).filter((w) => w.length > 3));
    if (myTokens.size === 0 || sibTokens.size === 0) continue;
    let common = 0;
    for (const tok of myTokens) {
      if (sibTokens.has(tok)) common++;
    }
    const overlap = common / Math.max(myTokens.size, sibTokens.size);
    if (overlap > maxOverlap) maxOverlap = overlap;
  }

  const criteria: CraftAuditCriterion[] = [
    {
      item: usesDrums ? '전체 그루브' : '전체 호흡 및 흐름',
      result: hasGrooveOrFlow && maxOverlap < 0.85 ? '우수' : hasGrooveOrFlow ? '양호' : '보통',
      judgment: hasGrooveOrFlow
        ? usesDrums
          ? '테마 정체성에 맞춘 안정적이고 탄력 있는 리듬 포켓 형성'
          : '드럼 없이도 곡의 호흡과 서정적 흐름이 매끄럽게 유지됨'
        : '리듬 포켓 및 흐름 키워드 보강 권장',
    },
    {
      item: usesBass ? '베이스 존재감' : '저음역 공명 (베이스리스)',
      result: hasBassPresence ? '우수' : '미흡',
      judgment: hasBassPresence
        ? usesBass
          ? '저음역 질감과 베이스 정체성이 선명하게 정의됨'
          : '피아노 왼손/기타 저음현 공명으로 저역 균형 확보'
        : '저음역 악기 및 톤 디렉션 보강 필요',
    },
    {
      item: usesBass ? '베이스·리듬 결속' : '반주 선율·보이싱',
      result: hasIndependentMotif ? '우수' : '양호',
      judgment: hasIndependentMotif
        ? usesBass
          ? '턴어라운드와 멜로디 감각이 살아있는 안정적 베이스 라인 설계'
          : '아르페지오·보이싱 전위가 조화롭게 이어지는 반주 설계'
        : '베이스·반주 선율 디렉션 보강 가능',
    },
    {
      item: usesDrums ? '포켓·바운스 감각' : '프레이징 여백',
      result: hasSyncopationOrSpace ? '우수' : '양호',
      judgment: hasSyncopationOrSpace
        ? usesDrums
          ? '백비트 중심이 흔들리지 않으면서 자연스러운 바운스와 고스트 노트 확보'
          : '자연스러운 호흡과 여백으로 서정적 울림 극대화'
        : '리듬 바운스 및 공간 여백 디테일 보강 가능',
    },
    {
      item: usesBass ? '악기 간 조화' : '반주-보컬 조화',
      result: hasInteraction ? '우수' : '양호',
      judgment: hasInteraction
        ? '건반·기타·브라스와 보컬이 서로 부딪히지 않고 조화롭게 어우러짐'
        : '악기 간 밸런스 키워드 보강 가능',
    },
    {
      item: '보컬·멜로디 안정성',
      result: hasVocalPhrasing ? '우수' : '양호',
      judgment: hasVocalPhrasing
        ? '음정 안정성과 귀에 남는 선율미가 살아있는 보컬 프레이징 설계'
        : '보컬 음색 및 멜로디 표현력 보강 가능',
    },
    {
      item: '전체 다이내믹',
      result: hasDynamic ? '우수' : '양호',
      judgment: hasDynamic
        ? '벌스-코러스-브릿지 감정선과 다이내믹 리프트가 안정적으로 설계됨'
        : '섹션 간 다이내믹 대비 보강 가능',
    },
  ];

  const effectiveBassTag = usesBass
    ? plan.bassKo
    : BASSLESS_LEFT_HAND_POOL[plan.trackNumber % BASSLESS_LEFT_HAND_POOL.length].ko;
  const effectiveDrumTag = usesDrums
    ? plan.drumKo
    : DRUMLESS_PULSE_POOL[plan.trackNumber % DRUMLESS_PULSE_POOL.length].ko;
  const effectiveHihatTag = usesHihat
    ? plan.hihatKo
    : HIHATLESS_SPACE_POOL[plan.trackNumber % HIHATLESS_SPACE_POOL.length].ko;

  return {
    archetypeLabel: plan.archetypeLabel,
    arrangementLabel: modeLabel,
    refined: false,
    signatureLabels: {
      bass: usesBass ? '베이스' : '저음 공명/반주',
      drum: usesDrums ? '드럼' : '리듬 호흡',
      hihat: usesHihat ? '하이햇' : '여백 설계',
      interaction: usesBass ? '악기 조화' : '반주-보컬 조화',
      vocalPhrasing: '보컬·멜로디',
      harmony: '화성 색채',
    },
    signatureTags: {
      bass: effectiveBassTag,
      drum: effectiveDrumTag,
      hihat: effectiveHihatTag,
      interaction: plan.interactionKo,
      vocalPhrasing: plan.vocalPhrasingKo,
      harmony: plan.harmonyKo,
    },
    criteria,
  };
}

function fitStylePromptLength(
  originalBody: string,
  addedParts: string[],
  excludeClause: string,
  minLen = 760,
  maxLen = 945,
  isInstrumental = false
): string {
  const cleanSegs = (s: string) =>
    s
      .replace(/\s+/g, ' ')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

  // Protect the original SOP style tags at the front so they are NEVER trimmed away!
  const baseParts = cleanSegs(originalBody);
  const extraParts = addedParts.flatMap((p) => cleanSegs(p));
  const combinedParts = [...baseParts];

  for (const ep of extraParts) {
    const joinedSoFar = combinedParts.join(', ');
    const currentLen = excludeClause ? `${joinedSoFar}, ${excludeClause}`.length : joinedSoFar.length;
    if (currentLen >= maxLen) {
      break;
    }
    const candidate = `${joinedSoFar}, ${ep}`;
    const candidateWithExclude = excludeClause ? `${candidate}, ${excludeClause}` : candidate;
    if (candidateWithExclude.length <= maxLen) {
      combinedParts.push(ep);
    }
  }

  const cleanExclude = excludeClause.trim();
  const joinWithExclude = (b: string) =>
    cleanExclude ? `${b.replace(/[,\s]+$/, '')}, ${cleanExclude}` : b.replace(/[,\s]+$/, '');

  let workingBody = combinedParts.join(', ');
  let result = joinWithExclude(workingBody);

  const enrichmentPool = isInstrumental
    ? [
        'catchy memorable instrumental melody',
        'expressive acoustic instrument phrasing',
        'warm analog studio depth',
        'balanced mid-range clarity',
        'natural stereo panorama',
        'polished streaming-ready master',
      ]
    : [
        'catchy memorable melody',
        'clear pitch-true lead vocal',
        'warm analog studio depth',
        'balanced mid-range clarity',
        'natural stereo panorama',
        'polished streaming-ready master',
      ];
  let idx = 0;
  while (result.length < minLen && idx < enrichmentPool.length) {
    if (!workingBody.toLowerCase().includes(enrichmentPool[idx])) {
      const nextBody = `${workingBody}, ${enrichmentPool[idx]}`;
      const nextFull = joinWithExclude(nextBody);
      if (nextFull.length <= maxLen) {
        workingBody = nextBody;
        result = nextFull;
      }
    }
    idx++;
  }

  // Only trim from the END (extra additions), keeping core SOP & vocal gender parts intact!
  if (result.length > maxLen) {
    const parts = cleanSegs(workingBody);
    while (joinWithExclude(parts.join(', ')).length > maxLen && parts.length > 5) {
      const last = parts[parts.length - 1];
      if (/\b(female|male|no vocals|instrumental only)\b/i.test(last) && parts.length > 6) {
        parts.splice(parts.length - 2, 1);
      } else {
        parts.pop();
      }
    }
    result = joinWithExclude(parts.join(', '));
    if (result.length > maxLen && !cleanExclude) {
      result = result.slice(0, maxLen).replace(/,\s*[^,]*$/, '').trim();
    }
  }

  return result;
}

function splitStylePromptAndExclude(rawStyle: string): {
  body: string;
  excludePrefix: 'Exclude: ' | '';
  excludeItems: string[];
} {
  const trimmed = (rawStyle || '').trim();
  const excludeKeywordMatch = trimmed.match(/\bExclude\s*:\s*(.*)$/i);
  if (excludeKeywordMatch && excludeKeywordMatch.index !== undefined) {
    const body = trimmed.slice(0, excludeKeywordMatch.index).replace(/[,\s]+$/, '').trim();
    const rawExcl = excludeKeywordMatch[1].trim();
    const items = rawExcl
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('-') ? t : `-${t}`));
    return { body, excludePrefix: 'Exclude: ', excludeItems: items };
  }

  const dashTailMatch = trimmed.match(/((?:,\s*-[a-z0-9][a-z0-9\s-]*)+)$/i);
  if (dashTailMatch && dashTailMatch.index !== undefined) {
    const body = trimmed.slice(0, dashTailMatch.index).replace(/[,\s]+$/, '').trim();
    const items = dashTailMatch[1]
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return { body, excludePrefix: '', excludeItems: items };
  }

  return { body: trimmed, excludePrefix: 'Exclude: ', excludeItems: [] };
}

function sanitizePositiveTextToGender(text: string, vocalGender: ResolvedVocalGender): string {
  if (!text) return text;
  let out = text;

  if (vocalGender === 'male') {
    out = out
      .replace(/\bfemale\s+lead\s+vocal(?:s)?\b/gi, 'solo male lead vocal')
      .replace(/\bfemale\s+lead\b/gi, 'solo male lead')
      .replace(/\bfemale\s+vocal(?:s)?\b/gi, 'solo male vocal')
      .replace(/\bfemale\s+voice\b/gi, 'male voice')
      .replace(/\bfemale-?led\b/gi, 'male-led')
      .replace(/\bfemale\b/gi, 'male')
      .replace(/\bwoman(?:'s)?\s+voice\b/gi, "man's voice")
      .replace(/\bwoman\b/gi, 'man')
      .replace(/\bgirl(?:'s)?\s+voice\b/gi, 'male voice')
      .replace(/\bher\s+voice\b/gi, 'his voice')
      .replace(/\bmezzo(?:-?soprano)?\b/gi, 'warm baritone')
      .replace(/\bsoprano\b/gi, 'clear tenor')
      .replace(/\balto\b/gi, 'warm tenor')
      .replace(/\bandrogynous\b/gi, 'clear warm')
      .replace(/\bduet\b/gi, 'solo')
      .replace(/\bsolo\s+solo\b/gi, 'solo')
      .replace(/(?<![a-z])male\s+male\b/gi, 'male');
  } else if (vocalGender === 'female') {
    out = out
      .replace(/(?<![a-z])male\s+lead\s+vocal(?:s)?\b/gi, 'solo female lead vocal')
      .replace(/(?<![a-z])male\s+lead\b/gi, 'solo female lead')
      .replace(/(?<![a-z])male\s+vocal(?:s)?\b/gi, 'solo female vocal')
      .replace(/(?<![a-z])male\s+voice\b/gi, 'female voice')
      .replace(/(?<![a-z])male-?led\b/gi, 'female-led')
      .replace(/(?<![a-z])male\b/gi, 'female')
      .replace(/\bman(?:'s)?\s+voice\b/gi, "woman's voice")
      .replace(/\bboyish\b/gi, 'youthful')
      .replace(/\bhis\s+voice\b/gi, 'her voice')
      .replace(/\bbaritone\b/gi, 'warm alto')
      .replace(/\btenor\b/gi, 'clear soprano')
      .replace(/\bcrooner\b/gi, 'vintage vocalist')
      .replace(/\bandrogynous\b/gi, 'ethereal')
      .replace(/\bduet\b/gi, 'solo')
      .replace(/\bsolo\s+solo\b/gi, 'solo')
      .replace(/\bfemale\s+female\b/gi, 'female');
  } else if (vocalGender === 'none') {
    const segs = out
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((seg) => {
        if (/\b(no\s*vocals?|instrumental(?:\s+only)?|pure\s+instrumental)\b/i.test(seg)) return true;
        return !/\b(vocal|vocals|vocalist|singing|sing-?rap|falsetto|soprano|alto|baritone|tenor|crooner|belting|chest\s*voice|head\s*voice|close-?mic|breath\s*control|spoken-?sung|ad-?libs?|female|(?<![a-z])male)\b/i.test(seg);
      });
    out = segs.join(', ');
  }

  return out.replace(/\s{2,}/g, ' ').replace(/,\s*,+/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '');
}

export function enforceVocalGenderInStylePrompt(
  stylePrompt: string,
  vocalGender: ResolvedVocalGender,
  maxLen: number = 975
): string {
  const { body, excludePrefix, excludeItems } = splitStylePromptAndExclude(stylePrompt);
  let cleanBody = sanitizePositiveTextToGender(body, vocalGender);

  if (vocalGender === 'male') {
    const hasExplicitMaleAnchor = /(?<![a-z])male\s+(?:lead\s+)?(?:vocal|vocals|voice|singer|rap|baritone|tenor)\b/i.test(cleanBody);
    const hasSoloMaleLead = /\bsolo\s+male\s+(?:lead\s+)?vocal\b/i.test(cleanBody);
    if (!hasExplicitMaleAnchor) {
      cleanBody = cleanBody ? `${cleanBody}, solo male lead vocal, male voice` : 'solo male lead vocal, male voice';
    } else if (!hasSoloMaleLead && !/\bsolo\s+male\b/i.test(cleanBody)) {
      cleanBody = cleanBody ? `${cleanBody}, solo male lead vocal` : 'solo male lead vocal';
    }
  } else if (vocalGender === 'female') {
    const hasExplicitFemaleAnchor = /\bfemale\s+(?:lead\s+)?(?:vocal|vocals|voice|singer|rap|soprano|alto|mezzo)\b/i.test(cleanBody);
    const hasSoloFemaleLead = /\bsolo\s+female\s+(?:lead\s+)?vocal\b/i.test(cleanBody);
    if (!hasExplicitFemaleAnchor) {
      cleanBody = cleanBody ? `${cleanBody}, solo female lead vocal, female voice` : 'solo female lead vocal, female voice';
    } else if (!hasSoloFemaleLead && !/\bsolo\s+female\b/i.test(cleanBody)) {
      cleanBody = cleanBody ? `${cleanBody}, solo female lead vocal` : 'solo female lead vocal';
    }
  } else {
    const hasInstrAnchor = /\b(?:pure\s+instrumental|instrumental\s+only|no\s+vocals?)\b/i.test(cleanBody);
    if (!hasInstrAnchor) {
      cleanBody = cleanBody ? `${cleanBody}, pure instrumental, instrumental only, no vocals` : 'pure instrumental, instrumental only, no vocals';
    }
  }

  // Deduplicate and sanitize Exclude items
  const cleanedExclude: string[] = [];
  const seenExcl = new Set<string>();
  for (const rawItem of excludeItems) {
    const norm = rawItem.trim().toLowerCase();
    if (!norm) continue;
    if (vocalGender === 'male' && (/^-?(?:male|vocals?|singing|lead\s+vocal)$/i.test(norm) || /^-(?<![a-z])male\s+vocal/i.test(norm))) {
      continue;
    }
    if (vocalGender === 'female' && /^-?(?:female|female\s+vocals?|vocals?|singing|lead\s+vocal)$/i.test(norm)) {
      continue;
    }
    if (!seenExcl.has(norm)) {
      seenExcl.add(norm);
      cleanedExclude.push(rawItem.trim());
    }
  }

  const requiredExcludes =
    vocalGender === 'male'
      ? ['-female vocals', '-female vocal']
      : vocalGender === 'female'
      ? ['-male vocals', '-male vocal']
      : ['-vocals', '-singing', '-lead vocal', '-male vocals', '-female vocals'];

  for (const req of requiredExcludes) {
    const hasAlready = cleanedExclude.some((item) => item.toLowerCase() === req.toLowerCase());
    if (!hasAlready) {
      cleanedExclude.push(req);
    }
  }

  const excludeStr = cleanedExclude.length > 0 ? `${excludePrefix}${cleanedExclude.join(', ')}` : '';
  const buildFull = (b: string) =>
    excludeStr ? `${b.replace(/[,\s]+$/, '')}, ${excludeStr}` : b.replace(/[,\s]+$/, '');

  let combined = buildFull(cleanBody);
  if (combined.length > maxLen) {
    const segs = cleanBody.split(',').map((s) => s.trim()).filter(Boolean);
    while (buildFull(segs.join(', ')).length > maxLen && segs.length > 4) {
      // Remove longest non-critical filler segment near the middle/end while keeping vocal gender & BPM
      let dropIdx = -1;
      for (let i = segs.length - 1; i >= 1; i--) {
        if (!/\b(female|male|vocal|voice|no vocals|instrumental|bpm)\b/i.test(segs[i])) {
          dropIdx = i;
          break;
        }
      }
      if (dropIdx === -1) break;
      segs.splice(dropIdx, 1);
    }
    combined = buildFull(segs.join(', '));
  }

  return combined;
}

export function enforceVocalGenderInMetaVocal(
  metaVocal: string | undefined,
  vocalGender: ResolvedVocalGender
): string {
  if (vocalGender === 'none') {
    return 'Instrumental (No vocals)';
  }
  const raw = (metaVocal || '').trim();
  if (vocalGender === 'male') {
    if (!raw) return 'Solo Male Lead Vocal';
    let cleaned = raw
      .replace(/여성\s*보컬/g, '남성 보컬')
      .replace(/여자\s*보컬/g, '남성 보컬')
      .replace(/여성/g, '남성')
      .replace(/\bfemale\b/gi, 'male')
      .replace(/\bsoprano\b/gi, 'tenor')
      .replace(/\bmezzo(?:-?soprano)?\b/gi, 'baritone')
      .replace(/\balto\b/gi, 'tenor')
      .replace(/\bandrogynous\b/gi, 'clear');
    if (!/(?<![a-z])male\b|남성/i.test(cleaned)) {
      cleaned = `Solo Male Vocal · ${cleaned}`;
    }
    return cleaned;
  }

  if (!raw) return 'Solo Female Lead Vocal';
  let cleaned = raw
    .replace(/남성\s*보컬/g, '여성 보컬')
    .replace(/남자\s*보컬/g, '여성 보컬')
    .replace(/남성/g, '여성')
    .replace(/(?<![a-z])male\b/gi, 'female')
    .replace(/\bbaritone\b/gi, 'alto')
    .replace(/\btenor\b/gi, 'soprano')
    .replace(/\bandrogynous\b/gi, 'ethereal');
  if (!/\bfemale\b|여성/i.test(cleaned)) {
    cleaned = `Solo Female Vocal · ${cleaned}`;
  }
  return cleaned;
}

export function enforceVocalGenderInLyricsTags(
  fullLyrics: string,
  vocalGender: ResolvedVocalGender
): string {
  if (!fullLyrics) return '';

  const sanitizeGuideText = (guide: string): string => {
    if (vocalGender === 'male') {
      return guide
        .replace(/\bfemale\s+lead\s+vocal\b/gi, 'male lead vocal')
        .replace(/\bfemale\s+vocal\b/gi, 'male vocal')
        .replace(/\bfemale\b/gi, 'male')
        .replace(/\bsoprano\b/gi, 'tenor')
        .replace(/\balto\b/gi, 'tenor')
        .replace(/\bmezzo(?:-?soprano)?\b/gi, 'baritone')
        .replace(/\bandrogynous\b/gi, 'clear');
    }
    if (vocalGender === 'female') {
      return guide
        .replace(/(?<![a-z])male\s+lead\s+vocal\b/gi, 'female lead vocal')
        .replace(/(?<![a-z])male\s+vocal\b/gi, 'female vocal')
        .replace(/(?<![a-z])male\b/gi, 'female')
        .replace(/\bbaritone\b/gi, 'alto')
        .replace(/\btenor\b/gi, 'soprano')
        .replace(/\bandrogynous\b/gi, 'ethereal');
    }
    return guide
      .replace(/\b(?:solo\s+)?(?:female|male)\s+(?:lead\s+)?vocal(?:s)?\b/gi, 'instrumental lead melody')
      .replace(/\b(?:lead\s+)?vocal(?:s)?\b/gi, 'instrumental melody')
      .replace(/\bsinging(?:-?rap)?\b/gi, 'instrumental phrase')
      .replace(/\bfalsetto\b/gi, 'harmonic swell');
  };

  let out = fullLyrics.replace(/\[([^\]\n\r]+)\]/g, (_full, inner: string) => {
    const trimmedInner = inner.trim();
    const colonIdx = trimmedInner.indexOf(':');
    if (colonIdx === -1) {
      if (vocalGender === 'male' && /^(?:verse\s*\d+|pre-?chorus|chorus|final\s+chorus|bridge)$/i.test(trimmedInner)) {
        return `[${trimmedInner}: solo male lead vocal]`;
      }
      if (vocalGender === 'female' && /^(?:verse\s*\d+|pre-?chorus|chorus|final\s+chorus|bridge)$/i.test(trimmedInner)) {
        return `[${trimmedInner}: solo female lead vocal]`;
      }
      return `[${trimmedInner}]`;
    }

    const header = trimmedInner.slice(0, colonIdx).trim();
    let desc = sanitizeGuideText(trimmedInner.slice(colonIdx + 1).trim());

    const isVocalHeader = /^(?:verse|pre-?chorus|final\s+chorus|chorus|bridge|hook)/i.test(header);
    if (isVocalHeader && desc) {
      if (vocalGender === 'male' && !/(?<![a-z])male\b/i.test(desc)) {
        desc = `male vocal, ${desc}`;
      } else if (vocalGender === 'female' && !/\bfemale\b/i.test(desc)) {
        desc = `female vocal, ${desc}`;
      }
    }
    return desc ? `[${header}: ${desc}]` : `[${header}]`;
  });

  // Also fix parenthesized voice directions like "(Lead female vocal belt ...)" or "(Supporting voice: ...)"
  out = out.replace(/^\(([^()\n\r]+)\)$/gm, (line, content: string) => {
    if (vocalGender === 'none' && /\b(supporting voice|lead .*vocal|vocal belt|singing)\b/i.test(content)) {
      return `(${sanitizeGuideText(content)})`;
    }
    if (/\b(vocal|female|male|voice|belt|singing|falsetto|soprano|alto|tenor|baritone)\b/i.test(content)) {
      return `(${sanitizeGuideText(content)})`;
    }
    return line;
  });

  return out;
}

export function enforceTrackVocalGender<T extends Partial<TrackItem>>(
  track: T,
  vocalGender: ResolvedVocalGender
): T {
  const nextStylePrompt = enforceVocalGenderInStylePrompt(track.stylePrompt || '', vocalGender);
  const nextMetaVocal = enforceVocalGenderInMetaVocal(track.metaInfo?.vocal, vocalGender);
  const nextLyrics = enforceVocalGenderInLyricsTags(track.fullLyrics || '', vocalGender);

  return {
    ...track,
    stylePrompt: nextStylePrompt,
    fullLyrics: nextLyrics,
    metaInfo: {
      ...(track.metaInfo || {}),
      vocal: nextMetaVocal,
    },
  };
}

function stripSectionPrefix(sectionName: string, rawGuide: string): string {
  let clean = (rawGuide || '').replace(/[\[\]{}]/g, '').trim();
  const baseName = sectionName.replace(/\s*\d+$/, '').replace(/^final\s+/i, '').trim();
  const exactRe = new RegExp(`^${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:\\-]\\s*`, 'i');
  const baseRe = baseName
    ? new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s*\\d+)?\\s*[:\\-]\\s*`, 'i')
    : null;

  for (let i = 0; i < 3; i++) {
    const prev = clean;
    clean = clean.replace(exactRe, '').trim();
    if (baseRe) clean = clean.replace(baseRe, '').trim();
    if (clean === prev) break;
  }
  return clean;
}

export function refineTrackWithCraftAudit(
  track: TrackItem,
  plan: InnovationPlan,
  siblingPrompts: string[] = []
): TrackItem {
  const genderLockedTrack = enforceTrackVocalGender(track, plan.vocalGender);
  const initialAudit = evaluateTrackMusicalCraft(genderLockedTrack, plan, siblingPrompts);
  const needsRefinement = initialAudit.criteria.some((c) => c.result === '미흡');

  if (!needsRefinement && (genderLockedTrack.stylePrompt || '').length >= 700) {
    return {
      ...genderLockedTrack,
      craftAudit: initialAudit,
    };
  }

  const { usesBass, usesDrums } = resolveEffectiveTrackInstrumentation(genderLockedTrack, plan);

  let rawStyle = (genderLockedTrack.stylePrompt || '').trim();
  let excludeClause = '';
  const excludeMatch = rawStyle.match(/(Exclude\s*:.*)$/i) || rawStyle.match(/((?:,\s*-[a-z0-9][a-z0-9\s-]*)+)$/i);
  if (excludeMatch && excludeMatch.index !== undefined) {
    excludeClause = excludeMatch[1].replace(/^,\s*/, '').trim();
    rawStyle = rawStyle.slice(0, excludeMatch.index).replace(/[,\s]+$/, '').trim();
  }

  const additions: string[] = [];
  const lower = rawStyle.toLowerCase();

  const effectiveBassDirective = usesBass
    ? plan.bassSuno
    : BASSLESS_LEFT_HAND_POOL[plan.trackNumber % BASSLESS_LEFT_HAND_POOL.length].suno;
  const effectiveDrumDirective = usesDrums
    ? plan.drumSuno
    : DRUMLESS_PULSE_POOL[plan.trackNumber % DRUMLESS_PULSE_POOL.length].suno;

  // Add at most 3 gentle, melody/groove-protecting enrichments only if missing
  if (
    usesBass
      ? !/(bass|sub-?bass|808|upright|double bass)/i.test(lower)
      : !/(left-?hand|arpeggio|lower-?register|thumb)/i.test(lower)
  ) {
    if (isTagCompatibleWithConstraints(effectiveBassDirective, plan.constraints)) {
      additions.push(effectiveBassDirective);
    }
  }

  if (
    usesDrums
      ? !/(drum|kick|snare|rimshot|pocket|groove)/i.test(lower)
      : !/(drumless|natural vocal|accompaniment)/i.test(lower)
  ) {
    if (isTagCompatibleWithConstraints(effectiveDrumDirective, plan.constraints)) {
      additions.push(effectiveDrumDirective);
    }
  }

  if (!/(melody|hook|catchy|singable|maj9|add9|7th)/i.test(lower)) {
    additions.push(plan.harmonySuno);
  }
  if (!/(vocal|phrasing|pitch|delivery)/i.test(lower) && additions.length < 3) {
    additions.push(plan.vocalPhrasingSuno);
  }
  if (!/\bbpm\b/i.test(lower)) {
    additions.push(plan.bpmSuggestion);
  }

  const fittedStylePrompt = fitStylePromptLength(
    rawStyle,
    additions,
    excludeClause,
    760,
    945,
    plan.vocalGender === 'none'
  );
  const finalStylePrompt = enforceVocalGenderInStylePrompt(fittedStylePrompt, plan.vocalGender);

  // Only add a gentle bracket guide if [Verse 1] or [Chorus] has NO guide at all;
  // NEVER overwrite or bloat existing SOP bracket guides with clunky rhythm formulas!
  let enhancedLyrics = genderLockedTrack.fullLyrics || '';
  if (enhancedLyrics) {
    const cleanVerseHint = stripSectionPrefix('Verse 1', plan.verseGuideHint);
    const cleanChorusHint = stripSectionPrefix('Chorus', plan.chorusGuideHint);
    enhancedLyrics = enhancedLyrics
      .replace(/^\[Verse 1\]$/m, `[Verse 1: ${cleanVerseHint}]`)
      .replace(/^\[Chorus\]$/m, `[Chorus: ${cleanChorusHint}]`);
    enhancedLyrics = enforceVocalGenderInLyricsTags(enhancedLyrics, plan.vocalGender);
  }

  const updatedTrack: TrackItem = {
    ...genderLockedTrack,
    stylePrompt: finalStylePrompt,
    fullLyrics: enhancedLyrics,
  };

  const finalAudit = evaluateTrackMusicalCraft(updatedTrack, plan, siblingPrompts);
  return {
    ...updatedTrack,
    craftAudit: {
      ...finalAudit,
      refined: additions.length > 0,
    },
  };
}

export function buildRefinementPromptForAI(
  weakItems: Array<{ track: TrackItem; plan: InnovationPlan; audit: TrackCraftAudit }>,
  themeName: string
): string {
  const details = weakItems
    .map(({ track, plan, audit }) => {
      const { usesBass, usesDrums } = resolveEffectiveTrackInstrumentation(track, plan);
      const weakCriteria = audit.criteria
        .filter((c) => c.result === '미흡' || c.result === '보통')
        .map((c) => `  * ${c.item} (${c.result}): ${c.judgment}`)
        .join('\n');

      const bassTarget = usesBass
        ? plan.bassSuno
        : BASSLESS_LEFT_HAND_POOL[plan.trackNumber % BASSLESS_LEFT_HAND_POOL.length].suno;
      const drumTarget = usesDrums
        ? plan.drumSuno
        : DRUMLESS_PULSE_POOL[plan.trackNumber % DRUMLESS_PULSE_POOL.length].suno;
      const lockedVocalText =
        plan.vocalGender === 'male'
          ? 'SOLO MALE LEAD VOCAL ONLY (keep "solo male lead vocal, male voice" + "-female vocals"; NEVER emit female cues!)'
          : plan.vocalGender === 'female'
          ? 'SOLO FEMALE LEAD VOCAL ONLY (keep "solo female lead vocal, female voice" + "-male vocals"; NEVER emit male cues!)'
          : 'PURE INSTRUMENTAL ONLY (no vocals, -vocals, -singing)';

      return `Track ${track.trackNumber} ("${track.title}") [${audit.arrangementLabel || plan.arrangementLabel}]:
Current stylePrompt: "${track.stylePrompt}"
Audit Gaps:
${weakCriteria}
Musical Enrichment Targets (strictly keep vocal pitch-true, rhythm pocket locked, and 760–940 chars total):
  - LOCKED VOCAL GENDER: ${lockedVocalText}
  - Low-Register / Bass: ${bassTarget}
  - Groove / Accompaniment Flow: ${drumTarget}
  - Catchy Melody & Harmony: ${plan.harmonySuno}
  - Vocal Phrasing: ${plan.vocalPhrasingSuno}`;
    })
    .join('\n\n');

  return `PRE-OUTPUT MUSICAL QUALITY REFINEMENT PASS (테마 맞춤 멜로디·보컬 안정화 검증 및 보완)
The following track(s) need clearer instrumentation or melodic focus for "${themeName}":

${details}

CRITICAL RULES:
1. STRICTLY PRESERVE EACH TRACK'S LOCKED VOCAL GENDER ("solo male lead vocal" vs "solo female lead vocal" vs "instrumental only") in both stylePrompt and verseGuide/chorusGuide! NEVER omit gender or switch to the opposite gender!
2. NEVER add off-beat/timing-breaking keywords ("ahead-of-beat", "behind-the-beat", "breaking 4/4", "off-grid", "irregular rests", "voice crack"). Keep vocals pitch-accurate, smooth, and groove-locked!
3. NEVER add bass or drums to stripped/bassless/drumless tracks, and NEVER add instruments forbidden by the theme's SOP.
4. For "verseGuide" and "chorusGuide": output ONLY the concise English description AFTER the colon (STRICTLY NEVER include "Verse 1:", "Chorus:", or square brackets "[" / "]" inside the value!).
Respond ONLY with valid JSON:
{
  "refinedTracks": [
    {
      "trackNumber": 1,
      "stylePrompt": "760-940 char refined Suno stylePrompt",
      "verseGuide": "concise English verse performance cue without section name prefix",
      "chorusGuide": "concise English chorus performance cue without section name prefix"
    }
  ]
}`;
}
