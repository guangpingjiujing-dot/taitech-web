/**
 * 一次資料 (公式仕様書・シラバス・試作問題) の URL。**出典リンクの唯一の正。**
 *
 * ## なぜこれがあるか
 *
 * `/fe` と `/joho1` は「IPA 公表の擬似言語仕様 Ver.5.1 に準拠」「IPA シラバス Ver.9.2 の
 * 範囲」「一次資料をもとに整理する」と**本文で主張しているのに、その資料への発リンクが
 * 1 本も無かった**。読者にも AI にも検証できない主張になっていた
 * (E-E-A-T の Expertise / Trustworthiness、`.claude/skills/ai_era_seo_aio` §3-3・§3-4)。
 *
 * ## なぜ 1 枚にまとめるか
 *
 * IPA / 大学入試センターの PDF URL は不透明なハッシュ (`doe3um0000002djj-att` など) を
 * 含み、**改版のたびに変わる**。ページ側にベタ書きすると、切れたときに全ページを
 * grep して回ることになる。
 *
 * ## 追加・更新するときの規約
 *
 * - **必ず HTTP 200 を確認してから足す。** 切れた出典リンクは信頼性を下げるので、
 *   出典が無い状態より悪い
 * - **バージョンを `version` に持ち、本文の表記もこれに合わせる。**
 *   「Ver.5.1 に準拠」と書いているのに別版の PDF を指す、というずれを防ぐ
 * - `checkedAt` は 200 を確認した日。リンク切れの点検はここを見て回る
 */
export type PrimarySource = {
  /** リンクテキストに使う正式名称。**URL をリンクテキストにしない** */
  label: string;
  /** 発行者。本文で「(IPA)」のように添えるのに使う */
  publisher: string;
  /** 版。本文の「Ver.5.1 に準拠」という表記と一致していること */
  version?: string;
  url: string;
  /** PDF なら true。リンクテキストに (PDF) を添えて不意のダウンロードを避ける */
  pdf?: boolean;
  /** HTTP 200 を最後に確認した日 (YYYY-MM-DD) */
  checkedAt: string;
};

export const primarySources = {
  /** 擬似言語の記述形式。`/fe/algorithm` が準拠を主張している相手 */
  ipaPseudoLanguage: {
    label: "試験で使用する情報技術に関する用語・プログラム言語など Ver.5.1",
    publisher: "IPA",
    version: "Ver.5.1",
    url: "https://www.ipa.go.jp/shiken/syllabus/doe3um0000002djj-att/shiken_yougo_ver5_1.pdf",
    pdf: true,
    checkedAt: "2026-08-29",
  },
  /** 基本情報技術者試験シラバス。`/fe/sql` の「データ操作」の範囲の出どころ */
  ipaFeSyllabus: {
    label: "基本情報技術者試験（レベル2）シラバス Ver.9.2",
    publisher: "IPA",
    version: "Ver.9.2",
    url: "https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kpe-att/syllabus_fe_ver9_2.pdf",
    pdf: true,
    checkedAt: "2026-08-29",
  },
  /** 上 2 つの掲載元。PDF の URL が変わったときはここから辿り直す */
  ipaSyllabusIndex: {
    label: "試験要綱・シラバスについて",
    publisher: "IPA",
    url: "https://www.ipa.go.jp/shiken/syllabus/gaiyou.html",
    checkedAt: "2026-08-29",
  },
  /** DNCL の唯一の公式仕様。`/joho1/dncl` の「仕様を公開している」の実体 */
  dncDncl: {
    label: "共通テスト手順記述標準言語(DNCL)の説明（2022年1月）",
    publisher: "大学入試センター",
    url: "https://www.dnc.ac.jp/albums/abm.php?d=666&f=abm00000819.pdf&n=R4_%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E6%89%8B%E9%A0%86%E8%A8%98%E8%BF%B0%E6%A8%99%E6%BA%96%E8%A8%80%E8%AA%9E%EF%BC%88DNCL%EF%BC%89%E3%81%AE%E8%AA%AC%E6%98%8E.pdf",
    pdf: true,
    checkedAt: "2026-08-29",
  },
  /**
   * 情報I のプログラム表記には仕様書が無く、**試作問題そのものが一次資料**。
   * PDF 直リンクではなく一覧ページを指しているのは、試作問題が複数ファイルに
   * 分かれていて、どれを見るかは読者の目的によるため。
   */
  dncJoho1Sample: {
    label: "令和7年度試験の問題作成の方向性、試作問題等",
    publisher: "大学入試センター",
    url: "https://www.dnc.ac.jp/kyotsu/kako_shiken_jouhou/r7/r7_kentoujoukyou/r7mondai.html",
    checkedAt: "2026-08-29",
  },
} as const satisfies Record<string, PrimarySource>;
