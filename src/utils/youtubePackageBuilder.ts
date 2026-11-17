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

  const isHeartbreak =
    /\b(lonely|loneliness|devastating|heartbreak|goodbye|farewell|miss you|empty|hollow|tears|sorrow|broken)\b/i.test(fullText) ||
    /(이별|그리움|외로움|공허|눈물|쓸쓸|아쉬운|헤어짐|혼자|고독|寂し|涙|さよなら)/.test(fullText);

  const isConfident =
    /\b(west\s*coast|freestyle|cypher|swagger|lowrider|g-funk|hip-hop|hip\s*hop|rap|flex)\b/i.test(fullText) ||
    /(자신감|프리스타일|힙합|랩)/.test(fullText);

  const isNostalgic =
    /\b(nostalgic|memories|yesterday|vintage|antique|gramophone|letter|photograph|remember)\b/i.test(fullText) ||
    /(추억|기억|오래된|옛날|향수|그때|필름|축음기)/.test(fullText);

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
      : 'effortless street-level rhythm, laid-back confidence, and authentic artistic poise';
    expressionEn = 'carrying a calm, self-assured expression with relaxed rhythmic poise and authentic charismatic presence';
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
    .replace(/\n*\[\s*🎧?\s*tracklist\s*\][\s\S]*?(?=\n\n[^\d\n]|$)/gi, '')
    .replace(/\n*tracklist\s*:?\s*\n(?:\s*\d{1,2}\..*(?:\n|$))+/gi, '')
    .replace(/(?:\n|^)\s*0?\d+\.\s+[^\n]*\(\s*\d{1,2}:\d{2}\s*\)\s*(?=\n|$)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildCuratedYoutubePackage(
  aiYoutube: Partial<YoutubePackage> | undefined,
  tracks: Array<Partial<TrackItem>>,
  theme: Partial<Theme>,
  lyricConcept: string = '',
  tracklist: string = ''
): YoutubePackage {
  const cleanConcept = (lyricConcept || '').trim();
  const isEnglishAscii = (val: string) => Boolean(val) && !/[\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FAF]/.test(val);
  const rawContextForScene = [
    aiYoutube?.titleKo || '',
    aiYoutube?.titleEn || '',
    aiYoutube?.title || '',
    aiYoutube?.thumbnailPrompt || '',
  ].join(' ');

  const scene = detectSceneProfile(theme, cleanConcept, tracks, rawContextForScene);
  const cleanTracklist = cleanTracklistNoTimestamps(tracklist, tracks);
  const trackNames = tracks.map((t) => t.title).filter(Boolean).slice(0, 4);
  const trackHighlightKo = trackNames.length > 0 ? `'${trackNames.join("', '")}'` : `'${theme.name || '감성 트랙'}'`;
  const trackHighlightEn = trackNames.length > 0 ? `'${trackNames.join("', '")}'` : `'${isEnglishAscii(theme.name || '') ? theme.name : scene.genreLabelEn}'`;

  const conceptSuffixKo = cleanConcept && cleanConcept.length <= 16 ? ` (${cleanConcept})` : '';
  const conceptSuffixEn = isEnglishAscii(cleanConcept) && cleanConcept.length <= 24 ? ` (${cleanConcept})` : '';

  const fallbackTitlesByScene: Record<SceneProfile['key'], { ko: string; en: string }> = {
    sunday_cafe: {
      ko: `일요일 카페에서 기분 좋아지는 그루브 팝 모음${conceptSuffixKo} 🎧 | Sunday Cafe Vibes`,
      en: `Feel-Good Groove Pop Playlist from the Sunday Cafe${conceptSuffixEn} 🎧 | Sunday Cafe Vibes`,
    },
    christmas_holiday: {
      ko: `눈 내리는 겨울밤, 마음이 따뜻해지는 크리스마스 캐롤 플레이리스트${conceptSuffixKo} 🎄❄️ | Christmas & Carol Vibes`,
      en: `Snowy Winter Eve & Warm Festive Christmas Carols Playlist${conceptSuffixEn} 🎄❄️ | Holiday Classics Mix`,
    },
    west_coast_rap: {
      ko: `캘리포니아 선셋 아래 흐르는 웨스트 코스트 프리스타일 랩 믹스${conceptSuffixKo} 🌴🔥 | West Coast Hip-Hop`,
      en: `Golden Hour California Cruise — West Coast Freestyle Rap & G-Funk Mix${conceptSuffixEn} 🌴🔥 | West Coast Vibes`,
    },
    rainy_autumn: {
      ko: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 너와 걷던 그 거리 🍁🌧️ 가을비 내린 날 하루 종일 듣고 싶은 감성 플리${conceptSuffixKo} | 𝐅𝐞𝐞𝐥-𝐆𝐨𝐨𝐝 𝐀𝐮𝐭𝐮𝐦𝐧 𝐏𝐨𝐩 • 카페음악 • 노동요`,
      en: `𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Walking Those Rain-Kissed Streets With You 🍁🌧️ All-Day Feel-Good Autumn Pop${conceptSuffixEn} | Cafe & Work Vibes`,
    },
    sunny_autumn_cafe: {
      ko: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 햇살 좋은 가을 창가, 여유롭고 편안하게 흐르는 감성 카페 플리${conceptSuffixKo} 🍂☀️ | Good Day Acoustic Pop`,
      en: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Sunlit Autumn Café Window & Effortless Feel-Good Acoustic Vibes${conceptSuffixEn} 🍂☀️ | Good Day Pop`,
    },
    romantic_groove: {
      ko: `지금 계절에 딱 맞는 설레는 분위기 ✨🍂 첫 곡부터 기분 좋아지는 그루브 팝 모음${conceptSuffixKo} 🎧 | Good Day Groove Pop`,
      en: `The Exact Mood This Season Calls For ✨🍂 Uplifting Romantic Groove Pop From Track One${conceptSuffixEn} 🎧 | Good Day Groove Pop`,
    },
    night_drive: {
      ko: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 새벽 도로 위 네온 불빛처럼 번지는 감각적인 칠 알앤비 힙합${conceptSuffixKo} 🌙✨ | Late Night Aesthetic R&B`,
      en: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Late Night City Highway & Dreamy Chill R&B Groove${conceptSuffixEn} 🌙✨ | Midnight Drive Mix`,
    },
    tokyo_rain: {
      ko: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 비 내리는 도쿄의 밤창가, 고요하게 스며드는 시티팝 · R&B 모음${conceptSuffixKo} 🌧️🌙 | Midnight Tokyo Alt-Pop`,
      en: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Rainy Midnight Window in Tokyo & Sophisticated Electronic R&B J-Pop${conceptSuffixEn} 🌧️🌙 | Alt-Pop City Mix`,
    },
    vintage_1940s_50s: {
      ko: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 오래된 축음기 바늘 소리처럼 따뜻한 ${scene.eraLabel} 빈티지 팝 감성${conceptSuffixKo} 📻🕯️ | ${scene.eraLabel} Vintage Lounge`,
      en: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Warm ${scene.eraLabel} Shellac Phonograph & Timeless Vinyl Lounge Memories${conceptSuffixEn} 📻🕯️ | Vintage Classics`,
    },
    cinematic_ost: {
      ko: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 한 편의 영화가 끝난 뒤에도 남는 깊은 여운, 시네마틱 발라드 모음${conceptSuffixKo} 🎬🌙 | Cinematic OST Ballads`,
      en: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Lingering Scenes After the Credits Roll — Deep Cinematic OST Ballads${conceptSuffixEn} 🎬🌙 | Film Score Vocal Mix`,
    },
  };

  const defaultPair = fallbackTitlesByScene[scene.key];
  const rawAiTitle = (aiYoutube?.title || '').trim();
  const hasHangulInRaw = /[\uAC00-\uD7AF]/.test(rawAiTitle);
  const titleKo = (aiYoutube?.titleKo || '').trim() || (hasHangulInRaw ? rawAiTitle : defaultPair.ko);
  const titleEn = (aiYoutube?.titleEn || '').trim() || (!hasHangulInRaw && rawAiTitle ? rawAiTitle : defaultPair.en);

  const defaultDescKo = [
    `${scene.seasonKo}, ${scene.locationKo}의 온기를 그대로 담아낸 플레이리스트입니다.`,
    cleanConcept
      ? `이번 플레이리스트는 '${cleanConcept}' 컨셉을 중심으로 곡의 서사와 리듬, 따뜻한 무드를 섬세하게 엮어 구성했습니다.`
      : `첫 곡부터 마지막 트랙까지 기분 좋은 흐름으로 자연스럽게 이어지도록 기획했습니다.`,
    `수록곡 ${trackHighlightKo} 등을 따라가며 카페 BGM, 작업/노동요, 여유로운 산책과 휴식 시간까지 온전히 즐겨보세요. ☕️🎧`,
  ].join('\n');

  const enThemeTitle = isEnglishAscii(theme.name || '') ? theme.name : scene.genreLabelEn;
  const defaultDescEn = [
    `Welcome to "${enThemeTitle}", capturing the atmosphere of ${scene.seasonEn} across ${scene.locationEn}.`,
    isEnglishAscii(cleanConcept)
      ? `Built around the central storytelling mood of "${cleanConcept}", each track weaves authentic groove, texture, and emotion from start to finish.`
      : `Built around the signature mood of ${scene.moodLabelEn}, each track flows seamlessly from the opening beat to the final note.`,
    `Featuring ${trackHighlightEn}, this curated mix brings immersive character to every listening moment. ☕️🎧`,
  ].join('\n');

  const rawAiDesc = (aiYoutube?.description || '').trim();
  const hasHangulInDesc = /[\uAC00-\uD7AF]/.test(rawAiDesc);
  const rawDescKo = (aiYoutube?.descriptionKo || '').trim() || (hasHangulInDesc ? rawAiDesc : defaultDescKo);
  const rawDescEn = (aiYoutube?.descriptionEn || '').trim() || (!hasHangulInDesc && rawAiDesc ? rawAiDesc : defaultDescEn);

  const descriptionKo = stripTracklistFromDescription(rawDescKo) || defaultDescKo;
  const descriptionEn = stripTracklistFromDescription(rawDescEn) || defaultDescEn;

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
