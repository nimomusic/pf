import type { Theme, TrackItem, VocalType } from '../types.ts';

export type ResolvedVocalGender = 'male' | 'female' | 'none';
export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';
export type SopEraMode =
  | 'contemporary'
  | 'historical_1940s_50s'
  | 'historical_1970s'
  | 'historical_retro';

export interface TemporalContext {
  year: number;
  month: number;
  day: number;
  isoDate: string;
  seasonKey: SeasonKey;
  seasonKo: string;
  seasonFullKo: string;
  seasonEn: string;
  seasonAdjectiveEn: string;
}

export function getCurrentTemporalContext(now: Date = new Date()): TemporalContext {
  const safeDate = Number.isNaN(now.getTime()) ? new Date() : now;
  const year = safeDate.getFullYear();
  const month = safeDate.getMonth() + 1;
  const day = safeDate.getDate();
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  if (month >= 3 && month <= 5) {
    const isLateSpring = month === 5;
    const isEarlySpring = month === 3;
    return {
      year,
      month,
      day,
      isoDate,
      seasonKey: 'spring',
      seasonKo: isEarlySpring ? '이른 봄' : isLateSpring ? '늦봄' : '봄',
      seasonFullKo: isEarlySpring ? '맑고 산뜻한 초봄' : isLateSpring ? '싱그러운 늦봄' : '따스하고 화사한 봄',
      seasonEn: isEarlySpring ? 'crisp early spring' : isLateSpring ? 'bright late spring' : 'fresh sunlit spring',
      seasonAdjectiveEn: isEarlySpring ? 'early-spring' : isLateSpring ? 'late-spring' : 'spring',
    };
  }

  if (month >= 6 && month <= 8) {
    const isLateSummer = month === 8 && day >= 15;
    return {
      year,
      month,
      day,
      isoDate,
      seasonKey: 'summer',
      seasonKo: isLateSummer ? '늦여름' : '여름',
      seasonFullKo: isLateSummer ? '선선함이 감도는 늦여름' : '청량하고 눈부신 여름',
      seasonEn: isLateSummer ? 'breezy late summer' : 'bright sunlit summer',
      seasonAdjectiveEn: isLateSummer ? 'late-summer' : 'summer',
    };
  }

  if (month >= 9 && month <= 11) {
    const isEarlyAutumn = month === 9;
    const isLateAutumn = month === 11;
    return {
      year,
      month,
      day,
      isoDate,
      seasonKey: 'autumn',
      seasonKo: isLateAutumn ? '늦가을' : isEarlyAutumn ? '초가을' : '가을',
      seasonFullKo: isLateAutumn ? '선선하고 맑은 늦가을' : isEarlyAutumn ? '선선한 바람이 부는 초가을' : '맑고 선선한 가을',
      seasonEn: isLateAutumn ? 'crisp late-autumn' : isEarlyAutumn ? 'breezy early-autumn' : 'crisp golden autumn',
      seasonAdjectiveEn: isLateAutumn ? 'late-autumn' : isEarlyAutumn ? 'early-autumn' : 'autumn',
    };
  }

  const isEarlyWinter = month === 12;
  return {
    year,
    month,
    day,
    isoDate,
    seasonKey: 'winter',
    seasonKo: isEarlyWinter ? '초겨울' : '겨울',
    seasonFullKo: isEarlyWinter ? '차갑고 맑은 초겨울' : '맑고 포근한 겨울',
    seasonEn: isEarlyWinter ? 'crisp early winter' : 'crisp clear winter',
    seasonAdjectiveEn: isEarlyWinter ? 'early-winter' : 'winter',
  };
}

export function stripSopNegativeClauses(rawText: string): string {
  return (rawText || '')
    .replace(/exclude\s*:[^\n\r]*/gi, ' ')
    .replace(/\b(?:while\s+)?(?:avoiding|avoid|never\s+use|never\s+include|do\s+not\s+use|don't\s+use|excluding|free\s+of|free\s+from)\b[^.;\n\r]*/gi, ' ')
    .replace(/(?:금지|제외|배제)[^\n\r]*/g, ' ')
    .replace(/(?:^|[\s,])-[a-z0-9][a-z0-9\s-]*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectSopEraMode(theme: Partial<Theme>): SopEraMode {
  const titleAndCat = `${theme.name || ''} ${theme.category || ''}`.toLowerCase();
  const positiveText = stripSopNegativeClauses(
    `${theme.name || ''} ${theme.category || ''} ${theme.sop || ''}`
  ).toLowerCase();

  if (
    /\b(1940|1940s|40s|40's|1950|1950s|50s|50's|shellac|phonograph|78\s*rpm|gramophone|doo-wop)\b/i.test(positiveText) ||
    /1940년대|1950년대|축음기/.test(positiveText)
  ) {
    return 'historical_1940s_50s';
  }

  const explicitlyContemporary =
    /\b(2020s|2020's|2020년대|2024|2025|2026|contemporary\s+pop|modern\s+production|crisp\s+modern\s+production)\b/i.test(positiveText);

  if (
    !explicitlyContemporary &&
    (/\b(1970|1970s|70s|70's|1960|1960s|60s|60's|motown|vintage\s+soul|70s\s+funk|disco\s+funk|70's\s+vintage)\b/i.test(positiveText) ||
      /70년대|60년대|빈티지\s*소울/.test(positiveText))
  ) {
    return 'historical_1970s';
  }

  if (
    !explicitlyContemporary &&
    (/\b(1920s?|1930s?|1980s?|80s|80's|1990s?|90s|90's|vintage\s+pop|retro\s+pop|golden\s+oldies)\b/i.test(
      `${titleAndCat} ${positiveText}`
    ) ||
      /80년대|90년대|빈티지\s*팝/.test(positiveText))
  ) {
    return 'historical_retro';
  }

  return 'contemporary';
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

  const startParity = typeof seedOffset === 'number' ? Math.abs(seedOffset) % 2 : Math.floor(Math.random() * 2);
  return Array.from({ length: count }, (_, i) => ((startParity + i) % 2 === 0 ? 'male' : 'female'));
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

export function enforceContemporaryEraInStylePrompt(
  stylePrompt: string,
  eraMode: SopEraMode,
  currentYear: number = new Date().getFullYear(),
  maxLen: number = 975
): string {
  if (eraMode !== 'contemporary' || !stylePrompt) {
    return stylePrompt;
  }

  const { body, excludePrefix, excludeItems } = splitStylePromptAndExclude(stylePrompt);
  let cleanBody = body
    .replace(/\bwarm\s+analog\s+studio\s+depth\b/gi, `crisp ${currentYear} modern studio clarity`)
    .replace(/\bwarm\s+analog\s+saturation\b/gi, 'clean modern harmonic sheen')
    .replace(/\banalog\s+tape\s+saturation\b/gi, 'crisp modern digital-hybrid clarity')
    .replace(/\banalog\s+tape\s+recording\s+vibe\b/gi, `crisp ${currentYear} studio vibe`)
    .replace(/\banalog\s+console\s+mix\b/gi, 'clean modern studio mix')
    .replace(/\banalog\s+synth\s+bass\b/gi, 'modern synth bass')
    .replace(/\banalog\s+sub-?bass\b/gi, 'modern sub-bass')
    .replace(/\banalog\b/gi, 'clean modern')
    .replace(/\b1970s?\s+soul\s+guitar\s+chops\b/gi, 'clean modern indie guitar chops')
    .replace(/\bauthentic\s+(?:1940s?|1950s?|1960s?|1970s?|70's|70s)\b/gi, `fresh ${currentYear} contemporary`)
    .replace(/\b(?:1940s?|1950s?|1960s?|1970s?|1980s?|1990s?|70's|70s|80's|80s|90's|90s|50's|40's)\b/gi, 'contemporary')
    .replace(/\btight\s+dry\s+vintage\s+kit\b/gi, 'tight dry modern drum kit')
    .replace(/\bvintage\s+(?:fender\s+)?rhodes\b/gi, 'warm Rhodes')
    .replace(/\bvintage\s+electric\s+piano\b/gi, 'warm Rhodes electric piano')
    .replace(/\bvintage\b/gi, 'modern')
    .replace(/\bretro\b/gi, 'contemporary')
    .replace(/\bold[-\s]school\b/gi, 'modern')
    .replace(/\bdated\s+sonic\s+tropes\b/gi, 'fresh modern sonic palette')
    .replace(/\b(?:cassette\s+hiss|shellac|78\s*rpm|gramophone|phonograph)\b/gi, 'crisp studio presence')
    .replace(/\b(?:modern\s+){2,}/gi, 'modern ')
    .replace(/\b(?:contemporary\s+){2,}/gi, 'contemporary ')
    .replace(/\b(?:clean\s+modern\s+){2,}/gi, 'clean modern ')
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,+/g, ', ')
    .replace(/^[,\s]+|[,\s]+$/g, '');

  if (!/\b(2020s|2020's|2026|modern|contemporary)\b/i.test(cleanBody)) {
    cleanBody = cleanBody ? `${cleanBody}, crisp ${currentYear} contemporary production` : `crisp ${currentYear} contemporary production`;
  }

  const nextExclude = [...excludeItems];
  const seen = new Set(nextExclude.map((e) => e.trim().toLowerCase()));
  for (const ban of ['-1970s', '-vintage', '-retro']) {
    if (!seen.has(ban)) {
      seen.add(ban);
      nextExclude.push(ban);
    }
  }

  const excludeStr = nextExclude.length > 0 ? `${excludePrefix}${nextExclude.join(', ')}` : '';
  const buildFull = (b: string) =>
    excludeStr ? `${b.replace(/[,\s]+$/, '')}, ${excludeStr}` : b.replace(/[,\s]+$/, '');

  let combined = buildFull(cleanBody);
  if (combined.length > maxLen) {
    const segs = cleanBody.split(',').map((s) => s.trim()).filter(Boolean);
    while (buildFull(segs.join(', ')).length > maxLen && segs.length > 4) {
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
