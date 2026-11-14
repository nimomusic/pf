import type { Theme, TrackItem, YoutubePackage } from '../types.ts';

export interface SceneProfile {
  key:
    | 'christmas_nyc'
    | 'sunday_cafe'
    | 'rainy_autumn'
    | 'sunny_autumn_cafe'
    | 'romantic_groove'
    | 'night_drive'
    | 'tokyo_rain'
    | 'vintage_1940s'
    | 'cinematic_ost';
  seasonEn: string;
  seasonKo: string;
  locationEn: string;
  locationKo: string;
  genreLabelEn: string;
  genreLabelKo: string;
  moodLabelEn: string;
  moodLabelKo: string;
}

export function detectSceneProfile(
  theme: Partial<Theme>,
  lyricConcept: string = '',
  tracks: Array<Partial<TrackItem>> = [],
  extraContext: string = ''
): SceneProfile {
  const trackText = tracks.map((t) => `${t.title || ''} ${t.mood || ''} ${t.metaInfo?.genre || ''}`).join(' ');
  // Prioritize active concept, generated title, and track titles BEFORE full SOP text
  // so incidental SOP words (e.g. "rain") don't override a sunny Sunday Cafe playlist!
  const activeContext = `${extraContext} ${lyricConcept} ${trackText} ${theme.name || ''} ${theme.category || ''}`.toLowerCase();
  const sopContext = `${theme.sop || ''}`.toLowerCase();
  const combined = `${activeContext} ${sopContext}`;

  if (combined.includes('shellac') || combined.includes('phonograph') || combined.includes('78 rpm') || combined.includes('1940')) {
    return {
      key: 'vintage_1940s',
      seasonEn: 'warm timeless twilight',
      seasonKo: '아늑한 빈티지 저녁',
      locationEn: 'antique mahogany parlor with an oak gramophone glowing under warm lamp light',
      locationKo: '앤티크 축음기가 놓인 따뜻한 빈티지 거실',
      genreLabelEn: '1940s Vintage Pop',
      genreLabelKo: '1940s 빈티지 팝',
      moodLabelEn: 'Nostalgic Gramophone Memories',
      moodLabelKo: '아날로그 축음기 감성',
    };
  }

  if (
    activeContext.includes('christmas') ||
    activeContext.includes('크리스마스') ||
    activeContext.includes('xmas') ||
    activeContext.includes('carol') ||
    activeContext.includes('holiday') ||
    activeContext.includes('winter') ||
    activeContext.includes('겨울')
  ) {
    return {
      key: 'christmas_nyc',
      seasonEn: 'crisp early winter dusk before Christmas',
      seasonKo: '크리스마스를 앞둔 설레는 겨울 저녁',
      locationEn: 'Fifth Avenue in New York illuminated by warm fairy lights and a glowing Christmas tree',
      locationKo: '반짝이는 트리와 불빛이 가득한 뉴욕 겨울 거리',
      genreLabelEn: 'Christmas Pop Playlist',
      genreLabelKo: '크리스마스 팝 모음',
      moodLabelEn: 'Cozy Holiday Groove',
      moodLabelKo: '기분 좋아지는 연말 그루브',
    };
  }

  // Detect Sunday / Morning / Cozy Cafe first before checking rain/autumn in SOP
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
        seasonEn: 'bright, sun-warmed Sunday late morning',
        seasonKo: '햇살이 포근하게 스며드는 일요일 오후',
        locationEn: 'sun-drenched artisan neighborhood café with warm oak tables, creamy latte art, and lush sunlit greenery outside the panoramic glass window',
        locationKo: '따스한 햇살과 원목 테이블, 향긋한 커피가 있는 감성 일요일 카페',
        genreLabelEn: 'Sunday Cafe Vibes',
        genreLabelKo: '기분 좋아지는 일요일 카페 그루브 팝',
        moodLabelEn: 'Warm Sunlit Sunday Cafe Groove',
        moodLabelKo: '여유롭고 포근한 일요일 카페 감성',
      };
    }
  }

  if (
    (activeContext.includes('rain') || activeContext.includes('비') || activeContext.includes('가을비')) &&
    (activeContext.includes('autumn') || activeContext.includes('가을') || activeContext.includes('낙엽') || activeContext.includes('street') || activeContext.includes('거리'))
  ) {
    return {
      key: 'rainy_autumn',
      seasonEn: 'misty golden-crimson autumn afternoon after rain',
      seasonKo: '가을비 내린 촉촉한 오후',
      locationEn: 'leaf-strewn city intersection lined with fiery orange maples and glossy wet asphalt',
      locationKo: '붉은 단풍과 젖은 아스팔트가 빛나는 가을비 거리',
      genreLabelEn: 'Feel-Good Autumn Pop',
      genreLabelKo: '가을 감성 팝 플리',
      moodLabelEn: 'Rainy Day Autumn Walk',
      moodLabelKo: '가을비 내린 날 하루 종일 듣는 감성 플리',
    };
  }

  if (combined.includes('j-pop') || combined.includes('jpop') || combined.includes('제이팝') || combined.includes('tokyo') || combined.includes('일본어') || combined.includes('city pop') || combined.includes('시티 팝')) {
    return {
      key: 'tokyo_rain',
      seasonEn: 'quiet indigo twilight in Tokyo',
      seasonKo: '고요한 도쿄의 푸른 밤',
      locationEn: 'high-rise apartment window and neon-lit Shibuya street shimmering softly at twilight',
      locationKo: '도심 창가와 네온 야경이 어우러진 공간',
      genreLabelEn: 'Electronic R&B J-Pop',
      genreLabelKo: '일렉트로닉 R&B J-POP',
      moodLabelEn: 'Midnight Urban Solitude',
      moodLabelKo: '세련된 새벽 도시 감성 플리',
    };
  }

  if (combined.includes('알앤비') || combined.includes('힙합') || combined.includes('hip-hop') || combined.includes('r&b') || combined.includes('trap') || combined.includes('새벽') || combined.includes('드라이브') || combined.includes('인스타')) {
    return {
      key: 'night_drive',
      seasonEn: 'late-night cool city breeze',
      seasonKo: '감각적인 늦은 밤',
      locationEn: 'city riverside avenue seen from a sleek car window and cozy late-night lounge',
      locationKo: '도시 야경이 스치는 새벽 드라이브 도로',
      genreLabelEn: 'Chill R&B & Hip-Hop',
      genreLabelKo: '느좋 칠(Chill) 알앤비 힙합',
      moodLabelEn: 'Late Night Aesthetic Drive',
      moodLabelKo: '새벽 드라이브 & 작업실 감성 플리',
    };
  }

  if (combined.includes('ost') || combined.includes('cinematic') || combined.includes('movie') || combined.includes('ballad') || combined.includes('발라드')) {
    return {
      key: 'cinematic_ost',
      seasonEn: 'melancholic golden-hour sunset',
      seasonKo: '노을이 스며드는 서정적인 오후',
      locationEn: 'sun-drenched quiet European theater balcony overlooking cobblestone streets',
      locationKo: '노을빛이 창가에 머무는 고요한 시네마틱 공간',
      genreLabelEn: 'Cinematic Ballad Playlist',
      genreLabelKo: '영화 OST 감성 발라드 모음',
      moodLabelEn: 'Deep Emotional Storytelling',
      moodLabelKo: '마음에 깊은 울림을 남기는 발라드 플리',
    };
  }

  if (activeContext.includes('autumn') || activeContext.includes('가을') || activeContext.includes('acoustic') || activeContext.includes('어쿠스틱')) {
    return {
      key: 'sunny_autumn_cafe',
      seasonEn: 'crisp golden autumn afternoon',
      seasonKo: '햇살 좋은 선선한 가을 오후',
      locationEn: 'warm wooden café terrace with panoramic glass windows facing golden ginkgo trees and historic stone walls',
      locationKo: '황금빛 은행나무와 돌담길이 보이는 감성 카페 창가',
      genreLabelEn: 'Good Day Pop',
      genreLabelKo: '여유롭고 기분 좋은 카페 팝 플리',
      moodLabelEn: 'Autumn Café Breeze',
      moodLabelKo: '카페음악 • 노동요 감성 플리',
    };
  }

  return {
    key: 'romantic_groove',
    seasonEn: 'warm golden-lit afternoon in a sunlit city neighborhood',
    seasonKo: '따스한 햇살과 기분 좋은 바람이 부는 오후',
    locationEn: 'sunlit SoHo sidewalk café table with warm brick townhouses and lush sunlit street trees',
    locationKo: '햇살이 스며드는 도심 골목 카페와 설레는 거리',
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
    christmas_nyc: ['#playlist', '#christmaspop', '#groovepop', '#newyorkvibe', '#wintercafe'],
    sunday_cafe: ['#playlist', '#groovepop', '#cafe', '#sundayvibes', '#feelgood'],
    rainy_autumn: ['#playlist', '#autumnpop', '#groovepop', '#rainyday', '#cafe'],
    sunny_autumn_cafe: ['#playlist', '#autumnpop', '#gooddaypop', '#acousticpop', '#cafe'],
    romantic_groove: ['#playlist', '#groovepop', '#gooddaypop', '#romanticpop', '#cafe'],
    night_drive: ['#playlist', '#chillrnb', '#koreanrnb', '#nightdrive', '#lounge'],
    tokyo_rain: ['#playlist', '#jpop', '#citypop', '#electronicrnb', '#midnight'],
    vintage_1940s: ['#playlist', '#vintagejazz', '#1940spop', '#retrolounge', '#cafe'],
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
  const storyHook = isPureEnglishText(lyricConcept)
    ? `expressing the intimate narrative mood of "${lyricConcept}"`
    : enTrackTitles
    ? `evoking the emotional essence of tracks such as ${enTrackTitles}`
    : `visualizing the signature atmosphere of "${scene.moodLabelEn}" (${enThemeLabel})`;

  const scenes: Record<SceneProfile['key'], { setting: string; subject: string; props: string; lighting: string }> = {
    sunday_cafe: {
      setting: `Set inside an airy, sun-warmed artisan neighborhood café on a peaceful ${scene.seasonEn}, a single expansive floor-to-ceiling timber-framed window occupies the backdrop, revealing a softly blurred sunlit brick terrace and leafy green street outside with zero gloomy weather.`,
      subject: `Positioned naturally right along the central axis of the frame at a handcrafted honey-oak table, a joyful young woman wearing a relaxed cream knit sweater sits candidly with one hand resting lightly beside a warm ceramic mug, offering a bright, genuine half-smile filled with peaceful Sunday anticipation while soft morning breeze catches loose strands of hair.`,
      props: `Drawing the eye directly inward along the warm wooden table perspective sit a speckled artisanal stoneware latte cup topped with velvety microfoam tulip art, a small crystal vase holding fresh white chamomile and warm peach wildflowers, an open linen-bound journal beside brass-rimmed sunglasses, and sun-dappled ceramic tableware.`,
      lighting: `Radiant golden late-morning sunlight pours diagonally across the center of the scene, illuminating the rising steam, sparkling off the glass vase and espresso crema, casting soft organic window-pane shadow geometry across the oak tabletop, and melting background café patrons into creamy honey-toned bokeh.`,
    },
    christmas_nyc: {
      setting: `Captured in one cohesive street-level frame along Manhattan's Fifth Avenue during a festive ${scene.seasonEn}, towering stone facades lead straight toward a glowing giant Christmas tree sparkling at the center background beneath bare winter trees wrapped in thousands of delicate golden fairy lights.`,
      subject: `Centered cleanly in the foreground from a candid first-person eye-level angle, two friends in plush cream shearling and camel wool sleeves gently clink two warm paper holiday coffee cups crowned with whipped cream and cinnamon brioche, while softly blurred New Yorkers stroll warmly behind them.`,
      props: `Crisp tactile details anchor the focal center: matte cream coffee cups with cozy knit cuffs catching amber highlights, flaky caramelized cinnamon pastry edges, frost-kissed granite pavement, and antique brass streetlamps reflecting soft festive bokeh.`,
      lighting: `Cool twilight cobalt sky harmonizes smoothly with warm 2700K storefront radiance and shimmering golden Christmas bokeh, wrapping the centered cups and festive street horizon in rich nostalgic Kodak Portra 400 warmth.`,
    },
    rainy_autumn: {
      setting: `Shot as one uninterrupted elevated diagonal frame overlooking a picturesque autumn intersection during a ${scene.seasonEn}, towering crimson and fiery orange maple canopies arch cleanly toward a rain-glistened zebra crosswalk and black wrought-iron park corner.`,
      subject: `Anchored as the clear visual focal point near the heart of the sunlit wet intersection, a stylish figure holding a translucent dome umbrella pauses gracefully in a tailored beige trench coat and knit scarf, looking gently upward amidst drifting scarlet maple leaves.`,
      props: `Mirror-like raindrops shimmer across dark asphalt and crisp white crosswalk stripes, vibrant golden and scarlet maple leaves scatter across glistening iron railings, and soft misty city trees recede naturally into depth.`,
      lighting: `Soft diffused post-rain sky intensifies rich fiery amber and crimson leaf pigments while luminous street reflections gleam across wet pavement in cohesive 35mm cinema color grading.`,
    },
    sunny_autumn_cafe: {
      setting: `Photographed from inside a serene minimalist wood-and-glass café looking straight out through a sweeping panoramic frameless window onto a peaceful ${scene.seasonEn} promenade lined with golden ginkgo trees and a timeless stone wall.`,
      subject: `Seated near the centered focal window at a warm oak table, a serene young woman in an oatmeal cashmere turtleneck leans slightly forward resting her chin lightly on her palm, smiling thoughtfully as warm autumn sunlight outlines her hair against golden ginkgo foliage outside.`,
      props: `In the foreground leading smoothly to center stand a fluted glass of iced Americano with dark crema swirls, matte stoneware saucer, half-open hardcover book, and delicate yellow ginkgo leaves resting on the exterior stone sill.`,
      lighting: `Low-angle honey-gold autumn sunlight streams cleanly through the ginkgo canopy across the café interior, balancing bright crisp window clarity with soft warm oak shadows.`,
    },
    romantic_groove: {
      setting: `Captured in one cohesive widescreen frame along a sun-dappled brick café terrace during a ${scene.seasonEn}, warm brownstone stoops, glowing café awnings, and leafy street trees frame an inviting neighborhood atmosphere full of effortless groove.`,
      subject: `Positioned as the clear central anchor at a sunny bistro table, a candidly smiling young woman in a soft ivory cardigan and light vintage denim jacket looks warmly toward the camera with sparkling affectionate eyes, hands cupped gently around a warm porcelain latte.`,
      props: `Carefully arranged foreground props guide the gaze to center: a handmade speckled cappuccino mug with microfoam latte art, brushed brass spoon, tortoiseshell sunglasses resting beside an open notebook, and soft sunlit greenery glowing softly behind.`,
      lighting: `Warm golden cross-lighting wraps the subject in radiant hair rim-light and luminous bokeh, paired with balanced sky fill and natural Kodak Portra 400 skin tones.`,
    },
    night_drive: {
      setting: `Framed cleanly from inside a sleek dark sedan cruising calmly along a midnight riverside boulevard during a ${scene.seasonEn}, glowing suspension bridge cables and city skyline bokeh stretch across clean glass in a single unified perspective.`,
      subject: `Positioned cleanly in the moody focal pocket beside the window, a stylish passenger in a charcoal wool coat rests near the softly lit console, looking pensively toward shimmering city lights as warm amber and cool cyan bokeh brush highlights across their profile.`,
      props: `Authentic leather stitching, delicate faint dashboard illumination, subtle condensation along the lower window corner, and realistic interior reflections create tactile nocturnal realism.`,
      lighting: `Cinestill 800T nocturnal cinema lighting balances warm sodium-vapor amber streetlamps against cool slate-blue midnight atmosphere with natural halation and organic grain.`,
    },
    tokyo_rain: {
      setting: `Set inside an understated Tokyo high-rise apartment overlooking Shibuya at twilight during a ${scene.seasonEn}, one uninterrupted floor-to-ceiling window opens out onto glowing city towers and soft evening neon haze.`,
      subject: `Seated calmly near the central window composition in an oversized slate knit sweater, a poised young Japanese woman cradles a warm stoneware mug with both hands, gazing peacefully toward the luminous Tokyo skyline.`,
      props: `A warm brass desk lamp casts a localized amber pool across a dark walnut side table beside wired studio headphones and an open sketchbook, leading the eye smoothly toward the skyline.`,
      lighting: `Warm interior tungsten lamp glow contrasts delicately with cool indigo dusk and diffused pastel neon city bokeh.`,
    },
    vintage_1940s: {
      setting: `Set inside an intimate wood-paneled 1940s listening parlor during a ${scene.seasonEn}, dark mahogany wainscoting, sheer lace curtains, and softly glowing casement windows frame one cohesive timeless sanctuary.`,
      subject: `Centered beside an antique oak gramophone with a brushed brass horn, a graceful figure in classic vintage tweed delicately rests the tonearm needle onto a glossy 78 RPM shellac disc under warm parlor light.`,
      props: `Vintage paper record sleeves, a porcelain teacup on lace linen, faintly glowing vacuum tubes, and golden dust particles hanging silently in amber rays complete the nostalgic composition.`,
      lighting: `Warm tungsten parlor glow blends softly with cool twilight window light in classic archival 35mm sepia-amber tones.`,
    },
    cinematic_ost: {
      setting: `Captured from one quiet European stone balcony overlooking weathered limestone rooftops and distant sunlit avenues during a ${scene.seasonEn}, tall wooden French doors frame a sweeping cinematic horizon.`,
      subject: `Standing gracefully near the center focal point in an ivory silk blouse and tailored wool coat, a soulful woman gazes serenely toward the golden sunset skyline as a gentle breeze brushes her dark hair.`,
      props: `Carved limestone balustrades, aged brass door hardware, billowing sheer linen curtains, and glowing dust motes in diagonal sunbeams anchor the emotional composition.`,
      lighting: `Rich golden-hour backlighting casts soft rim highlights and velvet atmospheric shadows across a timeless anamorphic cinema frame.`,
    },
  };

  const chosen = scenes[scene.key];

  const compositionAndCenterFocus = `Unified Center-Focused Composition & Visual Hierarchy: Engineered as ONE single, continuous, uninterrupted 16:9 widescreen photograph—strictly never a split-screen, never a diptych, and never two side-by-side panels. Compose with deliberate leading lines (table edges, sunlit beams, and architectural framing) guiding the viewer's eye effortlessly toward the clear hero focal point positioned near the center of the frame. Foreground props remain gently recessed along the lower edge with shallow depth falloff, while background architecture dissolves smoothly into creamy, distraction-free optical bokeh so attention stays locked on the heartwarming central subject and mood.`;

  const cameraOpticsAndPurity = `Photographic Craft, True-to-Life Textures & Strict Zero-Text Purity: Shot on a full-frame Leica SL2-S paired with a 35mm f/1.8 APO prime lens at ISO 400, f/2.0, natural 1/250s shutter speed, rendering authentic skin texture, fine wool and linen fiber weave, subtle ceramic glaze grain, natural specular water/glass highlights, and authentic Kodak Portra 400 organic film grain without artificial CGI gloss or over-processed HDR contrast. Color grading harmonizes warm golden highlights, natural skin tones, and airy inviting midtones tailored seamlessly to "${enThemeLabel}". CRITICAL CONSTRAINT: Strictly NO text, NO typography, NO titles, NO letters, NO subtitles, NO captions, NO logos, and NO watermarks anywhere in the image—pure clean photography only.`;

  return [
    `Single unified 16:9 ultra-realistic photorealistic editorial photograph ${storyHook}.`,
    chosen.setting,
    chosen.subject,
    chosen.props,
    chosen.lighting,
    compositionAndCenterFocus,
    cameraOpticsAndPurity,
  ].join(' ');
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

  // If AI already produced a true >= 2000 character cohesive prompt, keep it cleanly while ensuring zero-text & single-frame discipline!
  if (cleanRaw.length >= 2000) {
    if (cleanRaw.toLowerCase().includes('no text') && cleanRaw.toLowerCase().includes('split')) {
      return cleanRaw;
    }
    return `${cleanRaw} ${noTextAndSingleFrameGuard}`.replace(/\s+/g, ' ').trim();
  }

  // If AI output was empty or a short placeholder (< 140 chars), build a complete bespoke single-scene 2,200+ char prompt.
  if (cleanRaw.length < 140) {
    return buildPhotorealisticSceneBase(
      scene,
      theme.name || 'Playlist',
      lyricConcept,
      tracks
    );
  }

  // IMPORTANT: When AI already established a valid custom scene (e.g. Sunday Cafe, friends, latte),
  // NEVER glue a second conflicting scene onto it! Enrich ONLY with scene-agnostic optical, lighting,
  // center-focused composition, tactile texture, and color harmony specifications matching that exact scene.
  const cohesiveCraftExpansion = [
    `Unified Center-Focused Composition & Visual Flow: Render this exact scene as ONE single continuous, cohesive 16:9 widescreen photograph—strictly NEVER split left-and-right into two locations, NEVER create a diptych or collage. Place the core focal subject cleanly near the central focal pocket of the frame so the viewer's eye locks effortlessly onto the heart of the story, anchored by subtle diagonal leading lines from foreground surfaces and gentle framing depth along the edges while background movement softens smoothly into creamy optical bokeh.`,
    `Cohesive Lighting Physics, Color Harmony & Atmosphere: Maintain 100% consistent weather, time of day, and atmospheric color palette unified around "${enSafeTheme}". Natural directional key light wraps smoothly across the central subject and foreground props with realistic specular highlights on glass, porcelain, coffee crema, and hair strands, paired with soft open shadow roll-off, rich warm-to-neutral tonal balance, and authentic ambient depth without muddy gloom or discordant color clashing.`,
    `Optical Realism & Tactile Micro-Detail: Photographed on a full-frame Leica SL2-S with a 35mm f/1.8 APO prime lens at ISO 400 and f/2.0 aperture, preserving true-to-life natural skin pores, organic fabric weave in knitwear and linen, realistic tabletop wood grain, delicate ceramic glaze texture, and genuine Kodak Portra 400 35mm film grain. Zero synthetic 3D smoothness, zero over-sharpened HDR halos, zero plastic skin.`,
    `Strict Image Purity & Zero Typography Mandate: Keep every pixel strictly photographic with generous breathable visual balance—NO text overlays, NO serif titles, NO playlist words, NO corner captions, NO logos, and NO watermarks anywhere in the image.`,
  ].join(' ');

  let combined = `${cleanRaw} ${cohesiveCraftExpansion}`.replace(/\s+/g, ' ').trim();
  if (combined.length < 2050) {
    const extraDepthLayer = `Environmental Continuity & Editorial Finish: Subtle ambient depth cues—gentle sunlight shafts through clean window glass, delicate specular rim highlights, fine micro-contrast across natural materials, and unhurried candid human posture—work seamlessly together within the same unbroken location to evoke an inviting, high-CTR YouTube playlist cover aesthetic.`;
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

  const conceptSuffixKo = cleanConcept ? ` (${cleanConcept})` : '';
  const conceptSuffixEn = isEnglishAscii(cleanConcept) ? ` (${cleanConcept})` : '';

  const fallbackTitlesByScene: Record<SceneProfile['key'], { ko: string; en: string }> = {
    sunday_cafe: {
      ko: `일요일 카페에서 기분 좋아지는 그루브 팝 모음${conceptSuffixKo} 🎧 | Sunday Cafe Vibes`,
      en: `Feel-Good Groove Pop Playlist from the Sunday Cafe${conceptSuffixEn} 🎧 | Sunday Cafe Vibes`,
    },
    christmas_nyc: {
      ko: `크리스마스가 가까워질수록, 이런 뉴욕이 더 좋아지잖아 🎄🗽 첫 곡부터 기분 좋아지는 그루브 팝 모음${conceptSuffixKo} 🎧 | Christmas Pop Playlist`,
      en: `The Closer Christmas Gets, The Better New York Feels 🎄🗽 Feel-Good Holiday Groove Pop${conceptSuffixEn} 🎧 | Christmas Pop Playlist`,
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
      en: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Late Night Neon Highway & Dreamy Korean Chill R&B Groove${conceptSuffixEn} 🌙✨ | Midnight Drive Mix`,
    },
    tokyo_rain: {
      ko: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 비 내리는 도쿄의 밤창가, 고요하게 스며드는 시티팝 · R&B 모음${conceptSuffixKo} 🌧️🌙 | Midnight Tokyo Alt-Pop`,
      en: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Rainy Midnight Window in Tokyo & Sophisticated Electronic R&B J-Pop${conceptSuffixEn} 🌧️🌙 | Alt-Pop City Mix`,
    },
    vintage_1940s: {
      ko: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | 오래된 축음기 바늘 소리처럼 따뜻한 1940년대 빈티지 팝 감성${conceptSuffixKo} 📻🕯️ | 1940s Shellac Lounge`,
      en: `🎧 𝐩𝐥𝐚𝐲𝐥𝐢𝐬𝐭 | Warm 1940s Shellac Phonograph & Timeless Vinyl Lounge Memories${conceptSuffixEn} 📻🕯️ | Vintage 78 RPM Classics`,
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
    `Welcome to "${enThemeTitle}", capturing the gentle warmth of ${scene.seasonEn} across ${scene.locationEn}.`,
    isEnglishAscii(cleanConcept)
      ? `Built around the central storytelling mood of "${cleanConcept}", each track weaves uplifting groove, warmth, and atmosphere from start to finish.`
      : `Built around the signature mood of ${scene.moodLabelEn}, each track flows seamlessly from the opening beat to the final note.`,
    `Featuring ${trackHighlightEn}, this curated mix brings feel-good comfort to cozy café mornings, focused work sessions, and slow weekend afternoons. ☕️🎧`,
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
