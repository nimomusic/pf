import type { CraftAuditCriterion, Theme, TrackCraftAudit, TrackItem, VocalType } from '../types.ts';

export type MusicArchetype =
  | 'groove_pop'
  | 'korean_rnb_hiphop'
  | 'jpop_electronic_rnb'
  | 'vintage_1940s_50s'
  | 'west_coast_rap'
  | 'cinematic_ost'
  | 'acoustic_indie'
  | 'general_custom';

export interface InnovationPlan {
  trackNumber: number;
  archetype: MusicArchetype;
  archetypeLabel: string;
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
    label: "1940s–1950s Shellac Vintage Pop / Lounge",
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

  cinematic_ost: {
    label: 'Cinematic OST / Emotional Film Ballad',
    bpmPool: ['70 BPM', '74 BPM', '72 BPM', '76 BPM', '68 BPM', '75 BPM'],
    keyColors: ['Dm9', 'Cm9', 'Am(add9)', 'Gm9', 'Bbmaj7', 'Em9'],
    bassOptions: [
      {
        ko: '4마디마다 전위와 선율을 바꾸며 서사를 이끄는 첼로·콘트라베이스 대선율 리프',
        suno: '4-bar evolving contrapuntal cello and bowed contrabass motif shifting harmonic inversions asymmetrically',
      },
    ],
    drumOptions: [
      {
        ko: '정형적 드럼 비트를 배제하고 팀파니·타악 악센트가 박자를 비틀어 긴장을 쌓는 구조',
        suno: 'cinematic percussive swells and deep orchestral floor-tom accents placed off-bar to build dramatic tension',
      },
    ],
    hihatOptions: [
      {
        ko: '심벌 롤과 하프·피아노 스타카토가 쉼표를 두고 호흡하는 여백의 리듬 아티큘레이션',
        suno: 'delicate suspended cymbal swells and sparse rhythmic pulse pauses letting emotional silence breathe',
      },
    ],
    interactionOptions: [
      {
        ko: '펠트 업라이트 피아노와 솔로 첼로·현악 섹션이 2마디씩 문답하는 시네마틱 대화',
        suno: 'intimate call-and-response dialogue between felt upright piano arpeggios, weeping solo cello, and soaring strings',
      },
    ],
    harmonyOptions: [
      {
        ko: '영화음악 특유의 서스펜디드 애드나인 및 반음계 전조 서사 화성',
        suno: 'evocative film-score harmonic twists using add9 suspensions, deceptive cadences, and poignant key lift',
      },
    ],
    vocalPhrasingOptions: [
      {
        ko: '속삭이는 독백에서 오케스트라 절정 벨팅으로 열리는 서사적 보컬 호흡',
        suno: 'delicate narrative whisper phrasing swelling organically into soaring heartfelt emotional belt at climax',
      },
    ],
    dynamicOptions: [
      {
        ko: '단독 피아노 정적에서 풀 오케스트라 카타르시스로 폭발하는 와이드 다이내믹 아크',
        suno: 'wide cinematic dynamic arc rising from bare felt piano silence through tension bridge into sweeping finale',
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
        ko: '핑거피킹 어쿠스틱 기타와 웜 우를리처/벨 키보드가 베이스 빈틈을 채우는 대화',
        suno: 'conversational interplay between fingerpicked nylon/steel acoustic guitar, warm Wurlitzer, and melodic bass',
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
        ko: '베이스와 다른 박자 위치에서 화음/기타/건반이 주고받는 콜앤리스폰스 상호작용',
        suno: 'distinct call-and-response interaction where guitar/keys answer inside rhythmic gaps left by the bass',
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

export function detectMusicArchetype(theme: Partial<Theme>, sopSpecs: {
  isJapanese?: boolean;
  isShellacVintage?: boolean;
  isCinematic?: boolean;
  isKoreanHipHopRnb?: boolean;
  isKorEngMixed?: boolean;
  isEnglishOnly?: boolean;
}): MusicArchetype {
  const combined = `${theme.name || ''} ${theme.category || ''} ${theme.sop || ''}`
    .toLowerCase()
    .replace(/exclude\s*:[^\n\r]*/gi, '')
    .replace(/금지[^\n\r]*/g, '')
    .replace(/제외[^\n\r]*/g, '');

  if (sopSpecs.isShellacVintage || /\b(1940|1950|shellac|phonograph|vintage\s*pop|78\s*rpm)\b/i.test(combined)) {
    return 'vintage_1940s_50s';
  }
  if (sopSpecs.isJapanese || /\b(j-pop|jpop|electronic\s*r&b\s*j-pop)\b/i.test(combined)) {
    return 'jpop_electronic_rnb';
  }
  if (/\b(west\s*coast|freestyle\s*rap|g-funk|westside|lowrider)\b/i.test(combined)) {
    return 'west_coast_rap';
  }
  if (sopSpecs.isCinematic || /\b(ost|cinematic|film\s*soundtrack|movie\s*ballad)\b/i.test(combined)) {
    return 'cinematic_ost';
  }
  if (sopSpecs.isKoreanHipHopRnb || sopSpecs.isKorEngMixed) {
    return 'korean_rnb_hiphop';
  }
  if (/\b(groove|retail\s*groove|chill\s*pop|feel-?good|sunday|cafe\s*pop|disco\s*pop|city\s*groove)\b/i.test(combined) || combined.includes('그루브')) {
    return 'groove_pop';
  }
  if (/\b(acoustic|folk|indie\s*pop|coffee\s*house)\b/i.test(combined) || combined.includes('어쿠스틱')) {
    return 'acoustic_indie';
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

    const bass = pool.bassOptions[(baseSeed + i * 1) % pool.bassOptions.length];
    const drum = pool.drumOptions[(baseSeed + i * 2 + 1) % pool.drumOptions.length];
    const hihat = pool.hihatOptions[(baseSeed + i * 3 + 2) % pool.hihatOptions.length];
    const interaction = pool.interactionOptions[(baseSeed + i * 1 + 2) % pool.interactionOptions.length];
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
  const blocks = plans.map(
    (p) => `Track ${p.trackNumber} Unique Musical DNA (${p.bpmSuggestion}, Harmonic Color: ${p.keyColor}):
  - Independent Bass Riff: ${p.bassSuno}
  - Displaced Drum Groove: ${p.drumSuno}
  - Hi-Hat / Percussion Rests: ${p.hihatSuno}
  - Instrument Call-and-Response: ${p.interactionSuno}
  - Harmonic / Melodic Freshness: ${p.harmonySuno}
  - Vocal / Lead Phrasing: ${p.vocalPhrasingSuno}
  - Dynamic Arc Contrast: ${p.dynamicSuno}`
  );

  return `
================================================================================
ANTI-HOMOGENIZATION MUSICAL INNOVATION MATRIX (탈정형·차별화 사운드 설계 — ALL TRACKS)
================================================================================
To prevent Suno AI from generating repetitive, generic melodies, predictable backbeats, and static root-note basslines across dozens of songs, EVERY track MUST embed its assigned Unique Musical DNA below into BOTH its 750–950 char "stylePrompt" AND its [Section: Guide] cues inside "fullLyrics" (strictly inside "${plans[0].archetypeLabel}" SOP boundaries):

${blocks.join('\n\n')}

PRE-OUTPUT 7-AXIS SELF-CRITIQUE REQUIREMENT:
Before finalizing JSON, mentally audit EVERY track against these 7 criteria:
1. 전체 그루브 (Overall Groove): Cohesive, natural, non-mechanical pocket
2. 베이스 존재감 (Bass Presence): Clear, well-defined low-end presence
3. 독립적인 베이스 리프 (Independent Bass Riff): Explicitly specifies a 4-bar evolving melodic bass riff/counterpoint (NEVER plain root-note bass)
4. 싱코페이션 (Syncopation): Explicitly prescribes displaced kick positions & irregular hi-hat accents/rests breaking standard backbeat
5. 악기 간 상호작용 (Instrument-Bass Call & Response): Explicitly choreographs guitar/keys/strings/synths answering in rhythmic spaces different from bass
6. 보컬 프레이징 (Vocal Phrasing): Prescribes distinct rhythmic vocal phrasing & melodic cadence
7. 전체 다이내믹 (Overall Dynamic Arc): Clear contrast between stripped verses, pre-chorus breath/breaks, and expanded choruses
If ANY track feels generic on items 3, 4, or 5 ("미흡" or "보통"), revise its "stylePrompt" and section guides BEFORE outputting JSON!`;
}

export function evaluateTrackMusicalCraft(
  track: Partial<TrackItem>,
  plan: InnovationPlan,
  siblingPrompts: string[] = []
): TrackCraftAudit {
  const style = (track.stylePrompt || '').toLowerCase();
  const lyrics = (track.fullLyrics || '').toLowerCase();
  const combined = `${style} ${lyrics}`;

  const hasGroove = /(groove|pocket|swing|bounce|rhythm|laid-?back|tight|organic|driving|pulse)/i.test(combined);
  const hasBassPresence = /(bass|sub-?bass|808|low-?end|contrabass|cello|moog|p-bass|upright bass)/i.test(style);
  const hasIndependentBass = /(4-bar|evolving|independent|melodic bass|counter-?melod|octave pop|turnaround|walking line|pitch-?glide|contrapuntal|bass riff|bass hook)/i.test(style);
  const hasSyncopation = /(displaced|syncopat|off-?beat|anticipating|broken-?pocket|irregular|intentional.*rest|air-?pocket|ghost|backbeat|double-?tap|rubato|asymmetric)/i.test(style);
  const hasInteraction = /(call-and-response|interlock|answer|dialogue|interplay|counter-?line|trading|rhythmic gaps|spaces left by)/i.test(combined);
  const hasVocalPhrasing = /(phrasing|cadence|behind-the-beat|ahead-of-beat|syncopated.*vocal|conversational|falsetto|chest voice|breath|whisper|ad-lib|lead phrasing)/i.test(combined);
  const hasDynamic = /(dynamic|crescendo|climax|stripped|dropout|pause|silence|contrast|bloom|swell|wide.*chorus|intimate.*verse|bridge)/i.test(combined);

  // Check similarity against sibling tracks in the same playlist
  const myTokens = new Set(style.split(/[^a-z0-9-]+/).filter((w) => w.length > 3));
  let maxOverlap = 0;
  for (const sib of siblingPrompts) {
    if (!sib || sib === track.stylePrompt) continue;
    const sibTokens = new Set(sib.toLowerCase().split(/[^a-z0-9-]+/).filter((w) => w.length > 3));
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
      item: '전체 그루브',
      result: hasGroove && maxOverlap < 0.78 ? '우수' : hasGroove ? '양호' : '보통',
      judgment: hasGroove
        ? '장르 정체성에 맞춘 자연스럽고 탄력 있는 포켓 형성'
        : '리듬 포켓 및 그루브 결속 키워드 보강 필요',
    },
    {
      item: '베이스 존재감',
      result: hasBassPresence ? '우수' : '미흡',
      judgment: hasBassPresence
        ? '저음역 질감과 악기 정체성이 선명하게 정의됨'
        : '저음 악기 및 베이스 톤 디렉션 부족',
    },
    {
      item: '독립적인 베이스 리프',
      result: hasIndependentBass ? '우수' : hasBassPresence ? '미흡' : '미흡',
      judgment: hasIndependentBass
        ? '4마디 단위 변주와 대위적 멜로디 베이스 훅 반영 완료'
        : '단순 루트음 위주 우려 — 기억에 남는 4마디 독립 리프 강화 필요',
    },
    {
      item: '싱코페이션',
      result: hasSyncopation ? '우수' : '보통',
      judgment: hasSyncopation
        ? '킥 위치 이동 및 불규칙 하이햇·의도적 쉼표로 정형 백비트 탈피'
        : '리듬적 변화는 있으나 강한 엇박 대비·쉼표 설계 부족',
    },
    {
      item: '악기 간 상호작용',
      result: hasInteraction ? '우수' : '보통',
      judgment: hasInteraction
        ? '기타·건반·현악이 베이스 여백에서 콜앤리스폰스로 대화함'
        : '베이스와 화성 악기 간 박자 분리 및 응답 설계 뚜렷하지 않음',
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
        ? '절-프리코러스 브레이크-후렴 확장의 명암 대비가 안정적으로 설계됨'
        : '섹션 간 밀도 대비 및 브레이크 포인트 추가 권장',
    },
  ];

  return {
    archetypeLabel: plan.archetypeLabel,
    refined: false,
    signatureTags: {
      bass: plan.bassKo,
      drum: plan.drumKo,
      hihat: plan.hihatKo,
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

  // If shorter than minLen, enrich gently with crisp mix/mastering precision tags (still keeping SOP hygiene)
  const enrichmentPool = [
    'analog console headroom',
    'clear rhythmic separation',
    'tactile transient clarity',
    'balanced mid-range warmth',
    'wide stereophonic field',
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

  // If longer than maxLen, trim earlier generic filler segments while preserving innovation directives & exclude clause
  if (result.length > maxLen) {
    const parts = workingBody.split(',').map((s) => s.trim()).filter(Boolean);
    const keepCritical = (segment: string) =>
      /(4-bar|evolving|independent|displaced|syncopat|irregular|rest|call-and-response|interlock|vocal|bpm|phrasing|maj9|add11|dorian|dynamic|contrast|shellac|phonograph|g-funk|808|rhodes|guitar|cello)/i.test(segment);

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

  let rawStyle = (track.stylePrompt || '').trim();
  let excludeClause = '';
  const excludeMatch = rawStyle.match(/(Exclude\s*:.*)$/i) || rawStyle.match(/((?:,\s*-[a-z0-9][a-z0-9\s-]*)+)$/i);
  if (excludeMatch && excludeMatch.index !== undefined) {
    excludeClause = excludeMatch[1].replace(/^,\s*/, '').trim();
    rawStyle = rawStyle.slice(0, excludeMatch.index).replace(/[,\s]+$/, '').trim();
  }

  const additions: string[] = [];
  const lower = rawStyle.toLowerCase();

  if (!/(4-bar|evolving|independent|melodic bass|counter-?melod|octave pop|turnaround|walking line|pitch-?glide|contrapuntal)/i.test(lower)) {
    additions.push(plan.bassSuno);
  }
  if (!/(displaced|syncopat|off-?beat|broken-?pocket|irregular|intentional.*rest|ghost)/i.test(lower)) {
    additions.push(plan.drumSuno, plan.hihatSuno);
  }
  if (!/(call-and-response|interlock|answer|dialogue|interplay|spaces left by)/i.test(lower)) {
    additions.push(plan.interactionSuno);
  }
  if (!/(maj9|add11|dorian|modal|passing chord|chromatic|6\/9|minor 11|deceptive|slash chord)/i.test(lower)) {
    additions.push(plan.harmonySuno);
  }
  if (!/(phrasing|cadence|behind-the-beat|ahead-of-beat|conversational)/i.test(lower)) {
    additions.push(plan.vocalPhrasingSuno);
  }
  if (!/(dynamic|contrast|bloom|dropout|stripped|climax)/i.test(lower)) {
    additions.push(plan.dynamicSuno);
  }
  if (!/\bbpm\b/i.test(lower)) {
    additions.push(plan.bpmSuggestion);
  }

  const enhancedBody = additions.length > 0
    ? `${rawStyle ? rawStyle + ', ' : ''}${additions.join(', ')}`
    : rawStyle;

  const finalStylePrompt = fitStylePromptLength(enhancedBody, excludeClause, 760, 945);

  // Lightly enrich [Verse 1] / [Chorus] guides if generic (preserving clean single-bracket hygiene)
  let enhancedLyrics = track.fullLyrics || '';
  if (enhancedLyrics && !/(call-and-response|4-bar|displaced|syncopat|counter)/i.test(enhancedLyrics)) {
    enhancedLyrics = enhancedLyrics
      .replace(/^\[Verse 1(?::\s*([^\]]+))?\]$/m, (_, existing) =>
        existing
          ? `[Verse 1: ${existing.trim()}, ${plan.verseGuideHint}]`
          : `[Verse 1: ${plan.verseGuideHint}]`
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
      const weakCriteria = audit.criteria
        .filter((c) => c.result === '미흡' || c.result === '보통')
        .map((c) => `  * ${c.item} (${c.result}): ${c.judgment}`)
        .join('\n');
      return `Track ${track.trackNumber} ("${track.title}"):
Current stylePrompt: "${track.stylePrompt}"
7-Axis Audit Gaps:
${weakCriteria}
Mandatory Innovation Targets to weave naturally into stylePrompt (strictly 760–940 chars total, preserving Exclude terms & "${themeName}" SOP):
  - Bass: ${plan.bassSuno}
  - Drum: ${plan.drumSuno}
  - Hi-Hat: ${plan.hihatSuno}
  - Call & Response: ${plan.interactionSuno}
  - Harmony: ${plan.harmonySuno}
  - Vocal Phrasing: ${plan.vocalPhrasingSuno}
  - Dynamic Arc: ${plan.dynamicSuno}`;
    })
    .join('\n\n');

  return `PRE-OUTPUT MUSICAL QUALITY REFINEMENT PASS (최종 출력 전 7항목 자가 검증 및 보완)
The following track(s) scored "미흡" or "보통" on independent bass riff, syncopation, or instrument interaction and risked sounding homogenized:

${details}

Rewrite ONLY the "stylePrompt" (strictly 760–940 English chars, dense comma-separated Suno tags) and optional improved "[Verse 1: ...]" / "[Chorus: ...]" tag headers so ALL 7 musical criteria reach "우수/양호". Keep track titles and sung lyric text unchanged.
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
