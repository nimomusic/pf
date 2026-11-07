import React, { useState } from 'react';
import { X, Check, Sparkles, Cpu, Key, Info, Search, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { ProviderType } from '../types';
import { OPTIMIZED_MODELS, FULL_MODEL_CATALOG, PROVIDER_AUTO_MODELS, PROVIDER_LABELS } from '../constants/models';

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
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  currentProvider,
  currentModel,
  isAutoModel,
  apiKeys,
  onSave
}) => {
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
    return (
      (matchesProvider || searchQuery.length > 2) &&
      (m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">AI 모델 & API 키 설정</h2>
              <p className="text-xs text-slate-500">최소 토큰 자동 최적화 · 5대 추천 모델 · 직접 검색 및 모델명 입력</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. AI 제공사 (Provider) 선택
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'gemini', name: 'Google Gemini', icon: '✨', sub: '초저비용 · 대용량 컨텍스트' },
                { id: 'gpt', name: 'OpenAI GPT', icon: '🤖', sub: '안정적인 구조화 · 다국어' },
                { id: 'claude', name: 'Anthropic Claude', icon: '⚡', sub: '풍부하고 감성적인 가사' },
              ].map((p) => {
                const isSelected = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id as ProviderType)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xl mb-1">{p.icon}</div>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm">{p.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
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
                {showKey ? '키 가리기' : '키 보기'}
              </button>
            </div>
            <input
              type={showKey ? 'text' : 'password'}
              value={keys[provider] || ''}
              onChange={(e) => setKeys({ ...keys, [provider]: e.target.value })}
              placeholder={PROVIDER_LABELS[provider].placeholder}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              {provider === 'gemini'
                ? 'Gemini는 키를 입력하지 않아도 서버에 등록된 기본 Gemini 엔진으로 즉시 구동됩니다.'
                : '입력하신 API 키는 브라우저 로컬 저장소에 안전하게 유지되며 서버 프록시로만 전달됩니다.'}
            </p>
          </div>

          {/* Auto Token Optimization Toggle */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-blue-900 text-xs sm:text-sm">
                  최적 토큰 절약 자동 모드 (Auto Optimization)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  권장
                </span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                선택한 제공사에서 가사 및 플레이리스트 기획 작업에 가장 적합하면서도 API 토큰 비용을 최소화하는 최신 경량 모델(
                {provider === 'gemini' && 'Gemini 3.1 Flash Lite'}
                {provider === 'gpt' && 'GPT-4o mini'}
                {provider === 'claude' && 'Claude 3.5 Haiku'}
                )을 자동으로 적용합니다.
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

          {/* Model Selection Tabs: 5대 추천 모델 VS 직접 검색 및 입력 */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewTab('recommended')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewTab === 'recommended'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  최적화 추천 모델 (5종)
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('search')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewTab === 'search'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>전체 모델 검색 & 직접 입력</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                현재 선택: <strong className="text-blue-600">{autoMode ? `${PROVIDER_AUTO_MODELS[provider]} (자동)` : selectedModel}</strong>
              </div>
            </div>

            {/* TAB 1: 5 Optimized Models */}
            {viewTab === 'recommended' && (
              <div className="space-y-2.5">
                {OPTIMIZED_MODELS.map((m) => {
                  const isSelected = (!autoMode && selectedModel === m.id) || (autoMode && selectedModel === m.id);
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
                          <div className="flex items-center gap-2">
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
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{m.description}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                            <span>
                              <strong>토큰 효율:</strong> {m.efficiencySummary}
                            </span>
                            <span>
                              <strong>주요 용도:</strong> {m.suitability}
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
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="모델명, 카테고리, 용도 검색 (예: 4o, flash, haiku, argon, o3)..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      지우기
                    </button>
                  )}
                </div>

                {/* Direct Custom Model ID Input */}
                <form onSubmit={handleApplyCustomModel} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span>사용자 직접 모델 ID 입력 (Custom Model)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      placeholder="예: gpt-4o-2024-11-20, claude-3-7-sonnet-20250219 등"
                      className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!customModelInput.trim()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      직접 적용
                    </button>
                  </div>
                </form>

                {/* Search Results List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredCatalog.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      검색 결과가 없습니다. 위의 '사용자 직접 모델 ID 입력'을 이용해 보세요.
                    </div>
                  ) : (
                    filteredCatalog.map((m) => {
                      const isSelected = !autoMode && selectedModel === m.id;
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
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{m.name}</span>
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {m.id}
                              </span>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                {m.tag}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">{m.description}</p>
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
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            설정 적용하기
          </button>
        </div>
      </div>
    </div>
  );
};
