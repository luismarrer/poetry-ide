import React, { useState } from 'react';
import type { PoemVersion } from '@/poetry/versions/types';
import { Plus, Copy, Trash2, Edit2, Split, Check } from 'lucide-react';

interface VersionTabsBarProps {
  versions: PoemVersion[]
  activeVersionId: string
  onSelectVersion: (id: string) => void
  onCreateVersion: () => void
  onDuplicateVersion: (id: string) => void
  onDeleteVersion: (id: string) => void
  onRenameVersion: (id: string, newName: string) => void
  isSplitView: boolean
  onToggleSplitView: () => void
}

export const VersionTabsBar: React.FC<VersionTabsBarProps> = ({
  versions,
  activeVersionId,
  onSelectVersion,
  onCreateVersion,
  onDuplicateVersion,
  onDeleteVersion,
  onRenameVersion,
  isSplitView,
  onToggleSplitView,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  const startEditing = (v: PoemVersion) => {
    setEditingId(v.id);
    setTempName(v.name);
  };

  const saveEditing = () => {
    if (editingId && tempName.trim().length > 0) {
      onRenameVersion(editingId, tempName.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      className="h-10 px-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between gap-2 select-none flex-shrink-0"
      data-testid="version-tabs-bar"
    >
      {/* Tabs list */}
      <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {versions.map(v => {
          const isActive = v.id === activeVersionId;
          const isEditing = editingId === v.id;

          return (
            <div
              key={v.id}
              className={`group relative flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-color)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] border border-transparent'
              }`}
              data-testid={`version-tab-${v.id}`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEditing();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={saveEditing}
                    autoFocus
                    className="w-24 px-1 py-0.5 text-xs bg-[var(--bg-primary)] border border-indigo-500 rounded focus:outline-none"
                    data-testid="rename-version-input"
                  />
                  <button onClick={saveEditing} className="text-emerald-500 hover:text-emerald-600">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSelectVersion(v.id)}
                  onDoubleClick={() => startEditing(v)}
                  className="flex items-center gap-1.5 focus:outline-none"
                  title="Haz doble clic para renombrar"
                >
                  <span className="truncate max-w-[140px]">{v.name}</span>
                </button>
              )}

              {/* Action buttons on tab hover */}
              {!isEditing && (
                <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      startEditing(v);
                    }}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded"
                    title="Renombrar versión"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDuplicateVersion(v.id);
                    }}
                    className="text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 rounded"
                    title="Duplicar versión"
                    data-testid={`duplicate-version-${v.id}`}
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                  {versions.length > 1 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteVersion(v.id);
                      }}
                      className="text-[var(--text-muted)] hover:text-red-500 p-0.5 rounded"
                      title="Eliminar versión"
                      data-testid={`delete-version-${v.id}`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* New Version Button */}
        <button
          onClick={onCreateVersion}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors border border-dashed border-[var(--border-color)]"
          title="Crear nueva versión vacía"
          data-testid="create-version-btn"
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* Split View Toggle */}
      <button
        onClick={onToggleSplitView}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex-shrink-0 ${
          isSplitView
            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-semibold shadow-xs'
            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)] hover:border-indigo-400/50'
        }`}
        title="Abrir dos versiones simultáneamente en pantalla dividida para comparar"
        data-testid="toggle-split-view-btn"
      >
        <Split className="w-3.5 h-3.5" />
        <span>{isSplitView ? 'Cerrar división' : 'Abrir dos versiones'}</span>
      </button>
    </div>
  );
};
