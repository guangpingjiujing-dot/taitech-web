import { buildTopicMetadata } from "@/lib/metadata";
import Link from "next/link";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { ExcelTable } from "@/components/viz/rdb-fundamentals/ExcelTable";
import { findTopic } from "@/content/topics";

const slug = "uniqueness";
const topic = findTopic("why-need-rdb", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "主キーと UNIQUE 制約はどう違う？",
    a: "主キーは NOT NULL + 一意性の組で、テーブルに 1 つだけ設定できます。UNIQUE 制約は複数設定可能で NULL を許容します (多くの DBMS で NULL 重複は許容)。",
  },
  {
    q: "「同姓同名の別人」を扱いたい時はどう設計する？",
    a: "名前を主キーにせず、代理キー (サロゲートキー、例: 連番 ID) を主キーにします。名前だけで判定しないよう業務側にも識別ルール (メール / 電話 / 生年月日) を定義します。",
  },
  {
    q: "UNIQUE 制約の NULL の扱いは DBMS でどう違う？",
    a: "PostgreSQL / MySQL は複数の NULL を許容、Oracle も同様。SQL Server は 1 つの NULL のみ許容 (歴史的経緯)。移植性を考えるなら UNIQUE 列は NOT NULL にするのが安全です。",
  },
  {
    q: "複合ユニークとは？",
    a: "複数列の組み合わせに対する UNIQUE 制約です。例: UNIQUE (order_id, product_id) で「同じ注文の同じ商品は 1 行のみ」を保証します。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="why-need-rdb" slug={slug}>
      <TopicJsonLd section="why-need-rdb" slug={slug} faq={faq} />

      <h2>事故 — 「山田太郎」の行が 4 つある。同一人物？別 4 名？</h2>
      <p>
        1 年ぶりに戻ってきた山田太郎さんは、自分の EC アカウントを覚えていなかった。ログイン画面で試行錯誤の末に「新規登録」を選んだが、
        以前使っていた email も思い出せない。とりあえず適当な文字列 (<code>n/a</code>、<code>unknown</code>、<code>-</code>) を入れて 3 回登録試行し、
        いずれも登録は通ってしまった。翌週、顧客管理シートを見ると「山田太郎」が 4 行ある。
      </p>

      <ExcelTable
        title="顧客管理シート — 「山田太郎」の行が 4 つ"
        sheetName="顧客.xlsx"
        columns={["顧客ID", "顧客名", "メール", "登録日"]}
        rows={[
          ["C-001", "山田太郎", "yamada@example.com", "2024-01-15"],
          ["C-011", "山田太郎", "n/a", "2025-11-01"],
          ["C-012", "山田太郎", "unknown", "2025-11-01"],
          ["C-013", "山田太郎", "-", "2025-11-01"],
          ["C-002", "佐藤花子", "sato@example.com", "2024-02-10"],
        ]}
        highlightCells={[
          { row: 1, col: 2, tone: "wrong" },
          { row: 2, col: 2, tone: "wrong" },
          { row: 3, col: 2, tone: "wrong" },
        ]}
        note="4 行は (a) 同姓同名の別 4 名か、(b) 1 人が 3 回追加登録した残骸か、システムからは判定できない"
      />

      <p>
        <strong>ここで先に確認しておきたい</strong>: 山田太郎という名前が 3 行あっても、それ自体は問題ない。
        現実に同姓同名の別人は存在する。顧客ID (C-001 / C-011 / C-012 / C-013) は自動採番で unique なので、
        <strong>DB 的な UNIQUE(顧客ID) 制約は既に満たされている</strong>。
      </p>
      <p>
        では何が問題なのか。<strong>「山田太郎さんとして戻ってきたお客さんが、C-001 の再訪か、それとも別の新規 3 名か」を DB から判定できない</strong>ことが問題。
        マーケメールは 4 通全員に届き苦情が出た。「今月の新規顧客数」統計は
        <span className="whitespace-nowrap">3 名</span> 増と報告されたが、実際は 0 (1 名の登録試行) だった可能性が高い。
        カスタマーサポートに「私の注文履歴が見つからない」と問い合わせが殺到した。
      </p>

      <h2>原因 — 「識別に使うべき列」に UNIQUE 制約がない</h2>
      <p>
        Excel の顧客シートには、どの列に対しても <strong>「絶対に重複させない」</strong>という宣言的な制約が無い。
        顧客ID はプログラム側の自動採番で <em>結果的に</em> unique になっているだけで、DB 側では何も保証していない。
      </p>
      <p>
        本当に unique であるべきなのは、<strong>顧客を業務的に識別する属性</strong> — つまり email や電話番号のような
        「同じ人なら同じ値になる」自然キー。ここに UNIQUE 制約が掛かっていれば、山田太郎さんが 2 回目の登録を試みた時点で
        <code>yamada@example.com</code> の重複挿入としてシステムが弾ける。
      </p>
      <p>
        <strong>surrogate key (顧客ID) の UNIQUE は「常に満たされる自明な条件」で、業務上ほとんど意味を持たない</strong>。
        意味のある UNIQUE は 自然キー (email / phone / 会員番号) に掛ける必要がある。Excel にはこの区別が無いので、
        surrogate key を unique にすればそれで満足してしまう構造になっている。
      </p>

      <h2>解決策 — 識別属性に UNIQUE + NOT NULL を宣言する</h2>
      <p>
        RDB では、テーブル定義時に <strong>「この列は絶対に重複しない」「NULL 禁止」</strong>を宣言できる。
        重複挿入は DBMS が拒否する。人間の運用に依存しない。
      </p>
      <pre>
        <code>{`CREATE TABLE customers (
  id         BIGSERIAL PRIMARY KEY,     -- surrogate key: 自動採番で常に unique
  email      VARCHAR(255) NOT NULL,     -- 業務的な識別属性
  name       VARCHAR(50)  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- 意味のある UNIQUE は「識別に使うべき列」に掛ける
  CONSTRAINT customers_email_key UNIQUE (email)
);

-- 山田太郎さんが 2 回目の登録を試みる → DBMS が拒否
INSERT INTO customers (email, name)
  VALUES ('yamada@example.com', '山田太郎');
-- ERROR: duplicate key value violates unique constraint "customers_email_key"`}</code>
      </pre>
      <p>
        本記事の主題である <strong>「一意性 = UNIQUE 制約」</strong> はこれだけ。
        「識別に使うべき列を選び、そこに UNIQUE を掛ける」がすべて。
      </p>

      <h3>補足: junk 値による回避と CHECK 制約</h3>
      <p>
        実は UNIQUE(email) だけでは、悪意なしのユーザーが <code>n/a</code>、<code>unknown</code>、<code>-</code> のような
        異なる junk 文字列を毎回入れて再登録するのを防げない (それぞれが別の unique 値として通ってしまう)。
        これを塞ぐには、email の <em>形式そのもの</em> を検証する <strong>CHECK 制約</strong> を併用する必要がある
        (別記事「CHECK / NOT NULL 制約」で扱う予定)。
      </p>
      <p>
        UNIQUE と CHECK は別の制約であり、扱う概念も別 (前者は「値の重複禁止」、後者は「値の形式検証」)。
        本記事はあくまで UNIQUE (一意性) に集中する。
      </p>

      <h3>「自然キー」vs「代理キー (サロゲートキー)」</h3>
      <p>
        主キーの候補は 2 種類:
      </p>
      <ul>
        <li>
          <strong>自然キー (natural key)</strong>: 業務データそのもの (email、社員番号、ISBN)。
          人間にとって意味があり、業務的な同一性を表現できる。
          <strong>だが値が変わる (email 変更、番号採番ルール変更) と参照が壊れる</strong>
        </li>
        <li>
          <strong>代理キー (surrogate key)</strong>: 業務と無関係な連番や UUID (<code>id</code> 列)。
          値が絶対に変わらないので参照が安定する。ただし「同じ人か違う人か」の情報は持たない
        </li>
      </ul>
      <p>
        多くの実務では <strong>surrogate key を主キーに、自然キー (email 等) に UNIQUE 制約</strong> の組み合わせを取る。
        これで「参照の安定性」と「業務的な重複防止」を両立できる。
      </p>

      <h2>境界事例と実務判断</h2>
      <ul>
        <li>
          <strong>同姓同名の別人</strong>: 名前を UNIQUE にしてはいけない (弾き過ぎる)。email や phone を UNIQUE にして、名前は普通の列にする
        </li>
        <li>
          <strong>家族で 1 email を共有</strong>: email UNIQUE だと 2 人目が登録できない。
          複合 UNIQUE <code>(email, name)</code> や、phone を含む複合キーで対応する
        </li>
        <li>
          <strong>NULL の扱いは DBMS で差がある</strong>: PostgreSQL / MySQL / Oracle は複数の NULL を許容、
          SQL Server は 1 つの NULL のみ許容。UNIQUE 列は NOT NULL にする方が移植性が高い
        </li>
        <li>
          <strong>複合ユニーク</strong>: <code>UNIQUE (order_id, product_id)</code> で
          「同じ注文の同じ商品は 1 行のみ」を保証。単一列 UNIQUE では表せない業務ルールを表現できる
        </li>
      </ul>

      <h2>関連トピック</h2>
      <p>
        主キー / UNIQUE の物理的な実装は
        <Link href="/rdb-index/unique"> UNIQUE インデックス </Link>
        を参照。キー設計そのものは
        <Link href="/data-modeling/normalization/keys"> キーの階層 </Link>
        で扱っている。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
