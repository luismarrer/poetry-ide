import React, { useState, useRef } from 'react';
import { X, Upload, FileCode, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { parseProjectBackup, type PoetryProjectBackup } from '@/poetry/storage/projectStorage';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreProject: (backup: PoetryProjectBackup) => void;
  onImportTextAsVersion: (filename: string, text: string) => void;
}

type ImportType = 'json_project' | 'text_file';

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onRestoreProject,
  onImportTextAsVersion,
}) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [parsedBackup, setParsedBackup] = useState<PoetryProjectBackup | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFileContent('');
    setFileName('');
    setImportType(null);
    setParsedBackup(null);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelected = (file: File) => {
    setErrorMessage(null);
    setFileName(file.name);

    const isJson = file.name.endsWith('.json');
    const reader = new FileReader();

    reader.onload = e => {
      const text = (e.target?.result as string) || '';
      setFileContent(text);

      if (isJson) {
        setImportType('json_project');
        const res = parseProjectBackup(text);
        if (res.success) {
          setParsedBackup(res.backup);
        } else {
          setParsedBackup(null);
          setErrorMessage(res.error);
        }
      } else {
        setImportType('text_file');
        setParsedBackup(null);
      }
    };

    reader.onerror = () => {
      setErrorMessage('No se pudo leer el archivo seleccionado.');
    };

    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (importType === 'json_project' && parsedBackup) {
      onRestoreProject(parsedBackup);
      handleClose();
    } else if (importType === 'text_file' && fileContent.trim().length > 0) {
      onImportTextAsVersion(fileName, fileContent);
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={e => {
        if (e.target === e.currentTarget) handleClose();
      }}
      data-testid="import-modal-backdrop"
    >
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150"
        data-testid="import-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold tracking-tight">Cargar o Recuperar Obra</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="Cerrar ventana"
            data-testid="close-import-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt,.md,.text"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />

          {!fileContent ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelected(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-[var(--border-color)] hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-[var(--bg-primary)] hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-center"
              data-testid="import-dropzone"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Haz clic para seleccionar o arrastra un archivo aquí
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Copia de seguridad <code className="font-mono">.json</code> o archivo de versos{' '}
                  <code className="font-mono">.txt / .md</code>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  {importType === 'json_project' ? (
                    <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="text-xs font-medium truncate">{fileName}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {importType === 'json_project'
                        ? 'Copia de seguridad de proyecto'
                        : 'Archivo de texto poético'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => resetState()}
                  className="text-xs text-[var(--text-muted)] hover:text-red-500 px-2 py-1 rounded transition-colors"
                >
                  Cambiar
                </button>
              </div>

              {/* Preview details if JSON backup */}
              {importType === 'json_project' && parsedBackup && (
                <div className="p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex flex-col gap-1.5 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Copia de seguridad válida
                  </div>
                  <p>
                    <span className="font-medium text-[var(--text-primary)]">Título:</span>{' '}
                    {parsedBackup.title || 'Sin título'}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--text-primary)]">Versiones:</span>{' '}
                    {parsedBackup.versions.length} {parsedBackup.versions.length === 1 ? 'versión' : 'versiones'}
                  </p>
                  {parsedBackup.exportedAt && (
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Exportado el: {new Date(parsedBackup.exportedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Preview text file */}
              {importType === 'text_file' && (
                <div className="p-3.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] flex flex-col gap-1">
                  <p className="font-semibold text-[var(--text-primary)]">
                    Importar como nueva versión
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-3 font-mono mt-1">
                    {fileContent.slice(0, 150)}...
                  </p>
                </div>
              )}

              {/* Error box */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {importType === 'json_project' && parsedBackup && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Al restaurar se sustituirá el estado actual del editor con las versiones respaldadas.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!fileContent || Boolean(errorMessage)}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none text-white shadow-xs transition-colors"
            data-testid="btn-confirm-import"
          >
            {importType === 'json_project' ? 'Restaurar proyecto' : 'Importar versos'}
          </button>
        </div>
      </div>
    </div>
  );
};
