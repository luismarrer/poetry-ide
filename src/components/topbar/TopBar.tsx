import React from 'react';
import type { FormId } from '@/poetry/forms/types';
import { Feather, BarChart2, Eye, EyeOff, Sun, Moon, BookOpen, Music } from 'lucide-react';

interface TopBarProps {
  title?: string
  formId: FormId
  onFormChange: (formId: FormId) => void
  showSynalephas: boolean
  onToggleShowSynalephas: () => void
  showRhyme: boolean
  onToggleShowRhyme: () => void
  rhymeMode?: 'consonant' | 'assonant'
  onRhymeModeChange?: (mode: 'consonant' | 'assonant') => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenStats: () => void
  onLoadSample: (key: string) => void
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  formId,
  onFormChange,
  showSynalephas,
  onToggleShowSynalephas,
  showRhyme,
  onToggleShowRhyme,
  rhymeMode = 'consonant',
  onRhymeModeChange,
  theme,
  onToggleTheme,
  onOpenStats,
  onLoadSample,
}) => {
  return (
    <header className="h-14 px-3 sm:px-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between gap-2 select-none z-10">
      {/* Brand */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-indigo-600/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
          <Feather className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap flex items-center gap-1.5">
            Poetry IDE
            {title && (
              <span className="hidden md:inline font-normal text-[var(--text-muted)] text-xs font-serif truncate max-w-[150px]">
                / {title}
              </span>
            )}
          </h1>
          <p className="hidden sm:block text-[10px] text-[var(--text-muted)] -mt-0.5 whitespace-nowrap">
            Métrica prosódica en tiempo real
          </p>
        </div>
      </div>

      {/* Center Controls: Structure & Synalephas */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
        {/* Form Selector */}
        <div className="flex items-center bg-[var(--bg-secondary)] p-0.5 sm:p-1 rounded-md text-xs font-medium border border-[var(--border-color)] flex-shrink-0">
          <button
            onClick={() => onFormChange('libre')}
            className={`px-2 sm:px-3 py-1 rounded transition-colors ${
              formId === 'libre'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            data-testid="form-selector-libre"
          >
            Libre
          </button>
          <button
            onClick={() => onFormChange('silva')}
            className={`px-2 sm:px-3 py-1 rounded transition-colors ${
              formId === 'silva'
                ? 'bg-[var(--bg-surface)] text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            data-testid="form-selector-silva"
          >
            Silva
          </button>
        </div>

        {/* Synalephas toggle */}
        <button
          onClick={onToggleShowSynalephas}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex-shrink-0 ${
            showSynalephas
              ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
          title="Mostrar u ocultar la señalización de sinalefas en el editor"
          data-testid="toggle-synalephas-vis"
        >
          {showSynalephas ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Sinalefas</span>
          <span className="font-mono text-sm leading-none -mt-0.5">‿</span>
        </button>

        {/* Rhyme toggle & mode selector */}
        <div className="flex items-center rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5 text-xs font-medium flex-shrink-0">
          <button
            onClick={onToggleShowRhyme}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded transition-colors ${
              showRhyme
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Mostrar u ocultar la rima en el margen del editor"
            data-testid="toggle-rhyme-vis"
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rima</span>
            <span className="font-mono text-xs font-bold">Aa</span>
          </button>

          {showRhyme && onRhymeModeChange && (
            <div className="flex items-center pl-1 ml-0.5 border-l border-[var(--border-color)]/70 gap-0.5">
              <button
                onClick={() => onRhymeModeChange('consonant')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[11px] transition-colors ${
                  rhymeMode === 'consonant'
                    ? 'bg-[var(--bg-surface)] text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Mostrar solo rimas consonantes"
                data-testid="rhyme-mode-consonant"
              >
                Consonante
              </button>
              <button
                onClick={() => onRhymeModeChange('assonant')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[11px] transition-colors ${
                  rhymeMode === 'assonant'
                    ? 'bg-[var(--bg-surface)] text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Mostrar rimas asonantes según la tradición métrica"
                data-testid="rhyme-mode-assonant"
              >
                Asonante
              </button>
            </div>
          )}
        </div>

        {/* Sample Poems */}
        <div className="relative flex-shrink-0">
          <select
            onChange={e => {
              if (e.target.value) {
                onLoadSample(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="text-xs max-w-[95px] sm:max-w-none bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md px-2 sm:px-2.5 py-1.5 cursor-pointer appearance-none pr-6 sm:pr-7 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
            data-testid="sample-poems-select"
          >
            <option value="" disabled>
              Ejemplos...
            </option>
            <option value="userCorpus">Corpus de prueba</option>
            <option value="silvaGongora">Silva (Luis de Góngora)</option>
            <option value="silvaBello">Silva a la agricultura (Bello)</option>
            <option value="blank">Lienzo en blanco</option>
          </select>
          <BookOpen className="w-3 h-3 text-[var(--text-muted)] absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Right Controls: Stats & Theme */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <button
          onClick={onOpenStats}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
          title="Ver estadísticas poéticas"
          data-testid="open-stats-btn"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Estadísticas</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="p-1.5 sm:p-2 rounded-md bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
          title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          data-testid="theme-toggle"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
