import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { normalizePastedCode } from "@/lib/joho1/paste";

/**
 * 貼り付けたテキストから行番号 `(01)` とブロック罫線 `│` `└` を取り除く。
 *
 * **受験者が最初にやる操作は「問題冊子のプログラムを貼る」**なので、
 * ここで弾くとシミュレーターが使われない (01-implementation-design.md §2-3)。
 *
 * 黙って書き換えると「貼ったものと違う」と不安になるので、
 * 整形したときは呼び出し側に知らせて UI で伝える。
 */
export function normalizePasteExtension(
  onNormalized?: () => void,
): Extension {
  return EditorView.domEventHandlers({
    paste(event, view) {
      const text = event.clipboardData?.getData("text/plain");
      if (!text) return false;
      const { code, changed } = normalizePastedCode(text);
      if (!changed) return false;

      event.preventDefault();
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: code },
        selection: { anchor: from + code.length },
      });
      onNormalized?.();
      return true;
    },
  });
}
