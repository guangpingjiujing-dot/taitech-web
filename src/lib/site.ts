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
    bio: "Web系自社開発企業のデータエンジニア。AWS認定全冠保持経験、IPAデータベーススペシャリスト、応用情報技術者ほかIPA系資格を多数保有。AIエージェント自作・AIプロダクト開発の実務経験もあり。個別指導でSQL・データベース・クラウド・AI活用を教えている。",
    mentorUrl: "https://menta.work/plan/17058",
  },
  contact: {
    email: "guangpingjiujing@gmail.com",
  },
} as const;

export type Site = typeof site;
