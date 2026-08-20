import { books, type Book } from "@/content/books";

/**
 * `/books` (分野別のおすすめ書籍まとめ) の棚。
 *
 * **棚は `BookDomain` とは別の軸。** domain は「どのトピックページに出してよいか」を
 * 決めるための分類で、SQL の棚のように **複数 domain にまたがる棚がある**
 * (SQL 入門書と DB 設計本はどちらも domain: "rdb")。棚を domain で引くと
 * この横断ができないので、**書籍 ID を読む順に手で並べる**形にしている。
 *
 * 並び順 = 読む順。カードは上から順に読むことを前提に説明を書いているので、
 * 「おすすめ度順」に並べ替えないこと。
 *
 * **1 棚 2 冊に絞っている。** 候補を網羅すると「どれを買えばいいか」が読者に残り、
 * まとめページとして機能しない。棚に載せる本は `books.ts` の `detail` を必ず埋め、
 * 冊数の代わりに 1 冊あたりの情報量で勝負する (unit test で固定)。
 * 基本情報だけは **科目A / 科目B で必要な本が別物**なので、役割違いの 2 冊を置く。
 */
export type BookShelfKey = "itpassport" | "fe" | "sql" | "python";

export type BookShelf = {
  /** ページ内アンカー ID も兼ねる (`/books#python` で個別の棚に直接飛ばせる) */
  key: BookShelfKey;
  label: string;
  /** 見出し直下の 1 文。「誰向けの棚か」だけを書く */
  summary: string;
  /** 選び方の指針。書籍 1 冊ずつの説明 (books.ts の description / detail) と重複させない */
  howToChoose: string[];
  /** 書籍 ID を読む順に並べたもの。**2 冊**に絞る (先頭のコメント参照) */
  order: string[];
  /** 各冊の役割ラベル (「科目A 対策」等)。order と同じ長さ・同じ順で書く */
  roles: string[];
  /** サイト内の関連ページ */
  related: { href: string; label: string }[];
};

export const bookShelves: BookShelf[] = [
  {
    key: "itpassport",
    label: "ITパスポート試験",
    summary:
      "IT の用語をほとんど知らない状態から始める人が大半の試験。テキスト 1 冊と過去問演習で合格圏に届く。",
    howToChoose: [
      "この 2 冊は **どちらか 1 冊**でよい。テキストを 2 冊買うより、1 冊を 2 周して演習に時間を割く方が早い",
      "講義を読むように理解を積みたいなら合格教本、1 冊で問題演習まで終わらせたいなら「いちばんやさしい」",
      "過去問は IPA が公開問題を無料で出しているので、まずはそれで足りる。問題集を買い足すのはテキストを 1 周してから",
      "シラバス改訂で生成 AI・データサイエンス分野が増えている。必ず受験年度に対応した最新版を選ぶ",
    ],
    order: ["ipa-pass-goukaku-kyohon-r08", "ipa-pass-ichiban-yasashii-r08"],
    roles: ["読んで理解する", "1 冊で演習まで"],
    related: [
      { href: "/fe", label: "次のステップ: 基本情報技術者試験の対策ツール" },
    ],
  },
  {
    key: "fe",
    label: "基本情報技術者試験",
    summary:
      "科目A（知識）と科目B（アルゴリズム・情報セキュリティ）で必要な本が違う。ここだけは 2 冊構成が前提になる。",
    howToChoose: [
      "科目A は範囲を通す入門書 1 冊、科目B は擬似言語の読解に特化した 1 冊。**役割が違うので両方要る**",
      "順番は科目A が先。用語の土台がないまま擬似言語に入ると、アルゴリズム以前に問題文で詰まる",
      "2 冊を終えたら過去問題集で本番の分量と時間配分に慣れる。ここは年度版を 1 冊足す",
    ],
    order: ["fe-kitami-r08", "fe-zero-algo-pseudo"],
    roles: ["科目A（知識）", "科目B（アルゴリズム）"],
    related: [
      { href: "/fe/algorithm", label: "擬似言語を 1 行ずつ実行して確かめる" },
      { href: "/fe/sql", label: "科目A の SQL を評価順に動かして確かめる" },
    ],
  },
  {
    key: "sql",
    label: "SQL・データベース",
    summary:
      "SQL を書く力と、テーブルを設計する力は別のスキル。1 冊ずつ順に片付ける。",
    howToChoose: [
      "書けるようになるまでは手を動かした量がそのまま効く。まず入門書のドリルをやり切る",
      "テーブルの切り方（設計）は SQL を書く力とは別のスキル。書けるようになった段階で設計本に進む",
      "この 2 冊の間には幅がある。実行計画やチューニングまで踏み込みたくなったら、その時点でパフォーマンス系を 1 冊足す",
    ],
    order: ["sukkiri-sql", "tatsujin-db-design"],
    roles: ["書けるようになる", "設計できるようになる"],
    related: [
      { href: "/fe/sql", label: "SQL を書いて結果を確かめる（登録不要）" },
      { href: "/rdb-index", label: "インデックスの仕組みを図解で理解する" },
      { href: "/data-modeling", label: "正規化と ER 図を体系的に整理する" },
    ],
  },
  {
    key: "python",
    label: "Python",
    summary:
      "文法を覚えることより、「自分の手で何かを動かせた」経験を先に作るほうが続く。2 冊は段階が違う。",
    howToChoose: [
      "未経験なら、文法を網羅する本より「動くものを作りながら進む本」を先に選ぶ",
      "1 冊目で「動いた」を作り、2 冊目で自分の手作業を実際に自動化する。この順で進めると手が止まりにくい",
      "言語仕様を体系的に埋めたり、書き方の作法を詰めたりするのはその次の段階。ここでは扱わない",
    ],
    order: ["python-1nensei", "python-taikutsu"],
    roles: ["はじめの 1 冊", "実際に自動化する"],
    related: [
      { href: "/fe/algorithm", label: "擬似言語と Python を横に並べて見る" },
    ],
  },
];

/**
 * 棚に並んだ書籍を `order` の順で、役割ラベルと組にして返す。
 * 存在しない ID / 役割ラベルの数の不一致は例外にする
 * (黙って消えると、棚が痩せていることにも役割がずれていることにも気づけない)。
 */
export function booksInShelf(shelf: BookShelf): { book: Book; role: string }[] {
  if (shelf.roles.length !== shelf.order.length) {
    throw new Error(
      `Shelf ${shelf.key}: roles (${shelf.roles.length}) must match order (${shelf.order.length})`,
    );
  }
  return shelf.order.map((id, i) => {
    const book = books.find((b) => b.id === id);
    if (!book) throw new Error(`Book not found in shelf ${shelf.key}: ${id}`);
    return { book, role: shelf.roles[i] };
  });
}
