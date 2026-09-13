import { EditorView } from '@codemirror/view';

export function createActiveVerseTracker(onLineChange: (lineIndex: number) => void) {
  let lastLine = -1;

  return EditorView.updateListener.of(update => {
    if (update.selectionSet || update.docChanged) {
      const head = update.state.selection.main.head;
      const lineIndex = update.state.doc.lineAt(head).number - 1;

      if (lineIndex !== lastLine) {
        lastLine = lineIndex;
        onLineChange(lineIndex);
      }
    }
  });
}
