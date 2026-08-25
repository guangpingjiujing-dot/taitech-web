/**
 * 実行計画セクション (`/query-plan`) のトピック定義。
 *
 * **`stage` は読者の到達点で切っている**（グループ分けではない）:
 *   read — 記号も読む順番も分からない状態から、木を内側から読めるようにする
 *   find — 読める人が「どのノードが遅いか」を指せるようにする（ここが旗艦）
 *   deep — 犯人は分かる人が「なぜ DB はその数字を出したか」まで遡る
 *
 * **表記の定義はこのセクションに 1 箇所だけ置く。** `/rdb-index` 側は定義を持たず、
 * 必要なところからリンクで送る（そうしないと読者が旗艦の途中で他セクションへ飛ばされる）。
 */
export type QueryPlanTopic = {
  section: "query-plan";
  stage: "read" | "find" | "deep";
  /**
   * 学習順序。**配列の並び順に頼らず明示的に持つ**（PrevNext / TopicNav がこれで並べる）。
   * `why-need-rdb` は順序を `PrevNext.tsx` の手書き配列に持たせていて、
   * トピック追加時に足し忘れて前後ナビが消える事故を起こしている。同じ轍を踏まない。
   */
  stageOrder: number;
  slug: string;
  path: string;
  title: string;
  shortTitle: string;
  level: "basic" | "advanced";
  summary: string;
  definition: string;
  keywords: string[];
  /** SEO 用: 指定時は <title> と OG title に使用（未指定なら shortTitle にフォールバック） */
  metaTitle?: string;
  /** SEO 用: 指定時は <meta description> と OG description に使用（未指定なら summary にフォールバック） */
  metaDescription?: string;
};

export const queryPlanTopics: QueryPlanTopic[] = [
  {
    section: "query-plan",
    stage: "read",
    slug: "what-is",
    path: "/query-plan/what-is",
    title: "実行計画とは何か（なぜ DB が計画を立てるのか）",
    shortTitle: "実行計画とは",
    level: "basic",
    stageOrder: 1,
    summary:
      "同じ SQL でも取り方は何通りもあり、DB がその中から 1 つを選んでいる。EXPLAIN をどこで打つかまで。",
    definition:
      "実行計画とは、SQL が「何が欲しいか」しか書いていないのに対して、データベースが「どうやって取るか」を決めた手順書である。同じ結果を返す取り方が複数あるとき、オプティマイザがコストを見積もって 1 つを選ぶ。",
    keywords: ["実行計画", "EXPLAIN", "オプティマイザ", "実行計画 とは", "explain 使い方"],
    metaTitle: "実行計画とは｜EXPLAIN の打ち方から図解",
    metaDescription:
      "実行計画とは何かを、SQL が「何が欲しいか」しか書いていないという話から解説。同じ SQL に取り方が何通りもあり DB が選んでいる仕組みと、psql / GUI クライアント / ORM それぞれで EXPLAIN を打つ方法まで。",
  },
  {
    section: "query-plan",
    stage: "read",
    slug: "read-tree",
    path: "/query-plan/read-tree",
    title: "実行計画を読む順番（木構造・内側から外側へ）",
    shortTitle: "読む順番",
    level: "basic",
    stageOrder: 2,
    summary:
      "上から順に実行される、という最頻出の誤読を潰す。インデントが深い方が先に動く。",
    definition:
      "実行計画は木構造で、インデントが深いノードほど先に実行される。矢印（->）が付いた行が子ノードで、親は子の結果を受け取ってから自分の処理をする。いちばん上の行が最後に実行される。",
    keywords: ["実行計画 読む順番", "explain 読み方", "実行計画 木構造", "explain 上から下"],
    metaTitle: "実行計画を読む順番｜木構造を内側から読む",
    metaDescription:
      "実行計画は上から順に実行されるという誤読を、木構造の図解で潰す。インデントの深いノードから先に動く仕組み、矢印の意味、いちばん上が最後に実行される理由を、本物の EXPLAIN 出力で確認できる。",
  },
  {
    section: "query-plan",
    stage: "read",
    slug: "explain-basics",
    path: "/query-plan/explain-basics",
    title: "cost / rows / width の意味（cost は秒ではない）",
    shortTitle: "cost と rows",
    level: "basic",
    stageOrder: 3,
    summary:
      "各ノードに付く 3 つの数字。cost の単位、rows が見積りであること、width の使われ方。",
    definition:
      "cost は「ページを 1 枚順に読む手間を 1.0 とした相対値」で、秒ではない。開始コストと総コストの 2 つが表示される。rows は 1 回の実行で返ると見積もった行数、width は 1 行の平均バイト数の見積り。",
    keywords: ["explain cost とは", "cost 単位", "explain rows width", "seq_page_cost"],
    metaTitle: "EXPLAIN の cost / rows / width とは｜単位を図解",
    metaDescription:
      "EXPLAIN の cost が秒ではなく相対値であること、開始コストと総コストの違い、rows が見積りにすぎないこと、width が何に使われるかを図解。実出力の数字がどこから来るかまで踏み込んで解説する。",
  },
  {
    section: "query-plan",
    stage: "read",
    slug: "explain-analyze",
    path: "/query-plan/explain-analyze",
    title: "EXPLAIN と EXPLAIN ANALYZE の違い（loops は 1 回あたりの平均）",
    shortTitle: "EXPLAIN ANALYZE",
    level: "basic",
    stageOrder: 4,
    summary:
      "見積りと実測。actual time の 2 つの数字、loops の掛け算、累積時間の引き算まで。",
    definition:
      "EXPLAIN は見積りだけを返すが、EXPLAIN ANALYZE は実際にクエリを実行して実測値も返す。actual time は「初行まで / 全行まで」の 2 つで、loops が 1 より大きいノードでは 1 回あたりの平均が表示される。総量に戻すには loops を掛ける。",
    keywords: [
      "explain analyze 違い",
      "explain analyze 見方",
      "loops とは",
      "actual time",
      "explain analyze 危険",
    ],
    metaTitle: "EXPLAIN ANALYZE の見方｜loops と actual time を図解",
    metaDescription:
      "EXPLAIN と EXPLAIN ANALYZE の違いを実出力で解説。actual time の 2 つの数字、loops があるときは 1 回あたりの平均が出ること、累積時間から自分の時間を引き算で出す方法、DML で打つと本当に更新される注意まで。",
  },
  {
    section: "query-plan",
    stage: "find",
    slug: "find-bottleneck",
    path: "/query-plan/find-bottleneck",
    title: "遅いノードの見つけ方（4 つのサイン）",
    shortTitle: "ボトルネックの特定",
    level: "advanced",
    stageOrder: 5,
    summary:
      "全ノードの自分時間を出して並べる。loops の掛け算、見積りとの乖離、無駄読みの 4 つで犯人を指す。",
    definition:
      "実行計画からボトルネックを特定する手順は、(1) 各ノードの自分時間を引き算で出して降順に並べ、(2) loops が 1 より大きいノードは掛け算で総量に戻し、(3) 実測が見積りの 10 倍以上のノードを根本原因の候補にし、(4) Rows Removed by Filter で無駄読みを見る、の 4 つである。",
    keywords: [
      "sql 遅い 原因",
      "クエリ 遅い 特定",
      "実行計画 ボトルネック",
      "postgresql 遅いクエリ",
      "explain 見るべきポイント",
    ],
    metaTitle: "SQL が遅い原因の特定｜実行計画の 4 つのサイン",
    metaDescription:
      "実行計画のどこを見れば遅い原因が分かるかを、手順として解説。全ノードの自分時間を出す引き算、loops の掛け算で最下位が 1 位に入れ替わる瞬間、見積りとの乖離、無駄読みの 4 つ。本物の 2 秒かかる計画で実演する。",
  },
  {
    section: "query-plan",
    stage: "find",
    slug: "scan-nodes",
    path: "/query-plan/scan-nodes",
    title: "スキャンの種類（Seq / Index / Index Only / Bitmap）",
    shortTitle: "スキャンの種類",
    level: "advanced",
    stageOrder: 6,
    summary:
      "4 種類の表記が何を意味するか。何 % を超えると全表スキャンに切り替わるかを実測で見る。",
    definition:
      "Seq Scan はテーブルを先頭から読む方法、Index Scan はインデックスを辿って 1 行ずつ取りに行く方法、Index Only Scan はインデックスだけで完結してテーブルを読まない方法、Bitmap Heap Scan は該当する行の位置をいったんビットマップに集めてからページ順にまとめて読む方法である。",
    keywords: [
      "seq scan とは",
      "bitmap heap scan",
      "index only scan",
      "seq scan index scan 切り替わり",
      "全表スキャン",
    ],
    metaTitle: "Seq Scan / Index Scan / Bitmap の違い｜切り替わりを実測",
    metaDescription:
      "実行計画に出る 4 種類のスキャンの違いを図解。Bitmap Heap Scan が何のためにあるか、Index Only Scan の Heap Fetches が 0 になる条件、そして対象行が何 % を超えると全表スキャンに切り替わるかを 50 万行の実測で示す。",
  },
  {
    section: "query-plan",
    stage: "find",
    slug: "index-cond-vs-filter",
    path: "/query-plan/index-cond-vs-filter",
    title: "Index Cond と Filter の違い（読む前に効く条件・読んだ後に捨てる条件）",
    shortTitle: "Index Cond と Filter",
    level: "advanced",
    stageOrder: 7,
    summary:
      "同じ WHERE 句でも、インデックスの張り方で Index Cond 側にも Filter 側にも出る。",
    definition:
      "Index Cond はインデックスを辿る段階で使われる条件で、読む行数そのものを減らす。Filter は行を読んだ後に捨てるための条件で、読む量は減らない。Rows Removed by Filter がその無駄読みの量を示す。",
    keywords: [
      "index cond filter 違い",
      "rows removed by filter",
      "recheck cond",
      "インデックス 使われない 確認",
    ],
    metaTitle: "Index Cond と Filter の違い｜同じ条件で見比べる",
    metaDescription:
      "実行計画の Index Cond と Filter の違いを、同じクエリ・同じデータでインデックスの張り方だけを変えた 2 枚の実出力で解説。Rows Removed by Filter が示す無駄読みの量と、複合インデックスで Filter が消える様子まで。",
  },
  {
    section: "query-plan",
    stage: "find",
    slug: "join-nodes",
    path: "/query-plan/join-nodes",
    title: "結合の種類（Nested Loop / Hash Join / Merge Join）",
    shortTitle: "結合の種類",
    level: "advanced",
    stageOrder: 8,
    summary:
      "3 つの結合方式がどう選ばれるか。Nested Loop が事故るのは見積りが外れたとき。",
    definition:
      "Nested Loop は外側の 1 行ごとに内側を引く方式、Hash Join は片側でハッシュ表を作ってもう片側を突き合わせる方式、Merge Join は両側をキー順に並べて突き合わせる方式である。オプティマイザは行数の見積りとインデックスの有無からどれかを選ぶ。",
    keywords: [
      "nested loop 遅い",
      "hash join merge join 違い",
      "結合アルゴリズム",
      "postgresql join 種類",
    ],
    metaTitle: "Nested Loop / Hash Join / Merge Join の違いを図解",
    metaDescription:
      "3 つの結合方式がどう選ばれるかを、同じ 2 テーブルで 3 種類とも出した実行計画で解説。Nested Loop が暴発するのは外側の行数を過小に見積もったときで、そのとき何が起きるかを実測の loops で示す。",
  },
  {
    section: "query-plan",
    stage: "find",
    slug: "sort-and-memory",
    path: "/query-plan/sort-and-memory",
    title: "Sort Method と work_mem（メモリに載らないと何が起きるか）",
    shortTitle: "ソートとメモリ",
    level: "advanced",
    stageOrder: 9,
    summary:
      "external merge はディスクに書いている印。work_mem を超えたときに何が起きるか。",
    definition:
      "Sort Method は並べ替えの方式を示し、quicksort はメモリ内で完結したこと、external merge は work_mem に収まらず一時ファイルに書き出したことを意味する。Memory: と Disk: のどちらが表示されるかで見分ける。",
    keywords: [
      "sort method external merge",
      "work_mem 設定",
      "postgres ソート 遅い",
      "temp file 一時ファイル",
      "hash batches",
    ],
    metaTitle: "external merge とは｜work_mem とソートの一時ファイル",
    metaDescription:
      "実行計画の Sort Method が external merge になる意味を解説。quicksort / top-N heapsort との違い、Disk: と Memory: の見分け方、work_mem を上げたときに同じノードの 1 行がどう変わるかを実出力で確認する。Hash 側の Batches も扱う。",
  },
  {
    section: "query-plan",
    stage: "deep",
    slug: "estimated-rows",
    path: "/query-plan/estimated-rows",
    title: "見積り行数はどこから来るのか（rows=850 を最後まで分解する）",
    shortTitle: "見積り行数の内訳",
    level: "advanced",
    stageOrder: 10,
    summary:
      "3 行しかないテーブルで rows=850 と出る。その 850 を計算で全部再現する。",
    definition:
      "統計情報がないテーブルの見積り行数は、ページ数の下限（10 ページ）と、型ごとの既定の幅から計算した 1 ページあたりの行数の積で決まる。PostgreSQL 本体の estimate_rel_size() がその計算をしている。",
    keywords: [
      "explain rows 実際と違う",
      "見積もり 行数 ずれる",
      "reltuples -1",
      "estimate_rel_size",
      "統計情報 無い",
    ],
    metaTitle: "EXPLAIN の rows はどこから来るか｜850 を分解する",
    metaDescription:
      "3 行しかないテーブルで rows=850 と出る理由を、ページ数の下限・型ごとの既定の幅・1 ページあたりの行数まで遡って全部計算で再現する。reltuples = -1 が「0 行」ではなく「未調査」の印であることや、幅の外れが行数の外れに連鎖する様子も実測で示す。",
  },
];
