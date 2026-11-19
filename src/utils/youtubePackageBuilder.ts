import type { Theme, TrackItem, YoutubePackage } from '../types.ts';

export type LyricCulture = 'korean' | 'japanese' | 'western';

export interface SceneProfile {
  key:
    | 'christmas_holiday'
    | 'sunday_cafe'
    | 'rainy_autumn'
    | 'sunny_autumn_cafe'
    | 'romantic_groove'
    | 'night_drive'
    | 'tokyo_rain'
    | 'vintage_1940s_50s'
    | 'west_coast_rap'
    | 'cinematic_ost';
  culture: LyricCulture;
  eraLabel: string;
  seasonEn: string;
  seasonKo: string;
  locationEn: string;
  locationKo: string;
  genreLabelEn: string;
  genreLabelKo: string;
  moodLabelEn: string;
  moodLabelKo: string;
}

export interface LyricMoodDetails {
  emotionKey: 'heartbreak_melancholy' | 'warm_romantic' | 'confident_groove' | 'nostalgic_reflective';
  emotionDescriptorEn: string;
  expressionEn: string;
  lightingMoodEn: string;
  weatherCues: {
    rainy: boolean;
    snowy: boolean;
    midnight: boolean;
    sunset: boolean;
    morning: boolean;
  };
  eraLabel: string;
  motifPhraseEn: string;
}

export function detectLyricCulture(
  theme: Partial<Theme>,
  tracks: Array<Partial<TrackItem>> = [],
  lyricConcept: string = ''
): LyricCulture {
  const trackBody = tracks
    .map((t) => `${t.title || ''} ${t.fullLyrics || ''}`)
    .join(' ');

  const trackKanaCount = (trackBody.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
  const trackHangulCount = (trackBody.match(/[\uAC00-\uD7AF]/g) || []).length;
  const trackLatinCount = (trackBody.match(/[a-zA-Z]/g) || []).length;

  // 1. Inspect actual generated track titles & lyrics first (ground truth!)
  if (trackKanaCount >= 8) {
    return 'japanese';
  }
  if (trackHangulCount >= 8) {
    return 'korean';
  }
  if (tracks.length > 0 && trackLatinCount >= 20 && trackHangulCount === 0 && trackKanaCount === 0) {
    return 'western';
  }

  // 2. Fallback to theme/SOP language rules (stripping excludes and boilerplate examples)
  const titleAndCat = `${theme.name || ''} ${theme.category || ''}`.toLowerCase();
  const rawSop = `${theme.sop || ''}`;
  const sopWithoutExcludes = rawSop
    .toLowerCase()
    .replace(/exclude\s*:[^\n\r]*/gi, '')
    .replace(/금지[^\n\r]*/g, '')
    .replace(/제외[^\n\r]*/g, '');
  const sopForLangCheck = sopWithoutExcludes
    .replace(/\(\s*예\s*:[^)\n\r]*(?:한국어|영어|한영)[^)\n\r]*\)/g, '')
    .replace(/한국어\s*\/\s*영어\s*사용\s*비율/g, '')
    .replace(/가사\s*구조\s*및\s*한영\s*비율\s*복제/g, '')
    .replace(/한영\s*(?:언어\s*)?비율/g, '');

  const hasExplicitEnglish =
    /\b(100%\s*english|in\s+100%\s*english|english\s*lyrics|sing\s*in\s*english|english\s+groove\s+pop|retail\s+groove\s+pop|west\s*coast|freestyle\s*rap|1940|1950|vintage\s*pop)\b/i.test(
      `${titleAndCat} ${sopForLangCheck}`
    ) ||
    sopForLangCheck.includes('영어 그루브 팝') ||
    sopForLangCheck.includes('영어 100%') ||
    sopForLangCheck.includes('100% 영문') ||
    sopForLangCheck.includes('영어 가사');

  const hasExplicitJapanese =
    titleAndCat.includes('j-pop') ||
    titleAndCat.includes('jpop') ||
    titleAndCat.includes('제이팝') ||
    titleAndCat.includes('일본어') ||
    sopForLangCheck.includes('100% 일본어') ||
    sopForLangCheck.includes('일본어 가사') ||
    (rawSop.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length > 25;

  if (hasExplicitJapanese && !hasExplicitEnglish) {
    return 'japanese';
  }
  if (hasExplicitEnglish) {
    return 'western';
  }

  const korCount = (rawSop.match(/[\uAC00-\uD7AF]/g) || []).length;
  const engCount = (rawSop.match(/[a-zA-Z]/g) || []).length;
  if (engCount > 150 && korCount < 30) {
    return 'western';
  }
  if (korCount >= 20 || /[\uAC00-\uD7AF]/.test(lyricConcept)) {
    return 'korean';
  }
  return 'western';
}

export function extractLyricMoodDetails(
  tracks: Array<Partial<TrackItem>> = [],
  lyricConcept: string = '',
  theme: Partial<Theme> = {}
): LyricMoodDetails {
  const fullText = [
    theme.name || '',
    theme.category || '',
    lyricConcept,
    ...tracks.map((t) => `${t.title || ''} ${t.mood || ''} ${t.fullLyrics || ''}`),
  ]
    .join(' ')
    .toLowerCase();

  const has1940 = /\b(1940|1940s|40s|40's|shellac|78\s*rpm|phonograph)\b/i.test(fullText) || fullText.includes('1940');
  const has1950 = /\b(1950|1950s|50s|50's|doo-wop|diner|jukebox)\b/i.test(fullText) || fullText.includes('1950');
  const eraLabel =
    has1940 && has1950
      ? '1940s–1950s'
      : has1950
      ? '1950s'
      : has1940
      ? '1940s'
      : 'contemporary';

  const rainy = /\b(rain|rainy|raindrops|umbrella|wet pavement|drizzle)\b/i.test(fullText) ||
    /(빗소리|비\s*내리|가을비|비\s*오는|우산|젖은\s*거리|雨)/.test(fullText);
  const snowy = /\b(snow|snowfall|snowflakes|frost|winter)\b/i.test(fullText) ||
    /(함박눈|눈\s*내리|눈송이|겨울|설경|雪)/.test(fullText);
  const midnight = /\b(midnight|3\s*am|late\s*night|neon|after\s*hours|nocturnal)\b/i.test(fullText) ||
    /(새벽|밤거리|한밤|네온|심야|어스름|深夜|真夜中)/.test(fullText);
  const sunset = /\b(sunset|golden\s*hour|twilight|dusk|evening)\b/i.test(fullText) ||
    /(노을|황혼|해질녘|석양|저녁|夕暮れ)/.test(fullText);
  const morning = /\b(morning|sunday|brunch|sunlight|sunrise|daylight)\b/i.test(fullText) ||
    /(아침|일요일|햇살|오전|주말)/.test(fullText);

  const isEmpoweringRecovery =
    /(이별\s*후의\s*성장|상처를\s*극복|역경\s*극복|혼자서도\s*충분히\s*행복|자신감\s*표현|더\s*나은\s*미래|순간의\s*즐거움|스트레스\s*해소)/.test(fullText) ||
    /\b(overcoming adversity|self[- ]confidence|empowering|move on stronger|better future)\b/i.test(fullText);

  const isHeartbreak =
    !isEmpoweringRecovery &&
    (/\b(lonely|loneliness|devastating|heartbreak|goodbye|farewell|miss you|empty|hollow|tears|sorrow|broken)\b/i.test(fullText) ||
      /(이별|그리움|외로움|공허|눈물|쓸쓸|아쉬운|헤어짐|혼자|고독|寂し|涙|さよなら)/.test(fullText));

  const isConfident =
    isEmpoweringRecovery ||
    /\b(west\s*coast|freestyle|cypher|swagger|lowrider|g-funk|hip-hop|hip\s*hop|rap|flex)\b/i.test(fullText) ||
    /(자신감|프리스타일|힙합|랩|극복|열정|자유로운\s*분위기)/.test(fullText);

  const isNostalgic =
    /\b(nostalgic|memories|yesterday|vintage|antique|gramophone|letter|photograph|remember)\b/i.test(fullText) ||
    /(추억|기억|오래된|옛날|향수|그때|필름|축음기|과거에\s*대한\s*후회)/.test(fullText);

  let emotionKey: LyricMoodDetails['emotionKey'] = 'warm_romantic';
  let emotionDescriptorEn = 'warm romantic anticipation, gentle affection, and uplifting tenderness';
  let expressionEn = 'offering a genuine, unguarded soft smile with warm expressive eyes full of quiet affection';
  let lightingMoodEn = 'radiant golden warmth wrapping the central scene in an inviting, reassuring glow';

  if (isHeartbreak && !isConfident) {
    emotionKey = 'heartbreak_melancholy';
    emotionDescriptorEn = 'poignant urban longing, quiet emotional vulnerability, and bittersweet remembrance';
    expressionEn = 'with a quiet, wistful contemplative gaze and subtle poignant restraint reflecting unspoken longing';
    lightingMoodEn = 'soft moody contrast between cool ambient twilight tones and localized warm tungsten highlights';
  } else if (isConfident && !isHeartbreak) {
    emotionKey = 'confident_groove';
    emotionDescriptorEn = /\b(west\s*coast|california|los\s*angeles)\b/i.test(fullText)
      ? 'effortless West Coast rhythm, laid-back confidence, and magnetic street-level swagger'
      : isEmpoweringRecovery
      ? 'radiant self-assurance, uplifting resilience, and liberated joyful energy'
      : 'effortless street-level rhythm, laid-back confidence, and authentic artistic poise';
    expressionEn = isEmpoweringRecovery
      ? 'carrying a bright, self-assured and liberated smile radiating resilience and genuine inner peace'
      : 'carrying a calm, self-assured expression with relaxed rhythmic poise and authentic charismatic presence';
    lightingMoodEn = 'crisp directional golden-hour sunlight carving warm highlights and deep atmospheric street contrast';
  } else if (isNostalgic) {
    emotionKey = 'nostalgic_reflective';
    emotionDescriptorEn = 'timeless bittersweet nostalgia, cherished memory, and poetic warmth';
    expressionEn = 'holding a tender, thoughtful expression immersed in warm personal memories';
    lightingMoodEn = 'soft archival amber luminescence with gentle window light falloff and classic film tonality';
  }

  const motifs: string[] = [];
  if (/(carol|캐롤|christmas|크리스마스|xmas|성탄|산타|징글)/.test(fullText)) motifs.push('festive Christmas ornaments, evergreen pine needles, and glowing holiday lights');
  if (/(coffee|latte|espresso|cafe|카페|커피|라떼)/.test(fullText)) motifs.push('warm ceramic coffee cup with rising steam');
  if (/(drive|car|highway|boulevard|lowrider|드라이브|도로|차창)/.test(fullText)) motifs.push('open avenue lights and sleek car interior silhouettes');
  if (/(palm|beach|venice|california|west coast|sunset)/.test(fullText)) motifs.push('tall California palm silhouettes and sunlit coastal avenue');
  if (/(record|vinyl|gramophone|shellac|jukebox|radio|레코드|축음기)/.test(fullText)) motifs.push('vintage spinning vinyl/shellac record and warm analog audio warmth');
  if (/(window|glass|창가|창문)/.test(fullText)) motifs.push('rain-or-sunlight-kissed architectural window framing');

  return {
    emotionKey,
    emotionDescriptorEn,
    expressionEn,
    lightingMoodEn,
    weatherCues: { rainy, snowy, midnight, sunset, morning },
    eraLabel,
    motifPhraseEn: motifs.length > 0 ? motifs.slice(0, 3).join(', ') : 'tactile everyday storytelling props',
  };
}

export function detectSceneProfile(
  theme: Partial<Theme>,
  lyricConcept: string = '',
  tracks: Array<Partial<TrackItem>> = [],
  extraContext: string = ''
): SceneProfile {
  const culture = detectLyricCulture(theme, tracks, lyricConcept);
  const moodDetails = extractLyricMoodDetails(tracks, lyricConcept, theme);

  const trackAndLyricsText = tracks
    .map((t) => `${t.title || ''} ${t.mood || ''} ${t.metaInfo?.genre || ''} ${t.fullLyrics || ''}`)
    .join(' ');
  const activeContext = `${extraContext} ${lyricConcept} ${trackAndLyricsText} ${theme.name || ''} ${theme.category || ''}`.toLowerCase();
  const sopContext = `${theme.sop || ''}`
    .toLowerCase()
    .replace(/exclude\s*:[^\n\r]*/gi, '')
    .replace(/금지[^\n\r]*/g, '')
    .replace(/제외[^\n\r]*/g, '');
  const combined = `${activeContext} ${sopContext}`;

  // 1. Era-Specific: 1940s–1950s Vintage Pop / Shellac / Doo-Wop / Swing
  if (
    /\b(1940|1940s|40s|40's|1950|1950s|50s|50's|shellac|phonograph|78\s*rpm|gramophone|doo-wop|vintage\s*pop)\b/i.test(combined) ||
    combined.includes('1940') ||
    combined.includes('1950')
  ) {
    const eraStr = moodDetails.eraLabel !== 'contemporary' ? moodDetails.eraLabel : '1940s–1950s';
    return {
      key: 'vintage_1940s_50s',
      culture,
      eraLabel: eraStr,
      seasonEn: `authentic ${eraStr} twilight`,
      seasonKo: `${eraStr} 빈티지 감성`,
      locationEn:
        culture === 'korean'
          ? `restored ${eraStr} Seoul vintage music parlor with dark wood paneling and antique tube radio`
          : `authentic ${eraStr} mahogany parlor & retro soda-fountain listening lounge glowing under warm incandescent lamps`,
      locationKo: `${eraStr} 클래식 빈티지 뮤직 라운지`,
      genreLabelEn: `${eraStr} Vintage Pop`,
      genreLabelKo: `${eraStr} 빈티지 팝`,
      moodLabelEn: `Nostalgic ${eraStr} Analog Memories`,
      moodLabelKo: `${eraStr} 아날로그 빈티지 감성`,
    };
  }

  // 2. Christmas / Carol / Holiday (localized to Korean / Western / Japanese!)
  if (
    activeContext.includes('christmas') ||
    activeContext.includes('크리스마스') ||
    activeContext.includes('carol') ||
    activeContext.includes('캐롤') ||
    activeContext.includes('xmas') ||
    activeContext.includes('성탄') ||
    activeContext.includes('산타') ||
    activeContext.includes('징글') ||
    activeContext.includes('jingle bell') ||
    activeContext.includes('mistletoe') ||
    sopContext.includes('carol') ||
    sopContext.includes('캐롤') ||
    sopContext.includes('christmas') ||
    sopContext.includes('크리스마스')
  ) {
    return {
      key: 'christmas_holiday',
      culture,
      eraLabel: 'contemporary',
      seasonEn: 'snow-dusted Christmas Eve twilight',
      seasonKo: '눈 내리는 크리스마스 이브',
      locationEn:
        culture === 'korean'
          ? 'snowy Seoul Myeongdong / Seongsu winter street glowing with a warmly lit Christmas tree and cozy festive Korean café windows'
          : culture === 'japanese'
          ? 'snow-kissed Tokyo Marunouchi avenue illuminated by warm golden Christmas lights and festive winter trees'
          : 'snow-dusted New York Fifth Avenue and glowing festive café square centered around a towering sparkling Christmas tree',
      locationKo:
        culture === 'korean'
          ? '눈 내리는 서울 도심과 따뜻한 크리스마스 트리 불빛'
          : culture === 'japanese'
          ? '도쿄 겨울 일루미네이션과 크리스마스 트리 불빛'
          : '반짝이는 트리와 눈 내리는 크리스마스 거리',
      genreLabelEn: 'Christmas & Carol Playlist',
      genreLabelKo: '크리스마스 캐롤 플레이리스트',
      moodLabelEn: 'Warm Festive Christmas Glow',
      moodLabelKo: '따뜻하고 설레는 크리스마스 캐롤 무드',
    };
  }

  // 3. West Coast Freestyle Rap / California G-Funk / US West Coast Hip-Hop
  if (
    /\b(west\s*coast|westside|g-funk|freestyle\s*rap|compton|venice\s*beach|crenshaw|los\s*angeles|california|lowrider)\b/i.test(combined) ||
    (culture === 'western' && /\b(rap|hip-hop|hip\s*hop|freestyle|cypher|boom\s*bap)\b/i.test(`${theme.name || ''} ${theme.category || ''} ${activeContext}`))
  ) {
    return {
      key: 'west_coast_rap',
      culture: 'western',
      eraLabel: 'contemporary',
      seasonEn: 'golden-hour California afternoon fading into warm West Coast sunset',
      seasonKo: '황금빛 노을이 물드는 미국 서부 LA 오후',
      locationEn: 'palm-lined Los Angeles Crenshaw / Venice boulevard bathed in warm Pacific sunset light with classic lowrider chrome reflections',
      locationKo: '야자수와 노을이 빛나는 미국 서부 LA 로스앤젤레스 거리',
      genreLabelEn: 'West Coast Freestyle Rap',
      genreLabelKo: '웨스트 코스트 프리스타일 랩',
      moodLabelEn: 'Authentic West Coast Hip-Hop Swagger',
      moodLabelKo: '미국 서부 힙합/프리스타일 바이브',
    };
  }

  // 4. Sunday / Cozy Cafe (localized by culture!)
  if (
    activeContext.includes('sunday') ||
    activeContext.includes('일요일') ||
    activeContext.includes('주말') ||
    activeContext.includes('브런치') ||
    activeContext.includes('brunch') ||
    activeContext.includes('coffee') ||
    activeContext.includes('커피') ||
    activeContext.includes('cafe') ||
    activeContext.includes('카페')
  ) {
    const hasExplicitRainInActive =
      activeContext.includes('가을비') ||
      activeContext.includes('rainy') ||
      activeContext.includes('빗소리') ||
      activeContext.includes('비 오는');

    if (!hasExplicitRainInActive) {
      return {
        key: 'sunday_cafe',
        culture,
        eraLabel: 'contemporary',
        seasonEn: 'bright, sun-warmed Sunday late morning',
        seasonKo: '햇살이 포근하게 스며드는 일요일 오전',
        locationEn:
          culture === 'korean'
            ? 'sunlit Seoul Seongsu-dong artisan neighborhood café with warm oak tables, creamy latte art, and lush street trees outside panoramic glass windows'
            : culture === 'japanese'
            ? 'sun-warmed Kichijoji Tokyo neighborhood café with cedar counters, pour-over glass coffee, and sunlit green maple trees outside'
            : 'sun-drenched SoHo or London neighborhood café with warm oak tables, artisanal latte art, and leafy sunlit brownstone streets outside',
        locationKo:
          culture === 'korean'
            ? '따스한 햇살이 드는 서울 성수동 감성 카페'
            : culture === 'japanese'
            ? '햇살이 스며드는 도쿄 키치조지 감성 카페'
            : '따스한 햇살과 원목 테이블이 있는 감성 서양 카페',
        genreLabelEn: 'Sunday Cafe Vibes',
        genreLabelKo: '기분 좋아지는 일요일 카페 플리',
        moodLabelEn: 'Warm Sunlit Sunday Cafe Groove',
        moodLabelKo: '여유롭고 포근한 일요일 카페 감성',
      };
    }
  }

  // 5. Rainy Autumn Walk (localized by culture!)
  if (
    (activeContext.includes('rain') || activeContext.includes('비') || activeContext.includes('가을비')) &&
    (activeContext.includes('autumn') || activeContext.includes('가을') || activeContext.includes('낙엽') || activeContext.includes('street') || activeContext.includes('거리'))
  ) {
    return {
      key: 'rainy_autumn',
      culture,
      eraLabel: 'contemporary',
      seasonEn: 'misty golden-crimson autumn afternoon after rain',
      seasonKo: '가을비 내린 촉촉한 오후',
      locationEn:
        culture === 'korean'
          ? 'rain-glistened Seoul Samcheong-dong / Jeongdong-gil ginkgo and maple boulevard lined with stone walls and glowing autumn leaves'
          : culture === 'japanese'
          ? 'rain-kissed Kyoto or Tokyo Meiji Jingu Gaien avenue glowing with scarlet maples and wet street reflections'
          : 'leaf-strewn New York Central Park edge or European autumn intersection lined with crimson maples and glossy wet asphalt',
      locationKo:
        culture === 'korean'
          ? '가을비에 젖은 서울 정동길 돌담과 단풍 거리'
          : '붉은 단풍과 젖은 아스팔트가 빛나는 가을비 거리',
      genreLabelEn: 'Feel-Good Autumn Pop',
      genreLabelKo: '가을 감성 팝 플리',
      moodLabelEn: 'Rainy Day Autumn Walk',
      moodLabelKo: '가을비 내린 날 하루 종일 듣는 감성 플리',
    };
  }

  // 6. Japanese J-POP / Tokyo Night
  const isJapaneseVisual =
    culture === 'japanese' ||
    activeContext.includes('j-pop') ||
    activeContext.includes('jpop') ||
    activeContext.includes('제이팝') ||
    activeContext.includes('tokyo') ||
    sopContext.includes('100% 일본어') ||
    sopContext.includes('electronic r&b j-pop');

  if (isJapaneseVisual) {
    return {
      key: 'tokyo_rain',
      culture: 'japanese',
      eraLabel: 'contemporary',
      seasonEn: moodDetails.weatherCues.rainy ? 'rainy indigo midnight in Tokyo' : 'quiet indigo twilight in Tokyo',
      seasonKo: '고요한 도쿄의 푸른 밤',
      locationEn: 'minimalist Tokyo Shibuya / Nakameguro high-rise apartment window looking out onto luminous city towers and twilight neon haze',
      locationKo: '도쿄 시부야 창가와 네온 야경이 어우러진 공간',
      genreLabelEn: 'Electronic R&B J-Pop',
      genreLabelKo: '일렉트로닉 R&B J-POP',
      moodLabelEn: 'Midnight Urban Solitude',
      moodLabelKo: '세련된 도쿄 새벽 감성 플리',
    };
  }

  // 7. Chill Groove Pop / Retail Groove Pop (localized by culture!)
  if (activeContext.includes('groove') || activeContext.includes('그루브') || activeContext.includes('chill pop') || activeContext.includes('retail groove')) {
    return {
      key: 'romantic_groove',
      culture,
      eraLabel: 'contemporary',
      seasonEn: moodDetails.weatherCues.midnight ? 'warm ambient evening glow' : 'warm golden-lit afternoon in a sunlit city neighborhood',
      seasonKo: '따스하고 세련된 도심 오후',
      locationEn:
        culture === 'korean'
          ? 'trendy Seoul Hannam-dong / Seongsu sunlit terrace café with warm brick facades and clean modern greenery'
          : 'sunlit SoHo New York or Silver Lake boutique café terrace with warm brick townhouses and golden afternoon sunbeams',
      locationKo:
        culture === 'korean'
          ? '햇살이 스며드는 서울 한남동·성수동 감각적인 테라스'
          : '햇살이 스며드는 뉴욕 소호 감성 카페 테라스',
      genreLabelEn: 'Chill Groove Pop',
      genreLabelKo: '기분 좋아지는 그루브 팝 모음',
      moodLabelEn: 'Effortless Urban Groove',
      moodLabelKo: '세련되고 기분 좋아지는 그루브 팝',
    };
  }

  // 8. R&B / Hip-Hop / Midnight Drive (localized by culture!)
  if (
    combined.includes('알앤비') ||
    combined.includes('힙합') ||
    combined.includes('hip-hop') ||
    combined.includes('r&b') ||
    combined.includes('trap') ||
    combined.includes('새벽') ||
    combined.includes('드라이브') ||
    combined.includes('인스타')
  ) {
    return {
      key: 'night_drive',
      culture,
      eraLabel: 'contemporary',
      seasonEn: 'late-night cool city breeze past midnight',
      seasonKo: '감각적인 새벽 도심의 밤',
      locationEn:
        culture === 'korean'
          ? 'midnight Seoul Han River riverside boulevard and Banpo Bridge city lights framed cleanly from inside a sleek dark sedan'
          : 'midnight metropolitan riverside expressway and glowing city skyline seen through sleek sedan glass',
      locationKo:
        culture === 'korean'
          ? '한강 야경과 서울 강변북로가 스치는 새벽 드라이브'
          : '도시 야경이 스치는 새벽 드라이브 도로',
      genreLabelEn: culture === 'korean' ? 'Korean Chill R&B & Hip-Hop' : 'Late-Night R&B & Hip-Hop',
      genreLabelKo: culture === 'korean' ? '느좋 한국 칠 알앤비 힙합' : '느좋 칠 알앤비 힙합',
      moodLabelEn: 'Late Night Aesthetic Drive',
      moodLabelKo: '새벽 드라이브 & 작업실 감성 플리',
    };
  }

  // 9. Cinematic OST / Ballad (localized by culture!)
  if (combined.includes('ost') || combined.includes('cinematic') || combined.includes('movie') || combined.includes('ballad') || combined.includes('발라드')) {
    return {
      key: 'cinematic_ost',
      culture,
      eraLabel: 'contemporary',
      seasonEn: moodDetails.weatherCues.rainy ? 'melancholic rainy dusk' : 'melancholic golden-hour sunset',
      seasonKo: '노을이 스며드는 서정적인 오후',
      locationEn:
        culture === 'korean'
          ? 'quiet modern Seoul Namsan hillside terrace and tall timber-framed window overlooking soft amber sunset rooftops'
          : 'sun-drenched quiet European stone balcony and tall French doors overlooking golden cobblestone rooftops',
      locationKo:
        culture === 'korean'
          ? '서울 남산 노을빛이 머무는 고요한 시네마틱 창가'
          : '노을빛이 창가에 머무는 고요한 시네마틱 공간',
      genreLabelEn: 'Cinematic Ballad Playlist',
      genreLabelKo: '영화 OST 감성 발라드 모음',
      moodLabelEn: 'Deep Emotional Storytelling',
      moodLabelKo: '마음에 깊은 울림을 남기는 발라드 플리',
    };
  }

  // 10. Sunny Autumn Cafe
  if (activeContext.includes('autumn') || activeContext.includes('가을') || activeContext.includes('acoustic') || activeContext.includes('어쿠스틱')) {
    return {
      key: 'sunny_autumn_cafe',
      culture,
      eraLabel: 'contemporary',
      seasonEn: 'crisp golden autumn afternoon',
      seasonKo: '햇살 좋은 선선한 가을 오후',
      locationEn:
        culture === 'korean'
          ? 'warm wooden Seoul Bukchon / Seochon café window overlooking golden ginkgo leaves along a traditional Korean stone wall'
          : 'warm wooden café terrace with panoramic glass windows facing golden autumn foliage and historic stone walls',
      locationKo:
        culture === 'korean'
          ? '황금빛 은행나무와 서울 돌담길이 보이는 감성 카페 창가'
          : '황금빛 가을 단풍이 보이는 감성 카페 창가',
      genreLabelEn: 'Good Day Autumn Pop',
      genreLabelKo: '여유롭고 기분 좋은 가을 카페 플리',
      moodLabelEn: 'Autumn Café Breeze',
      moodLabelKo: '카페음악 • 노동요 감성 플리',
    };
  }

  return {
    key: 'romantic_groove',
    culture,
    eraLabel: 'contemporary',
    seasonEn: 'warm golden-lit afternoon in a sunlit city neighborhood',
    seasonKo: '따스한 햇살과 기분 좋은 바람이 부는 오후',
    locationEn:
      culture === 'korean'
        ? 'sunlit Seoul Seongsu-dong café terrace with warm brick architecture and soft afternoon greenery'
        : 'sunlit SoHo sidewalk café table with warm brick townhouses and lush sunlit street trees',
    locationKo:
      culture === 'korean'
        ? '햇살이 스며드는 서울 성수동 감성 카페 거리'
        : '햇살이 스며드는 도심 골목 카페와 설레는 거리',
    genreLabelEn: 'Good Day Groove Pop',
    genreLabelKo: '기분 좋아지는 그루브 팝 모음',
    moodLabelEn: 'Feel-Good Romantic Groove',
    moodLabelKo: '듣는 순간 설레고 기분 좋아지는 그루브 팝',
  };
}

export function normalizeFiveHashtags(
  rawHashtags: string | undefined,
  theme: Partial<Theme>,
  lyricConcept: string = '',
  tracks: Array<Partial<TrackItem>> = [],
  extraContext: string = ''
): string {
  const scene = detectSceneProfile(theme, lyricConcept, tracks, extraContext);
  const extracted = (rawHashtags || '')
    .match(/#[a-zA-Z0-9_\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FAF]+/g) || [];

  const filteredExisting = extracted
    .map((t) => t.toLowerCase())
    .filter((t) => !['#sunoai', '#plymasterfactory', '#musicproduction', '#audiocards'].includes(t));

  const poolByScene: Record<SceneProfile['key'], string[]> = {
    christmas_holiday: ['#playlist', '#christmas', '#carol', '#wintervibes', '#holidaypop'],
    sunday_cafe: ['#playlist', '#groovepop', '#cafe', '#sundayvibes', '#feelgood'],
    rainy_autumn: ['#playlist', '#autumnpop', '#groovepop', '#rainyday', '#cafe'],
    sunny_autumn_cafe: ['#playlist', '#autumnpop', '#gooddaypop', '#acousticpop', '#cafe'],
    romantic_groove: ['#playlist', '#groovepop', '#gooddaypop', '#chillpop', '#cafe'],
    night_drive: ['#playlist', '#chillrnb', '#koreanrnb', '#nightdrive', '#lounge'],
    tokyo_rain: ['#playlist', '#jpop', '#citypop', '#electronicrnb', '#midnight'],
    vintage_1940s_50s: ['#playlist', '#vintagepop', '#1950spop', '#1940sjazz', '#retrolounge'],
    west_coast_rap: ['#playlist', '#westcoastrap', '#freestylerap', '#gfunk', '#hiphop'],
    cinematic_ost: ['#playlist', '#cinematicost', '#emotionalballad', '#filmmusic', '#healing'],
  };

  const result: string[] = [];
  const pushUnique = (tag: string) => {
    const clean = tag.startsWith('#') ? tag : `#${tag}`;
    if (!result.includes(clean) && result.length < 5) {
      result.push(clean);
    }
  };

  pushUnique('#playlist');
  for (const tag of filteredExisting) {
    if (result.length >= 5) break;
    pushUnique(tag);
  }
  for (const tag of poolByScene[scene.key]) {
    if (result.length >= 5) break;
    pushUnique(tag);
  }

  return result.slice(0, 5).join(' ');
}

function stripTextOverlayInstructions(promptText: string): string {
  const cleaned = promptText
    .replace(/minimalist white editorial serif[^,.]*?(?:text|typography)[^,.]*[,.]?/gi, '')
    .replace(/minimalist white serif text[^,.]*[,.]?/gi, '')
    .replace(/editorial serif typography[^,.]*[,.]?/gi, '')
    .replace(/(?:reading|saying|emphasizing|featuring text)\s*["'][^"']*["'][^,.]*[,.]?/gi, '')
    .replace(/tiny subtle poetic caption text[^,.]*[,.]?/gi, '')
    .replace(/,\s*,+/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.replace(/[,\s]+$/, '.');
}

function getCulturePersonPhrase(culture: LyricCulture, role: 'woman' | 'man' | 'figure' | 'couple'): string {
  const prefix = culture === 'korean' ? 'Korean' : culture === 'japanese' ? 'Japanese' : 'Western';
  if (role === 'couple') {
    return `two ${prefix} young friends`;
  }
  if (role === 'man') {
    return `${prefix} young man`;
  }
  if (role === 'figure') {
    return `${prefix} person`;
  }
  return `${prefix} young woman`;
}

function buildPhotorealisticSceneBase(
  scene: SceneProfile,
  themeName: string,
  lyricConcept: string,
  tracks: Array<Partial<TrackItem>>
): string {
  const isPureEnglishText = (val: string) => Boolean(val) && !/[\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FAF]/.test(val);
  const enTrackTitles = tracks
    .map((t) => t.title || '')
    .filter((title) => isPureEnglishText(title))
    .slice(0, 3)
    .join(', ');
  const enThemeLabel = isPureEnglishText(themeName) ? themeName : scene.genreLabelEn;
  const moodDetails = extractLyricMoodDetails(tracks, lyricConcept, { name: themeName });

  const storyHook = isPureEnglishText(lyricConcept)
    ? `expressing the lyrical narrative mood of "${lyricConcept}" (${moodDetails.emotionDescriptorEn})`
    : enTrackTitles
    ? `translating the lyrical story and ${moodDetails.emotionDescriptorEn} of tracks like ${enTrackTitles}`
    : `visualizing the signature ${moodDetails.emotionDescriptorEn} and atmosphere of "${enThemeLabel}"`;

  const woman = getCulturePersonPhrase(scene.culture, 'woman');
  const man = getCulturePersonPhrase(scene.culture, 'man');
  const couple = getCulturePersonPhrase(scene.culture, 'couple');
  const weatherOverlayNote = moodDetails.weatherCues.rainy
    ? 'Delicate real raindrops cling softly to nearby glass and reflect ambient lights without muddying clarity.'
    : moodDetails.weatherCues.snowy
    ? 'Crisp natural winter chill and soft drifting snowflakes gently kiss coats and window frames.'
    : '';

  const scenes: Record<SceneProfile['key'], { setting: string; subject: string; props: string; lighting: string; optics: string }> = {
    sunday_cafe: {
      setting: `Set inside ${scene.locationEn} on a peaceful ${scene.seasonEn}, a single expansive floor-to-ceiling timber-framed window occupies the backdrop, revealing softly blurred sunlit trees and neighborhood architecture outside.`,
      subject: `Positioned naturally right along the central axis of the frame at a handcrafted oak table, a candid ${woman} wearing relaxed knitwear sits comfortably beside a warm ceramic mug, ${moodDetails.expressionEn} while gentle morning light catches loose strands of hair.`,
      props: `Drawing the eye inward along the wooden table perspective sit ${moodDetails.motifPhraseEn}, a speckled artisanal stoneware latte cup with velvety microfoam art, a small clear glass bud vase with fresh wildflowers, and an open linen journal. ${weatherOverlayNote}`,
      lighting: `${moodDetails.lightingMoodEn}, casting soft natural window-pane light across the oak tabletop and melting background café silhouettes into creamy honey-toned optical bokeh.`,
      optics: `Shot on a full-frame Leica SL2-S paired with a 35mm f/1.8 APO prime lens at ISO 400 and f/2.0 aperture, preserving natural skin texture, knitwear fiber detail, and authentic Kodak Portra 400 organic film grain.`,
    },
    christmas_holiday: {
      setting: `Captured in one cohesive street-level frame at ${scene.locationEn} during a festive ${scene.seasonEn}, warm architectural facades lead directly toward a towering illuminated Christmas tree sparkling at the central background horizon beneath winter trees wrapped in golden fairy lights.`,
      subject: `Centered cleanly in the foreground at eye level, ${couple} dressed in cozy winter wool coats and plush knit scarves share warm holiday coffee cups while softly blurred festive pedestrians stroll peacefully behind them, ${moodDetails.expressionEn}.`,
      props: `Tactile seasonal details anchor the center: warm matte ceramic or holiday paper cups releasing soft winter steam, golden Christmas tree ornaments glowing in bokeh, evergreen wreaths, gift ribbons, and fresh snowflakes glistening across coats and stone pavement.`,
      lighting: `Cool twilight indigo winter sky harmonizes with warm 2700K storefront radiance and shimmering golden Christmas lights, wrapping the central figures and festive horizon in rich Kodak Portra 400 holiday warmth.`,
      optics: `Shot on a full-frame Leica SL2-S with a 35mm f/1.8 APO prime lens at ISO 800 and f/2.0 aperture, rendering realistic winter wool textures, authentic facial features, sparkling specular holiday bokeh, and organic 35mm film grain.`,
    },
    west_coast_rap: {
      setting: `Captured in one uninterrupted 16:9 street-level frame along a ${scene.locationEn} during a ${scene.seasonEn}, towering California fan palms silhouette sharply against a warm amber-peach Pacific sky while vintage lowrider chrome and neighborhood storefronts sit cleanly in soft background depth.`,
      subject: `Anchored right at the center focal point in front of a parked classic West Coast coupe or analog neighborhood vocal booth, an authentic contemporary Western male hip-hop artist in an oversized crisp heavyweight tee, open plaid flannel, tailored Dickies trousers, sunglasses, and subtle silver chain leans naturally near a vintage chrome condenser mic or car hood, ${moodDetails.expressionEn}.`,
      props: `Grounding the authentic modern US West Coast hip-hop identity: a classic candy-painted lowrider silhouette gleaming softly behind him, concrete sidewalk palm shadows, studio headphones or notebook of handwritten freestyle bars, and warm California golden-hour atmosphere with zero AI neon clichés.`,
      lighting: `${moodDetails.lightingMoodEn}, bathing the central figure and palm-lined avenue in authentic Los Angeles sunset backlight, warm rim highlights, rich shadows, and crisp cinematic contrast.`,
      optics: `Photographed on an anamorphic 35mm cinema lens with Leica SL2-S / Cinestill aesthetic at ISO 400 and f/2.0 aperture, preserving realistic skin pores, cotton fabric folds, subtle chrome reflections, and crisp 35mm film grain.`,
    },
    vintage_1940s_50s: {
      setting: `Set inside ${scene.locationEn} during an ${scene.seasonEn}, period-authentic ${scene.eraLabel} walnut wainscoting, patterned vintage wallpaper, lace curtains, and brass wall sconces frame one cohesive mid-century sanctuary—strictly zero modern smartphones, laptops, or digital screens anywhere.`,
      subject: `Centered gracefully beside a gleaming antique oak gramophone with a brass horn or classic ${scene.eraLabel} tabletop tube radio, a period-dressed ${woman} styled in authentic ${scene.eraLabel} victory-roll or soft sculpted curls, tailored wool tweed skirt-suit and pearl studs delicately places the tonearm needle onto a glossy 78 RPM shellac disc, ${moodDetails.expressionEn}.`,
      props: `True ${scene.eraLabel} artifacts fill the center composition: worn paper 78 RPM record sleeves, glowing warm amber vacuum tubes, a delicate porcelain teacup on lace doily linen, rotary bakelite telephone silhouette in soft focus, and sunlit dust motes suspended in the room.`,
      lighting: `Warm tungsten parlor lamp glow blends gently with soft twilight window rays, casting rich mid-century amber-sepia highlights and deep velvet shadows true to ${scene.eraLabel} editorial photography.`,
      optics: `Photographed on a classic 1940s–1950s Rolleiflex 2.8 medium-format camera with archival Kodachrome / warm silver-gelatin film grain, soft vintage lens halation, authentic mid-century color rendition, and zero modern digital gloss.`,
    },
    rainy_autumn: {
      setting: `Shot as one uninterrupted elevated diagonal frame overlooking ${scene.locationEn} during a ${scene.seasonEn}, fiery crimson and golden autumn canopies arch cleanly toward glistening wet pavement and crisp street crossings.`,
      subject: `Anchored near the heart of the sunlit wet intersection, a stylish ${woman} holding a clear dome umbrella pauses gracefully in a tailored beige trench coat and soft wool scarf amidst drifting autumn leaves, ${moodDetails.expressionEn}.`,
      props: `Mirror-like raindrops shimmer across dark wet asphalt, vibrant maple and ginkgo leaves scatter along wet curbs, and atmospheric city trees recede smoothly into soft depth.`,
      lighting: `${moodDetails.lightingMoodEn}, intensifying fiery amber and crimson leaf pigments against luminous wet pavement reflections.`,
      optics: `Shot on a full-frame Leica SL2-S 35mm f/1.8 APO lens with authentic Kodak Portra 400 color rendition, natural skin detail, and organic film grain.`,
    },
    sunny_autumn_cafe: {
      setting: `Photographed inside ${scene.locationEn} during a ${scene.seasonEn}, a sweeping frameless glass window reveals golden autumn leaves glowing gently along quiet neighborhood streets outside.`,
      subject: `Seated near the centered focal window at a warm oak table, a serene ${woman} in a soft oatmeal cashmere knit rests lightly beside her coffee cup, ${moodDetails.expressionEn} as crisp autumn light rims her hair.`,
      props: `Leading smoothly to center stand ${moodDetails.motifPhraseEn}, matte ceramic tableware, an open hardcover book, and delicate fallen ginkgo leaves resting on the exterior stone sill. ${weatherOverlayNote}`,
      lighting: `Low-angle honey-gold autumn sunlight pours cleanly through golden foliage across the wooden interior, balancing bright window clarity with warm natural shadows.`,
      optics: `Shot on a full-frame Leica SL2-S 35mm f/1.8 APO prime lens at f/2.0 with Kodak Portra 400 tonal harmony and zero CGI gloss.`,
    },
    romantic_groove: {
      setting: `Captured in one cohesive widescreen frame along ${scene.locationEn} during a ${scene.seasonEn}, warm brick facades, glowing café awnings, and natural neighborhood foliage frame an inviting urban atmosphere.`,
      subject: `Positioned as the clear central anchor at a cozy table, a candid ${woman} in effortless stylish knitwear and light casual layers sits comfortably beside a warm porcelain drink, ${moodDetails.expressionEn}.`,
      props: `Carefully arranged foreground props guide the eye to center: ${moodDetails.motifPhraseEn}, handmade speckled ceramic cup, subtle sunglasses, and sunlit greenery glowing smoothly behind. ${weatherOverlayNote}`,
      lighting: `${moodDetails.lightingMoodEn}, creating luminous rim highlights and creamy optical bokeh across the neighborhood backdrop.`,
      optics: `Shot on a full-frame Leica SL2-S 35mm f/1.8 APO lens with Kodak Portra 400 natural skin tones and fine film grain.`,
    },
    night_drive: {
      setting: `Framed cleanly from inside ${scene.locationEn} during a ${scene.seasonEn}, distant illuminated bridge cables and city skyline bokeh streak softly past clean dark glass in one unified perspective.`,
      subject: `Positioned cleanly in the moody focal pocket beside the side window, a stylish ${man} (or young adult) in an understated dark wool coat rests near the softly lit console, ${moodDetails.expressionEn} as amber streetlamp and cyan dashboard reflections brush across their profile.`,
      props: `Authentic leather seat stitching, faint warm instrument glow, subtle mist on the lower glass corner, wired earbuds or analog journal, and nocturnal city reflections build deep late-night immersion. ${weatherOverlayNote}`,
      lighting: `Cinestill 800T nocturnal cinema lighting balances warm sodium-vapor amber streetlamps against cool midnight slate tones with natural halation and subtle film grain.`,
      optics: `Shot on a full-frame Leica SL2-S 35mm f/1.8 APO lens at ISO 1600 and f/1.8 aperture with authentic nocturnal film halation and realistic skin texture.`,
    },
    tokyo_rain: {
      setting: `Set inside ${scene.locationEn} during a ${scene.seasonEn}, one uninterrupted floor-to-ceiling window looks cleanly out over glowing Tokyo streets and soft evening twilight haze.`,
      subject: `Seated calmly near the central window composition in an oversized slate knit sweater, a poised ${woman} cradles a warm stoneware mug with both hands, ${moodDetails.expressionEn}.`,
      props: `A warm brass desk lamp casts an amber glow across a dark walnut side table beside wired studio headphones, vinyl sleeve silhouettes, and an open sketchbook. ${weatherOverlayNote}`,
      lighting: `Warm tungsten lamp glow contrasts delicately with cool indigo Tokyo dusk and diffused pastel neon bokeh.`,
      optics: `Shot on a full-frame Leica SL2-S 35mm f/1.8 APO lens with Cinestill/Portra twilight color grading and organic 35mm film grain.`,
    },
    cinematic_ost: {
      setting: `Captured from ${scene.locationEn} during a ${scene.seasonEn}, tall wooden French doors and warm architectural lines frame a sweeping, emotional horizon.`,
      subject: `Standing gracefully near the center focal point in an ivory silk blouse and tailored wool coat, a soulful ${woman} looks calmly out toward the horizon as gentle breeze moves loose hair strands, ${moodDetails.expressionEn}.`,
      props: `Weathered architectural railings, billowing sheer linen curtains, ${moodDetails.motifPhraseEn}, and warm dust motes suspended in diagonal light rays anchor the filmic storytelling. ${weatherOverlayNote}`,
      lighting: `${moodDetails.lightingMoodEn}, casting delicate rim light and velvet atmospheric shadows across a timeless widescreen cinema frame.`,
      optics: `Shot on an anamorphic full-frame cinema prime lens with Leica optical clarity and classic Kodak Portra 400 archival film grain.`,
    },
  };

  const chosen = scenes[scene.key];

  const compositionAndCenterFocus = `Unified Center-Focused Composition & Visual Hierarchy: Engineered as ONE single, continuous, uninterrupted 16:9 widescreen photograph—strictly never a split-screen, never a diptych, and never two side-by-side panels. Compose with deliberate leading lines guiding the viewer's eye effortlessly toward the clear hero focal point positioned near the center of the frame, with shallow depth falloff melting background distractions into natural optical bokeh.`;

  const purityConstraint = `Strict Zero-Text Purity: CRITICAL CONSTRAINT—strictly NO text, NO typography, NO titles, NO letters, NO subtitles, NO captions, NO logos, and NO watermarks anywhere in the image; pure clean editorial photography only.`;

  let assembled = [
    `Single unified 16:9 ultra-realistic photorealistic editorial photograph ${storyHook}.`,
    chosen.setting,
    chosen.subject,
    chosen.props,
    chosen.lighting,
    compositionAndCenterFocus,
    chosen.optics,
    purityConstraint,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (assembled.length < 2150) {
    assembled = `${assembled} Atmospheric Depth & Editorial Craft: Crisp micro-contrast across natural fabric weaves, wood grain, skin pores, ceramic glazes, and window glass specular highlights reinforces authentic documentary realism while keeping the central emotional narrative effortlessly readable at small YouTube thumbnail scale.`
      .replace(/\s+/g, ' ')
      .trim();
  }

  return assembled;
}

function isPromptCoherentWithSceneAndCulture(cleanRaw: string, scene: SceneProfile): boolean {
  const lower = cleanRaw.toLowerCase();

  // Culture check
  if (scene.culture === 'korean') {
    const mentionsOtherEthnicityOrCity =
      /\b(tokyo|shibuya|japanese|kyoto|new york|manhattan|fifth avenue|soho|london|paris|european|caucasian)\b/i.test(lower);
    const mentionsKorean = /\b(korean|seoul|korea|han river|seongsu|hannam|gangnam|bukchon|samcheong)\b/i.test(lower);
    if (mentionsOtherEthnicityOrCity || !mentionsKorean) {
      return false;
    }
  } else if (scene.culture === 'japanese') {
    const mentionsOther = /\b(korean|seoul|new york|manhattan|london|caucasian)\b/i.test(lower);
    const mentionsJapanese = /\b(japanese|tokyo|japan|shibuya|nakameguro|kichijoji|kyoto)\b/i.test(lower);
    if (mentionsOther || !mentionsJapanese) {
      return false;
    }
  } else if (scene.culture === 'western') {
    const mentionsAsia = /\b(korean|seoul|japanese|tokyo|shibuya)\b/i.test(lower);
    if (mentionsAsia) {
      return false;
    }
  }

  // Era / subculture checks
  if (scene.key === 'vintage_1940s_50s') {
    const hasEra = /\b(1940|1950|40s|50s|vintage|gramophone|phonograph|shellac|78\s*rpm|retro|mid-century)\b/i.test(lower);
    const hasModernAnachronism = /\b(smartphone|iphone|laptop|macbook|ipad|led strip|earbuds|airpods)\b/i.test(lower);
    if (!hasEra || hasModernAnachronism) return false;
  }

  if (scene.key === 'west_coast_rap') {
    const hasWestCoast = /\b(west coast|los angeles|california|palm|venice|crenshaw|lowrider|hip-hop|hip hop|rap|freestyle|g-funk)\b/i.test(lower);
    if (!hasWestCoast) return false;
  }

  if (scene.key === 'christmas_holiday') {
    const hasHoliday = /\b(christmas|xmas|holiday|carol|festive|pine tree|christmas tree|ornaments|snow|fairy lights)\b/i.test(lower);
    if (!hasHoliday) return false;
  }

  return true;
}

export function ensurePhotorealisticPrompt(
  rawPrompt: string | undefined,
  theme: Partial<Theme>,
  lyricConcept: string = '',
  tracks: Array<Partial<TrackItem>> = [],
  extraContext: string = ''
): string {
  const cleanRaw = stripTextOverlayInstructions((rawPrompt || '').replace(/\s+/g, ' ').trim());
  const scene = detectSceneProfile(theme, lyricConcept, tracks, `${extraContext} ${cleanRaw}`);
  const hasNonEnglish = (val: string) => /[\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FAF]/.test(val);
  const enSafeTheme = theme.name && !hasNonEnglish(theme.name) ? theme.name : scene.genreLabelEn;

  const noTextAndSingleFrameGuard =
    'Single continuous uninterrupted 16:9 widescreen camera perspective—strictly NO split-screen, NO diptych, NO multi-panel collage, and STRICTLY ZERO text, ZERO typography, ZERO letters, ZERO captions, ZERO titles, and ZERO watermarks anywhere inside the frame.';

  // If AI prompt is empty, short, OR misses the required lyric culture / era / subculture, generate bespoke scene!
  if (cleanRaw.length < 140 || !isPromptCoherentWithSceneAndCulture(cleanRaw, scene)) {
    return buildPhotorealisticSceneBase(
      scene,
      theme.name || 'Playlist',
      lyricConcept,
      tracks
    );
  }

  // If AI already produced a true >= 2000 character coherent prompt, keep it cleanly with zero-text & single-frame guard!
  if (cleanRaw.length >= 2000) {
    if (cleanRaw.toLowerCase().includes('no text') && cleanRaw.toLowerCase().includes('split')) {
      return cleanRaw;
    }
    return `${cleanRaw} ${noTextAndSingleFrameGuard}`.replace(/\s+/g, ' ').trim();
  }

  // Coherent 140–1999 char AI prompt: enrich with era-appropriate optical realism, center focus, and zero typography.
  const opticalSpec =
    scene.key === 'vintage_1940s_50s'
      ? `Optical Realism & Archival ${scene.eraLabel} Micro-Detail: Captured on classic ${scene.eraLabel} medium-format film camera with natural Kodachrome grain, authentic period fabric weave, warm brass/wood patina, and zero modern digital smoothness.`
      : `Optical Realism & Tactile Micro-Detail: Photographed on a full-frame Leica SL2-S with a 35mm f/1.8 APO prime lens at ISO 400 and f/2.0 aperture, preserving natural skin pores, authentic fabric textures, and genuine Kodak Portra 400 film grain without CGI gloss.`;

  const cohesiveCraftExpansion = [
    `Unified Center-Focused Composition & Visual Flow: Render this exact scene as ONE single continuous, cohesive 16:9 widescreen photograph—strictly NEVER split left-and-right into two locations, NEVER create a diptych or collage. Place the hero subject cleanly near the center focal pocket with subtle foreground leading lines and smooth background bokeh.`,
    `Cohesive Lighting Physics, Color Harmony & Atmosphere: Maintain 100% consistent ${scene.seasonEn} weather, era (${scene.eraLabel}), and color palette unified around "${enSafeTheme}" with realistic directional highlights and soft shadow roll-off.`,
    opticalSpec,
    `Strict Image Purity & Zero Typography Mandate: Keep every pixel strictly photographic—NO text overlays, NO serif titles, NO playlist words, NO corner captions, NO logos, and NO watermarks anywhere in the image.`,
  ].join(' ');

  let combined = `${cleanRaw} ${cohesiveCraftExpansion}`.replace(/\s+/g, ' ').trim();
  if (combined.length < 2050) {
    const extraDepthLayer = `Environmental Continuity & Editorial Finish: Subtle ambient depth cues—natural directional light shafts, delicate specular rim highlights, tactile material micro-contrast, and unhurried candid posture—work seamlessly together within the same unbroken location to evoke an inviting, high-CTR YouTube playlist cover aesthetic.`;
    combined = `${combined} ${extraDepthLayer}`.replace(/\s+/g, ' ').trim();
  }
  return combined;
}

function cleanTracklistNoTimestamps(tracklist: string, tracks: Array<Partial<TrackItem>>): string {
  const fromTracks = tracks
    .filter((t) => Boolean(t?.title))
    .map((t, idx) => `${String(idx + 1).padStart(2, '0')}. ${String(t.title).trim()}`)
    .join('\n');

  if (fromTracks) {
    return fromTracks;
  }

  return (tracklist || '')
    .split('\n')
    .map((line) =>
      line
        .replace(/\s*[\(\[]\s*\d{1,2}:\d{2}(?::\d{2})?\s*[\)\]]\s*$/g, '')
        .trim()
    )
    .filter(Boolean)
    .join('\n');
}

function stripTracklistFromDescription(desc: string): string {
  if (!desc) return '';
  return desc
    // Remove numbered song lines with or without timestamps (keep clean "🎧 Tracklist" marker if present)
    .replace(/\[\s*🎧?\s*tracklist\s*\]/gi, '🎧 Tracklist')
    .replace(/(?:\n|^)\s*0?\d+\.\s+[^\n]*(?:\(\s*\d{1,2}:\d{2}(?::\d{2})?\s*\))?\s*(?=\n|$)/g, '')
    .replace(/\(\s*\d{1,2}:\d{2}(?::\d{2})?\s*\)/g, '')
    .replace(/(🎧\s*Tracklist)[ \t]*\n*(?=📌)/gi, '$1\n\n\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function extractConceptFocusPhrase(cleanConcept: string): { titleLabel: string; detailSentence: string; isPreset: boolean } {
  if (!cleanConcept) {
    return { titleLabel: '', detailSentence: '', isPreset: false };
  }
  const colonIdx = cleanConcept.indexOf(':');
  if (colonIdx > 0 && colonIdx <= 24) {
    const titlePart = cleanConcept.slice(0, colonIdx).trim();
    const descPart = cleanConcept.slice(colonIdx + 1).trim();
    return {
      titleLabel: titlePart,
      detailSentence: descPart,
      isPreset: true,
    };
  }
  const compact = cleanConcept.replace(/\s+/g, ' ').trim();
  const shortLabel = compact.length <= 24 ? compact : compact.slice(0, 22).trim() + '…';
  return {
    titleLabel: shortLabel,
    detailSentence: compact,
    isPreset: false,
  };
}

function isWeakYoutubeTitle(rawTitle: string, isKorean: boolean): boolean {
  const t = (rawTitle || '').trim();
  if (!t || t.length < 18) return true;

  if (isKorean) {
    // Reject flat AI titles like "기다리던 GTA6와 함께하는 신나는 하루 | 플레이리스트"
    if (/\|\s*(플레이리스트|playlist|플리)\s*$/i.test(t) && !t.includes('•')) return true;
    if (/(와|과)\s*함께하는\s*(신나는|즐거운|특별한|행복한)\s*(하루|여정|시간|순간)/.test(t)) return true;
    if (/에\s*어울리는\s*플레이리스트/.test(t)) return true;
    if (!t.includes('|') && !/𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭|playlist/i.test(t)) return true;
  } else {
    if (/\|\s*playlist\s*$/i.test(t) && !t.includes('•')) return true;
    if (/\b(exciting day with|joyful journey with|happy day with|special moment with|anticipated)\b/i.test(t) && !t.includes('•')) return true;
    if (!t.includes('|') && !/𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭|playlist/i.test(t)) return true;
  }
  return false;
}

function isWeakYoutubeDescription(rawDesc: string, isKorean: boolean): boolean {
  const d = (rawDesc || '').trim();
  if (!d || d.length < 180) return true;

  // Reject textbook AI slop phrases
  if (
    /(경험하세요|만끽하세요|빠져보세요|음악\s*여정을\s*시작|특별한\s*순간을\s*즐겨보세요)/.test(d) ||
    /\b(experience a joyful musical journey|diving into the world of|enjoy this special moment with friends)\b/i.test(d)
  ) {
    return true;
  }

  // Must carry the 5-block YouTube playlist structure (Tracklist marker, pin CTA, hashtags)
  const hasTracklistHeader = /🎧\s*tracklist/i.test(d);
  const hasPinBlock = d.includes('📌');
  const hasHashtags = (d.match(/#[a-zA-Z0-9_\uAC00-\uD7AF]+/g) || []).length >= 4;

  if (!hasTracklistHeader || !hasPinBlock || !hasHashtags) {
    return true;
  }

  if (isKorean && !/[\uAC00-\uD7AF]{15,}/.test(d)) return true;
  if (!isKorean && !/[a-zA-Z]{30,}/.test(d)) return true;

  return false;
}

function buildConceptHookPair(
  scene: SceneProfile,
  moodDetails: LyricMoodDetails,
  cleanConcept: string,
  themeName: string
): { koHook: string; enHook: string; koEmotionDesc: string; enEmotionDesc: string } {
  const { titleLabel } = extractConceptFocusPhrase(cleanConcept);
  const lower = `${cleanConcept} ${themeName}`.toLowerCase();

  if (/첫눈에\s*반한/.test(cleanConcept)) {
    return {
      koHook: '시선이 마주친 순간 심장이 먼저 반응하잖아 💓 첫 곡부터 두근거리는',
      enHook: 'The Second Your Eyes Meet and Your Heart Skips a Beat 💓',
      koEmotionDesc: '누군가를 처음 마주한 찰나의 설렘과 자연스레 빠져드는 달콤한 떨림을 담아낸',
      enEmotionDesc: 'capturing the electric thrill of catching someone’s eye for the very first time and falling effortlessly under their spell',
    };
  }
  if (/달콤한\s*고백/.test(cleanConcept)) {
    return {
      koHook: '좋아한다는 말보다 먼저 마음을 전하고 싶은 날 💌 달콤하게 스며드는',
      enHook: 'When Every Melody Feels Like a Sweet Confession 💌',
      koEmotionDesc: '함께 웃는 평범한 순간조차 특별해지는 다정한 설렘과 진심 어린 고백의 온도를 담은',
      enEmotionDesc: 'wrapped in warm romantic affection, gentle joy, and the tender courage of an honest confession',
    };
  }
  if (/헤어짐의\s*상처/.test(cleanConcept)) {
    return {
      koHook: '말없이 이어폰을 꽂고 걷고 싶은 밤 🌙 마음이 조용히 아려오는',
      enHook: 'Songs for the Quiet Hours After Goodbye 🌙',
      koEmotionDesc: '이별 직후의 빈자리와 쉽게 잦아들지 않는 시린 감정을 담담하고 솔직하게 어루만지는',
      enEmotionDesc: 'honestly tracing the quiet ache, lingering echoes, and midnight vulnerability after parting ways',
    };
  }
  if (/과거에\s*대한\s*후회/.test(cleanConcept)) {
    return {
      koHook: '문득 그날로 되돌아가고 싶어지는 밤 🕰️ 오래된 기억이 번지는',
      enHook: 'Late-Night Melodies for the Memories We Still Rewind 🕰️',
      koEmotionDesc: '지나간 계절의 장면들과 잊히지 않는 그리움을 서정적인 선율 위에 깊게 펼쳐낸',
      enEmotionDesc: 'immersing every late-night hour in bittersweet nostalgia and unspoken longing for yesterday',
    };
  }
  if (/이별\s*후의\s*성장/.test(cleanConcept)) {
    return {
      koHook: '혼자여도 꽤 괜찮고, 오히려 더 빛나는 요즘 ✨ 기분 좋게 당당한',
      enHook: 'Standing Taller, Feeling Lighter & Glowing Solo ✨',
      koEmotionDesc: '지난 상처를 딛고 온전한 나 자신으로 단단하고 자유롭게 빛나는 회복의 에너지를 담은',
      enEmotionDesc: 'celebrating quiet resilience, self-love, and the liberating warmth of blooming stronger on your own',
    };
  }
  if (/자신감\s*표현/.test(cleanConcept)) {
    return {
      koHook: '누가 뭐래도 내 리듬대로 가는 거지 😎 틀어두면 자존감 200% 올라가는',
      enHook: 'Unapologetic Confidence & Magnetic Energy From Track One 😎',
      koEmotionDesc: '타인의 시선에 흔들리지 않는 단단한 자기 확신과 기분 좋은 여유를 불어넣어 주는',
      enEmotionDesc: 'infused with fearless self-assurance, authentic poise, and magnetic groove',
    };
  }
  if (/현실의\s*스트레스\s*해소/.test(cleanConcept)) {
    return {
      koHook: '답답한 일상 잠시 로그아웃, 리듬에 몸 맡겨버리는 밤 🔥 텐션 살아나는',
      enHook: 'Clock Out of Reality & Turn Up the Midnight Release 🔥',
      koEmotionDesc: '반복되는 지루한 하루를 시원하게 털어내고 자유로운 해방감과 생동감을 되찾아주는',
      enEmotionDesc: 'crafted to shake off everyday stress with effortless rhythm and late-night liberation',
    };
  }
  if (/순간의\s*즐거움/.test(cleanConcept)) {
    return {
      koHook: '내일 걱정은 내일로 미루고 지금 이 리듬만 즐기자 ✨ 틀어두면 기분 200%',
      enHook: 'No Worries About Tomorrow — Pure Present-Moment Groove ✨',
      koEmotionDesc: '지금 이 순간의 청춘과 반짝이는 에너지를 가장 세련된 사운드로 만끽하게 해주는',
      enEmotionDesc: 'radiating carefree youth, sunlit optimism, and pure in-the-moment vitality',
    };
  }
  if (/역경\s*극복/.test(cleanConcept)) {
    return {
      koHook: '조금 늦어도 결국 해낼 거니까 🌤️ 지친 마음을 다시 일으켜 세우는',
      enHook: 'Through Heavy Clouds Toward Brighter Ground 🌤️',
      koEmotionDesc: '쉽게 지치는 날에도 다시 한 걸음 내딛을 수 있도록 따뜻한 용기와 단단한 위로를 건네는',
      enEmotionDesc: 'offering steady encouragement, quiet grit, and uplifting resolve through every storm',
    };
  }
  if (/더\s*나은\s*미래/.test(cleanConcept)) {
    return {
      koHook: '새로운 시작을 앞둔 설레는 아침 ☀️ 꿈을 향해 달려가는 시간을 채워줄',
      enHook: 'Fresh Horizons & Fearless Momentum for What Comes Next ☀️',
      koEmotionDesc: '더 나은 내일을 준비하는 설렘과 목표를 향한 멈추지 않는 열정을 경쾌하게 담아낸',
      enEmotionDesc: 'bright with fresh-start anticipation, clear focus, and unstoppable forward momentum',
    };
  }

  // Custom user free-text concept (e.g. GTA6, weekend morning, cafe wait, drive, etc.)
  if (titleLabel) {
    const cleanFocus = titleLabel.replace(/[.!?~]+$/, '');
    const asciiTokens = cleanFocus.match(/[A-Za-z0-9][A-Za-z0-9\s&+-]{1,20}/g);
    const enFocus = !/[\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FAF]/.test(cleanFocus)
      ? cleanFocus
      : asciiTokens && asciiTokens.join(' ').trim().length >= 2
      ? asciiTokens.join(' ').trim()
      : '';
    const isEnergetic = moodDetails.emotionKey === 'confident_groove' || /(gta|게임|파티|신나|드라이브|질주|밤샘|힙합|랩)/i.test(lower);
    const isMelancholic = moodDetails.emotionKey === 'heartbreak_melancholy';

    if (isEnergetic) {
      return {
        koHook: `"${cleanFocus}" 기다리던 순간처럼 텐션 확 끌어올리는 🔥 한 번 틀면 못 끄는`,
        enHook: enFocus ? `Locked-In Momentum & High-Energy Vibes for ${enFocus} 🔥` : `Locked-In Momentum & High-Energy Vibes From Track One 🔥`,
        koEmotionDesc: `'${cleanFocus}'의 설렘과 기다려온 에너지를 세련된 비트와 감각적인 무드로 풀어낸`,
        enEmotionDesc: enFocus
          ? `channeling the electric anticipation of ${enFocus} into crisp rhythm and magnetic momentum`
          : `channeling pure anticipation into crisp rhythm and magnetic momentum`,
      };
    }
    if (isMelancholic) {
      return {
        koHook: `'${cleanFocus}' 떠올리며 조용히 틀어두기 좋은 🌙 여운이 깊게 남는`,
        enHook: enFocus ? `Quietly Resonating Through ${enFocus} Hours 🌙` : `Quiet Midnight Melodies With Deep Lingering Echoes 🌙`,
        koEmotionDesc: `'${cleanFocus}'의 섬세한 감정선과 서사를 깊이 있는 선율로 담아낸`,
        enEmotionDesc: enFocus
          ? `weaving the intimate mood of ${enFocus} into reflective, deeply textured soundscapes`
          : `weaving delicate midnight emotion into reflective, deeply textured soundscapes`,
      };
    }
    return {
      koHook: `'${cleanFocus}' 무드 그대로, 첫 곡부터 분위기 미쳤음 ✨ 하루를 채워주는`,
      enHook: enFocus ? `Instant Atmosphere & Effortless Flow for ${enFocus} ✨` : `Instant Atmosphere & Effortless Flow From Track One ✨`,
      koEmotionDesc: `'${cleanFocus}'의 감성과 장면들을 감각적인 사운드로 촘촘히 엮어낸`,
      enEmotionDesc: enFocus
        ? `translating the atmosphere of ${enFocus} into an effortlessly cohesive listening flow`
        : `weaving rich everyday atmosphere into an effortlessly cohesive listening flow`,
    };
  }

  return {
    koHook: '',
    enHook: '',
    koEmotionDesc: '',
    enEmotionDesc: '',
  };
}

function buildEditorialTitlePair(
  scene: SceneProfile,
  moodDetails: LyricMoodDetails,
  theme: Partial<Theme>,
  cleanConcept: string
): { ko: string; en: string } {
  const hook = buildConceptHookPair(scene, moodDetails, cleanConcept, theme.name || '');
  const hasConceptHook = Boolean(hook.koHook);

  const genreSuffixByScene: Record<SceneProfile['key'], { ko: string; en: string; emoji: string }> = {
    christmas_holiday: {
      ko: 'Christmas Groove Pop • 연말 매장 • 카페음악',
      en: 'Christmas Groove Pop • Cozy Holiday Mix',
      emoji: '🎄❄️',
    },
    sunday_cafe: {
      ko: 'Groove Pop • 카페음악 • 매장음악 • 노동요',
      en: 'Sunday Café Groove Pop • Chill & Work Mix',
      emoji: '☕️🎧',
    },
    rainy_autumn: {
      ko: 'Feel-Good Autumn Pop • 카페음악 • 노동요',
      en: 'Feel-Good Autumn Pop • Rainy Day Vibes',
      emoji: '🍁🌧️',
    },
    sunny_autumn_cafe: {
      ko: 'Good Day Acoustic Pop • 카페 • 매장음악',
      en: 'Sunlit Autumn Acoustic Pop • Café Vibes',
      emoji: '🍂☀️',
    },
    romantic_groove: {
      ko: 'Groove Pop • Chill Mood • 카페음악 • 매장음악',
      en: 'Chill Groove Pop • Café & Everyday Vibes',
      emoji: '🎧✨',
    },
    night_drive: {
      ko: '감성 알앤비 • 힙합 • 새벽 드라이브 • 작업실',
      en: 'Korean Chill R&B • Hip-Hop • Midnight Drive',
      emoji: '🌙🚘',
    },
    tokyo_rain: {
      ko: 'Electronic R&B J-POP • 시티팝 • 새벽 감성',
      en: 'Electronic R&B J-POP • Midnight Tokyo Mix',
      emoji: '🌧️🌃',
    },
    vintage_1940s_50s: {
      ko: `${scene.eraLabel} Vintage Pop • 레트로 라운지 • 카페음악`,
      en: `${scene.eraLabel} Vintage Pop • Classic Shellac Lounge`,
      emoji: '📻🕯️',
    },
    west_coast_rap: {
      ko: 'West Coast Freestyle Rap • G-Funk • 드라이브 힙합',
      en: 'West Coast Freestyle Rap • California G-Funk Mix',
      emoji: '🌴🔥',
    },
    cinematic_ost: {
      ko: 'Cinematic OST • 감성 발라드 • 새벽 사색',
      en: 'Cinematic OST Ballads • Film Score Mood',
      emoji: '🎬🌙',
    },
  };

  const suffix = genreSuffixByScene[scene.key];

  if (hasConceptHook) {
    return {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | ${hook.koHook} 플레이리스트 | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | ${hook.enHook} | ${suffix.en}`,
    };
  }

  const defaultByScene: Record<SceneProfile['key'], { ko: string; en: string }> = {
    christmas_holiday: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 와, 이런 노래라면 크리스마스가 너무 기다려지잖아...🎄❄️ 첫 곡부터 기분 설레는 플리 | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | If Christmas Sounds Like This, December Can't Come Soon Enough 🎄❄️ | ${suffix.en}`,
    },
    sunday_cafe: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 커피 한 잔만 마시러 했는데, 어느새 세 시간 ☕️ | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Came In for One Coffee, Stayed Three Hours ☕️🎧 | ${suffix.en}`,
    },
    rainy_autumn: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 너와 걷던 그 거리, 가을비 내린 날 하루 종일 틀어두고 싶은 플리 🍁🌧️ | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Rain-Kissed Autumn Streets & All-Day Feel-Good Pop 🍁🌧️ | ${suffix.en}`,
    },
    sunny_autumn_cafe: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 햇살 좋은 창가, 틀어두면 공간 분위기 200% 올라가는 팝송 🍂☀️ | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Sunlit Café Window & Effortless Acoustic Warmth 🍂☀️ | ${suffix.en}`,
    },
    romantic_groove: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 우연히 틀었는데, 첫 곡부터 분위기 미쳤음 ✨🎧 | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Pressed Play Once and the Whole Room Caught the Vibe ✨🎧 | ${suffix.en}`,
    },
    night_drive: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 새벽 공기 마시며 듣는 적당히 몽환적인 칠 알앤비 힙합 🌙🚘 | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Midnight City Lights & Smooth Nocturnal R&B Hip-Hop 🌙🚘 | ${suffix.en}`,
    },
    tokyo_rain: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 이 음악을 듣는 순간, 비 내리는 도쿄의 밤이 시작된다 🌧️🌃 | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Rain Against Tokyo Glass & Deep Electronic R&B 🌧️🌃 | ${suffix.en}`,
    },
    vintage_1940s_50s: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 오래된 축음기 바늘 소리처럼 따뜻한 ${scene.eraLabel} 빈티지 팝 감성 📻🕯️ | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Warm ${scene.eraLabel} Shellac Crackle & Timeless Parlor Ballads 📻🕯️ | ${suffix.en}`,
    },
    west_coast_rap: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 캘리포니아 선셋 아래 흐르는 묵직한 웨스트 코스트 프리스타일 랩 🌴🔥 | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Pacific Sunset Cruise — Raw West Coast Freestyle & G-Funk 🌴🔥 | ${suffix.en}`,
    },
    cinematic_ost: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 영화 엔딩 크레딧이 올라간 뒤에도 오래 남는 깊은 여운 🎬🌙 | ${suffix.ko}`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Lingering Scenes After the Credits Roll — Cinematic OST Ballads 🎬🌙 | ${suffix.en}`,
    },
  };

  return defaultByScene[scene.key];
}

function buildEditorialDescriptionPair(
  scene: SceneProfile,
  moodDetails: LyricMoodDetails,
  theme: Partial<Theme>,
  cleanConcept: string
): { ko: string; en: string } {
  const hook = buildConceptHookPair(scene, moodDetails, cleanConcept, theme.name || '');

  interface DescConfig {
    line1Ko: string;
    line2Ko: string;
    situationsKo: string;
    wishKo: string;
    pinKo: string;
    ctaKo: string;
    tagsKo: string;
    line1En: string;
    line2En: string;
    situationsEn: string;
    wishEn: string;
    pinEn: string;
    ctaEn: string;
    tagsEn: string;
  }

  const byScene: Record<SceneProfile['key'], DescConfig> = {
    christmas_holiday: {
      line1Ko: `소복이 눈 내리는 겨울 도심, 반짝이는 조명 아래 따뜻함과 설렘을 더해주는 크리스마스 그루브 팝 플레이리스트입니다.`,
      line2Ko: `신나면서도 들뜨지 않는 세련된 리듬으로 카페, 매장, 그리고 당신의 겨울 일상을 한층 더 특별하게 채워보세요. 🎄✨`,
      situationsKo: `연말 매장 BGM은 물론, 크리스마스 시즌 드라이브, 홈파티, 작업 시간에도 분위기를 끌어올려 줍니다.`,
      wishKo: `미리 만나는 크리스마스 감성과 함께 감각적이고 따뜻한 하루 보내세요!`,
      pinKo: `📌 이 영상은 공간에 시즌 감성을 더하는 세련된 사운드를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 연말 분위기를 함께 나눠주세요!`,
      tagsKo: `#크리스마스플레이리스트 #카페음악 #매장BGM #크리스마스팝송 #연말팝송 #GroovePop #겨울드라이브 #노동요 #XmasBGM`,
      line1En: `Soft snow drifting over glowing winter streets, this Christmas groove pop playlist brings cozy warmth and festive anticipation to every corner.`,
      line2En: `Let its upbeat yet effortlessly refined rhythm elevate your café, retail floor, or quiet winter afternoon at home. 🎄✨`,
      situationsEn: `Ideal for holiday retail & café BGM, festive evening drives, cozy house parties, and focused creative work sessions.`,
      wishEn: `Wishing you a stylish, heartwarming day wrapped in early Christmas spirit!`,
      pinEn: `📌 Curated to bring sophisticated seasonal warmth and polished soundscapes to every space.`,
      ctaEn: `If you enjoyed the vibe and music, please subscribe, like, and turn on notifications to share the holiday mood together!`,
      tagsEn: `#ChristmasPlaylist #CafeMusic #StoreBGM #HolidayPop #GroovePop #WinterDrive #WorkBGM #XmasVibes #CozyPlaylist`,
    },
    sunday_cafe: {
      line1Ko: `햇살이 부드럽게 스며드는 여유로운 카페 창가, 기분 좋은 설렘과 포근한 온기를 더해주는 그루브 팝 플레이리스트입니다.`,
      line2Ko: `대화를 방해하지 않으면서도 리듬감이 살아있는 세련된 사운드로 카페, 매장, 그리고 당신의 주말 일상을 특별하게 채워보세요. ☕️🎧`,
      situationsKo: `트렌디한 카페·편집숍 BGM은 물론, 주말 드라이브, 브런치 타임, 집중이 필요한 작업 시간에도 기분 좋게 어울립니다.`,
      wishKo: `기분 좋은 그루브와 함께 감각적이고 여유로운 하루 보내세요!`,
      pinKo: `📌 이 영상은 머무는 공간의 공기를 기분 좋게 바꿔주는 세련된 그루브 사운드를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 기분 좋은 음악 일상을 함께 나눠주세요!`,
      tagsKo: `#그루브팝 #카페음악 #매장BGM #일요일플레이리스트 #감성팝송 #GroovePop #브런치BGM #노동요 #CafePlaylist`,
      line1En: `Sunlight spilling across warm oak café tables, this Sunday groove pop playlist brings effortless warmth and an uplifting spark to your day.`,
      line2En: `Crafted with smooth, conversation-friendly grooves to elevate coffee shops, retail spaces, and unhurried weekend mornings. ☕️🎧`,
      situationsEn: `Perfect for boutique café & store BGM, weekend brunch, sunlit drives, and creative study or work sessions.`,
      wishEn: `Have an inspiring, feel-good day carried by warm rhythms and sunny vibes!`,
      pinEn: `📌 Curated to bring refined groove-driven ambiance that elevates every room you step into.`,
      ctaEn: `If this playlist brightened your day, please subscribe, like, and turn on notifications to share more vibes together!`,
      tagsEn: `#GroovePop #SundayCafe #CafeMusic #StoreBGM #FeelGoodPop #BrunchVibes #ChillPlaylist #WorkMusic #RetailBGM`,
    },
    rainy_autumn: {
      line1Ko: `촉촉하게 젖은 가을 거리와 낙엽 사이, 차분한 여운과 기분 좋은 리듬을 함께 전하는 감성 그루브 팝 플레이리스트입니다.`,
      line2Ko: `잔잔하면서도 감각적인 멜로디로 카페 창가, 작업 공간, 그리고 당신의 계절 일상을 한층 깊게 채워보세요. 🍁🌧️`,
      situationsKo: `비 오는 날 매장 BGM은 물론, 가을 드라이브, 독서, 조용히 집중하는 작업·공부 시간에도 분위기를 더해줍니다.`,
      wishKo: `가을비의 차분한 감성과 함께 따뜻하고 여유로운 하루 보내세요!`,
      pinKo: `📌 이 영상은 계절의 결을 섬세하게 담아낸 감성 사운드를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 가을 감성을 함께 나눠주세요!`,
      tagsKo: `#가을플레이리스트 #비오는날음악 #카페음악 #매장BGM #감성팝송 #AutumnPop #GroovePop #노동요 #RainyDayBGM`,
      line1En: `Rain-glistened autumn avenues and golden leaves drifting past the glass, this feel-good autumn pop mix pairs cozy warmth with crisp groove.`,
      line2En: `Let its smooth melodies enrich quiet coffee corners, boutique spaces, and every unhurried rainy afternoon. 🍁🌧️`,
      situationsEn: `Designed for rainy-day café BGM, scenic autumn drives, reading hours, and steady creative focus.`,
      wishEn: `Stay warm and enjoy a calm, deeply atmospheric day!`,
      pinEn: `📌 Curated to capture rich seasonal texture and clean, modern listening comfort.`,
      ctaEn: `If you loved the mood, subscribe, like, and hit the bell to share more seasonal playlists together!`,
      tagsEn: `#AutumnPlaylist #RainyDayMusic #CafeMusic #StoreBGM #AutumnPop #GroovePop #StudyBGM #CozyVibes #FeelGoodMix`,
    },
    sunny_autumn_cafe: {
      line1Ko: `선선한 가을 바람과 황금빛 햇살 아래, 편안하고 기분 좋은 온기를 더해주는 어쿠스틱 그루브 팝 플레이리스트입니다.`,
      line2Ko: `과하지 않으면서도 경쾌하게 흐르는 리듬으로 카페, 쇼룸, 그리고 당신의 오후 일상을 더욱 감각적으로 채워보세요. 🍂☀️`,
      situationsKo: `감성 카페·매장 BGM은 물론, 나른한 오후 산책과 드라이브, 작업 및 노동요로도 자연스럽게 스며듭니다.`,
      wishKo: `따스한 가을 햇살처럼 기분 좋고 편안한 하루 보내세요!`,
      pinKo: `📌 이 영상은 일상의 공간을 기분 좋게 감싸는 따뜻한 사운드를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 기분 좋은 플레이리스트를 함께 나눠주세요!`,
      tagsKo: `#가을팝송 #카페음악 #매장BGM #어쿠스틱플리 #기분좋아지는음악 #GoodDayPop #AutumnVibes #노동요 #CafeBGM`,
      line1En: `Crisp autumn air and golden afternoon sunbeams, this feel-good acoustic pop mix delivers effortless warmth and breezy groove.`,
      line2En: `Smoothly balanced for sunlit cafés, curated retail floors, and relaxing everyday listening. 🍂☀️`,
      situationsEn: `Great for café & boutique BGM, golden-hour walks, afternoon drives, and light-hearted daily productivity.`,
      wishEn: `Wishing you a bright, unhurried day filled with warm autumn sunshine!`,
      pinEn: `📌 Curated to wrap everyday spaces in clean, uplifting acoustic warmth.`,
      ctaEn: `Subscribe, like, and turn on notifications if this mix brought warmth to your day!`,
      tagsEn: `#AutumnPop #AcousticPlaylist #CafeMusic #StoreBGM #GoodDayPop #SunnyVibes #WorkBGM #ChillPop #MorningPlaylist`,
    },
    romantic_groove: {
      line1Ko: `도심의 기분 좋은 햇살과 세련된 무드 아래, 일상에 설렘과 생기를 더해주는 칠 그루브 팝 플레이리스트입니다.`,
      line2Ko: `신나면서도 부담스럽지 않은 탄탄한 리듬으로 카페, 매장, 그리고 당신의 하루를 한층 더 감각적으로 채워보세요. 🎧✨`,
      situationsKo: `트렌디한 매장·카페 BGM은 물론, 시티 드라이브, 작업·노동요, 가벼운 홈파티 시간에도 분위기를 단번에 끌어올려 줍니다.`,
      wishKo: `기분 좋은 리듬의 여운과 함께 감각적이고 설레는 하루 보내세요!`,
      pinKo: `📌 이 영상은 머무는 공간에 세련된 무드와 리듬감을 더하는 사운드를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 감각적인 음악 취향을 함께 나눠주세요!`,
      tagsKo: `#그루브팝 #플레이리스트 #카페음악 #매장BGM #칠팝 #GroovePop #ChillPop #드라이브음악 #노동요`,
      line1En: `Golden city daylight and crisp modern rhythm, this chill groove pop playlist adds instant sparkle and effortless poise to your day.`,
      line2En: `Balanced with punchy basslines and airy keys to elevate cafés, retail spaces, and everyday creative routines. 🎧✨`,
      situationsEn: `Built for stylish café & store BGM, city drives, daily focus work, and laid-back evening gatherings.`,
      wishEn: `Enjoy an uplifting, stylish day carried by smooth modern grooves!`,
      pinEn: `📌 Curated for effortless modern atmosphere and polished space-filling sound.`,
      ctaEn: `If you enjoyed the playlist, subscribe, like, and turn on notifications to stay tuned for every new mix!`,
      tagsEn: `#GroovePop #ChillPop #Playlist #CafeMusic #StoreBGM #DriveMusic #WorkBGM #GoodVibes #ModernPop`,
    },
    night_drive: {
      line1Ko: `도시의 불빛이 번지는 늦은 밤과 새벽 사이, 감각적인 그루브와 짙은 여운을 더해주는 칠 알앤비 힙합 플레이리스트입니다.`,
      line2Ko: `묵직한 808 베이스와 몽환적인 리듬으로 새벽 드라이브, 작업실, 그리고 당신의 밤 시간을 더욱 깊이 있게 채워보세요. 🌙🚘`,
      situationsKo: `한적한 새벽 드라이브는 물론, 야간 작업·코딩, 혼술·휴식 시간, 감각적인 쇼룸 BGM으로도 완벽하게 어울립니다.`,
      wishKo: `도시의 밤공기와 함께 감각적이고 몰입감 깊은 밤 보내세요!`,
      pinKo: `📌 이 영상은 밤의 공기와 도시의 감성을 가장 세련되게 담아내는 사운드를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 늦은 밤 플레이리스트를 함께 나눠주세요!`,
      tagsKo: `#한국알앤비 #감성힙합 #새벽감성 #느좋플리 #드라이브음악 #KoreanRnB #ChillHipHop #작업실BGM #NightDrive`,
      line1En: `Neon reflections gliding across midnight boulevards, this nocturnal chill R&B and hip-hop mix delivers lush atmosphere and effortless pocket.`,
      line2En: `Anchored by warm Rhodes chords and deep gliding bass to color late-night drives, studio sessions, and after-hours calm. 🌙🚘`,
      situationsEn: `Tailored for midnight highway drives, late-night creative work, solo unwind hours, and moody lounge BGM.`,
      wishEn: `Have a deeply immersive, stylish night wrapped in smooth nocturnal vibes!`,
      pinEn: `📌 Curated to capture sleek nocturnal aesthetics and deep late-night sound design.`,
      ctaEn: `Subscribe, like, and turn on notifications to share more late-night R&B sessions together!`,
      tagsEn: `#KoreanRnB #ChillHipHop #NightDrive #LateNightVibes #AestheticRnB #StudyBeats #MidnightMix #LoungeBGM #SlowJam`,
    },
    tokyo_rain: {
      line1Ko: `푸른 어스름이 내려앉은 도쿄의 밤창가, 도시적 고독과 섬세한 울림을 전하는 일렉트로닉 R&B J-POP 플레이리스트입니다.`,
      line2Ko: `투명한 신스 질감과 절제된 리듬으로 혼자만의 밤, 사색의 시간, 그리고 조용한 공간을 깊이 있게 채워보세요. 🌧️🌃`,
      situationsKo: `비 오는 날 감성 휴식은 물론, 밤 산책, 집중이 필요한 작업 시간, 고요한 라운지 BGM으로도 깊은 몰입감을 선사합니다.`,
      wishKo: `차분하고 세련된 도쿄 밤의 여운과 함께 고요하고 아름다운 시간 보내세요!`,
      pinKo: `📌 이 영상은 여백과 도시적 정서를 정교하게 담아낸 하이엔드 사운드를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 깊이 있는 플레이리스트를 함께 나눠주세요!`,
      tagsKo: `#제이팝 #일본알앤비 #도쿄감성 #새벽플레이리스트 #일렉트로닉알앤비 #JPOP #AltPop #비오는날음악 #CityVibes`,
      line1En: `Indigo twilight overlooking quiet Tokyo windows, this electronic R&B J-pop playlist blends urban solitude with razor-sharp sonic elegance.`,
      line2En: `Glassy synth layers and restrained midnight grooves bring quiet emotional depth to late-night focus and rainy evenings. 🌧️🌃`,
      situationsEn: `Ideal for rainy-night reflection, solo late-night walks, deep studio focus, and minimalist lounge spaces.`,
      wishEn: `Spend a serene, deeply evocative night inside these refined Tokyo soundscapes!`,
      pinEn: `📌 Curated around atmospheric space, nocturnal clarity, and modern Japanese alt-pop artistry.`,
      ctaEn: `If this mix moved you, please subscribe, like, and hit notifications to explore more nocturnal sessions!`,
      tagsEn: `#JPOP #ElectronicRnB #TokyoNight #AltPop #RainyVibes #MidnightPlaylist #CityPopMood #StudyMusic #LateNightChill`,
    },
    vintage_1940s_50s: {
      line1Ko: `오래된 축음기에서 흘러나오는 따뜻한 바늘 소리처럼, 시대를 초월한 낭만을 전하는 ${scene.eraLabel} 빈티지 팝 플레이리스트입니다.`,
      line2Ko: `포근한 아날로그 질감과 부드러운 스윙 리듬으로 서재, 빈티지 카페, 그리고 당신의 고요한 일상을 클래식하게 채워보세요. 📻🕯️`,
      situationsKo: `엔틱 카페·라운지 BGM은 물론, 여유로운 독서와 글쓰기, 차 한 잔과 함께하는 오후 휴식 시간에도 품격을 더해줍니다.`,
      wishKo: `시간이 지나도 바래지 않는 아날로그 감성과 함께 따뜻하고 평온한 하루 보내세요!`,
      pinKo: `📌 이 영상은 세월의 온기가 살아있는 클래식 아날로그 사운드를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 시대를 초월한 명곡의 감성을 함께 나눠주세요!`,
      tagsKo: `#빈티지팝 #레트로플레이리스트 #올드팝 #카페음악 #매장BGM #VintagePop #1950sMusic #아날로그감성 #재즈라운지`,
      line1En: `Warm shellac crackle rising from an antique mahogany phonograph, this ${scene.eraLabel} vintage pop mix revives timeless mid-century romance.`,
      line2En: `Rich tube warmth, brushed swing drums, and velvet melodies transform cafés, studies, and quiet evenings into a golden era. 📻🕯️`,
      situationsEn: `Made for vintage café & parlor BGM, unhurried reading hours, afternoon tea, and nostalgic midnight unwinding.`,
      wishEn: `Enjoy a peaceful, timeless day steeped in classic analog charm!`,
      pinEn: `📌 Curated to preserve authentic mid-century tone, warmth, and intimate acoustic character.`,
      ctaEn: `If you love classic analog charm, please subscribe, like, and turn on notifications to share the nostalgia!`,
      tagsEn: `#VintagePop #1940sMusic #1950sPop #RetroLounge #ShellacVinyl #CafeMusic #AnalogVibes #ClassicBallads #OldiesMix`,
    },
    west_coast_rap: {
      line1Ko: `황금빛 노을이 내려앉은 미국 서부 LA 거리, 묵직한 베이스와 여유로운 스웨거가 살아있는 웨스트 코스트 힙합 플레이리스트입니다.`,
      line2Ko: `타이트한 붐뱁·G-Funk 그루브와 거침없는 플로우로 드라이브, 운동, 그리고 당신의 하루에 폭발적인 에너지를 채워보세요. 🌴🔥`,
      situationsKo: `선셋 시티 드라이브는 물론, 웨이트 트레이닝·런닝, 작업 텐션 부스터, 스트리트 무드 매장 BGM으로도 완벽합니다.`,
      wishKo: `거침없고 당당한 웨스트 코스트 바이브와 함께 오늘 하루도 자신감 넘치게 보내세요!`,
      pinKo: `📌 이 영상은 본토 스트리트 사운드의 타격감과 세련된 그루브를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 리얼 힙합 바이브를 함께 나눠주세요!`,
      tagsKo: `#웨스트코스트랩 #힙합플레이리스트 #프리스타일랩 #드라이브음악 #운동BGM #WestCoastRap #GFunk #HipHopMix #스트리트무드`,
      line1En: `Golden California sunset casting long shadows across palm-lined avenues, this West Coast freestyle rap mix brings pure G-Funk weight and poise.`,
      line2En: `Hard-hitting low end and razor-sharp rhythmic flow power up your drive, workout, and everyday hustle. 🌴🔥`,
      situationsEn: `Built for sunset coastal drives, gym sessions, high-energy studio work, and bold streetwear retail spaces.`,
      wishEn: `Move through the day with unshakeable confidence and effortless West Coast swagger!`,
      pinEn: `📌 Curated for crisp rhythmic punch, classic West Coast low-end, and authentic street energy.`,
      ctaEn: `Drop a like, subscribe, and hit the bell if these West Coast grooves hit your rotation!`,
      tagsEn: `#WestCoastRap #FreestyleRap #GFunk #HipHopPlaylist #DriveMusic #WorkoutBGM #CaliforniaVibes #RapMix #StreetGroove`,
    },
    cinematic_ost: {
      line1Ko: `한 편의 영화가 끝난 뒤에도 마음속에 오래 머무는 장면처럼, 깊은 서사와 울림을 전하는 시네마틱 OST 발라드 플레이리스트입니다.`,
      line2Ko: `섬세한 피아노 선율과 웅장하게 번지는 현악 사운드로 사색의 밤, 작업 시간, 그리고 당신의 내면을 진하게 채워보세요. 🎬🌙`,
      situationsKo: `글쓰기와 깊은 사색이 필요한 시간은 물론, 하루를 마무리하는 저녁 산책, 감성적인 야간 드라이브에도 깊은 여운을 남깁니다.`,
      wishKo: `마음에 조용히 스며드는 영화 같은 선율과 함께 따뜻하고 평온한 시간 보내세요!`,
      pinKo: `📌 이 영상은 한 편의 영화처럼 감정의 결을 섬세하게 따라가는 사운드를 지향합니다.`,
      ctaKo: `영상과 음악이 마음에 드셨다면 구독과 좋아요, 알림 설정으로 깊은 여운이 남는 음악을 함께 나눠주세요!`,
      tagsKo: `#영화OST #시네마틱발라드 #감성발라드 #플레이리스트 #새벽감성 #CinematicOST #FilmMusic #휴식음악 #사색BGM`,
      line1En: `Like the lingering final frame of an unforgettable film, this cinematic OST ballad playlist delivers sweeping emotion and intimate storytelling.`,
      line2En: `Delicate felt piano and soaring orchestral strings enrich quiet reflection, creative writing, and late-night listening. 🎬🌙`,
      situationsEn: `Ideal for deep study, reflective writing, sunset strolls, and quiet emotional unwinding after a long day.`,
      wishEn: `May these cinematic melodies bring calm, beauty, and quiet strength to your evening!`,
      pinEn: `📌 Curated to trace heartfelt cinematic arcs and lush acoustic emotion.`,
      ctaEn: `Subscribe, like, and turn on notifications if these film-score ballads touched your heart!`,
      tagsEn: `#CinematicOST #MovieBallads #FilmScore #EmotionalPlaylist #PianoStrings #StudyMusic #NightReflection #HealingBGM #OSTVibes`,
    },
  };

  const cfg = byScene[scene.key];
  const cleanGenreLabelKo = scene.genreLabelKo.replace(/\s*(플레이리스트|플리|모음)\s*$/g, '').trim() || scene.genreLabelKo;
  const line1Ko = hook.koEmotionDesc
    ? `${scene.seasonKo}, ${hook.koEmotionDesc} ${cleanGenreLabelKo} 플레이리스트입니다.`
    : cfg.line1Ko;
  const line1En = hook.enEmotionDesc
    ? `${scene.seasonEn.charAt(0).toUpperCase() + scene.seasonEn.slice(1)} — ${hook.enEmotionDesc}, this ${scene.genreLabelEn.replace(/\s*playlist\s*$/i, '').trim()} playlist sets the exact mood.`
    : cfg.line1En;

  const ko = [
    `${line1Ko}\n${cfg.line2Ko}`,
    `${cfg.situationsKo}\n${cfg.wishKo}`,
    `🎧 Tracklist\n\n`,
    `${cfg.pinKo}\n${cfg.ctaKo}`,
    cfg.tagsKo,
  ].join('\n\n');

  const en = [
    `${line1En}\n${cfg.line2En}`,
    `${cfg.situationsEn}\n${cfg.wishEn}`,
    `🎧 Tracklist\n\n`,
    `${cfg.pinEn}\n${cfg.ctaEn}`,
    cfg.tagsEn,
  ].join('\n\n');

  return { ko, en };
}

export function buildCuratedYoutubePackage(
  aiYoutube: Partial<YoutubePackage> | undefined,
  tracks: Array<Partial<TrackItem>>,
  theme: Partial<Theme>,
  lyricConcept: string = '',
  tracklist: string = ''
): YoutubePackage {
  const cleanConcept = (lyricConcept || '').trim();
  const rawContextForScene = [
    aiYoutube?.titleKo || '',
    aiYoutube?.titleEn || '',
    aiYoutube?.title || '',
    aiYoutube?.thumbnailPrompt || '',
  ].join(' ');

  const scene = detectSceneProfile(theme, cleanConcept, tracks, rawContextForScene);
  const moodDetails = extractLyricMoodDetails(tracks, cleanConcept, theme);
  const cleanTracklist = cleanTracklistNoTimestamps(tracklist, tracks);

  const editorialTitles = buildEditorialTitlePair(scene, moodDetails, theme, cleanConcept);
  const rawAiTitle = (aiYoutube?.title || '').trim();
  const hasHangulInRaw = /[\uAC00-\uD7AF]/.test(rawAiTitle);
  const candidateTitleKo = (aiYoutube?.titleKo || '').trim() || (hasHangulInRaw ? rawAiTitle : '');
  const candidateTitleEn = (aiYoutube?.titleEn || '').trim() || (!hasHangulInRaw && rawAiTitle ? rawAiTitle : '');

  const titleKo = !isWeakYoutubeTitle(candidateTitleKo, true) ? candidateTitleKo : editorialTitles.ko;
  const titleEn = !isWeakYoutubeTitle(candidateTitleEn, false) ? candidateTitleEn : editorialTitles.en;

  const editorialDescs = buildEditorialDescriptionPair(scene, moodDetails, theme, cleanConcept);
  const rawAiDesc = (aiYoutube?.description || '').trim();
  const hasHangulInDesc = /[\uAC00-\uD7AF]/.test(rawAiDesc);
  const candidateDescKo = stripTracklistFromDescription(
    (aiYoutube?.descriptionKo || '').trim() || (hasHangulInDesc ? rawAiDesc : '')
  );
  const candidateDescEn = stripTracklistFromDescription(
    (aiYoutube?.descriptionEn || '').trim() || (!hasHangulInDesc && rawAiDesc ? rawAiDesc : '')
  );

  const descriptionKo = !isWeakYoutubeDescription(candidateDescKo, true) ? candidateDescKo : editorialDescs.ko;
  const descriptionEn = !isWeakYoutubeDescription(candidateDescEn, false) ? candidateDescEn : editorialDescs.en;

  const hashtags = normalizeFiveHashtags(aiYoutube?.hashtags, theme, cleanConcept, tracks, rawContextForScene);
  const thumbnailPrompt = ensurePhotorealisticPrompt(
    aiYoutube?.thumbnailPrompt,
    theme,
    cleanConcept,
    tracks,
    rawContextForScene
  );

  return {
    title: `${titleKo}\n${titleEn}`,
    titleKo,
    titleEn,
    description: `[한국어]\n${descriptionKo}\n\n[English]\n${descriptionEn}`,
    descriptionKo,
    descriptionEn,
    tracklist: cleanTracklist,
    hashtags,
    thumbnailPrompt,
  };
}
