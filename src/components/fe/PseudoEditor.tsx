"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EditorState, Compartment, StateEffect, StateField } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  Decoration,
  DecorationSet,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
} from "@codemirror/language";
import { pseudoLanguage } from "./pseudoLanguage";

const setHighlightLine = StateEffect.define<number | null>();

const highlightLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    let decs = value.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setHighlightLine)) {
        if (e.value == null || e.value < 1) {
          decs = Decoration.none;
        } else {
          const line = Math.min(e.value, tr.state.doc.lines);
          const linePos = tr.state.doc.line(line);
          decs = Decoration.set([
            Decoration.line({
              attributes: { class: "cm-execLine" },
            }).range(linePos.from),
          ]);
        }
      }
    }
    return decs;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const execLineTheme = EditorView.theme({
  "&": {
    fontSize: "0.95rem",
    height: "100%",
  },
  ".cm-scroller": {
    fontFamily:
      "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
    lineHeight: "1.5",
    overflow: "auto",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "1px solid var(--color-border, #e5e7eb)",
    color: "var(--color-muted-foreground, #9ca3af)",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  ".cm-content": {
    caretColor: "black",
  },
  // execLine styles MUST come after activeLine so they win when both classes
  // are present on the same line. The compound `.cm-line.cm-execLine` also
  // raises specificity above the single-class `.cm-activeLine` rule.
  ".cm-line.cm-execLine": {
    backgroundColor: "rgba(255, 214, 0, 0.45)",
  },
  ".cm-line.cm-execLine.cm-activeLine": {
    backgroundColor: "rgba(255, 214, 0, 0.45)",
  },
});

export interface PseudoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  highlightLine?: number | null;
  /** Version counter — the highlight effect re-fires whenever this changes,
   *  even if `highlightLine` is unchanged (e.g. same line highlighted twice
   *  in a row during a loop). */
  highlightVersion?: number;
  height?: string;
  minHeight?: string;
  className?: string;
  /** Called on mount with an imperative handle for programmatic edits. */
  onReady?: (api: { insertText: (text: string) => void }) => void;
}

export function PseudoEditor({
  value,
  onChange,
  readOnly = false,
  highlightLine = null,
  highlightVersion = 0,
  height,
  minHeight = "260px",
  className,
  onReady,
}: PseudoEditorProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const editableCompartment = useMemo(() => new Compartment(), []);
  const [, forceRender] = useState(0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useLayoutEffect(() => {
    if (!parentRef.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        indentOnInput(),
        highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        pseudoLanguage,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        highlightLineField,
        execLineTheme,
        editableCompartment.of(EditorView.editable.of(!readOnly)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChangeRef.current) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });
    const view = new EditorView({ state, parent: parentRef.current });
    viewRef.current = view;
    forceRender((n) => n + 1);
    if (onReady) {
      onReady({
        insertText: (text: string) => {
          const v = viewRef.current;
          if (!v) return;
          const { from, to } = v.state.selection.main;
          v.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length },
          });
          v.focus();
        },
      });
    }
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // We intentionally only initialise once. External `value` changes are
    // handled via a separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setHighlightLine.of(highlightLine) });
    // `highlightVersion` is included so the effect re-fires on every commit,
    // even when the target line is the same as the previous one (e.g. a for
    // loop's header line re-highlighted on the next iteration).
  }, [highlightLine, highlightVersion]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: editableCompartment.reconfigure(
        EditorView.editable.of(!readOnly),
      ),
    });
  }, [readOnly, editableCompartment]);

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height: height ?? undefined,
        minHeight: height ? undefined : minHeight,
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    />
  );
}
