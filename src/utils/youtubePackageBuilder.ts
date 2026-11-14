import { Theme, TrackItem, YoutubePackage } from '../types';

export interface SceneProfile {
  key: 'christmas_nyc' | 'rainy_autumn' | 'sunny_autumn_cafe' | 'romantic_groove' | 'night_drive' | 'tokyo_rain' | 'vintage_1940s' | 'cinematic_ost';
  seasonEn: string;
  seasonKo: string;
  locationEn: string;
  locationKo: string;
  genreLabelEn: string;
  genreLabelKo: string;
  moodLabelEn: string;
  moodLabelKo: string;
  coverText: string;
}

export function detectSceneProfile(
  theme: Partial<Theme>,
  lyricConcept: string = '',
  tracks: Array<Partial<TrackItem>> = []
): SceneProfile {
  const trackText = tracks.map((t) => `${t.title || ''} ${t.mood || ''} ${t.metaInfo?.genre || ''}`).join(' ');
  const combined = `${theme.name || ''} ${theme.category || ''} ${theme.sop || ''} ${lyricConcept} ${trackText}`.toLowerCase();

  if (combined.includes('shellac') || combined.includes('phonograph') || combined.includes('78 rpm') || combined.includes('1940')) {
    return {
      key: 'vintage_1940s',
      seasonEn: 'warm timeless twilight',
      seasonKo: '아늑한 빈티지 저녁',
      locationEn: 'antique mahogany parlor with an oak gramophone and rain-misted window',
      locationKo: '앤티크 축음기가 놓인 따뜻한 빈티지 거실',
      genreLabelEn: '1940s Vintage Pop',
      genreLabelKo: '1940s 빈티지 팝',
      moodLabelEn: 'Nostalgic Gramophone Memories',
      moodLabelKo: '아날로그 축음기 감성',
      coverText: 'VINTAGE MOOD',
    };
  }

  if (combined.includes('christmas') || combined.includes('크리스마스') || combined.includes('xmas') || combined.includes('carol') || combined.includes('holiday') || combined.includes('winter') || combined.includes('겨울')) {
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
      coverText: 'Christmas Pop',
    };
  }

  if ((combined.includes('rain') || combined.includes('비') || combined.includes('가을비')) && (combined.includes('autumn') || combined.includes('가을') || combined.includes('낙엽') || combined.includes('street') || combined.includes('거리'))) {
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
      coverText: 'playlist',
    };
  }

  if (combined.includes('j-pop') || combined.includes('jpop') || combined.includes('제이팝') || combined.includes('tokyo') || combined.includes('일본어') || combined.includes('city pop') || combined.includes('시티 팝')) {
    return {
      key: 'tokyo_rain',
      seasonEn: 'quiet indigo twilight in Tokyo',
      seasonKo: '고요한 도쿄의 푸른 밤',
      locationEn: 'high-rise apartment window and neon-lit Shibuya street shimmering through raindrops',
      locationKo: '빗방울 맺힌 도심 창가와 네온 야경',
      genreLabelEn: 'Electronic R&B J-Pop',
      genreLabelKo: '일렉트로닉 R&B J-POP',
      moodLabelEn: 'Midnight Urban Solitude',
      moodLabelKo: '세련된 새벽 도시 감성 플리',
      coverText: 'MIDNIGHT CITY',
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
      coverText: 'LATE NIGHT',
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
      coverText: 'CINEMA MOOD',
    };
  }

  if (combined.includes('autumn') || combined.includes('가을') || combined.includes('cafe') || combined.includes('카페') || combined.includes('acoustic') || combined.includes('어쿠스틱')) {
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
      coverText: 'AUTUMN MOOD',
    };
  }

  // Default / Romantic Groove Pop / Feel-Good Pop
  return {
    key: 'romantic_groove',
    seasonEn: 'warm golden-lit autumn afternoon in New York',
    seasonKo: '기분 좋은 바람이 부는 설레는 오후',
    locationEn: 'sunlit SoHo sidewalk café table with brick townhouses, amber foliage, and bustling city warmth',
    locationKo: '햇살이 스며드는 도시 골목 카페와 설레는 거리',
    genreLabelEn: 'Good Day Groove Pop',
    genreLabelKo: '기분 좋아지는 그루브 팝 모음',
    moodLabelEn: 'Feel-Good Romantic Groove',
    moodLabelKo: '듣는 순간 설레고 기분 좋아지는 그루브 팝',
    coverText: 'Good Day Pop',
  };
}

export function normalizeFiveHashtags(
  rawHashtags: string | undefined,
  theme: Partial<Theme>,
  lyricConcept: string = '',
  tracks: Array<Partial<TrackItem>> = []
): string {
  const scene = detectSceneProfile(theme, lyricConcept, tracks);
  const extracted = (rawHashtags || '')
    .match(/#[a-zA-Z0-9_\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FAF]+/g) || [];

  const filteredExisting = extracted
    .map((t) => t.toLowerCase())
    .filter((t) => !['#sunoai', '#plymasterfactory', '#musicproduction', '#audiocards'].includes(t));

  const poolByScene: Record<SceneProfile['key'], string[]> = {
    christmas_nyc: ['#playlist', '#christmaspop', '#groovepop', '#newyorkvibe', '#wintercafe'],
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

  // Prioritize #playlist first when appropriate, then curated AI tags (up to 5), then scene defaults
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

function buildPhotorealisticSceneBase(
  mode: 'thumbnail' | 'background',
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
    ? `expressing the intimate narrative theme of "${lyricConcept}"`
    : enTrackTitles
    ? `capturing the emotional storyline of tracks like ${enTrackTitles}`
    : `visualizing the signature atmosphere of "${scene.moodLabelEn}" (${enThemeLabel})`;

  const scenes: Record<SceneProfile['key'], { setting: string; subject: string; props: string; lighting: string }> = {
    christmas_nyc: {
      setting: `Set along a lively Manhattan street near Rockefeller Plaza at ${scene.seasonEn}, towering limestone buildings frame a towering Christmas tree glittering with warm amber, ruby, and emerald lights in the soft background bokeh, while bare winter street trees are wrapped in thousands of delicate golden fairy lights stretching down the avenue.`,
      subject: mode === 'thumbnail'
        ? `In the immediate foreground, two friends' hands wearing plush cream shearling and camel wool sleeves gently raise and clink two festive paper coffee cups crowned with swirled whipped cream and toasted cinnamon brioche pastries, captured from a candid first-person eye-level viewpoint as muffled pedestrians stroll joyfully past blurred luxury shop windows.`
        : `Across the midground sidewalk, blurred silhouettes of warmly dressed New Yorkers in wool overcoats and plaid scarves walk leisurely past glowing boutique windows and festive evergreen planters, preserving a calm inviting focal pocket in the center.`,
      props: `Rich tactile foreground and midground details include crisp matte cream coffee cups with subtle embossed sleeves, delicate caramelized sugar flakes on golden brioche foam, frost-kissed granite sidewalk curbs, vintage wrought-iron streetlamps, and polished brass storefront frames catching the festive reflections.`,
      lighting: `Twilight cobalt-blue sky transitions softly into warm 2700K tungsten shopfront radiance and shimmering golden fairy-light bokeh, producing natural specular highlights across the pastry cream, wool fibers, and damp winter pavement with nostalgic Kodak Portra 400 warmth.`,
    },
    rainy_autumn: {
      setting: `Shot from an elevated second-story architectural vantage point looking diagonally across a quiet city intersection during a ${scene.seasonEn}, dense canopies of fiery orange, burnt sienna, gold, and crimson maple trees arch dramatically over dark rain-slicked crosswalks and vintage black iron park railings.`,
      subject: mode === 'thumbnail'
        ? `Midway across the glistening zebra crosswalk, a stylish pedestrian holding a clear dome umbrella pauses in a natural mid-stride turn beneath swirling maple leaves, wearing a tailored beige trench coat and soft knit scarf, her serene upward glance and gentle candid half-smile evoking quiet cinematic longing.`
        : `Occasional sleek city cars—a deep cobalt compact hatchback and a charcoal crossover—glide unhurriedly past the rain-damp intersection while solitary distant figures stroll beneath translucent umbrellas along the leaf-carpeted sidewalk.`,
      props: `Hundreds of fallen amber and scarlet maple leaves cling to the dark wet asphalt, zebra crosswalk paint gleams with mirror-like liquid reflections, glistening iron fence pickets line the leafy park corner, and soft mist clings to distant brick facades.`,
      lighting: `Diffused overcast rainy-day skylight saturates the vibrant autumn canopy without harsh shadows while crisp specular reflections of crimson leaves, warm brake lights, and distant streetlamps shimmer across the wet road surface in rich 35mm cinema color grading.`,
    },
    sunny_autumn_cafe: {
      setting: `Photographed from inside a serene minimalist wood-and-glass café looking out through a massive floor-to-ceiling frameless window onto a peaceful ${scene.seasonEn} boulevard, where tall golden ginkgo trees spill bright yellow leaves beside an aged textured stone garden wall.`,
      subject: mode === 'thumbnail'
        ? `Seated effortlessly at the sun-warmed oak table in the left foreground, a young woman in an oatmeal cashmere turtleneck leans slightly forward with chin resting softly in her palm, looking outside toward passersby and a cyclist gliding past the stone wall with an unforced, peaceful daydreaming smile and natural loose hair catching warm rim light.`
        : `Outside the spotless glass, a cyclist glides slowly along the sunlit promenade beneath golden ginkgo branches while two silhouettes in long autumn coats walk calmly beside the historic stone wall, leaving the tranquil wooden café table peaceful in the foreground.`,
      props: `On the solid natural-grain oak café table sit a fluted glass of iced Americano with dark espresso swirls and condensation droplets, a matte cream ceramic saucer, a linen-bound hardcover book resting half-open, and fallen yellow ginkgo leaves scattered along the exterior slate sill.`,
      lighting: `Low-angle late-afternoon golden sunlight streams diagonally through the ginkgo canopy and into the café interior, casting elongated soft-edged leaf shadows across the pale travertine bench and illuminating dust motes in warm honey-toned daylight.`,
    },
    romantic_groove: {
      setting: `Captured along a charming sunlit brick street terrace during a ${scene.seasonEn}, ivy-draped brownstone townhouses, warm café awnings, and golden-leaved street trees frame a vibrant urban neighborhood filled with effortless groove and romantic energy.`,
      subject: mode === 'thumbnail'
        ? `At a sunlit bistro table in the right-third foreground, a candidly laughing young woman in a soft ivory cardigan and vintage denim jacket looks across the table toward the camera as her eyes sparkle with affectionate warmth, fingers lightly wrapped around a warm porcelain latte cup while a gentle afternoon breeze lifts strands of sun-kissed hair.`
        : `In the soft-focus background of the sunlit sidewalk terrace, couples chat quietly at wooden bistro tables beneath warm string bulbs and dappled tree shade while golden leaves drift casually past parked bicycles and brownstone stoops.`,
      props: `Fine foreground textures feature a handmade speckled ceramic cappuccino mug with silky microfoam latte art, a brushed brass spoon, sunglasses resting beside a vinyl record sleeve, textured red brick masonry, and sunlit amber foliage framing the upper corners.`,
      lighting: `Warm golden-hour cross-lighting creates luminous hair rim-light and glowing honey bokeh through the autumn leaves, balanced by crisp ambient sky fill and creamy Kodak Portra 400 skin tones with natural contrast and lifelike shadow detail.`,
    },
    night_drive: {
      setting: `Framed from the quiet passenger perspective inside a sleek dark sedan cruising slowly beside an urban riverfront boulevard during a ${scene.seasonEn}, towering city bridge cables and warm skyline reflections stretch across midnight glass.`,
      subject: mode === 'thumbnail'
        ? `In the moody interior foreground, a stylish young adult in a charcoal wool jacket rests one forearm casually near the softly glowing dashboard while glancing toward the rain-speckled side window with a contemplative, subtly enigmatic expression as warm amber and teal city bokeh paints soft highlights across cheek and collarbone.`
        : `Seen steadily through the clean driver-side and windshield glass, glowing bridge lights, distant red taillight trails, and cool cyan streetlights glide smoothly over rain-slick asphalt with meditative nighttime rhythm.`,
      props: `Subtle authentic details include soft leather steering wheel stitching, faint amber instrument-cluster illumination, tiny crystalline condensation droplets clinging to the outer glass edge, and gentle interior reflections on the brushed aluminum door trim.`,
      lighting: `Cinestill 800T nocturnal cinema lighting contrasts warm sodium-vapor amber streetlamps and crimson taillight halation against cool slate-blue midnight sky, producing creamy low-light grain, soft glass reflections, and atmospheric depth.`,
    },
    tokyo_rain: {
      setting: `Set inside an understated Tokyo high-rise apartment overlooking the wet midnight streets of Shibuya during a ${scene.seasonEn}, expansive floor-to-ceiling rain-streaked glass reveals distant neon signage and luminous apartment towers dissolving into gentle mist.`,
      subject: mode === 'thumbnail'
        ? `Silhouetted softly in three-quarter profile near the rain-beaded window, a poised young Japanese woman in an oversized slate knit sweater holds a warm stoneware mug with both hands, gazing pensively into the rainy metropolis with quiet understated grace and calm eyes reflecting neon bokeh.`
        : `Raindrops trace delicate irregular paths down the dark apartment windowpane while distant skyscraper beacons and blurred neon reflections pulse calmly across the wet Tokyo skyline below.`,
      props: `Beside the window rest a warm minimalist brass desk lamp casting a pool of amber light, an open notebook, minimalist wired studio headphones resting on a walnut table, and fine raindrops catching ruby and cyan city glow on the glass.`,
      lighting: `Intimate warm amber desk-lamp key light softly sculpts the interior foreground against cool indigo twilight and vibrant magenta-cyan neon reflections diffused through wet window glass.`,
    },
    vintage_1940s: {
      setting: `Set inside a timeless wood-paneled 1940s listening parlor during a ${scene.seasonEn}, dark walnut wainscoting, sheer lace curtains, and rain-misted casement windows frame an intimate sanctuary of analog nostalgia.`,
      subject: mode === 'thumbnail'
        ? `Seated beside the glowing mahogany cabinet phonograph, a graceful figure in a classic tailored tweed coat delicately places the brass tonearm needle onto a spinning black 78 RPM shellac disc, wearing an expression of quiet tender remembrance under soft amber lamplight.`
        : `An antique wooden cabinet gramophone with a brushed brass horn spins a glossy black shellac record smoothly at steady speed beside a softly crackling hearth and sheer lace curtains billowing imperceptibly.`,
      props: `Authentic period objects include stacked paper record sleeves, a vintage crystal teacup on a lace doily, warm glowing vacuum tubes peeking through cloth speaker mesh, and fine floating dust motes suspended in amber light beams.`,
      lighting: `Warm incandescent tungsten parlor glow blends with pale twilight filtering through sheer curtains, bathed in rich sepia-amber film tonality, delicate optical halation, and fine archival 35mm grain.`,
    },
    cinematic_ost: {
      setting: `Captured on a quiet European balcony overlooking weathered limestone rooftops and distant misty avenues during a ${scene.seasonEn}, timeless stone balustrades and billowing linen curtains create an evocative widescreen film still.`,
      subject: mode === 'thumbnail'
        ? `Standing gracefully in side-profile beside the open French balcony doors, a soulful young woman in a flowing ivory silk blouse and wool coat looks gently toward the golden horizon, wind softly brushing strands of dark hair across her cheek with deeply expressive, bittersweet cinematic poise.`
        : `Through tall open wooden French doors, golden sunlight filters gently across translucent linen curtains drifting in a slow breeze above quiet cobblestone rooftops bathed in sunset haze.`,
      props: `Detailed textures include aged carved limestone railing, antique brass window latches, a weathered wooden piano edge glowing softly inside the dim room, and delicate amber dust particles floating in slanted light shafts.`,
      lighting: `Dramatic yet natural golden-hour backlighting wraps the scene in warm rim highlights, soft lens bloom, deep velvet shadows, and timeless widescreen anamorphic cinema color grading.`,
    },
  };

  const chosen = scenes[scene.key];
  const framingAndTech = mode === 'thumbnail'
    ? `Composition & Cover Engineering: 16:9 widescreen editorial lifestyle photography framed with classic rule-of-thirds depth, shot on a full-frame Leica SL2-S with a 35mm f/1.8 prime lens at ISO 400, crisp foreground focal clarity melting smoothly into creamy natural background bokeh. Leave clean, uncluttered negative space across the upper-center horizon or window sky and place minimalist white editorial serif typography reading "${scene.coverText}" cleanly centered without obscuring any faces or hero props, plus tiny subtle poetic caption text tucked softly in the bottom-left margin. Zero CGI gloss, zero plastic skin, natural organic micro-contrast, true Kodak Portra 400 photographic texture, 8K ultra-detailed photorealism.`
    : `Seamless Loop & Camera Physics: 16:9 widescreen locked-off tripod cinematic backdrop engineered explicitly for seamless multi-hour looping playback, shot on a full-frame Sony FX3 / Leica SL2 with a 50mm f/1.4 cinema prime, keeping horizon, architecture, and main framing rock-steady with ZERO camera pan, ZERO zoom, and ZERO cuts. Infuse subtle, continuous ambient loop choreography: unhurried wisps of warm steam curling upward, occasional golden leaves or dust motes drifting slowly through soft light beams, gentle raindrop shimmer and soft reflections rippling calmly across wet surfaces, and faint natural warmth breathing in distant bokeh lights. Strictly NO text, NO typography, NO titles, NO logos, and NO watermarks anywhere in frame; purely authentic photorealistic 8K natural lighting and film grain.`;

  const opticalDetailExtension = mode === 'thumbnail'
    ? `Micro-Detail, Color Palette & Atmospheric Finish: Every surface reveals tactile real-world imperfection—subtle weave in wool and linen garments, micro-scratches on aged wood grain, gentle condensation beads on glassware, soft skin pores under natural daylight, and organic depth falloff across midground architecture and foliage. Color grading balances warm amber highlights, rich earthy midtones, and clean shadows without crushed blacks or artificial HDR saturation, maintaining an authentic editorial magazine look ready for high-CTR YouTube playlist cover presentation for "${enThemeLabel}".`
    : `Micro-Detail, Atmospheric Continuity & Mastering: Every architectural surface, tree branch, tabletop object, and reflective pavement or windowpane preserves consistent exposure, color temperature, and subtle tonal richness across the entire loop cycle. Natural depth-of-field separation anchors the foreground without distracting motion blur, while organic shadow transitions, gentle ambient light breathing, and 35mm cinema film grain deliver a serene, immersive 16:9 visual canvas tailored to "${enThemeLabel}".`;

  return [
    `16:9 ultra-realistic photorealistic editorial scene ${storyHook}.`,
    chosen.setting,
    chosen.subject,
    chosen.props,
    chosen.lighting,
    framingAndTech,
    opticalDetailExtension,
  ].join(' ');
}

export function ensurePhotorealisticPrompt(
  rawPrompt: string | undefined,
  mode: 'thumbnail' | 'background',
  theme: Partial<Theme>,
  lyricConcept: string = '',
  tracks: Array<Partial<TrackItem>> = []
): string {
  const clean = (rawPrompt || '').replace(/\s+/g, ' ').trim();
  const scene = detectSceneProfile(theme, lyricConcept, tracks);

  // If AI already produced a true >= 2000 character prompt, keep it cleanly!
  if (clean.length >= 2000) {
    return clean;
  }

  const richGenerated = buildPhotorealisticSceneBase(
    mode,
    scene,
    theme.name || 'Playlist',
    lyricConcept,
    tracks
  );

  // If AI output was just a tiny placeholder (< 240 chars), replace cleanly with the full bespoke 2200+ char prompt.
  if (clean.length < 240) {
    if (richGenerated.length >= 2100) {
      return richGenerated;
    }
  }

  // Otherwise preserve the AI's custom creative concept at the front and append non-overlapping deep photographic layers
  const hasNonEnglish = (val: string) => /[\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FAF]/.test(val);
  const enSafeTheme = theme.name && !hasNonEnglish(theme.name) ? theme.name : scene.genreLabelEn;
  const enSafeConcept = lyricConcept && !hasNonEnglish(lyricConcept) ? ` (${lyricConcept})` : '';
  const supplement =
    mode === 'thumbnail'
      ? `Expanded Scene & Photographic Specification: Captured as a 16:9 widescreen editorial lifestyle photograph tailored for "${enSafeTheme}"${enSafeConcept}, balancing clean foreground framing, rich seasonal architectural backdrop, and authentic human presence with relaxed candid posture, gentle expressive warmth, and natural fabric textures (wool, linen, ceramic, rain-kissed glass). Photographed on a full-frame Leica SL2-S with a 35mm f/1.8 prime lens, layered rule-of-thirds depth, natural directional golden or twilight illumination, soft specular surface reflections, subtle Kodak Portra 400 organic film grain, zero AI plastic sheen, and clean negative space in the upper frame featuring understated white editorial serif cover typography ("${scene.coverText}") without overlapping key subjects.`
      : `Expanded Seamless Loop & Cinematography Specification: Captured as a 16:9 locked-off tripod cinema frame tailored for "${enSafeTheme}"${enSafeConcept}, photographed on a full-frame 50mm f/1.4 cinema prime with stable horizon geometry, authentic material micro-textures, natural directional ambient light, and rich organic film grain. Engineered specifically for hypnotic seamless looping playback with zero camera cuts or shakes: continuous unhurried micro-motion including slowly drifting seasonal leaves or sunlit dust motes, faint rising beverage steam, gentle surface light ripples, and softly glowing bokeh ambience. Strictly NO text, NO typography, NO titles, and NO watermarks anywhere in frame.`;

  const baseText = clean.length < 240 ? richGenerated : `${clean} ${richGenerated}`;
  const combined = `${baseText} ${supplement}`.replace(/\s+/g, ' ').trim();
  if (combined.length >= 2100) {
    return combined;
  }
  return `${combined} ${supplement}`.replace(/\s+/g, ' ').trim();
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
  const scene = detectSceneProfile(theme, cleanConcept, tracks);
  const trackNames = tracks.map((t) => t.title).filter(Boolean).slice(0, 4);
  const trackHighlightKo = trackNames.length > 0 ? `'${trackNames.join("', '")}'` : `'${theme.name || '감성 트랙'}'`;
  const trackHighlightEn = trackNames.length > 0 ? `'${trackNames.join("', '")}'` : `'${isEnglishAscii(theme.name || '') ? theme.name : scene.genreLabelEn}'`;

  const conceptSuffixKo = cleanConcept ? ` (${cleanConcept})` : '';
  const conceptSuffixEn = isEnglishAscii(cleanConcept) ? ` (${cleanConcept})` : '';

  const fallbackTitlesByScene: Record<SceneProfile['key'], { ko: string; en: string }> = {
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
    `${scene.seasonKo}, ${scene.locationKo}의 온기를 그대로 담아낸 「${theme.name || '플레이리스트'}」입니다.`,
    cleanConcept ? `이번 플레이리스트는 '${cleanConcept}' 컨셉을 중심으로 트랙의 서사와 감정을 섬세하게 엮어 구성했습니다.` : `첫 곡부터 마지막 트랙까지 끊김 없이 자연스럽게 이어지는 흐름으로 기획했습니다.`,
    `수록곡 ${trackHighlightKo} 등을 따라가며 카페 BGM, 작업/노동요, 산책이나 드라이브 등 어느 순간에도 기분 좋은 여운을 느껴보세요.`,
    '',
    '[🎧 Tracklist]',
    tracklist,
    '',
    '좋아요와 구독은 다음 플레이리스트 제작에 큰 힘이 됩니다. 오늘도 음악과 함께 편안하고 기분 좋은 하루 보내세요 ☕️🎧',
  ].filter((v) => v !== undefined).join('\n');

  const enThemeTitle = isEnglishAscii(theme.name || '') ? theme.name : scene.genreLabelEn;
  const defaultDescEn = [
    `Welcome to "${enThemeTitle}", capturing the warmth of ${scene.seasonEn} across ${scene.locationEn}.`,
    isEnglishAscii(cleanConcept)
      ? `Built around the central storytelling concept of "${cleanConcept}", each track weaves cohesive emotion, groove, and atmosphere from start to finish.`
      : `Built around the signature mood of ${scene.moodLabelEn}, each track weaves cohesive emotion, groove, and atmosphere from start to finish.`,
    `Featuring ${trackHighlightEn}, this mix is crafted for cozy café mornings, focused work sessions, evening walks, and late-night drives.`,
    '',
    '[🎧 Tracklist]',
    tracklist,
    '',
    'Thank you for listening—like and subscribe for more curated mood playlists tailored to every season ☕️🎧',
  ].filter((v) => v !== undefined).join('\n');

  const rawAiDesc = (aiYoutube?.description || '').trim();
  const hasHangulInDesc = /[\uAC00-\uD7AF]/.test(rawAiDesc);
  let descriptionKo = (aiYoutube?.descriptionKo || '').trim() || (hasHangulInDesc ? rawAiDesc : defaultDescKo);
  let descriptionEn = (aiYoutube?.descriptionEn || '').trim() || (!hasHangulInDesc && rawAiDesc ? rawAiDesc : defaultDescEn);

  if (tracklist && !descriptionKo.includes(tracklist.split('\n')[0])) {
    descriptionKo = `${descriptionKo.trim()}\n\n[🎧 Tracklist]\n${tracklist}`;
  }
  if (tracklist && !descriptionEn.includes(tracklist.split('\n')[0])) {
    descriptionEn = `${descriptionEn.trim()}\n\n[🎧 Tracklist]\n${tracklist}`;
  }

  const hashtags = normalizeFiveHashtags(aiYoutube?.hashtags, theme, cleanConcept, tracks);
  const thumbnailPrompt = ensurePhotorealisticPrompt(
    aiYoutube?.thumbnailPrompt,
    'thumbnail',
    theme,
    cleanConcept,
    tracks
  );
  const backgroundImagePrompt = ensurePhotorealisticPrompt(
    aiYoutube?.backgroundImagePrompt,
    'background',
    theme,
    cleanConcept,
    tracks
  );

  return {
    title: `${titleKo}\n${titleEn}`,
    titleKo,
    titleEn,
    description: `[한국어]\n${descriptionKo}\n\n[English]\n${descriptionEn}`,
    descriptionKo,
    descriptionEn,
    tracklist,
    hashtags,
    thumbnailPrompt,
    backgroundImagePrompt,
  };
}
