/**
 * デモ動画に重ねる注釈レイヤー。
 *
 * ナレーション代わりの字幕ではなく「視線誘導」が目的。X は動画をミュートで
 * 自動再生するので、無音・無テキストだと最初の 1〜2 秒で何の画面か伝わらない。
 * また一番見せたい変化 (合計が 0 → 40 → 110 → 200) は右パネルの小さな文字なので、
 * スマホの TL では何もしないと見落とされる。
 *
 * 入れるのは 3 つだけ。増やすとサイトのモノクロな見た目から浮く。
 * - キャプション: 画面下の 1 行。今どこを見ればいいかを言う
 * - リング: 注目させたいパネルを囲む枠
 * - エンドカード: 最後に URL を出す (投稿本文にリンクを貼らない運用なので、
 *   URL を伝えられるのは動画の中だけ)
 */

/** ページ側に注入する window.__demo の型 */
export interface DemoOverlay {
  caption(text: string | null): void;
  ring(panelTitle: string | null): void;
  endCard(headline: string, url: string): void;
}

declare global {
  interface Window {
    __demo: DemoOverlay;
  }
}

/**
 * 注釈レイヤーを DOM に差し込み、`window.__demo` を生やす。
 * page.evaluate に渡して実行する関数なので、外部の変数を参照してはいけない。
 */
export function installOverlay(): void {
  const FONT = `"Hiragino Sans", "Noto Sans JP", sans-serif`;
  const FG = "#0a0a0a";
  const BG = "#fafafa";

  const layer = document.createElement("div");
  layer.style.cssText = [
    "position:fixed",
    "inset:0",
    "pointer-events:none",
    "z-index:2147483647",
    `font-family:${FONT}`,
  ].join(";");

  // --- キャプション (画面下の 1 行) ---
  const captionWrap = document.createElement("div");
  captionWrap.style.cssText = [
    "position:absolute",
    "left:0",
    "right:0",
    // グリッド下端 (約 y=640) とリングの下辺に被らない位置。
    // 上げすぎるとパネルの枠に重なる
    "bottom:14px",
    "display:flex",
    "justify-content:center",
  ].join(";");
  const caption = document.createElement("div");
  caption.style.cssText = [
    `background:${FG}`,
    `color:${BG}`,
    "padding:9px 20px",
    "border-radius:8px",
    "font-size:23px",
    "font-weight:700",
    "letter-spacing:0.5px",
    "opacity:0",
    "transition:opacity .28s ease",
  ].join(";");
  captionWrap.appendChild(caption);

  // --- リング (注目パネルを囲む枠) ---
  const ring = document.createElement("div");
  ring.style.cssText = [
    "position:absolute",
    `border:3px solid ${FG}`,
    "border-radius:12px",
    "opacity:0",
    // 位置はアニメーションさせない。リングは常に「消えている間」に置き直すので
    // 移動を見せる意味がなく、top/left だけ補間されると width/height は即時反映な
    // ぶん、変数ペインから出力ペインへ動く途中の大きさが合わないコマが写る
    "transition:opacity .28s ease",
  ].join(";");

  // --- エンドカード ---
  const endCard = document.createElement("div");
  endCard.style.cssText = [
    "position:absolute",
    "inset:0",
    `background:${BG}`,
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "justify-content:center",
    "gap:18px",
    "opacity:0",
    "transition:opacity .45s ease",
  ].join(";");

  layer.append(ring, captionWrap, endCard);
  document.body.appendChild(layer);

  /** h3 の見出しテキストからパネルの <section> を引く */
  function findPanel(title: string): HTMLElement | null {
    const headings = Array.from(document.querySelectorAll("h3"));
    const hit = headings.find((h) => h.textContent?.trim() === title);
    return hit?.closest("section") ?? null;
  }

  window.__demo = {
    caption(text) {
      if (text === null) {
        caption.style.opacity = "0";
        return;
      }
      caption.textContent = text;
      caption.style.opacity = "1";
    },

    ring(panelTitle) {
      if (panelTitle === null) {
        ring.style.opacity = "0";
        return;
      }
      const panel = findPanel(panelTitle);
      if (!panel) return;
      const r = panel.getBoundingClientRect();
      const pad = 7;
      ring.style.top = `${r.top - pad}px`;
      ring.style.left = `${r.left - pad}px`;
      ring.style.width = `${r.width + pad * 2}px`;
      ring.style.height = `${r.height + pad * 2}px`;
      ring.style.opacity = "1";
    },

    endCard(headline, url) {
      const h = document.createElement("div");
      h.textContent = headline;
      h.style.cssText = `font-size:34px;font-weight:700;color:${FG}`;
      const u = document.createElement("div");
      u.textContent = url;
      u.style.cssText = [
        "font-size:46px",
        "font-weight:800",
        `color:${FG}`,
        `border-bottom:4px solid ${FG}`,
        "padding-bottom:6px",
      ].join(";");
      endCard.replaceChildren(h, u);
      endCard.style.opacity = "1";
      caption.style.opacity = "0";
      ring.style.opacity = "0";
    },
  };
}