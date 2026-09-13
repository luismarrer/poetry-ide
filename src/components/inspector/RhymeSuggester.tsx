import React, { useState, useMemo } from 'react';
import type { VerseAnalysis } from '@/poetry/meter/analyzeVerse';
import { poeticDictionary, type PoeticWordEntry } from '@/poetry/rhyme/poeticDictionary';
import { Sparkles, Search, Copy, Check, Plus, Filter, HelpCircle } from 'lucide-react';

interface RhymeSuggesterProps {
  verse?: VerseAnalysis
  rhymeMode: 'consonant' | 'assonant'
  onRhymeModeChange?: (mode: 'consonant' | 'assonant') => void
  onInsertWord?: (word: string) => void
}

export const RhymeSuggester: React.FC<RhymeSuggesterProps> = ({
  verse,
  rhymeMode,
  onRhymeModeChange,
  onInsertWord,
}) => {
  const [activeTab, setActiveTab] = useState<'consonant' | 'assonant'>(rhymeMode);
  const [syllableFilter, setSyllableFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  // Sync activeTab when external rhymeMode changes if no manual override was set
  React.useEffect(() => {
    setActiveTab(rhymeMode);
  }, [rhymeMode]);

  // Extract ending from active verse
  const rhymeEnding = verse?.rhymeEnding;

  // Compute suggestions based on active verse OR custom search query
  const searchResults = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return poeticDictionary.search(searchQuery.trim(), activeTab, {
        syllables: syllableFilter || undefined,
        limit: 30,
      });
    }

    if (!rhymeEnding) {
      return { matchedEnding: '', assonantScheme: '', results: [] };
    }

    const lastWord = verse?.words[verse.words.length - 1]?.raw;
    const results = poeticDictionary.suggestForVerseEnding(rhymeEnding, activeTab, {
      syllables: syllableFilter || undefined,
      excludeWord: lastWord,
      limit: 30,
    });

    return {
      matchedEnding: rhymeEnding.normalized,
      assonantScheme: rhymeEnding.assonantEnding || rhymeEnding.vowelsOnly,
      results,
    };
  }, [verse, rhymeEnding, activeTab, syllableFilter, searchQuery]);

  const handleCopy = (word: string) => {
    navigator.clipboard.writeText(word).then(() => {
      setCopiedWord(word);
      setTimeout(() => setCopiedWord(null), 1800);
    });
  };

  const currentEndingLabel = activeTab === 'consonant'
    ? (rhymeEnding ? `-${rhymeEnding.raw}` : 'consonante')
    : (rhymeEnding ? `${rhymeEnding.assonantEnding || rhymeEnding.vowelsOnly}` : 'asonante');

  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Sugeridor de Rimas</span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-0.5 rounded border border-[var(--border-color)]">
          <button
            onClick={() => {
              setActiveTab('consonant');
              if (onRhymeModeChange && rhymeMode !== 'consonant') {
                onRhymeModeChange('consonant');
              }
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'consonant'
                ? 'bg-[var(--bg-surface)] text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            data-testid="suggester-tab-consonant"
          >
            Consonante
          </button>
          <button
            onClick={() => {
              setActiveTab('assonant');
              if (onRhymeModeChange && rhymeMode !== 'assonant') {
                onRhymeModeChange('assonant');
              }
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'assonant'
                ? 'bg-[var(--bg-surface)] text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            data-testid="suggester-tab-assonant"
          >
            Asonante
          </button>
        </div>
      </div>

      {/* Free Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={
            rhymeEnding
              ? `Buscar otra palabra (o rimando con ${currentEndingLabel})...`
              : 'Escribe una palabra para buscar rimas (ej: noche, luna)...'
          }
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-purple-500"
          data-testid="rhyme-suggester-search-input"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs"
            title="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>

      {/* Syllable Filters (Metric fit for Silva / Endecasílabos / Heptasílabos) */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[11px]">
        <span className="text-[var(--text-muted)] flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" />
          Sílabas:
        </span>
        {[
          { label: 'Todas', val: null },
          { label: '2', val: 2 },
          { label: '3', val: 3 },
          { label: '4', val: 4 },
        ].map(item => (
          <button
            key={String(item.val)}
            onClick={() => setSyllableFilter(item.val)}
            className={`px-2 py-0.5 rounded transition-colors ${
              syllableFilter === item.val
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/50'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
            }`}
            data-testid={`filter-syllables-${item.val ?? 'all'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]/60">
        <span>
          {searchQuery ? (
            <>Rimas para <strong className="text-[var(--text-primary)] font-mono">{searchQuery}</strong></>
          ) : rhymeEnding ? (
            <>
              {activeTab === 'consonant' ? 'Rima consonante' : 'Rima asonante'} para{' '}
              <strong className="text-[var(--text-primary)] font-mono">{currentEndingLabel}</strong>
            </>
          ) : (
            'Sugerencias de rima'
          )}
        </span>
        <span>{searchResults.results.length} encontradas</span>
      </div>

      {/* Results Grid / Chips */}
      <div
        className="max-h-48 overflow-y-auto pr-1 flex flex-wrap gap-1.5"
        data-testid="rhyme-suggestions-list"
      >
        {searchResults.results.length > 0 ? (
          searchResults.results.map(item => {
            const isCopied = copiedWord === item.word;
            return (
              <div
                key={item.word}
                className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-purple-400 dark:hover:border-purple-600 transition-all text-xs"
              >
                <button
                  onClick={() => handleCopy(item.word)}
                  className="font-serif font-medium text-[var(--text-primary)] hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 cursor-pointer"
                  title={`Copiar "${item.word}" (${item.syllables} sílabas, ${item.stressType})`}
                  data-testid={`rhyme-word-${item.word}`}
                >
                  <span>{item.word}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1 rounded">
                    {item.syllables}s
                  </span>
                </button>

                <div className="flex items-center gap-0.5 border-l border-[var(--border-color)] pl-1">
                  <button
                    onClick={() => handleCopy(item.word)}
                    className="text-[var(--text-muted)] hover:text-purple-600 dark:hover:text-purple-400 p-0.5 rounded transition-colors"
                    title="Copiar al portapapeles"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>

                  {onInsertWord && (
                    <button
                      onClick={() => onInsertWord(item.word)}
                      className="text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 rounded transition-colors"
                      title="Insertar al final del verso activo"
                      data-testid={`insert-word-${item.word}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full py-4 text-center text-[var(--text-muted)] text-xs flex flex-col items-center gap-1">
            <HelpCircle className="w-4 h-4 opacity-60" />
            <span>
              {searchQuery || rhymeEnding
                ? 'No se encontraron rimas en el léxico con estos filtros.'
                : 'Escribe un verso con terminación o busca una palabra arriba.'}
            </span>
          </div>
        )}
      </div>

      {copiedWord && (
        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium text-center bg-emerald-50 dark:bg-emerald-950/40 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
          ¡"{copiedWord}" copiado al portapapeles!
        </div>
      )}
    </div>
  );
};
