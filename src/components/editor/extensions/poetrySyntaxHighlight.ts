import { RangeSetBuilder } from '@codemirror/state';
import { EditorView, Decoration, type DecorationSet, ViewPlugin, type ViewUpdate } from '@codemirror/view';

const commentMark = Decoration.mark({
  class: 'cm-poetry-comment',
});

const headingMark = Decoration.mark({
  class: 'cm-poetry-heading',
});

function buildSyntaxDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      const text = line.text;
      const trimmed = text.trim();

      if (trimmed.startsWith('//') || trimmed.startsWith('%')) {
        builder.add(line.from, line.to, commentMark);
      } else if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^(#{1,6})\s+/);
        if (match) {
          builder.add(line.from, line.to, headingMark);
        }
      } else {
        // Check for inline comments: e.g. "verso // comentario" or "verso % comentario"
        const slashIdx = text.indexOf('//');
        const percentIdx = text.indexOf(' %');
        let commentIdx = -1;
        if (slashIdx !== -1 && percentIdx !== -1) {
          commentIdx = Math.min(slashIdx, percentIdx + 1);
        } else if (slashIdx !== -1) {
          commentIdx = slashIdx;
        } else if (percentIdx !== -1) {
          commentIdx = percentIdx + 1;
        }

        if (commentIdx !== -1) {
          builder.add(line.from + commentIdx, line.to, commentMark);
        }
      }

      pos = line.to + 1;
    }
  }
  return builder.finish();
}

export const poetrySyntaxPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildSyntaxDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildSyntaxDecorations(update.view);
      }
    }
  },
  {
    decorations: v => v.decorations,
  }
);

/**
 * Toggles line comments (//) on selected line(s), like Cmd+/ or Ctrl+/ in VS Code.
 */
export function togglePoetryComment(view: EditorView): boolean {
  const { state, dispatch } = view;
  const changes = [];
  const lines = new Set<number>();

  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    for (let l = startLine; l <= endLine; l++) {
      lines.add(l);
    }
  }

  // Check if all lines are commented with //
  let allCommented = true;
  for (const lineNum of lines) {
    const line = state.doc.line(lineNum);
    if (!line.text.trim().startsWith('//')) {
      allCommented = false;
      break;
    }
  }

  for (const lineNum of lines) {
    const line = state.doc.line(lineNum);
    if (allCommented) {
      // Remove // or // 
      const match = line.text.match(/^(\s*)\/\/\s?/);
      if (match) {
        changes.push({
          from: line.from + match[1].length,
          to: line.from + match[0].length,
          insert: '',
        });
      }
    } else {
      // Add // 
      if (!line.text.trim().startsWith('//')) {
        changes.push({
          from: line.from,
          to: line.from,
          insert: '// ',
        });
      }
    }
  }

  if (changes.length > 0) {
    dispatch({ changes });
    return true;
  }
  return false;
}
