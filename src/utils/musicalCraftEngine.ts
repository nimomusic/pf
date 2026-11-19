import type { CraftAuditCriterion, Theme, TrackCraftAudit, TrackItem, VocalType } from '../types.ts';

export type MusicArchetype =
  | 'groove_pop'
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

export interface InnovationPlan {
  trackNumber: number;
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
    ko: '베이스 없이 4마디마다 보이싱·페달톤이 변하는 피아노 왼손 독립 대선율 모티프',
    suno: '4-bar evolving piano left-hand independent counter-melody and shifting open-fifth low-register resonance with zero bass instrument',
  },
  {
    ko: '어쿠스틱 기타 저음현 엄지 아르페지오가 4마디마다 선율을 바꾸는 독립 리프 (베이스 제외)',
    suno: 'independent 4-bar evolving fingerpicked acoustic lower-string thumb arpeggio counter-line shifting motifs naturally',
  },
  {
    ko: '펠트 피아노 저역 옥타브 공명과 경과음이 4마디 단위로 움직이는 서정적 반주 리프',
    suno: '4-bar evolving warm felt-piano lower-register octave resonance and chromatic passing-tone line carrying low-end warmth organically',
  },
];

const DRUMLESS_PULSE_POOL: Array<{ ko: string; suno: string }> = [
  {
    ko: '드럼 비트 없이 반주 스트럼·아르페지오 악센트 이동과 자연스러운 루바토 호흡',
    suno: 'drumless organic phrasing with subtle rubato tempo elasticity and displaced chordal pulse accents inside the accompaniment',
  },
  {
    ko: '타악기 없이 4마디마다 반주 리듬 밀도를 비틀어 긴장을 조율하는 어쿠스틱 펄스',
    suno: 'no percussion pulse relying on shifting 4-bar arpeggio syncopation and natural performer breathing rubato',
  },
];

const HIHATLESS_SPACE_POOL: Array<{ ko: string; suno: string }> = [
  {
    ko: '하이햇 대신 프레이즈 끝 1박의 의도적인 침묵과 여백의 호흡(에어 포켓) 설계',
    suno: 'intentional 1-beat silent breath pauses and suspended decay air-pockets between phrases instead of hi-hat ticks',
  },
  {
    ko: '심벌/하이햇 없이 보컬 흡기와 피아노 잔향 사이의 비대칭 정적 리듬 설계',
    suno: 'asymmetric vocal-intake silence gaps and lingering natural room decay creating rhythmic tension without hi-hats',
  },
];

const ARCHETYPE_POOLS: Record<MusicArchetype, ArchetypePool> = {
  groove_pop: {
    label: 'Groove Pop / Retail Feel-Good Pop',
    bpmPool: ['102 BPM', '106 BPM', '98 BPM', '110 BPM', '104 BPM', '112 BPM'],
    keyColors: ['Dbmaj9', 'Fmaj9', 'Eb Dorian groove', 'Abmaj9', 'G Mixolydian pop', 'Bbm9'],
    bassOptions: [
      {
        ko: '4마디 단위로 변화하는 독립적인 옥타브 팝 멜로디 베이스 리프',
        suno: '4-bar evolving independent melodic bass riff with tight octave pops and chromatic bar-4 turnaround',
      },
      {
        ko: '보컬 여백을 파고드는 4마디 변주 핑거스타일 P-베이스 카운터 리프',
        suno: 'independent syncopated fingerstyle P-bass counter-melody shifting motif every 4 bars around vocal gaps',
      },
      {
        ko: '일렉 베이스와 아날로그 신스 베이스가 4마디마다 응답하는 훅 리프',
        suno: 'memorable 4-bar melodic muted bass hook layered with rubbery analog synth bass turnaround',
      },
      {
        ko: '루트음을 벗어나 상행·하행 프레이즈를 그리는 4마디 독립 멜로디 베이스',
        suno: 'non-repetitive 4-bar ascending and descending melodic bass riff with crisp ghost plucks',
      },
    ],
    drumOptions: [
      {
        ko: '정형적 백비트를 비튼 선행 킥 배치와 스네어 고스트 노트',
        suno: 'displaced kick pattern anticipating beat 2 and 4-and instead of rigid backbeat, crisp dry snare with ghost taps',
      },
      {
        ko: '드롭아웃과 브로큰 포켓이 살아있는 탄력적 킥-스네어 싱코페이션',
        suno: 'broken-pocket syncopated kick drum shifting off-beat every 2 bars, tight rimshot and bar-end beat dropout',
      },
      {
        ko: '점8분음표 당김음 킥과 뒤로 살짝 당긴 레이드백 스네어 포켓',
        suno: 'dotted-eighth kick syncopation pushing forward over laid-back pocket snare placement',
      },
      {
        ko: '전조 직전 1박 브레이크와 바운스 변칙 킥을 결합한 입체적 리듬',
        suno: 'asymmetric bounce kick placement with crisp snare accents and sudden 1-beat pocket pause before hook',
      },
    ],
    hihatOptions: [
      {
        ko: '불규칙한 16분음표 하이햇 강약과 의도적인 쉼표(에어 포켓)',
        suno: 'irregular crisp hi-hat accents with intentional 16th-note air-pocket rests and brief off-beat open hat',
      },
      {
        ko: '3박을 비우는 변칙 스윙 하이햇과 미세한 셰이커 응답',
        suno: 'non-linear swung closed hi-hat leaving deliberate rests on beat 3 answered by dry shaker flicks',
      },
      {
        ko: '스타카토 오픈/클로즈드 하이햇 교차와 짧은 박자 공백 설계',
        suno: 'staccato alternating open-closed hi-hat articulation punctuated by crisp rhythmic silence gaps',
      },
    ],
    interactionOptions: [
      {
        ko: '베이스가 쉴 때 치고 들어오는 뮤트 펑크 기타의 주고받기 대화',
        suno: 'clean muted funk rhythm guitar stabs answering strictly inside rhythmic spaces left by the bass riff',
      },
      {
        ko: '로즈 9화음 코드와 기타 커팅이 베이스 리프와 대위적으로 교차',
        suno: 'call-and-response dialogue between clean chicken-scratch guitar chops, warm Rhodes 9th chords, and bass',
      },
      {
        ko: '클린 일렉 기타 아르페지오와 베이스 훅의 2마디 교대 인터플레이',
        suno: 'interlocking 2-bar call-and-response between staccato clean electric guitar licks and melodic bassline',
      },
    ],
    harmonyOptions: [
      {
        ko: '모달 인터체인지와 add9/11 텐션 보이싱 기반의 신선한 훅 화성',
        suno: 'fresh maj9 and add11 chord voicings with unexpected pre-chorus modal interchange turnaround',
      },
      {
        ko: '정형화된 4코드 반복을 깬 경과화음 및 비대칭 멜로디 리프트',
        suno: 'non-cliche passing chord progressions avoiding standard 4-chord loops, bright stepped melodic hook',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '박자를 살짝 앞서 던지는 경쾌한 대화형 싱코페이션 보컬 프레이징',
        suno: 'conversational slightly ahead-of-beat vocal phrasing with crisp rhythmic breath rests and playful ad-lib tails',
      },
      {
        ko: '절은 담백한 리듬 말투, 후렴은 시원하게 뻗는 다이내믹 보컬 프레이징',
        suno: 'tight syncopated verse vocal cadence opening into airy, lifted wide-interval chorus phrasing',
      },
      {
        ko: '그루브 빈틈에 여운을 남기는 레이드백 팔세토 전환 프레이징',
        suno: 'relaxed behind-the-beat pocket vocal delivery alternating crisp chest voice with silky falsetto pickups',
      },
    ],
    dynamicOptions: [
      {
        ko: '미니멀한 벌스 포켓에서 1박 정적 후 터지는 입체적 코러스 다이내믹',
        suno: 'intimate bass-and-rimshot verse pocket dropping to 1-beat silence before wide layered chorus bloom',
      },
      {
        ko: '브릿지 스트립다운과 마지막 코러스 악기 대화가 고조되는 다층 다이내믹',
        suno: 'stepped arrangement arc with stripped Rhodes bridge and polyrhythmic guitar-bass climax finale',
      },
    ],
  },

  korean_rnb_hiphop: {
    label: 'Korean Aesthetic R&B / Chill Trap Hip-Hop',
    bpmPool: ['78 BPM', '82 BPM', '85 BPM', '88 BPM', '76 BPM', '90 BPM'],
    keyColors: ['F#m9', 'Cm11', 'Amaj9', 'Dm9', 'Ebmaj7#11', 'Bbm9'],
    bassOptions: [
      {
        ko: '4마디마다 음정 글라이드 궤적이 달라지는 독립적 808 멜로디 베이스',
        suno: '4-bar evolving melodic 808 sub-bass hook with distinct octave pitch-glides and counter-melodic phrasing',
      },
      {
        ko: '드럼과 따로 숨 쉬며 후렴 훅을 견인하는 4마디 서정적 808 리프',
        suno: 'independent 4-bar lyrical sub-808 bassline moving melodically against chord roots with muted ghost drops',
      },
      {
        ko: '아날로그 신스 베이스와 글라이드 808이 교차하는 입체적 저음 리프',
        suno: 'alternating warm Moog sub pulse and 4-bar pitch-bent 808 bass turnaround with clean low-end punch',
      },
    ],
    drumOptions: [
      {
        ko: '정박 1·3박을 비켜가는 트랩 킥 변주와 지연된 레이지 림샷',
        suno: 'displaced off-grid trap kick hits skipping downbeats paired with lazy behind-the-beat rimshot snare',
      },
      {
        ko: '하프타임과 더블타임 킥 포켓이 4마디마다 교차하는 탈정형 그루브',
        suno: 'elastic half-time drum pocket with unexpected double-kick anticipations and bar-4 snare dropout',
      },
    ],
    hihatOptions: [
      {
        ko: '미세 스윙이 걸린 불규칙 32분음표 하이햇 롤과 의도적 무음 공백',
        suno: 'irregular swung 32nd hi-hat bursts balanced by wide intentional rhythmic rests and soft foley clicks',
      },
      {
        ko: '강약을 극단적으로 나눈 변칙 하이햇 악센트와 빈 박자 여백',
        suno: 'dynamic high-low hi-hat accent shifts leaving clean silence pockets around vocal intakes',
      },
    ],
    interactionOptions: [
      {
        ko: '트레몰로 로즈 피아노·보컬 찹이 808 베이스 여백과 주고받는 콜앤리스폰스',
        suno: 'call-and-response interplay between tremolo Rhodes chords, pitch-shifted vocal chops, and 808 glides',
      },
      {
        ko: '클린 나일론 기타 아르페지오와 신스 패드가 저음 리프 사이를 메우는 대화',
        suno: 'warm clean guitar plucks and ambient analog synth swells answering in the spaces of the sub-bass motif',
      },
    ],
    harmonyOptions: [
      {
        ko: '마이너 11th와 디미니쉬드 경과화음으로 뻔하지 않은 새벽 도시 화성감',
        suno: 'lush minor 11th voicings and smoky diminished passing chords creating unpredictable nocturnal tension',
      },
      {
        ko: '부유하는 서스펜디드 코드와 반음계적 탑노트 진행',
        suno: 'floating suspended chord extensions with subtle chromatic top-note harmonic motion',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '속삭이는 듯한 숨결 싱잉랩에서 갑작스레 뻗는 팔세토 도약 프레이징',
        suno: 'intimate breathy close-mic singing-rap phrasing suddenly blooming into soaring airy falsetto hooks',
      },
      {
        ko: '문장 끝을 흘리며 박자 뒤로 눕는 레이드백 멜로딕 플로우',
        suno: 'behind-the-beat laid-back conversational melodic rap flow with delicate trail-off ad-libs',
      },
    ],
    dynamicOptions: [
      {
        ko: '무반주 브레스 인트로에서 딥 808 드롭으로 낙차를 키운 극적 다이내믹',
        suno: 'sparse atmospheric verse stripped to Rhodes and breath dropping sharply into heavy lush chorus pocket',
      },
    ],
  },

  jpop_electronic_rnb: {
    label: 'Electronic R&B J-POP / Cinematic Alt-Pop',
    bpmPool: ['90 BPM', '93 BPM', '95 BPM', '92 BPM', '96 BPM', '89 BPM'],
    keyColors: ['Em9', 'Bm11', 'Gmaj9#11', 'C#m9', 'Am9', 'Fmaj9'],
    bassOptions: [
      {
        ko: '유리 같은 신스 키 사이를 4마디마다 다르게 수놓는 독립 서브 베이스 리프',
        suno: '4-bar evolving melodic Moog sub-bass counterpoint weaving asymmetrically beneath glassy synth keys',
      },
      {
        ko: '정박을 피한 싱코페이션 일렉 베이스와 딥 서브가 겹치는 4마디 변주 리프',
        suno: 'independent syncopated synth-bass riff shifting harmonic counterpoint every 4 bars with warm low punch',
      },
    ],
    drumOptions: [
      {
        ko: '미니멀 전자 킥의 변칙 위치 이동과 드라이 림샷 고스트 타격',
        suno: 'minimal electronic kick displaced off predictable downbeats, crisp dry snare with subtle foley clicks',
      },
      {
        ko: '정형적 4/4를 비트는 스윙 일렉트로닉 포켓과 프레이즈 끝 1박 정적',
        suno: 'laid-back swinging electronic drum pocket breaking rigid 4/4 feel with deliberate bar-end pause',
      },
    ],
    hihatOptions: [
      {
        ko: '마이크로 타이밍이 흔들리는 불규칙 하이햇과 여백의 foley SFX',
        suno: 'micro-timed irregular electronic hi-hat ticks interspersed with intentional air rests and subtle room foley',
      },
    ],
    interactionOptions: [
      {
        ko: '클린 기타 프래그먼트와 빈티지 일렉 피아노가 서브 베이스와 대위적으로 응답',
        suno: 'conversational clean electric guitar fragments answering vintage electric piano and bass motif gaps',
      },
    ],
    harmonyOptions: [
      {
        ko: '철학적 여운을 남기는 J-POP 특유의 상행 서브도미넌트 마이너·분수 코드',
        suno: 'sophisticated Japanese alt-pop slash chords, suspended 9th voicings, and bittersweet chromatic modulations',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '저음역의 차분한 낭독조 프레이징에서 후렴구 와이드 톤으로 확장되는 대비',
        suno: 'intimate restrained low-register conversational phrasing expanding cleanly into wide serene chorus sustain',
      },
    ],
    dynamicOptions: [
      {
        ko: '고독한 실내 공간 여백에서 후렴의 넓은 스테레오 입체감으로 열리는 다이내믹',
        suno: 'quiet close-room verse airiness contrasting with wide stereo bass-and-synth chorus expansion',
      },
    ],
  },

  vintage_1940s_50s: {
    label: '1940s–1950s Shellac Vintage Pop / Lounge',
    bpmPool: ['74 BPM', '78 BPM', '82 BPM', '72 BPM', '80 BPM', '86 BPM'],
    keyColors: ['Ebmaj7', 'Ab6', 'Dm7b5–G7alt', 'Bbmaj7', 'C6/9', 'Fmaj7'],
    bassOptions: [
      {
        ko: '4마디마다 경과음 워킹 라인을 달리하는 독립 콘트라베이스 멜로디 리프',
        suno: '4-bar evolving melodic upright double bass walking line with warm chromatic turnarounds every 4th bar',
      },
      {
        ko: '서정적 2박 페달에서 4마디 스윙 카운터 멜로디로 전환되는 업라이트 베이스',
        suno: 'independent woody acoustic upright bass shifting from soft two-feel pulse into singing 4-bar counter-melody',
      },
    ],
    drumOptions: [
      {
        ko: '브러쉬 스네어의 미세한 악센트 이동과 킥 위치 변화를 준 올드 스윙 포켓',
        suno: 'gentle brushed snare swing alternating soft feather-kick accents off beat 1 and 3 with natural human rubato',
      },
    ],
    hihatOptions: [
      {
        ko: '의도적 쉼표를 둔 부드러운 브러쉬 심벌 스윕과 아날로그 공간 호흡',
        suno: 'delicate brushed ride cymbal sweeps with subtle dynamic accents and unhurried breathing rests',
      },
    ],
    interactionOptions: [
      {
        ko: '벨벳 뮤트 트럼펫·클라리넷이 펠트 피아노와 더블 베이스 사이에서 응답하는 대화',
        suno: 'intimate call-and-response between velvet Harmon-muted trumpet, warm clarinet counter-lines, felt piano, and upright bass',
      },
    ],
    harmonyOptions: [
      {
        ko: '1940~50년대 클래식 재즈 발라드 특유의 6/9·디미니쉬드 반음계 진행',
        suno: 'authentic mid-century 6/9 chords, lush altered dominant turnarounds, and bittersweet chromatic voice leading',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '앞박과 뒷박을 자유롭게 넘나드는 아날로그 루바토 크루너 프레이징',
        suno: 'sincere vintage behind-the-beat rubato vocal phrasing with delicate natural vibrato and breathy intimacy',
      },
    ],
    dynamicOptions: [
      {
        ko: '셀락 음반 특유의 좁은 미드레인지 속에서 피어나는 절제된 감정 클라이맥스',
        suno: 'intimate parlor opening swelling warmly into rich brass-and-piano mid-century climax before quiet run-out',
      },
    ],
  },

  west_coast_rap: {
    label: 'West Coast Freestyle Rap / G-Funk Hip-Hop',
    bpmPool: ['92 BPM', '96 BPM', '89 BPM', '94 BPM', '98 BPM', '90 BPM'],
    keyColors: ['Cm7', 'Gm7', 'Fm7', 'Bbm7', 'Dm7', 'Ebm7'],
    bassOptions: [
      {
        ko: '4마디마다 벤딩과 옥타브 바운스가 변하는 독립적 G-Funk 웜 베이스 리프',
        suno: '4-bar evolving rubbery Minimoog G-Funk bass hook with expressive pitch glides and syncopated octave snaps',
      },
      {
        ko: '보컬 플로우와 맞물려 독자적 리듬을 끌고 가는 묵직한 아날로그 펑크 베이스',
        suno: 'independent punchy West Coast analog synth bassline weaving 4-bar rhythmic variations beneath vocal flow',
      },
    ],
    drumOptions: [
      {
        ko: '정형화된 스네어-킥을 깬 엇박 킥 더블탭과 묵직한 웨스트코스트 레이드백 포켓',
        suno: 'hard-hitting West Coast boom-bap/G-funk kick displacement with off-beat double taps and crisp dry clap-snare',
      },
    ],
    hihatOptions: [
      {
        ko: '의도적 쉼과 오프비트 악센트를 섞어 스윙감을 살린 웨스트코스트 하이햇',
        suno: 'swung crisp hi-hats with irregular off-beat accents, intentional micro-rests, and tight shaker pockets',
      },
    ],
    interactionOptions: [
      {
        ko: '하이피치 G-Funk 신스 리드·로즈 코드가 묵직한 베이스 리프 빈틈에서 주고받는 대화',
        suno: 'signature high West Coast sine-synth whistle lead and wah-guitar stabs answering 2-bar synth bass gaps',
      },
    ],
    harmonyOptions: [
      {
        ko: '도리안 마이너 펑크 코드와 블루스적 펜타토닉 턴어라운드',
        suno: 'sleek Dorian minor funk chord stabs and soulful West Coast Rhodes turnaround voicings',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '레이백 쉼표를 활용해 비트를 타는 여유롭고 날카로운 프리스타일 케이던스',
        suno: 'effortless behind-the-beat rhythmic rap cadence using sharp multi-syllable pauses and confident breath control',
      },
    ],
    dynamicOptions: [
      {
        ko: '드럼 드롭아웃 아카펠라 펀치라인 후 전 악기가 꽂히는 강렬한 다이내믹 대비',
        suno: 'tight beat-drop acapella bar turns slamming back into full low-end G-funk groove impact',
      },
    ],
  },

  // NOTE: SOP-safe Cinematic OST Ballad (no strings/timpani/brass if forbidden; supports both bass-equipped lanes and stripped bassless/drumless lanes!)
  cinematic_ost: {
    label: 'Cinematic Movie OST Ballad',
    bpmPool: ['68 BPM', '72 BPM', '74 BPM', '66 BPM', '76 BPM', '70 BPM'],
    keyColors: ['Dm9', 'Cm9', 'Am(add9)', 'Gm9', 'Bbmaj7', 'Em9'],
    bassOptions: [
      {
        ko: '절제된 딥 서브 베이스/업라이트 베이스가 4마디마다 전위와 선율을 바꾸는 독립 저음 리프',
        suno: '4-bar evolving warm upright bass or deep sub-bass counter-melody shifting inversions organically beneath sparse chords',
      },
      {
        ko: '베이스 악기 없이 펠트 피아노 왼손·어쿠스틱 저음현 공명으로 저역을 채우는 독립 반주',
        suno: 'bassless warm felt-piano left-hand open-fifth resonance and 4-bar evolving lower-register counter-voice',
      },
    ],
    drumOptions: [
      {
        ko: '후렴에서만 부드럽게 합류하는 브러쉬/미니멀 펄스의 변칙 위치와 프레이즈 호흡',
        suno: 'restrained brushed kit or soft programmed pulse entering late in chorus with behind-the-beat rhythmic phrasing',
      },
      {
        ko: '드럼 비트를 비운 루바토 호흡과 반주 아르페지오의 강약 악센트 이동',
        suno: 'drumless intimate rubato phrasing led by expressive acoustic guitar or felt-piano rhythmic weight shifts',
      },
    ],
    hihatOptions: [
      {
        ko: '최종 후렴 직전 1박 정적(Silence Drop)과 여백의 호흡 설계',
        suno: 'intentional 1-beat near-silence contrast pause before final chorus and spacious vocal-breath rests',
      },
    ],
    interactionOptions: [
      {
        ko: '피아노/클린 기타와 보컬 적층 화음이 2마디 여백에서 주고받는 영화적 문답',
        suno: 'intimate call-and-response dialogue between felt piano or fingerpicked guitar fills and stacked vocal harmonies inside breath gaps',
      },
    ],
    harmonyOptions: [
      {
        ko: '영화음악 특유의 서스펜디드 add9·반음계 위장종지(Deceptive Cadence) 및 클라이맥스 키 리프트',
        suno: 'evocative film-ballad harmonic twists using add9 suspensions, deceptive cadences, and poignant final-chorus key lift',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '속삭이는 근접 독백에서 균열(Crack)·헤드보이스·폭발적 서스테인으로 열리는 서사 프레이징',
        suno: 'close-mic breathy hush in verses building through vulnerable voice crack to soaring open-vowel sustained climax notes',
      },
    ],
    dynamicOptions: [
      {
        ko: '단독 피아노/기타 정적(1절) → 1박 무음 대비(브릿지 끝) → 풀 보컬 레이어 절정 다이내믹',
        suno: 'dramatic dynamic arc from exposed bare-instrument verse through 1-beat contrast drop into stacked vocal finale',
      },
    ],
  },

  // Dedicated Ballad Archetype (Piano / Acoustic / Classic Korean/English Ballads — naturally supports NO BASS & NO DRUMS!)
  ballad_intimate: {
    label: 'Intimate Ballad / Piano & Acoustic Vocal-Led',
    bpmPool: ['66 BPM', '70 BPM', '72 BPM', '64 BPM', '74 BPM', '68 BPM'],
    keyColors: ['Abmaj7', 'Fmaj9', 'Ebmaj7', 'C#m9', 'Bbmaj9', 'Dmaj9'],
    bassOptions: [
      {
        ko: '베이스 악기 없이 피아노 왼손 옥타브·대선율 모티프가 4마디마다 변주되는 저역 설계',
        suno: '4-bar evolving piano left-hand counter-melody and rich low-register open-fifth voicing without dedicated bass guitar',
      },
      {
        ko: '어쿠스틱/나일론 기타 엄지 저음현이 4마디마다 선율을 바꾸며 보컬과 대위적으로 호흡',
        suno: 'independent 4-bar fingerpicked nylon/steel thumb-bass arpeggio moving counter-melodically beneath vocal line',
      },
    ],
    drumOptions: [
      {
        ko: '드럼 없는 자연 루바토 템포 밀당과 반주 코드 타건의 강약 변주',
        suno: 'drumless expressive rubato timing gently pulling ahead and behind vocal phrases with nuanced accompaniment weight',
      },
      {
        ko: '타악 없이 아르페지오 밀도와 서스테인 페달 울림으로 만드는 감성 리듬 포켓',
        suno: 'organic percussion-free ballad flow shaped by asymmetric 4-bar arpeggio density and warm pedal bloom',
      },
    ],
    hihatOptions: [
      {
        ko: '절과 후렴 경계·감정 절정 직전에 놓인 의도적 1박 침묵과 숨결 여백',
        suno: 'deliberate 1-beat vocal breath rests and hushed pre-chorus silence pauses replacing steady percussive ticks',
      },
    ],
    interactionOptions: [
      {
        ko: '보컬 프레이즈가 쉬는 마디 끝을 채우는 피아노/기타의 섬세한 콜앤리스폰스 필인',
        suno: 'delicate call-and-response where solo piano motifs or acoustic guitar chimes answer strictly inside vocal pauses',
      },
    ],
    harmonyOptions: [
      {
        ko: '전통적 4코드 루프를 피한 add9·분수 코드 전위와 예상치 못한 서브도미넌트 마이너 전환',
        suno: 'expressive slash-chord lower-register voice leading, add9 voicings, and bittersweet minor-iv harmonic turns',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '가까이 속삭이는 인티메이트 오프닝에서 후렴의 짙은 흉성·가성 전환까지 입체적 프레이징',
        suno: 'intimate close-mic behind-the-beat conversational verses rising into emotionally trembling chest-to-falsetto chorus phrasing',
      },
    ],
    dynamicOptions: [
      {
        ko: '숨소리만 들리는 극미니멀 1절에서 클라이맥스 1박 정적 후 터지는 감정 폭발 아크',
        suno: 'wide emotional dynamic arc from whisper-quiet exposed verse to 1-beat stripped pause before full vocal release',
      },
    ],
  },

  acoustic_indie: {
    label: 'Acoustic Indie Pop / Warm Cafe Folk',
    bpmPool: ['94 BPM', '98 BPM', '90 BPM', '100 BPM', '88 BPM', '96 BPM'],
    keyColors: ['Gmaj7', 'Dmaj9', 'Amaj7', 'Cmaj9', 'Fmaj7', 'Em9'],
    bassOptions: [
      {
        ko: '어쿠스틱 기타 저음현과 별개로 4마디마다 멜로디를 그리는 따뜻한 우드 베이스 리프',
        suno: '4-bar evolving warm melodic acoustic upright/P-bass line moving independently of guitar root strums',
      },
      {
        ko: '베이스 없이 핑거스타일 어쿠스틱 기타의 얼터네이팅 저음현 모티프로 리듬과 저역 동시 견인',
        suno: 'bassless warm fingerpicked acoustic guitar alternating thumb-bass counter-motif shifting every 4 bars',
      },
    ],
    drumOptions: [
      {
        ko: '정박 스네어 대신 우드 림클릭·브러쉬 킥 위치 변주로 살린 아기자기한 포켓',
        suno: 'organic brushed kit with displaced soft kick syncopations and warm wood rim-clicks off standard backbeat',
      },
    ],
    hihatOptions: [
      {
        ko: '불규칙 셰이커 강약과 의도적인 8분음표 쉼표로 숨 쉬는 어쿠스틱 그루브',
        suno: 'playful irregular shaker and soft hi-hat accents with breezy eighth-note breathing rests',
      },
    ],
    interactionOptions: [
      {
        ko: '핑거피킹 어쿠스틱 기타와 웜 우를리처/벨 키보드가 여백을 주고받으며 채우는 대화',
        suno: 'conversational interplay between fingerpicked nylon/steel acoustic guitar, warm Wurlitzer fills, and harmonic spaces',
      },
    ],
    harmonyOptions: [
      {
        ko: '개방현 텐션과 재즈풍 7th/9th 보이싱이 섞인 산뜻한 인디 화성',
        suno: 'open-string resonant add9 and warm maj7 indie chord inversions with sunlit harmonic turns',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '미소 짓듯 가볍고 자연스럽게 엇박을 타는 내추럴 보컬 프레이징',
        suno: 'warm intimate storytelling vocal phrasing with natural off-beat conversational inflection',
      },
    ],
    dynamicOptions: [
      {
        ko: '친밀한 어쿠스틱 도입에서 하모니가 겹쳐지는 다채로운 후렴 다이내믹',
        suno: 'cozy close-mic verse opening gracefully into warm multi-layered harmony chorus lift',
      },
    ],
  },

  general_custom: {
    label: 'Custom SOP Theme',
    bpmPool: ['96 BPM', '102 BPM', '88 BPM', '108 BPM', '92 BPM', '100 BPM'],
    keyColors: ['Fmaj9', 'Dm9', 'Amaj9', 'Cm9', 'Ebmaj9', 'Gm9'],
    bassOptions: [
      {
        ko: '4마디 단위로 선율과 리듬이 변주되는 기억에 남는 독립 베이스 리프',
        suno: '4-bar evolving independent melodic bass hook with distinct bar-4 turnaround rather than static root notes',
      },
      {
        ko: '보컬과 메인 악기 사이를 유영하는 대위적 4마디 베이스 모티프',
        suno: 'independent contrapuntal melodic bassline shifting rhythmic motif every 4 bars',
      },
    ],
    drumOptions: [
      {
        ko: '정형화된 1·3박 백비트를 비튼 싱코페이션 킥 위치 변주와 고스트 스네어',
        suno: 'displaced syncopated kick placements breaking straight backbeat feel, crisp snare ghost notes',
      },
    ],
    hihatOptions: [
      {
        ko: '불규칙한 하이햇 악센트와 의도적인 박자 쉼표를 결합한 입체적 퍼커션',
        suno: 'irregular hi-hat accents and intentional rhythmic rests creating breathable pocket tension',
      },
    ],
    interactionOptions: [
      {
        ko: '주 악기/건반/기타가 저역과 다른 박자 위치에서 주고받는 콜앤리스폰스 상호작용',
        suno: 'distinct call-and-response interaction where keys/guitar answer inside rhythmic gaps left by the vocal and low register',
      },
    ],
    harmonyOptions: [
      {
        ko: '세련된 9화음 텐션과 비정형 코드 턴어라운드로 뻔한 진행 탈피',
        suno: 'non-repetitive rich 9th chord extensions and unexpected pre-chorus harmonic lift',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '프레이즈마다 호흡과 박자 감각을 달리하는 생동감 있는 보컬 프레이징',
        suno: 'dynamic conversational vocal phrasing balancing tight syncopation with expressive sustained notes',
      },
    ],
    dynamicOptions: [
      {
        ko: '섹션별 악기 밀도 대비와 브레이크가 살아있는 안정적이고 극적인 다이내믹',
        suno: 'clear dynamic contrast between sparse rhythmic verse pockets and full-spectrum textured chorus climax',
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
  if (c.forbidsBass && /\b(sub-?bass|808|bassline|bass\s*riff|bass\s*hook|upright\s*bass|p-bass|synth\s*bass|moog\s*sub)\b/.test(l)) return false;
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

  // Extract explicit BPM range from SOP if provided so we strictly stay inside SOP BPM!
  const sopText = `${theme.sop || ''}`;
  const bpmRangeMatch = sopText.match(/(\d{2,3})\s*(?:~|-|to)\s*(\d{2,3})\s*bpm/i);
  const singleBpmMatch = sopText.match(/(\d{2,3})\s*bpm/i);

  const plans: InnovationPlan[] = [];
  for (let i = 0; i < trackCount; i++) {
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
      hasBass = !constraints.forbidsBass && false;
      hasDrums = false;
      hasHihat = false;
    } else if (archetype === 'ballad_intimate') {
      // Ballad playlist: rotate naturally between pure stripped piano/guitar (no bass/drums), drumless upright/felt warmth, and late-bloom rhythm ballads
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
      // Respect THEME_014023 8-lane diversity: some lanes (Lane 3 Raw Folk-Acoustic / Lane 8 Storybook Piano) omit bass/drums, others include restrained sub-bass/brushed pulse!
      const pattern = (baseSeed + i) % 3;
      if (pattern === 0) {
        hasBass = false;
        hasDrums = false;
        hasHihat = false;
      } else if (pattern === 1) {
        hasBass = !constraints.forbidsBass;
        hasDrums = !constraints.forbidsDrums;
        hasHihat = false; // ballads don't force hi-hat ticks unless needed
      }
    } else if (archetype === 'acoustic_indie' && i % 2 === 1 && !/upright bass|drum/i.test(`${theme.name || ''}`)) {
      // Mix unplugged bassless fingerstyle tracks into acoustic indie sets
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

    // Filter pools by SOP constraints to NEVER emit forbidden instruments (e.g. cello/strings/timpani in OST Ballad)
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
              ko: '피아노/어쿠스틱 기타 선율 필인이 보컬 여백 사이에서 주고받는 섬세한 문답',
              suno: 'delicate piano or clean acoustic guitar melodic fills answering strictly inside vocal breath spaces',
            },
          ];

    const bass = bassPoolToUse[(baseSeed + i * 1) % bassPoolToUse.length];
    const drum = drumPoolToUse[(baseSeed + i * 2 + 1) % drumPoolToUse.length];
    const hihat = hihatPoolToUse[(baseSeed + i * 3 + 2) % hihatPoolToUse.length];
    const interaction = interactionPoolToUse[(baseSeed + i * 1 + 2) % interactionPoolToUse.length];
    const harmony = pool.harmonyOptions[(baseSeed + i * 2) % pool.harmonyOptions.length];
    const vocalPhrasing =
      vocal === 'none'
        ? {
            ko: '보컬 없는 인스트루멘털 리드 멜로디의 프레이징 호흡 및 선율 변주',
            suno: 'expressive instrumental lead phrasing with conversational call-and-response motifs (no vocals)',
          }
        : pool.vocalPhrasingOptions[(baseSeed + i * 3 + 1) % pool.vocalPhrasingOptions.length];
    const dynamic = pool.dynamicOptions[(baseSeed + i) % pool.dynamicOptions.length];
    const keyColor = pool.keyColors[(baseSeed + i * 2) % pool.keyColors.length];

    plans.push({
      trackNumber: i + 1,
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
      verseGuideHint: `${bass.suno.split(',')[0]}, ${drum.suno.split(',')[0]}`,
      chorusGuideHint: `${interaction.suno.split(',')[0]}, ${dynamic.suno.split(',')[0]}`,
      bridgeGuideHint: `stripped arrangement, ${harmony.suno.split(',')[0]}`,
    });
  }

  return plans;
}

export function formatInnovationPromptSection(plans: InnovationPlan[]): string {
  if (plans.length === 0) return '';
  const blocks = plans.map((p) => {
    const bassTitle = p.hasBass
      ? 'Independent Bass Riff'
      : 'Low-Register Left-Hand / Accompaniment Counter-Motif (NO dedicated bass instrument)';
    const drumTitle = p.hasDrums
      ? 'Displaced Drum Groove'
      : 'Organic Rubato / Chordal Pulse (NO drums)';
    const hihatTitle = p.hasHihat
      ? 'Hi-Hat / Percussion Rests'
      : 'Intentional Silence & Breath Air-Pockets (NO hi-hat)';

    return `Track ${p.trackNumber} Unique Musical DNA [${p.arrangementLabel}] (${p.bpmSuggestion}, Harmonic Color: ${p.keyColor}):
  - ${bassTitle}: ${p.bassSuno}
  - ${drumTitle}: ${p.drumSuno}
  - ${hihatTitle}: ${p.hihatSuno}
  - Accompaniment Call-and-Response: ${p.interactionSuno}
  - Harmonic / Melodic Freshness: ${p.harmonySuno}
  - Vocal / Lead Phrasing: ${p.vocalPhrasingSuno}
  - Dynamic Arc Contrast: ${p.dynamicSuno}`;
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
    exclusionReminders.push('STRICT SOP RESPECT: This theme omits drums — NEVER add drum kits, kick, snare, or hi-hats; achieve rhythmic freshness through rubato phrasing, accompaniment motif evolution, and intentional silence rests.');
  }

  return `
================================================================================
ANTI-HOMOGENIZATION MUSICAL INNOVATION MATRIX (테마 맞춤 탈정형 사운드 설계)
================================================================================
To prevent Suno AI from generating repetitive, generic melodies, predictable harmonies, or flat rhythms across dozens of songs, EVERY track MUST embed its assigned Unique Musical DNA below into BOTH its 750–950 char "stylePrompt" AND its [Section: Guide] cues inside "fullLyrics" (strictly respecting "${plans[0].archetypeLabel}" instrumentation and NEVER forcing instruments omitted by the genre/ballad lane or SOP):
${exclusionReminders.length > 0 ? '\n' + exclusionReminders.map((r) => `- ${r}`).join('\n') + '\n' : ''}
${blocks.join('\n\n')}

PRE-OUTPUT 7-AXIS THEME-AWARE SELF-CRITIQUE REQUIREMENT:
Before finalizing JSON, audit EVERY track against its genre-appropriate 7 criteria (adapting naturally when a ballad/minimal track intentionally has NO bass or NO drums):
1. Overall Groove / Flow: Cohesive, non-mechanical pocket or organic rubato breathing flow
2. Low-End / Register Presence: Clear low-end bass presence OR rich piano left-hand / acoustic thumb-bass low-register resonance (never muddy)
3. Independent Motif: 4-bar evolving melodic bass riff (if bass exists) OR 4-bar evolving left-hand/arpeggio counter-motif (if bassless ballad — NEVER static block chords)
4. Syncopation & Intentional Silence: Displaced kicks & irregular hi-hat rests (if drums exist) OR rubato timing pulls, syncopated phrasing & 1-beat silence drops (if drumless ballad)
5. Call & Response Interplay: Keys/guitar/vocals answering inside the spaces of the primary pulse/bass/vocal phrase
6. Vocal Phrasing: Distinct conversational/emotional timing, register shifts, and breath nuance
7. Dynamic Arc: Clear contrast between sparse stripped sections, silence drop, and expanded climax`;
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

  const mentionsBass = /\b(bass|sub-?bass|808|contrabass|moog\s*sub|p-bass|upright\s*bass|bassline|fretless)\b/i.test(bodyWithoutExclude);
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
    ? /(groove|pocket|swing|bounce|rhythm|laid-?back|tight|organic|driving|pulse)/i.test(combined)
    : /(rubato|flow|breathing|organic|lyricism|phrase|sway|unhurried|pulse|swell|intimate)/i.test(combined);

  const hasBassPresence = usesBass
    ? /(bass|sub-?bass|808|low-?end|moog|p-bass|upright bass|fretless)/i.test(styleBody)
    : /(left-?hand|low-?register|lower-?register|lower-?string|open-?fifth|octave|felt piano|felt-piano|acoustic piano|nylon|fingerpick|thumb|warm low|pedal|resonance|voicing)/i.test(styleBody);

  const hasIndependentMotif = usesBass
    ? /(4-bar|evolving|independent|melodic bass|counter-?melod|octave pop|turnaround|walking line|pitch-?glide|contrapuntal|bass riff|bass hook)/i.test(styleBody)
    : /(4-bar|evolving|independent|counter-?melod|counter-?line|arpeggio|voicing|passing-?tone|fingerpick|turnaround|slash-?chord|motif)/i.test(styleBody);

  const hasSyncopationOrSpace = usesDrums
    ? /(displaced|syncopat|off-?beat|anticipating|broken-?pocket|irregular|intentional.*rest|air-?pocket|ghost|backbeat|double-?tap|rubato|asymmetric)/i.test(styleBody)
    : /(rubato|behind-the-beat|ahead-of-beat|silence|pause|breath|rest|syncopat|asymmetric|fermata|air-?pocket|1-beat|stripped|drop)/i.test(combined);

  const hasInteraction = /(call-and-response|interlock|answer|dialogue|interplay|counter-?line|trading|rhythmic gaps|spaces left by|fill|vocal pauses|breath gaps)/i.test(combined);
  const hasVocalPhrasing = /(phrasing|cadence|behind-the-beat|ahead-of-beat|syncopated.*vocal|conversational|falsetto|chest voice|breath|whisper|ad-lib|lead phrasing|crack|vibrato|sustain|belt|hush)/i.test(combined);
  const hasDynamic = /(dynamic|crescendo|climax|stripped|dropout|pause|silence|contrast|bloom|swell|wide.*chorus|intimate.*verse|bridge|escalation|release)/i.test(combined);

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
      result: hasGrooveOrFlow && maxOverlap < 0.78 ? '우수' : hasGrooveOrFlow ? '양호' : '보통',
      judgment: hasGrooveOrFlow
        ? usesDrums
          ? '장르 정체성에 맞춘 자연스럽고 탄력 있는 포켓 형성'
          : '드럼 없이도 곡의 호흡과 서정적 템포 흐름이 매끄럽게 유지됨'
        : usesDrums
        ? '리듬 포켓 및 그루브 결속 키워드 보강 필요'
        : '루바토 호흡 및 자연스러운 프레이즈 흐름 디렉션 보강 필요',
    },
    {
      item: usesBass ? '베이스 존재감' : '저음역 공명 (베이스리스)',
      result: hasBassPresence ? '우수' : '미흡',
      judgment: hasBassPresence
        ? usesBass
          ? '저음역 질감과 베이스 악기 정체성이 선명하게 정의됨'
          : '별도 베이스 악기 없이 피아노 왼손/기타 저음현 공명으로 저역 균형 확보'
        : usesBass
        ? '저음 악기 및 베이스 톤 디렉션 부족'
        : '베이스 없는 편성에서 피아노 왼손/기타 저역 보이싱 명세 보강 필요',
    },
    {
      item: usesBass ? '독립적인 베이스 리프' : '왼손·반주 독립 모티프',
      result: hasIndependentMotif ? '우수' : '미흡',
      judgment: hasIndependentMotif
        ? usesBass
          ? '4마디 단위 변주와 대위적 멜로디 베이스 훅 반영 완료'
          : '단순 코드 연타가 아닌 4마디 변주 왼손/아르페지오 독립 선율 설계 완료'
        : usesBass
        ? '단순 루트음 위주 우려 — 기억에 남는 4마디 독립 리프 강화 필요'
        : '뻔한 정박 코드 반주 우려 — 4마디마다 변주되는 왼손 대선율/아르페지오 필요',
    },
    {
      item: usesDrums ? '싱코페이션' : '프레이징 여백·밀당',
      result: hasSyncopationOrSpace ? '우수' : '보통',
      judgment: hasSyncopationOrSpace
        ? usesDrums
          ? '킥 위치 이동 및 불규칙 하이햇·의도적 쉼표로 정형 백비트 탈피'
          : '루바토 박자 밀당과 의도적 1박 침묵·숨결 여백으로 기계적 정박 탈피'
        : usesDrums
        ? '리듬적 변화는 있으나 강한 엇박 대비·쉼표 설계 부족'
        : '드럼 없는 곡의 생명인 프레이즈 밀당과 1박 무음 여백 설계 보강 필요',
    },
    {
      item: usesBass ? '악기 간 상호작용' : '반주-보컬 문답',
      result: hasInteraction ? '우수' : '보통',
      judgment: hasInteraction
        ? usesBass
          ? '기타·건반이 베이스 여백에서 콜앤리스폰스로 대화함'
          : '피아노/기타 필인이 보컬 호흡 여백 사이에서 섬세하게 응답함'
        : usesBass
        ? '베이스와 화성 악기 간 박자 분리 및 응답 설계 뚜렷하지 않음'
        : '보컬 휴지기에 파고드는 반주 필인/콜앤리스폰스 설계 보강 필요',
    },
    {
      item: '보컬 프레이징',
      result: hasVocalPhrasing ? '우수' : '양호',
      judgment: hasVocalPhrasing
        ? '박자 밀당과 호흡·음색 전환이 살아있는 입체적 프레이징'
        : '보컬 리듬감 및 표현력 디테일 보강 가능',
    },
    {
      item: '전체 다이내믹',
      result: hasDynamic ? '우수' : '양호',
      judgment: hasDynamic
        ? '절-브릿지 정적 대비-후렴 확장의 명암이 안정적으로 설계됨'
        : '섹션 간 밀도 대비 및 브레이크 포인트 추가 권장',
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
      drum: usesDrums ? '드럼' : '리듬 호흡/밀당',
      hihat: usesHihat ? '하이햇' : '여백·쉼표 설계',
      interaction: usesBass ? '악기 대화' : '반주-보컬 문답',
      vocalPhrasing: '보컬 프레이징',
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

function fitStylePromptLength(baseBody: string, excludeClause: string, minLen = 760, maxLen = 945): string {
  const cleanBody = baseBody
    .replace(/\s+/g, ' ')
    .replace(/,\s*,+/g, ',')
    .replace(/\s+,/g, ',')
    .replace(/^,\s*|,\s*$/g, '')
    .trim();

  const cleanExclude = excludeClause.trim();
  const joinWithExclude = (b: string) =>
    cleanExclude ? `${b.replace(/[,\s]+$/, '')}, ${cleanExclude}` : b.replace(/[,\s]+$/, '');

  let result = joinWithExclude(cleanBody);

  const enrichmentPool = [
    'analog console headroom',
    'clear melodic separation',
    'tactile transient clarity',
    'balanced mid-range warmth',
    'natural studio room depth',
    'polished playlist mastering',
  ];
  let idx = 0;
  let workingBody = cleanBody;
  while (result.length < minLen && idx < enrichmentPool.length) {
    if (!workingBody.toLowerCase().includes(enrichmentPool[idx])) {
      workingBody = `${workingBody}, ${enrichmentPool[idx]}`;
      result = joinWithExclude(workingBody);
    }
    idx++;
  }

  if (result.length > maxLen) {
    const parts = workingBody.split(',').map((s) => s.trim()).filter(Boolean);
    const keepCritical = (segment: string) =>
      /(4-bar|evolving|independent|displaced|syncopat|irregular|rest|silence|rubato|call-and-response|interlock|vocal|bpm|phrasing|maj9|add11|add9|dorian|dynamic|contrast|shellac|phonograph|g-funk|808|rhodes|guitar|piano|bassless|drumless)/i.test(
        segment
      );

    while (joinWithExclude(parts.join(', ')).length > maxLen && parts.length > 6) {
      const expendableIdx = parts.findIndex((seg, pIdx) => pIdx > 1 && !keepCritical(seg));
      if (expendableIdx !== -1) {
        parts.splice(expendableIdx, 1);
      } else {
        parts.splice(2, 1);
      }
    }
    result = joinWithExclude(parts.join(', '));
    if (result.length > maxLen && !cleanExclude) {
      result = result.slice(0, maxLen).replace(/,\s*[^,]*$/, '').trim();
    }
  }

  return result;
}

export function refineTrackWithCraftAudit(
  track: TrackItem,
  plan: InnovationPlan,
  siblingPrompts: string[] = []
): TrackItem {
  const initialAudit = evaluateTrackMusicalCraft(track, plan, siblingPrompts);
  const needsRefinement = initialAudit.criteria.some((c) => c.result === '미흡' || c.result === '보통');

  if (!needsRefinement) {
    return {
      ...track,
      craftAudit: initialAudit,
    };
  }

  const { usesBass, usesDrums, usesHihat } = resolveEffectiveTrackInstrumentation(track, plan);

  let rawStyle = (track.stylePrompt || '').trim();
  let excludeClause = '';
  const excludeMatch = rawStyle.match(/(Exclude\s*:.*)$/i) || rawStyle.match(/((?:,\s*-[a-z0-9][a-z0-9\s-]*)+)$/i);
  if (excludeMatch && excludeMatch.index !== undefined) {
    excludeClause = excludeMatch[1].replace(/^,\s*/, '').trim();
    rawStyle = rawStyle.slice(0, excludeMatch.index).replace(/[,\s]+$/, '').trim();
  }

  const additions: string[] = [];
  const lower = rawStyle.toLowerCase();

  // Strictly match instrumentation reality: NEVER inject bass/drums/hihat into a bassless/drumless ballad or SOP-forbidden track!
  const effectiveBassDirective = usesBass
    ? plan.bassSuno
    : BASSLESS_LEFT_HAND_POOL[plan.trackNumber % BASSLESS_LEFT_HAND_POOL.length].suno;
  const effectiveDrumDirective = usesDrums
    ? plan.drumSuno
    : DRUMLESS_PULSE_POOL[plan.trackNumber % DRUMLESS_PULSE_POOL.length].suno;
  const effectiveHihatDirective = usesHihat
    ? plan.hihatSuno
    : HIHATLESS_SPACE_POOL[plan.trackNumber % HIHATLESS_SPACE_POOL.length].suno;

  if (
    usesBass
      ? !/(4-bar|evolving|independent|melodic bass|counter-?melod|octave pop|turnaround|walking line|pitch-?glide|contrapuntal)/i.test(lower)
      : !/(4-bar|evolving|independent|counter-?melod|arpeggio|left-?hand|thumb-?bass|open-?fifth)/i.test(lower)
  ) {
    if (isTagCompatibleWithConstraints(effectiveBassDirective, plan.constraints)) {
      additions.push(effectiveBassDirective);
    }
  }

  if (
    usesDrums
      ? !/(displaced|syncopat|off-?beat|broken-?pocket|irregular|intentional.*rest|ghost)/i.test(lower)
      : !/(rubato|behind-the-beat|silence|pause|1-beat|arpeggio syncopation|breath)/i.test(lower)
  ) {
    if (isTagCompatibleWithConstraints(effectiveDrumDirective, plan.constraints)) {
      additions.push(effectiveDrumDirective);
    }
    if (isTagCompatibleWithConstraints(effectiveHihatDirective, plan.constraints)) {
      additions.push(effectiveHihatDirective);
    }
  } else if (usesHihat && !/(hi-?hat|shaker|ride)/i.test(lower)) {
    if (isTagCompatibleWithConstraints(effectiveHihatDirective, plan.constraints)) {
      additions.push(effectiveHihatDirective);
    }
  }

  if (!/(call-and-response|interlock|answer|dialogue|interplay|spaces left by|vocal pauses|breath gaps)/i.test(lower)) {
    if (isTagCompatibleWithConstraints(plan.interactionSuno, plan.constraints)) {
      additions.push(plan.interactionSuno);
    }
  }
  if (!/(maj9|add11|add9|dorian|modal|passing chord|chromatic|6\/9|minor 11|deceptive|slash-?chord)/i.test(lower)) {
    additions.push(plan.harmonySuno);
  }
  if (!/(phrasing|cadence|behind-the-beat|ahead-of-beat|conversational|breath)/i.test(lower)) {
    additions.push(plan.vocalPhrasingSuno);
  }
  if (!/(dynamic|contrast|bloom|dropout|stripped|climax|1-beat)/i.test(lower)) {
    additions.push(plan.dynamicSuno);
  }
  if (!/\bbpm\b/i.test(lower)) {
    additions.push(plan.bpmSuggestion);
  }

  const enhancedBody = additions.length > 0
    ? `${rawStyle ? rawStyle + ', ' : ''}${additions.join(', ')}`
    : rawStyle;

  const finalStylePrompt = fitStylePromptLength(enhancedBody, excludeClause, 760, 945);

  let enhancedLyrics = track.fullLyrics || '';
  if (enhancedLyrics && !/(call-and-response|4-bar|displaced|syncopat|counter|rubato|pause)/i.test(enhancedLyrics)) {
    const safeVerseHint = `${effectiveBassDirective.split(',')[0]}, ${effectiveDrumDirective.split(',')[0]}`;
    enhancedLyrics = enhancedLyrics
      .replace(/^\[Verse 1(?::\s*([^\]]+))?\]$/m, (_, existing) =>
        existing
          ? `[Verse 1: ${existing.trim()}, ${safeVerseHint}]`
          : `[Verse 1: ${safeVerseHint}]`
      )
      .replace(/^\[Chorus(?::\s*([^\]]+))?\]$/m, (_, existing) =>
        existing
          ? `[Chorus: ${existing.trim()}, ${plan.chorusGuideHint}]`
          : `[Chorus: ${plan.chorusGuideHint}]`
      );
  }

  const updatedTrack: TrackItem = {
    ...track,
    stylePrompt: finalStylePrompt,
    fullLyrics: enhancedLyrics,
  };

  const finalAudit = evaluateTrackMusicalCraft(updatedTrack, plan, siblingPrompts);
  return {
    ...updatedTrack,
    craftAudit: {
      ...finalAudit,
      refined: true,
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
        ? `${plan.drumSuno}; ${plan.hihatSuno}`
        : `${DRUMLESS_PULSE_POOL[plan.trackNumber % DRUMLESS_PULSE_POOL.length].suno}; ${HIHATLESS_SPACE_POOL[plan.trackNumber % HIHATLESS_SPACE_POOL.length].suno}`;

      return `Track ${track.trackNumber} ("${track.title}") [${audit.arrangementLabel || plan.arrangementLabel}]:
Current stylePrompt: "${track.stylePrompt}"
7-Axis Audit Gaps:
${weakCriteria}
Theme-Safe Innovation Targets to weave naturally into stylePrompt (strictly 760–940 chars total, honoring ALL Exclude/forbidden rules in "${themeName}" SOP):
  - Low-Register / Counter-Motif: ${bassTarget}
  - Rhythm / Breathing Space: ${drumTarget}
  - Call & Response: ${plan.interactionSuno}
  - Harmony: ${plan.harmonySuno}
  - Vocal Phrasing: ${plan.vocalPhrasingSuno}
  - Dynamic Arc: ${plan.dynamicSuno}`;
    })
    .join('\n\n');

  return `PRE-OUTPUT MUSICAL QUALITY REFINEMENT PASS (테마·편성 맞춤 7항목 자가 검증 및 보완)
The following track(s) risked sounding repetitive or generic on motif independence, rhythmic phrasing/syncopation, or call-and-response interaction:

${details}

CRITICAL: NEVER add bass instruments or drums to stripped/bassless/drumless ballad tracks, and NEVER add instruments forbidden by the theme's SOP (such as orchestral strings/cello/timpani).
Rewrite ONLY the "stylePrompt" (strictly 760–940 English chars, dense comma-separated Suno tags) and optional improved "[Verse 1: ...]" / "[Chorus: ...]" tag headers so ALL 7 theme-specific criteria reach "우수/양호". Keep track titles and sung lyric text unchanged.
Respond ONLY with valid JSON:
{
  "refinedTracks": [
    {
      "trackNumber": 1,
      "stylePrompt": "760-940 char refined Suno stylePrompt",
      "verseGuide": "concise English verse tag guide",
      "chorusGuide": "concise English chorus tag guide"
    }
  ]
}`;
}
