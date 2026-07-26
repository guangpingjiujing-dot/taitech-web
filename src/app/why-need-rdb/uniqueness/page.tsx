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

      <h2>事故 — 「山田太郎」さんが 3 人いる</h2>
      <p>
        顧客管理シートに「山田太郎」の行が 3 つできてしまった。それぞれ違う連絡先で、
        EC サイトから発送指示が来た「山田太郎」がどの行の顧客なのかシステム的に判定できない。
        カスタマーサポートに問い合わせが殺到した。
      </p>

      <ExcelTable
        title="顧客管理シート — 同名 3 人が並ぶ"
        sheetName="顧客.xlsx"
        columns={["顧客ID", "顧客名", "メール", "登録日"]}
        rows={[
          ["C-001", "山田太郎", "yamada@example.com", "2024-01-15"],
          ["C-011", "山田太郎", "n/a", "2024-08-03"],
          ["C-012", "山田太郎", "unknown", "2025-02-20"],
          ["C-013", "山田太郎", "-", "2025-11-01"],
          ["C-002", "佐藤花子", "sato@example.com", "2024-02-10"],
        ]}
        highlightCells={[
          { row: 1, col: 1, tone: "wrong" },
          { row: 2, col: 1, tone: "wrong" },
          { row: 3, col: 1, tone: "wrong" },
        ]}
        note="C-011 / C-012 / C-013 の 3 行が同じ「山田太郎」。メールも全てゴミ値で本人特定できない"
      />

      <h2>原因 — Excel には「宣言的な重複禁止」がない</h2>
      <p>
        Excel の「重複の削除」機能はあくまで <strong>事後処理</strong>。
        ユーザーが手作業で実行しなければ効かないし、実行しても「どの行を消すか」の判定は人任せ。
        「入力時に重複させない」というルールを構造的に強制する仕組みがない。
      </p>
      <p>
        タイポや同姓同名の判定を人力で完璧にやるのは不可能。運用ルール
        (「登録前にチェックする」) を作っても、必ず抜ける瞬間がある。
      </p>

      <h2>解決策 — 主キーと UNIQUE 制約</h2>
      <p>
        RDB では、テーブル定義時に <strong>「この列は絶対に重複しない」</strong> と宣言できる。
        重複挿入は DBMS が拒否する。人間の運用に依存しない。
      </p>
      <pre>
        <code>{`CREATE TABLE customers (
  id CHAR(6) PRIMARY KEY,      -- 主キー: 一意 + NOT NULL
  email VARCHAR(255) UNIQUE NOT NULL,  -- UNIQUE 制約
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 重複を試みるとエラー
INSERT INTO customers (id, email, name)
  VALUES ('C-011', 'yamada@example.com', '山田太郎');
-- ERROR: duplicate key value violates unique constraint "customers_email_key"`}</code>
      </pre>

      <h3>「自然キー」vs「代理キー (サロゲートキー)」</h3>
      <p>
        主キーの候補は 2 種類。
      </p>
      <ul>
        <li>
          <strong>自然キー</strong>: 業務データそのもの (メール、社員番号、ISBN)。人間にとって意味があるが、
          値が変わる (メール変更、番号採番ルール変更) と参照が壊れる
        </li>
        <li>
          <strong>代理キー (サロゲートキー)</strong>: 業務と無関係な連番や UUID (<code>id</code> 列)。
          値が絶対に変わらないので参照が安定する。多くの実務では代理キーを主キーにし、
          自然キー相当の列には UNIQUE 制約だけ付ける
        </li>
      </ul>

      <h2>境界事例と実務判断</h2>
      <ul>
        <li>
          <strong>同姓同名の別人</strong>: 名前だけを主キーや UNIQUE にしてはいけない。
          代理キーを主キーに、email に UNIQUE、名前は普通の列にする
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
