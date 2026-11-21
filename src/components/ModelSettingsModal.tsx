import React, { useState } from 'react';
import { X, Check, Sparkles, Cpu, Key, Info, Search, SlidersHorizontal } from 'lucide-react';
import { ProviderType } from '../types';
import { OPTIMIZED_MODELS, FULL_MODEL_CATALOG, PROVIDER_AUTO_MODELS, PROVIDER_LABELS } from '../constants/models';
import { getTranslation } from '../i18n/translations';

const EN_OPTIMIZED_META: Record<string, { badge: string; description: string; efficiencySummary: string; suitability: string }> = {
  'gpt-5.4-mini': {
    badge: 'Next-Gen Smart Mini',
    description: 'OpenAI next-gen high-efficiency mini model. Precisely plans modern music trends, lyrics structure, and Suno prompts at high speed.',
    efficiencySummary: 'Next-gen intelligence optimized for music & lyric planning',
    suitability: 'Complex theme SOP alignment, multilingual rhyme optimization'
  },
  'gpt-4o-mini': {
    badge: 'Best OpenAI Value',
    description: 'OpenAI lightweight flagship offering gpt-4o level intelligence at over 60% lower token cost for structured music metadata.',
    efficiencySummary: 'Low cost, high reliability, top-tier JSON & formatting accuracy',
    suitability: 'Suno style tags, YouTube SEO keywords & tracklist structuring'
  },
  'gpt-4.1-mini': {
    badge: 'Precision Music Plan',
    description: 'Lightweight model with improved reasoning and high instruction adherence for section distribution and vocal direction.',
    efficiencySummary: 'High SOP compliance and fast response time',
    suitability: 'Detailed vocal texture and track runtime design'
  },
  'gemini-3.1-flash-lite': {
    badge: 'Min Token · Ultra Fast',
    description: 'Google ultra-lightweight model delivering the lowest token cost and blazing speed for multi-track playlist & lyric generation.',
    efficiencySummary: 'Lowest input/output token cost, #1 price-to-performance',
    suitability: 'Multi-track lyric generation, cohesive playlist planning'
  },
  'claude-3-5-haiku-20241022': {
    badge: 'Poetic Lyrics · Fast',
    description: 'Anthropic lightweight model combining 3x faster response speed with expressive, poetic lyric writing.',
    efficiencySummary: 'Fast response with literary vocabulary at low token usage',
    suitability: 'Ballad, indie, and jazz lyrics with strong rhyme and flow'
  },
  'gemini-3.8-flash': {
    badge: 'Flagship Standard',
    description: 'Balanced speed and creative intelligence for genre blending and trendy YouTube playlist copywriting.',
    efficiencySummary: 'Mid-tier token cost with strong creative expression',
    suitability: 'Large playlist (5-10 tracks) storyline composition'
  },
  'gpt-4o': {
    badge: 'Premium Quality',
    description: 'Premium flagship model for deep musical knowledge and polished YouTube SEO packaging.',
    efficiencySummary: 'Higher token cost with top-tier completeness & nuance',
    suitability: 'Premium album planning & detailed thumbnail prompts'
  }
};

const EN_CATALOG_META: Record<string, { category: string; tag: string; description: string }> = {
  'gemini-3.1-flash-lite': { category: 'Ultra-Light', tag: 'Min Token Pick', description: 'Ultra-low cost · Fast response · Ideal for multi-track planning & lyrics' },
  'gemini-3.8-flash': { category: 'Flagship', tag: 'Standard Pick', description: 'Multimodal reasoning & balanced creativity · Rich phrasing' },
  'gemini-4-argon': { category: 'Deep Reasoning', tag: 'Deep Logic', description: 'Complex music theory, structured narrative & advanced planning' },
  'gemini-flash-latest': { category: 'Alias', tag: 'Latest Flash', description: 'Dynamically points to the latest Google Flash model' },
  'gpt-5.4-mini': { category: 'Next-Gen Smart', tag: 'Next-Gen Mini', description: 'OpenAI next-gen mini · Precise trend & lyric structure planning' },
  'gpt-4.1-mini': { category: 'Precision Plan', tag: 'Precision', description: 'High SOP adherence · Detailed vocal texture & runtime design' },
  'gpt-4o-mini': { category: 'Ultra-Light', tag: 'Min Token Pick', description: 'Best OpenAI value · Structured JSON & Suno style tags' },
  'gpt-4o': { category: 'Flagship', tag: 'High Quality', description: 'Deep genre analysis & trendy YouTube SEO packaging' },
  'o3-mini': { category: 'Reasoning', tag: 'Logic Focus', description: 'Specialized in STEM & complex rhyme/structure analysis' },
  'o1-mini': { category: 'Reasoning', tag: 'Light Logic', description: 'Complex lyric rhyme & musical theme mapping' },
  'o1': { category: 'Reasoning Pro', tag: 'Deep Logic', description: 'Long-form lyrics & deep musical storytelling' },
  'gpt-4.5-preview': { category: 'Next-Gen Large', tag: 'Preview', description: 'OpenAI large intelligence preview model' },
  'gpt-4-turbo': { category: 'High Perf', tag: 'Turbo', description: '128k context high-performance model' },
  'claude-3-5-haiku-20241022': { category: 'Ultra-Light', tag: 'Min Token Pick', description: 'Fast emotional lyrics · Poetic vocabulary at low token cost' },
  'claude-3-5-sonnet-20241022': { category: 'Flagship', tag: 'Literary Art', description: 'Poetic lyrics & refined playlist copywriting' },
  'claude-3-7-sonnet-20250219': { category: 'Hybrid', tag: 'Latest Sonnet', description: 'Hybrid thinking + standard intelligence flagship' },
  'claude-3-opus-20240229': { category: 'Heavy Flagship', tag: 'Deep Literary', description: 'Philosophical depth & polished literary songwriting' }
};

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: ProviderType;
  currentModel: string;
  isAutoModel: boolean;
  apiKeys: Record<ProviderType, string>;
  onSave: (settings: {
    provider: ProviderType;
    model: string;
    isAutoModel: boolean;
    apiKeys: Record<ProviderType, string>;
  }) => void;
  lang?: string;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  currentProvider,
  currentModel,
  isAutoModel,
  apiKeys,
  onSave,
  lang = 'ko'
}) => {
  const t = getTranslation(lang);
  const isKo = lang === 'ko';
  const [provider, setProvider] = useState<ProviderType>(currentProvider);
  const [selectedModel, setSelectedModel] = useState<string>(currentModel);
  const [autoMode, setAutoMode] = useState<boolean>(isAutoModel);
  const [keys, setKeys] = useState<Record<ProviderType, string>>({ ...apiKeys });
  const [showKey, setShowKey] = useState(false);

  // Search & Custom Model state
  const [searchQuery, setSearchQuery] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');
  const [viewTab, setViewTab] = useState<'recommended' | 'search'>('recommended');

  if (!isOpen) return null;

  const getPlaceholder = (p: ProviderType) => {
    if (p === 'gemini') return t.apiKeyPlaceholderGemini;
    if (p === 'claude') return t.apiKeyPlaceholderClaude;
    return t.apiKeyPlaceholderGpt;
  };

  const handleProviderChange = (newProvider: ProviderType) => {
    setProvider(newProvider);
    if (autoMode) {
      setSelectedModel(PROVIDER_AUTO_MODELS[newProvider]);
    } else {
      const match = FULL_MODEL_CATALOG.find((m) => m.id === selectedModel);
      if (!match || match.provider !== newProvider) {
        setSelectedModel(PROVIDER_AUTO_MODELS[newProvider]);
      }
    }
  };

  const handleAutoModeToggle = (checked: boolean) => {
    setAutoMode(checked);
    if (checked) {
      setSelectedModel(PROVIDER_AUTO_MODELS[provider]);
    }
  };

  const handleSelectModel = (modelId: string, modelProvider?: ProviderType) => {
    setSelectedModel(modelId);
    if (modelProvider && modelProvider !== provider) {
      setProvider(modelProvider);
    }
  };

  const handleApplyCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (customModelInput.trim()) {
      setAutoMode(false);
      setSelectedModel(customModelInput.trim());
      setCustomModelInput('');
    }
  };

  const handleSave = () => {
    onSave({
      provider,
      model: autoMode ? PROVIDER_AUTO_MODELS[provider] : selectedModel,
      isAutoModel: autoMode,
      apiKeys: keys
    });
    onClose();
  };

  // Filtered models for search tab
  const filteredCatalog = FULL_MODEL_CATALOG.filter((m) => {
    const matchesProvider = m.provider === provider;
    if (!searchQuery.trim()) return matchesProvider;
    const q = searchQuery.toLowerCase();
    const enMeta = EN_CATALOG_META[m.id];
    return (
      (matchesProvider || searchQuery.length > 2) &&
      (m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (enMeta && (enMeta.category.toLowerCase().includes(q) || enMeta.description.toLowerCase().includes(q))))
    );
  });

  const autoModelName =
    provider === 'gemini'
      ? 'Gemini 3.1 Flash Lite'
      : provider === 'gpt'
      ? 'GPT-5.4 mini'
      : 'Claude 3.5 Haiku';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/50 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">{t.msTitle}</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">{t.msSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-sm">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t.msProviderHeading}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { id: 'gemini', name: 'Google Gemini', icon: '✨', sub: t.msGeminiSub },
                { id: 'gpt', name: 'OpenAI GPT', icon: '🤖', sub: t.msGptSub },
                { id: 'claude', name: 'Anthropic Claude', icon: '⚡', sub: t.msClaudeSub },
              ].map((p) => {
                const isSelected = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id as ProviderType)}
                    className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-lg sm:text-xl mb-1">{p.icon}</div>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm">{p.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>{PROVIDER_LABELS[provider].label}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer"
              >
                {showKey ? t.hideKey : t.showKey}
              </button>
            </div>
            <input
              type={showKey ? 'text' : 'password'}
              value={keys[provider] || ''}
              onChange={(e) => setKeys({ ...keys, [provider]: e.target.value })}
              placeholder={getPlaceholder(provider)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 flex items-start gap-1 leading-snug">
              <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
              <span>{provider === 'gemini' ? t.msGeminiHint : t.msOtherHint}</span>
            </p>
          </div>

          {/* Auto Token Optimization Toggle */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <h4 className="font-bold text-blue-900 text-xs sm:text-sm">
                  {t.msAutoTitle}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white whitespace-nowrap">
                  {t.msAutoRecommended}
                </span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                {t.msAutoDesc.replace('{model}', autoModelName)}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => handleAutoModeToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Model Selection Tabs */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewTab('recommended')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    viewTab === 'recommended'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.msTabRecommended}
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('search')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    viewTab === 'search'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.msTabSearch}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                {t.msCurrentSelection}{' '}
                <strong className="text-blue-600">
                  {autoMode ? `${PROVIDER_AUTO_MODELS[provider]} (${t.msAutoTag})` : selectedModel}
                </strong>
              </div>
            </div>

            {/* TAB 1: Optimized Models */}
            {viewTab === 'recommended' && (
              <div className="space-y-2.5">
                {OPTIMIZED_MODELS.map((m) => {
                  const isSelected = (!autoMode && selectedModel === m.id) || (autoMode && selectedModel === m.id);
                  const enMeta = !isKo ? EN_OPTIMIZED_META[m.id] : undefined;
                  const badge = enMeta?.badge || m.badge;
                  const desc = enMeta?.description || m.description;
                  const eff = enMeta?.efficiencySummary || m.efficiencySummary;
                  const suit = enMeta?.suitability || m.suitability;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setAutoMode(false);
                        handleSelectModel(m.id, m.provider);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm">{m.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                m.tokenCostTier === 'lowest'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : m.tokenCostTier === 'low'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : m.tokenCostTier === 'balanced'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}
                            >
                              {badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{desc}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                            <span>
                              <strong>{t.msTokenEfficiency}</strong> {eff}
                            </span>
                            <span>
                              <strong>{t.msPrimaryUse}</strong> {suit}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 pt-1">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: Searchable Catalog & Direct Model Input */}
            {viewTab === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.msSearchPlaceholder}
                    className="w-full pl-9 pr-14 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {t.msClearSearch}
                    </button>
                  )}
                </div>

                {/* Direct Custom Model ID Input */}
                <form onSubmit={handleApplyCustomModel} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.msCustomModelLabel}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      placeholder={t.msCustomModelPlaceholder}
                      className="flex-1 min-w-0 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!customModelInput.trim()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {t.msApplyCustom}
                    </button>
                  </div>
                </form>

                {/* Search Results List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredCatalog.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      {t.msNoSearchResults}
                    </div>
                  ) : (
                    filteredCatalog.map((m) => {
                      const isSelected = !autoMode && selectedModel === m.id;
                      const enMeta = !isKo ? EN_CATALOG_META[m.id] : undefined;
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setAutoMode(false);
                            handleSelectModel(m.id, m.provider);
                          }}
                          className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-800">{m.name}</span>
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {m.id}
                              </span>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                {enMeta?.tag || m.tag}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">{enMeta?.description || m.description}</p>
                          </div>

                          <div className="shrink-0">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {t.msCancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {t.msApplySettings}
          </button>
        </div>
      </div>
    </div>
  );
};
