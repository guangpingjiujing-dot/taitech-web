import { buildTopicMetadata } from "@/lib/metadata";
import Link from "next/link";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { KeyHierarchyDiagram } from "@/components/viz/datamodel/KeyHierarchyDiagram";
import { NormalizedTableView } from "@/components/viz/datamodel/TableBeforeAfter";
import { findTopic } from "@/content/topics";

const slug = "keys";
const topic = findTopic("data-modeling", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "候補キーとスーパーキーの違いは？",
    a: "スーパーキーは行を一意に特定できる属性集合の総称、候補キーはそのうち「極小」なもの (一つでも属性を減らすと一意性が失われる) です。",
  },
  {
    q: "主キーはどうやって決めるべき？",
    a: "候補キーの中から、値が変わらない・NULLにならない・短くて扱いやすいものを選びます。業務キーが不安定な場合は代理キー (サロゲートキー) を導入します。",
  },
  {
    q: "複合キーは避けるべき？",
    a: "避けるべきではありません。関連テーブル (中間テーブル) では複合キーが本質的に必要です。ただし外部キーで参照される主キーは代理キーにすることが多いです。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="data-modeling" slug={slug}>
      <TopicJsonLd section="data-modeling" slug={slug} faq={faq} />

      <h2>「行を見分けるための鍵」にはいくつか種類がある</h2>
      <p>
        テーブルの中から特定の 1 行を指し示すには、他の行と区別できる目印が必要になる。
        この目印になる列 (または列の組み合わせ) を <strong>キー</strong> と呼ぶ。
      </p>
      <p>
        ややこしいのは、キーには <strong>用途と性質による名前</strong> がいくつかあること。
        大きい枠から順に「スーパーキー ⊃ 候補キー ⊃ 主キー」の入れ子構造になっている。
        以下の集合図と説明で全体像を掴んでおこう。
      </p>

      <KeyHierarchyDiagram />

      <h3>「極小」ってどういうこと?</h3>
      <p>
        候補キーの説明で「極小」という言葉が出てくる。これは
        <strong>「その中のどれか 1 つでも列を削ったら、もう行を一意に見分けられなくなる」</strong>
        ぎりぎりの状態を指す。
      </p>
      <p>
        例えば <code>(注文ID, 商品ID)</code> という 2 列セットが候補キーだとする。
        このセットから <code>注文ID</code> だけを削って <code>(商品ID)</code> にすると、
        同じ商品が複数の注文で買われていた場合に行が一意にならなくなる。
        逆に <code>商品ID</code> だけを削って <code>(注文ID)</code> にしても、同じ注文で複数商品を買っていれば一意にならない。
        つまり <code>(注文ID, 商品ID)</code> は <strong>「これ以上減らせない最小の組み合わせ」</strong> になっている、というのが「極小」の意味。
      </p>
      <p>
        ちなみに、この <code>(注文ID, 商品ID)</code> に <code>数量</code> を足した <code>(注文ID, 商品ID, 数量)</code> も
        「行を一意に見分けられる列の組み合わせ」ではあるが、<code>数量</code> は無くても一意に見分けられるので「極小」ではなく、
        候補キーではなくスーパーキー止まりになる。
      </p>

      <h2>複数の列を組み合わせるキー (複合キー) と、他テーブルを参照するキー (外部キー)</h2>
      <p>
        キーは 1 つの列とは限らない。
        <strong>複合キー</strong> (composite key): 2 つ以上の列を組み合わせて初めて 1 行を見分けられる場合のキー。
        よく出てくるのは「注文と商品を組み合わせて 1 つの明細行を表す」ような中間テーブルで、
        <code>(注文ID, 商品ID)</code> という 2 列セットが主キーになる。
      </p>
      <p>
        <strong>外部キー</strong> (foreign key): 別テーブルの主キーを指し示すために持つ列。
        たとえば「受注明細」テーブルに置いた <code>注文ID</code> は「受注」テーブルの主キーを指し、
        <code>商品ID</code> は「商品」テーブルの主キーを指している。
        テーブルを分割した時に生まれる「あっちのテーブルのこの行を指してる」という参照関係を保つのが役割。
      </p>

      <p>実際にはこんな形になる。</p>

      <div className="not-prose my-6 flex flex-col gap-4 md:flex-row md:flex-wrap">
        <div className="min-w-0 flex-1">
          <NormalizedTableView
            data={{
              name: "受注",
              columns: ["注文ID", "注文日"],
              rows: [
                ["O001", "2026-06-01"],
                ["O002", "2026-06-02"],
              ],
              primaryKey: ["注文ID"],
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <NormalizedTableView
            data={{
              name: "商品",
              columns: ["商品ID", "商品名"],
              rows: [
                ["P01", "ノート"],
                ["P02", "ペン"],
              ],
              primaryKey: ["商品ID"],
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <NormalizedTableView
            data={{
              name: "受注明細 (複合キー + 外部キー)",
              columns: ["注文ID", "商品ID", "数量"],
              rows: [
                ["O001", "P01", "2"],
                ["O001", "P02", "1"],
                ["O002", "P01", "5"],
              ],
              primaryKey: ["注文ID", "商品ID"],
            }}
          />
        </div>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">
        受注明細テーブルの <code>(注文ID, 商品ID)</code> は 複合キー (2 列セットで主キー)。
        同時に、注文ID は 受注 テーブルへの外部キー・商品ID は 商品 テーブルへの外部キーになっている。
      </p>

      <h2>覚えておく用語: 非キー属性</h2>
      <p>
        次の <Link href="/data-modeling/normalization/2nf">第2正規形</Link>・
        <Link href="/data-modeling/normalization/3nf">第3正規形</Link>
        から「<strong>非キー属性</strong>」という言葉が頻繁に出てくる。
        字面通り「<strong>キーに含まれない列</strong>」のこと。
      </p>
      <p>
        たとえば <code>(社員ID, 氏名, 部署ID, 部署名)</code> というテーブルで、
        候補キーが <code>社員ID</code> だけなら、氏名・部署ID・部署名の 3 つがすべて非キー属性。
        「非キー属性が他の何にどう決まっているか」を見ることで、次の正規形に進める余地があるかを判断する。
      </p>

      <h2>主キーの構造が親を含むケース — 弱エンティティ</h2>
      <p>
        受注明細の主キー <code>(注文ID, 商品ID)</code> は、
        <strong>親テーブル (受注) の主キーを子側の主キーが借りている</strong> 形になっている。
        こういうエンティティを <strong>弱エンティティ</strong> と呼ぶ。
        「明細番号 3」だけでは「どの注文の 3 行目？」と特定できず、親のキーを組み込んで初めて世界の中で 1 行に絞れる。
      </p>
      <p>
        判定は主キーの構造だけで決まる。
        親のキーを継承していれば弱エンティティ、独立の主キーで完結していれば強エンティティ。
        詳しくは <Link href="/data-modeling/er-diagram/weak-entity">弱エンティティ (weak entity)</Link>。
      </p>

      <h2>主キーの選び方 (実務のコツ)</h2>
      <p>候補キーが複数あるときに、どれを主キーに選ぶかは実務でよく迷う。目安は以下の 4 つ。</p>
      <ul>
        <li>
          <strong>値が変わらないもの</strong>: 主キーの値が途中で変わると、それを参照している外部キーも全部書き直すことになる。だから将来変わらない属性が望ましい。
        </li>
        <li>
          <strong>NULL にならないもの</strong>: NULL だと「値が無い」ので行を特定できない。主キーには NULL 不可の列を選ぶ。
        </li>
        <li>
          <strong>短くて扱いやすいもの</strong>: 長い文字列や複数列のセットは、参照する他のテーブルからも扱いにくくなる。
        </li>
        <li>
          <strong>ちょうどいい業務キーが無ければ「代理キー」</strong>: 上記を満たす業務属性が無いなら、
          連番 ID など「業務的な意味は無いけど、行を見分けるためだけの ID」を作って主キーにする。これを <strong>サロゲートキー</strong> (surrogate key) と呼ぶ。
        </li>
      </ul>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
