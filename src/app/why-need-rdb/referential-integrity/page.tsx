import { buildTopicMetadata } from "@/lib/metadata";
import Link from "next/link";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { ExcelTable } from "@/components/viz/rdb-fundamentals/ExcelTable";
import { findTopic } from "@/content/topics";

const slug = "referential-integrity";
const topic = findTopic("why-need-rdb", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "外部キー制約はパフォーマンス的に付けない方がいい？",
    a: "挿入・更新・削除時に参照チェックのコストが乗りますが、多くの場合は無視できる程度です。データ品質を犠牲にしてまで外すべき場面は限定的で、性能問題が出た後に局所的に判断すべきです。",
  },
  {
    q: "ON DELETE CASCADE と RESTRICT はどう使い分ける？",
    a: "「親を消したら子も自動的に消えていい」は CASCADE (例: カート削除 → カート内の明細行も自動削除、タグ削除 → 記事タグ紐付けの中間行も自動削除)、「子が残っていたら親を消させない」は RESTRICT (例: 顧客に注文が残っていたら削除禁止)。デフォルトは NO ACTION (実質 RESTRICT) が安全で、CASCADE は「子データが純粋に親に依存していて単独では意味を持たない場合」に限定する。",
  },
  {
    q: "論理削除 (deleted_at) と外部キーは共存できる？",
    a: "できます。ただし FK は物理行の存在を見るため、deleted_at IS NOT NULL の親を子から参照できてしまう問題があります。ビジネスロジックで補完するか、履歴テーブルを分けるかの設計判断が必要です。",
  },
  {
    q: "外部キーを付けない代わりにアプリケーション側でチェックすれば？",
    a: "アプリケーション経路 (バッチ / 別サービス / DBA の直接 SQL) を全て通せば理論上は可能ですが、抜け道が発生した瞬間にデータが壊れます。DBMS で構造的に保証する方が確実です。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="why-need-rdb" slug={slug}>
      <TopicJsonLd section="why-need-rdb" slug={slug} faq={faq} />

      <h2>事故 — 顧客を消したら注文の宛先が不明になった</h2>
      <p>
        顧客シートで、退会した顧客 <code>C-999</code> の行を削除した。
        翌日、注文シートを見ると <code>C-999</code> の注文が 3 件残っている。
        宛先の顧客情報が引けなくなり、発送業務が止まった。
      </p>

      <ExcelTable
        title="注文シート — 存在しない顧客への注文が残る"
        sheetName="注文.xlsx"
        columns={["注文ID", "顧客ID", "顧客名 (VLOOKUP)", "商品ID", "金額"]}
        rows={[
          ["ORD-001", "C-001", "山田太郎", "P-042", "¥9,800"],
          ["ORD-002", "C-999", "#N/A", "P-018", "¥7,600"],
          ["ORD-003", "C-999", "#N/A", "P-042", "¥9,800"],
          ["ORD-004", "C-999", "#N/A", "P-018", "¥7,600"],
        ]}
        highlightCells={[
          { row: 1, col: 1, tone: "wrong" },
          { row: 1, col: 2, tone: "wrong" },
          { row: 2, col: 1, tone: "wrong" },
          { row: 2, col: 2, tone: "wrong" },
          { row: 3, col: 1, tone: "wrong" },
          { row: 3, col: 2, tone: "wrong" },
        ]}
        note="顧客シートの C-999 を消したので VLOOKUP が #N/A になる。しかし注文行は残ったまま (孤立参照)"
      />

      <h2>原因 — Excel はシート間の参照を強制しない</h2>
      <p>
        Excel の <code>VLOOKUP</code> や参照式は「参照先が消えたら <code>#N/A</code> になる」だけ。
        <strong>「参照している行がいるから消せない」と教えてくれる仕組みがない</strong>。
        削除時に「参照している注文はどうする？」と警告するか、削除を禁止するか、あるいは注文も一緒に消すか、
        の判断を DBMS に任せる仕組みが必要になる。
      </p>

      <h2>解決策 — 外部キー制約 (FOREIGN KEY) と ON DELETE 挙動</h2>
      <p>
        RDB では、テーブル定義時に <strong>「この列の値は別テーブルの主キーとして必ず存在すること」</strong>
        を宣言できる。存在しない値を挿入したり、参照されている行を削除しようとすると、DBMS が拒否する。
      </p>
      <pre>
        <code>{`CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  customer_id CHAR(6) NOT NULL,
  product_id CHAR(6) NOT NULL,
  qty INT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT
);

-- 存在しない顧客への注文は挿入拒否
INSERT INTO orders (id, customer_id, product_id, qty)
  VALUES (1001, 'C-999', 'P-042', 1);
-- ERROR: insert or update on table "orders" violates foreign key constraint

-- 注文が残ったまま顧客を削除しようとしても拒否
DELETE FROM customers WHERE id = 'C-999';
-- ERROR: update or delete on table "customers" violates foreign key constraint
--        DETAIL: Key (id)=(C-999) is still referenced from table "orders".`}</code>
      </pre>

      <h3>ON DELETE の 4 種類の挙動</h3>
      <ul>
        <li>
          <strong>RESTRICT / NO ACTION</strong> (既定): 子から参照が残っていたら親の削除を拒否
        </li>
        <li>
          <strong>CASCADE</strong>: 親を消すと子も自動的に消える。例: カート削除 → カート明細行も削除
        </li>
        <li>
          <strong>SET NULL</strong>: 子の FK 列を NULL にする (FK 列が NULL 可の場合のみ)
        </li>
        <li>
          <strong>SET DEFAULT</strong>: 子の FK 列を定義された既定値に戻す
        </li>
      </ul>

      <h2>境界事例と実務判断</h2>
      <ul>
        <li>
          <strong>CASCADE は便利だが危険</strong>: 「意図しない大量削除」を招きやすい。
          純粋に親に従属するデータ (明細行、タグ紐付け) のみに限定するのが安全
        </li>
        <li>
          <strong>論理削除 (soft delete) との相性</strong>: <code>deleted_at</code> 列を持たせて論理削除する場合、
          FK は物理行の存在を見るので「論理削除された親を子から参照できる」問題が残る。
          ビジネスロジックで補完するか、履歴テーブルを分けるかの判断が必要
        </li>
        <li>
          <strong>パフォーマンスへの影響</strong>: FK チェックのコストは通常無視できる。
          性能問題が実測で確認された時だけ、局所的に外すかインデックス設計を見直す
        </li>
      </ul>

      <h2>関連トピック</h2>
      <p>
        キー設計そのものは
        <Link href="/data-modeling/normalization/keys"> キーの階層 </Link>
        、参照関係を図で表現する話は
        <Link href="/data-modeling/er-diagram/relationship"> 関連 (リレーションシップ) </Link>
        を参照。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
