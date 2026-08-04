/**
 * OG 画像 (next/og) 内で擬似言語コードを描画するときの前処理。
 *
 * next/og は使用文字に応じて Google Fonts から動的にサブセットを取りに行くが、
 * ≧ / ≦ / ≠ は取得に失敗し (Status: 400)、ビルドログが汚れるうえ字形が欠ける。
 * 擬似言語側はこれらの半角表記も同義として受け付けるので、画像内だけ落として描く。
 */
export function ogSafePseudoCode(text: string): string {
  return text
    .replace(/≧/g, ">=")
    .replace(/≦/g, "<=")
    .replace(/≠/g, "!=");
}
