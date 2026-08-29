export const site = {
  name: "たいてっく",
  /*
   * `fullName` はトップの `<title>`、`description` はトップの meta description と
   * フッターの紹介文に出る。
   *
   * **「わかりやすく」「初学者」「未経験」を明示的に入れている。** 実際の読者は
   * 「基本情報 SQL わかりやすく」「正規化 わかりやすく」のような、
   * 分かりやすさを求める語で検索して来る。中身は厳密な定義を売りにしているが、
   * **入口の文言まで硬くすると、その読者に見つけてもらえない**。
   */
  fullName: "たいてっく — データベースとSQLを、わかりやすく動かして学ぶ",
  description:
    "データベースとSQLを初学者にもわかりやすく。インデックス・正規化・ER図の仕組みを動く図解と厳密な定義で解説し、基本情報技術者試験の擬似言語とSQLはブラウザで動かして確かめられます。プログラミング未経験からデータベーススペシャリスト対策まで。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://taitech.dev",
  ogImage: "/og-default.png",
  author: {
    name: "たいてっく",
    handle: "taitech",
    role: "エンジニア講師 / データエンジニア",
    /*
     * **資格は「取得年つき」で書く。「多数」「ほか」で水増ししない。**
     *
     * 検証可能な証跡（Credly のバッジ URL）は実名が出るため貼らないと決めた
     * (roadmap #84 / log/2026-08-29-eeat-sameas-and-citations.md)。証跡が無いぶん、
     * **具体性で信頼性を作る**方針にしてある。年と数を書くのは飾りではなく、
     * 曖昧な自己申告との差がそこにしか無いため。
     *
     * **有効な資格の「数」を書かないこと。** AWS 認定は 3 年で切れ、更新していないので
     * 数ヶ月ごとに減る。「現在有効なのは N 種」と書くと放置した瞬間に嘘になる。
     */
    bio: "Web系自社開発企業のデータエンジニア。2022〜2024年にAWS認定12種すべてを取得（全冠）、以降は更新していないため順次失効中。IPAデータベーススペシャリスト（2023年）、応用情報技術者、基本情報技術者を保有。Microsoft Azure・Power Platform・LPICなども含めIT資格は計34種。AIエージェント自作・AIプロダクト開発の実務経験もあり。個別指導でSQL・データベース・クラウド・AI活用を教えている。",
    mentorUrl: "https://menta.work/plan/17058",
    /*
     * 外部で同一人物として運用しているプロフィール。
     *
     * **`AuthorJsonLd` / `SiteJsonLd` の `sameAs` と `/about` の可視リンクが
     * 両方ここを読む。** 片方だけに足すと構造化データと可視情報がずれる
     * (guide.md §4-4)。**増やすときは必ずここに足す。**
     *
     * なぜ要るか: Qiita / Zenn / X を運用しているのに、サイトからも構造化データからも
     * 1 本も繋がっていなかった。検索エンジンから見て同一の発信者として束ねる手掛かりが
     * 無い状態で、これは E-E-A-T の Authoritativeness に直接効く
     * (guide.md §5-1: ブランドウェブ言及 0.664 / 被リンク 0.218)。
     *
     * **リンク切れは逆効果**なので、追加時に必ず 200 を確認する。
     */
    profiles: [
      { label: "X", handle: "@taitech_dev", url: "https://x.com/taitech_dev" },
      { label: "Qiita", handle: "@taitech_dev", url: "https://qiita.com/taitech_dev" },
      { label: "Zenn", handle: "@taitech", url: "https://zenn.dev/taitech" },
    ],
  },
  contact: {
    email: "guangpingjiujing@gmail.com",
  },
} as const;

export type Site = typeof site;
