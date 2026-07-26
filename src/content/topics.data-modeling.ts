export type DataModelingTopic = {
  section: "data-modeling";
  category: "normalization" | "er-diagram";
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

export const dataModelingTopics: DataModelingTopic[] = [
  {
    section: "data-modeling",
    category: "normalization",
    slug: "why",
    path: "/data-modeling/normalization/why",
    title: "なぜ正規化が必要か",
    shortTitle: "なぜ正規化が必要か",
    level: "basic",
    summary:
      "正規化されていないテーブルでは、同じ事実を複数の行に重複して持つために、挿入・更新・削除の各操作で矛盾や情報損失が発生する。この「更新時異常」を体系的に排除するのが正規化の目的である。",
    definition:
      "正規化とは、更新時異常 (挿入異常・更新異常・削除異常) を排除するために、リレーションを関数従属性の分析に基づいて分割し、一つの事実を一つの場所にのみ格納するデータベース設計手法である。",
    keywords: [
      "正規化",
      "データベース正規化",
      "更新時異常",
      "挿入異常",
      "更新異常",
      "削除異常",
      "データ冗長性",
      "一事実一箇所",
    ],
    metaTitle: "なぜ正規化が必要か｜更新時異常 (挿入・更新・削除) を図解",
    metaDescription:
      "正規化されていないテーブルで発生する挿入異常・更新異常・削除異常の 3 種類を図解で解説。同じ事実を複数行に持つことで起きる矛盾と情報損失、なぜ「一事実一箇所」が原則なのか。",
  },
  {
    section: "data-modeling",
    category: "normalization",
    slug: "functional-dependency",
    path: "/data-modeling/normalization/functional-dependency",
    title: "関数従属性 (Functional Dependency)",
    shortTitle: "関数従属性",
    level: "basic",
    summary:
      "属性 X の値が決まると属性 Y の値も一意に決まる関係を関数従属という。この概念は 1NF〜3NF、BCNF まで正規化の全ステップの判定基準になる。部分関数従属・推移関数従属など派生概念も整理する。",
    definition:
      "関数従属性とは、リレーション上で属性集合 X の値が定まれば属性集合 Y の値が一意に定まる関係 (X → Y と表記) であり、テーブルの意味的整合性と正規化判定の基準として用いられる概念である。",
    keywords: [
      "関数従属",
      "関数従属性",
      "functional dependency",
      "部分関数従属",
      "推移関数従属",
      "推移的関数従属",
      "完全関数従属",
      "多値従属",
      "決定関数",
      "FD",
    ],
    metaTitle: "関数従属性 (Functional Dependency) とは｜図解で理解",
    metaDescription:
      "関数従属性の定義と例を図解で解説。X → Y の記法、完全関数従属・部分関数従属・推移関数従属・多値従属の違い、関数従属の判定手順、2NF/3NF/4NF との対応まで整理。",
  },
  {
    section: "data-modeling",
    category: "normalization",
    slug: "keys",
    path: "/data-modeling/normalization/keys",
    title: "キーの階層 (スーパーキー・候補キー・主キー)",
    shortTitle: "キーの階層",
    level: "basic",
    summary:
      "正規化の議論に入る前に、スーパーキー・候補キー・主キーの3階層と、外部キー・代替キー・複合キーとの関係を整理する。2NF/3NF の「非キー属性」「部分従属」を語るための語彙を揃える。",
    definition:
      "候補キーとは、テーブルの 1 行を一意に見分けられる列の組み合わせのうち「これ以上どれか 1 つでも削ったら見分けられなくなる」最小のものをいい、その中から実装上 1 つを選んで主キーとする。",
    keywords: [
      "候補キー",
      "主キー",
      "スーパーキー",
      "代替キー",
      "複合キー",
      "外部キー",
      "極小性",
      "一意性",
    ],
    metaTitle: "候補キー・主キー・スーパーキーの違い｜キーの階層を図解",
    metaDescription:
      "候補キー・主キー・スーパーキー・外部キー・代替キー・複合キーの関係を図解で整理。極小性と一意性の観点から、2NF/3NF で語られる「非キー属性」「部分従属」を理解するための語彙。",
  },
  {
    section: "data-modeling",
    category: "normalization",
    slug: "1nf",
    path: "/data-modeling/normalization/1nf",
    title: "第1正規形 (1NF)",
    shortTitle: "第1正規形",
    level: "basic",
    summary:
      "全ての属性がアトミック値をとり、繰り返しグループを含まない状態が第1正規形。非1NF (unnormalized form) の代表例を並置し、1NF に変換する具体的手続きを図解する。",
    definition:
      "第1正規形とは、リレーションの全ての属性が単一値 (アトミック値) を持ち、繰り返しグループや複合値を含まない状態をいい、以降の全ての正規形の前提となる最も基本的な正規形である。",
    keywords: [
      "第1正規形",
      "1NF",
      "アトミック値",
      "単一値",
      "繰り返しグループ",
      "非1NF",
      "正規化手順",
    ],
    metaTitle: "第1正規形 (1NF) とは｜非 1NF から変換する手順を図解",
    metaDescription:
      "第 1 正規形の定義と、非 1NF から 1NF に変換する具体的手続きを図解で解説。アトミック値・繰り返しグループ・非 1NF の代表例を並置し、以降の 2NF・3NF の前提を整理。",
  },
  {
    section: "data-modeling",
    category: "normalization",
    slug: "2nf",
    path: "/data-modeling/normalization/2nf",
    title: "第2正規形 (2NF)",
    shortTitle: "第2正規形",
    level: "basic",
    summary:
      "複合主キーの一部分にだけ関数従属する非キー属性 (部分関数従属) を切り出して別テーブル化するのが 2NF。単一主キーのテーブルは自動的に 2NF を満たす点も整理する。",
    definition:
      "第2正規形とは、第1正規形を満たし、かつ非キー属性のすべてが候補キー全体に完全関数従属している (候補キーの一部分だけで決まる部分関数従属を持たない) リレーションの状態をいう。",
    keywords: [
      "第2正規形",
      "2NF",
      "部分関数従属",
      "完全関数従属",
      "複合キー",
      "候補キー",
      "非キー属性",
    ],
    metaTitle: "第2正規形 (2NF) とは｜部分関数従属の排除を図解",
    metaDescription:
      "第 2 正規形の定義と、複合主キーの一部にだけ関数従属する非キー属性（部分関数従属）を切り出す手続きを図解で解説。単一主キーのテーブルが自動的に 2NF を満たす理由まで。",
  },
  {
    section: "data-modeling",
    category: "normalization",
    slug: "3nf",
    path: "/data-modeling/normalization/3nf",
    title: "第3正規形 (3NF)",
    shortTitle: "第3正規形",
    level: "basic",
    summary:
      "非キー属性が別の非キー属性を経由して主キーに従属する「推移関数従属」を排除するのが 3NF。実務ではここまで来れば十分と言われることが多い理由も示す。",
    definition:
      "第3正規形とは、第2正規形を満たし、かつ非キー属性が候補キー以外の非キー属性を経由して関数従属していない (推移関数従属を持たない) リレーションの状態をいう。",
    keywords: [
      "第3正規形",
      "3NF",
      "推移関数従属",
      "推移的従属",
      "非キー属性",
      "候補キー",
    ],
    metaTitle: "第3正規形 (3NF) とは｜推移関数従属の排除を図解",
    metaDescription:
      "第 3 正規形の定義と、非キー属性が別の非キー属性を経由して主キーに従属する「推移関数従属」を排除する手続きを図解で解説。実務では 3NF で十分と言われる理由まで。",
  },
  {
    section: "data-modeling",
    category: "normalization",
    slug: "denormalization",
    path: "/data-modeling/normalization/denormalization",
    title: "非正規化とパフォーマンスの実務判断",
    shortTitle: "非正規化",
    level: "advanced",
    summary:
      "読み取り性能や運用の都合で、あえて正規化を崩す設計判断が非正規化。何を守り何を捨てるか、カバリングインデックスやマテリアライズドビューとの棲み分けまで含めて整理する。",
    definition:
      "非正規化 (denormalization) とは、参照性能や運用容易性を優先し、正規化により分割されたリレーションを意図的に冗長化または結合統合する設計手法であり、更新時異常のリスクと引き換えに読み取り効率を得る。",
    keywords: [
      "非正規化",
      "denormalization",
      "データ冗長性",
      "パフォーマンス",
      "参照性能",
      "カバリングインデックス",
      "マテリアライズドビュー",
    ],
    metaTitle: "非正規化 (Denormalization) とは｜実務判断を図解",
    metaDescription:
      "非正規化の実務判断を図解で解説。読み取り性能や運用の都合であえて正規化を崩す設計、何を守り何を捨てるか、カバリングインデックスやマテリアライズドビューとの棲み分けまで。",
  },
  {
    section: "data-modeling",
    category: "er-diagram",
    slug: "entity",
    path: "/data-modeling/er-diagram/entity",
    title: "エンティティ (実体) とは",
    shortTitle: "エンティティ",
    level: "basic",
    summary:
      "ER 図の四角い箱の中身。何をエンティティにするか、何を属性に落とすかの判断基準を、身近な例で整理する。",
    definition:
      "エンティティとは、実世界における区別可能な対象または概念であって、ER モデルにおいて属性の集合として表現される抽象単位である。",
    keywords: [
      "エンティティ",
      "実体",
      "ER図",
      "属性",
      "強エンティティ",
      "弱エンティティ",
    ],
    metaTitle: "エンティティとは｜ER 図の「箱」の中身を身近な例で図解",
    metaDescription:
      "ER 図におけるエンティティ (実体) の定義と、何を箱にして何を属性に落とすかの判断基準を、会社・学校・家族などの身近な例で図解。強エンティティと弱エンティティの導入まで。",
  },
  {
    section: "data-modeling",
    category: "er-diagram",
    slug: "relationship",
    path: "/data-modeling/er-diagram/relationship",
    title: "関連 (リレーションシップ) とは",
    shortTitle: "関連",
    level: "basic",
    summary:
      "ER 図の線が表す「エンティティ同士がどう繋がっているか」の意味。役割名と方向、自己参照 (再帰関連) までを身近な例で整理する。",
    definition:
      "関連とは、2 つ以上のエンティティ集合の間に存在する意味的な繋がりを表す ER モデルの構成要素であり、その両端のカーディナリティと参加制約によって関係の性質が規定される。",
    keywords: [
      "関連",
      "リレーションシップ",
      "ER図",
      "役割名",
      "再帰関連",
      "自己参照",
    ],
    metaTitle: "関連 (リレーションシップ) とは｜ER 図の「線」の意味を図解",
    metaDescription:
      "ER 図の関連 (リレーションシップ) の定義と、役割名の付け方、自己参照 (再帰関連) の書き方までを身近な例で図解。同じエンティティ間に複数の関連があるときの区別方法まで。",
  },
  {
    section: "data-modeling",
    category: "er-diagram",
    slug: "cardinality",
    path: "/data-modeling/er-diagram/cardinality",
    title: "カーディナリティ (多重度) とは",
    shortTitle: "カーディナリティ",
    level: "basic",
    summary:
      "「1 人の部長は何人の部下を持つか」を規定する多重度制約。1:1、1:N、多対多 を身近な例で整理する。",
    definition:
      "カーディナリティとは、ER モデルにおいて 2 つのエンティティ集合の間の関連が、片方のインスタンス 1 個に対してもう片方のインスタンス何個と結び付くかを規定する多重度制約である。",
    keywords: [
      "カーディナリティ",
      "多重度",
      "1対1",
      "1対多",
      "多対多",
      "ER図",
      "IE記法",
      "鳥足",
    ],
    metaTitle: "カーディナリティとは｜1対1・1対多・多対多を身近な例で図解",
    metaDescription:
      "ER 図のカーディナリティ (多重度) の定義と、1:1・1:N・N:M の 3 種類を「1 人の部長と部下」「1 人の学生と履修科目」など身近な例で図解。IE 記法 (crow's foot) の記号の読み方まで。",
  },
  {
    section: "data-modeling",
    category: "er-diagram",
    slug: "optionality",
    path: "/data-modeling/er-diagram/optionality",
    title: "参加制約 (必須参加 / 任意参加) とは",
    shortTitle: "参加制約",
    level: "basic",
    summary:
      "「所属する社員が 0 人の部署を認めるか」「どの部署にも所属していない社員を認めるか」を規定する最小基数の制約。IE 記法の記号の読み方まで。",
    definition:
      "参加制約 (optionality) とは、ER モデルにおいて関連の各エンティティ側が関連に必ず参加するか (必須参加) 参加しないことも許されるか (任意参加) を規定する、最小基数についての制約である。",
    keywords: [
      "参加制約",
      "optionality",
      "必須参加",
      "任意参加",
      "最小基数",
      "IE記法",
    ],
    metaTitle: "参加制約とは｜必須参加と任意参加を「0 人の部署」を例に図解",
    metaDescription:
      "ER 図の参加制約 (optionality) の定義と、必須参加・任意参加を「所属 0 人の部署を認めるか」「配属前の内定者を登録できるか」など具体的な設計判断に落として図解。IE 記法の記号 (縦棒 / 円) の読み方まで。",
  },
  {
    section: "data-modeling",
    category: "er-diagram",
    slug: "many-to-many",
    path: "/data-modeling/er-diagram/many-to-many",
    title: "多対多 (N:M) と連関実体",
    shortTitle: "多対多",
    level: "basic",
    summary:
      "「1 学生は複数科目を取り、1 科目に複数学生が集まる」の多対多関係を、連関実体 (履修登録) で分解する手続き。",
    definition:
      "多対多 (N:M) 関連とは、両側のエンティティが互いに複数個と結び付く関連であり、実装時には両者を参照する連関実体 (関連実体・中間テーブル) に分解される。",
    keywords: [
      "多対多",
      "N:M",
      "連関実体",
      "関連実体",
      "中間テーブル",
      "履修登録",
      "ER図",
    ],
    metaTitle: "多対多 (N:M) と連関実体とは｜中間テーブルへの分解を図解",
    metaDescription:
      "ER 図の多対多 (N:M) 関連と連関実体 (中間テーブル) の定義を、「学生と履修科目」「顧客と商品」の例で図解。中間テーブルを作らないと何が起きるか、いつ属性を持たせるかまで。",
  },
  {
    section: "data-modeling",
    category: "er-diagram",
    slug: "weak-entity",
    path: "/data-modeling/er-diagram/weak-entity",
    title: "弱エンティティと識別関係",
    shortTitle: "弱エンティティ",
    level: "basic",
    summary:
      "「注文書の 3 行目」のように、親がいなければ意味を持たないエンティティ。エンティティ側から見れば「弱」、関連側から見れば「識別関係」— 主キーの構造で判別する。",
    definition:
      "弱エンティティ (weak entity) とは、自身の属性だけでは行を一意に識別できず、親エンティティの主キーを借りて初めて一意になるエンティティであり、親との関連は識別関係 (identifying relationship)、対義の独立エンティティ同士を繋ぐ関連は非識別関係と呼ばれる。",
    keywords: [
      "弱エンティティ",
      "weak entity",
      "強エンティティ",
      "識別関係",
      "非識別関係",
      "identifying relationship",
      "複合主キー",
    ],
    metaTitle: "弱エンティティと識別関係とは｜「注文明細」を例に図解",
    metaDescription:
      "弱エンティティと識別関係の定義を「注文と注文明細」「建物と部屋」の例で図解。強エンティティ / 非識別関係との違い、主キーが親のキーを含むかで判別する手続き、ON DELETE CASCADE などの実装帰結まで。",
  },
  {
    section: "data-modeling",
    category: "er-diagram",
    slug: "notation",
    path: "/data-modeling/er-diagram/notation",
    title: "ER 図の記法比較 (IE / IDEF1X / Chen)",
    shortTitle: "記法",
    level: "basic",
    summary:
      "同じ ER 図を 3 記法で描き分けた 1:1 対応表。実務ではどれを選ぶかの判断基準まで。",
    definition:
      "ER 図の記法とは、エンティティ・関連・カーディナリティ・参加制約などの ER モデル構成要素を図式化する視覚言語であり、IE 記法 (crow's foot)、IDEF1X、Chen 記法などが実務・学術の場面ごとに使われる。",
    keywords: [
      "ER図 記法",
      "IE記法",
      "IDEF1X",
      "Chen記法",
      "crow's foot",
      "情報工学記法",
    ],
    metaTitle: "ER 図の記法比較 (IE / IDEF1X / Chen)｜同じ図を 3 記法で描き分け",
    metaDescription:
      "ER 図の主要 3 記法 (IE / IDEF1X / Chen) を同じ ER 図で描き分け、記号の 1:1 対応表と、実務ではどの記法を選ぶかの判断基準まで解説。",
  },
];
