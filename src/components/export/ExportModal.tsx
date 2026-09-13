import React, { useState, useMemo } from 'react';
import { X, Download, Copy, Check, FileText, Code, FileSpreadsheet } from 'lucide-react';
import type { PoemAnalysisResult } from '@/poetry/index';
import type { FormId } from '@/poetry/forms/types';
import type { PoemVersion } from '@/poetry/versions/types';
import {
  exportPoemAsPlainText,
  exportPoemAsManuscript,
  exportProjectAsJson,
  triggerFileDownload,
  type StorableProjectState,
} from '@/poetry/storage/projectStorage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formId: FormId;
  analysis: PoemAnalysisResult;
  projectState: StorableProjectState;
  activeVersion: PoemVersion;
}

type ExportTab = 'txt' | 'manuscript' | 'json';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  formId,
  analysis,
  projectState,
  activeVersion,
}) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('txt');
  const [copied, setCopied] = useState<boolean>(false);

  const safeFilenameBase = useMemo(() => {
    const raw = (title || 'poema').trim().toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '_');
    return raw.length > 0 ? raw : 'poema';
  }, [title]);

  const content = useMemo(() => {
    switch (activeTab) {
      case 'txt':
        return exportPoemAsPlainText(title, activeVersion.text);
      case 'manuscript':
        return exportPoemAsManuscript(title, formId, analysis);
      case 'json':
        return exportProjectAsJson(projectState);
      default:
        return '';
    }
  }, [activeTab, title, activeVersion.text, formId, analysis, projectState]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  const handleDownload = () => {
    let filename = `${safeFilenameBase}.txt`;
    let mime = 'text/plain;charset=utf-8';

    if (activeTab === 'manuscript') {
      filename = `${safeFilenameBase}_metrica.md`;
      mime = 'text/markdown;charset=utf-8';
    } else if (activeTab === 'json') {
      filename = `${safeFilenameBase}_backup.json`;
      mime = 'application/json;charset=utf-8';
    }

    triggerFileDownload(filename, content, mime);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="export-modal-backdrop"
    >
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150"
        data-testid="export-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold tracking-tight">Exportar y Guardar Obra</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="Cerrar ventana"
            data-testid="close-export-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('txt')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'txt'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold bg-[var(--bg-surface)] rounded-t-md'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            data-testid="tab-export-txt"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Texto plano (.txt)</span>
          </button>

          <button
            onClick={() => setActiveTab('manuscript')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'manuscript'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold bg-[var(--bg-surface)] rounded-t-md'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            data-testid="tab-export-manuscript"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Manuscrito métrico (.md)</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'json'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold bg-[var(--bg-surface)] rounded-t-md'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            data-testid="tab-export-json"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Copia de seguridad (.json)</span>
          </button>
        </div>

        {/* Info description */}
        <div className="px-5 py-2.5 bg-[var(--bg-primary)] border-b border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
          <span>
            {activeTab === 'txt' && 'Exporta los versos limpios de la versión activa para publicación o lectura.'}
            {activeTab === 'manuscript' &&
              'Genera una tabla completa con número de verso, conteo silábico, acentos rítmicos y rimas.'}
            {activeTab === 'json' &&
              'Exporta todo el proyecto con todas las versiones y ajustes métricos para respaldar y restaurar.'}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            {activeTab === 'txt' && `${safeFilenameBase}.txt`}
            {activeTab === 'manuscript' && `${safeFilenameBase}_metrica.md`}
            {activeTab === 'json' && `${safeFilenameBase}_backup.json`}
          </span>
        </div>

        {/* Content Preview */}
        <div className="flex-1 p-4 overflow-auto min-h-[220px] max-h-[360px] bg-[var(--bg-primary)] font-mono text-xs text-[var(--text-secondary)] border-b border-[var(--border-color)]">
          <pre className="whitespace-pre-wrap select-all">{content}</pre>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-[var(--bg-surface)] flex items-center justify-between gap-3">
          <div className="text-[11px] text-[var(--text-muted)]">
            Tu obra siempre permanece en tu control.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
              data-testid="btn-copy-export"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              data-testid="btn-download-export"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar archivo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
