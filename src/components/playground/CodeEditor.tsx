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
import type { Extension } from "@codemirror/state";

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

/**
 * 句単位のハイライト。**行単位の `highlightLineField` とは別に持つ。**
 *
 * 擬似言語のステップ実行は「今どの行か」だが、SQL の段階実行は「今どの句か」で、
 * `WHERE 単価 > 100` のように 1 行の一部だけを指す必要がある
 * (docs/wip/20260815-fe-sql/01-implementation-design.md §1-1)。
 * 文字オフセットの範囲を受けて mark decoration を張る。
 */
const setHighlightRange = StateEffect.define<{ from: number; to: number } | null>();

const highlightRangeMark = Decoration.mark({ class: "cm-execRange" });

const highlightRangeField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    let decs = value.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setHighlightRange)) continue;
      if (e.value == null) {
        decs = Decoration.none;
        continue;
      }
      // 範囲がドキュメント長を超えるとdispatchで例外になるので必ず丸める
      const max = tr.state.doc.length;
      const from = Math.max(0, Math.min(e.value.from, max));
      const to = Math.max(from, Math.min(e.value.to, max));
      decs = from === to ? Decoration.none : Decoration.set([highlightRangeMark.range(from, to)]);
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
  // 句単位のハイライト。行ハイライトと同じ黄色だが、下線で「範囲」だと分かるようにする
  ".cm-execRange": {
    backgroundColor: "rgba(255, 214, 0, 0.45)",
    boxShadow: "inset 0 -2px 0 0 rgba(180, 140, 0, 0.9)",
    borderRadius: "2px",
  },
});

export interface CodeEditorProps {
  /** 言語定義と追加装飾。CodeMirror の拡張をそのまま渡す */
  extensions: Extension[];
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  highlightLine?: number | null;
  /**
   * 句単位でハイライトする文字オフセットの範囲。SQL の段階実行で使う。
   * `highlightLine` と併用してよい (別々の decoration として重なる)。
   */
  highlightRange?: { from: number; to: number } | null;
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

export function CodeEditor({
  extensions,
  value,
  onChange,
  readOnly = false,
  highlightLine = null,
  highlightRange = null,
  highlightVersion = 0,
  height,
  minHeight = "260px",
  className,
  onReady,
}: CodeEditorProps) {
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
        history(),
        bracketMatching(),
        indentOnInput(),
        highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        ...extensions,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        highlightLineField,
        highlightRangeField,
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

    /*
      画面外でマウントされたエディタは行の高さを計測できず、CodeMirror は
      HeightOracle の既定値 (14px) のまま gutter を描く。実際の行高は 22.8px なので、
      その間だけ行番号とブロック罫線が本文とずれる。

      **これを IntersectionObserver で直そうとしないこと。** 2026-08-08 に試して
      1px も変わらなかった。根拠は @codemirror/view の ViewState.measure():

        if (!this.inView && !this.scrollTarget && !inWindow(view.dom)) return 0;

      `inWindow()` は要素の矩形を **viewport (win.innerWidth/innerHeight)** と比べるので、
      fold 下のエディタはここで早期 return し、外から requestMeasure() を呼んでも
      計測自体が走らない。可視になれば CodeMirror が自前の IntersectionObserver で
      measure() するので、後から張る observer は「同じことを二度やる」だけになる。

      ずれているのは画面外にある間だけで、ユーザーがその状態を見ることはない。
    */
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
    view.dispatch({ effects: setHighlightRange.of(highlightRange) });
    // highlightRange はオブジェクトなので、参照が変わるだけでも張り直す。
    // from/to を依存に展開すると、同じ範囲を再指定したときに再発火しない
  }, [highlightRange, highlightVersion]);

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
