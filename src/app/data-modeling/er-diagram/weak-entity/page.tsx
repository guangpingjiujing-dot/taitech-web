import { buildTopicMetadata } from "@/lib/metadata";
import Link from "next/link";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { ERDiagram } from "@/components/viz/er/ERDiagram";
import { WeirdERDiagram } from "@/components/viz/er/WeirdERDiagram";
import { WeakEntityQuiz } from "@/components/viz/er/WeakEntityQuiz";
import { findTopic } from "@/content/topics";

const slug = "weak-entity";
const topic = findTopic("data-modeling", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "弱エンティティと識別関係は違うものですか？",
    a: "実質同じ現象を別角度から呼んだ用語です。エンティティ側から見ると「弱エンティティ」、それを親に繋ぐ関連側から見ると「識別関係」。逆に「強エンティティ」と「非識別関係」もペア。IE 記法ではどちらも主キーが親のキーを含むかどうかで判別します。",
  },
  {
    q: "弱エンティティと連関実体は同じですか？",
    a: "似ているが違う。弱エンティティは「親に依存して識別される」性質そのもの、連関実体は「多対多を分解するために挟む第 3 のエンティティ」の役割。連関実体は多くの場合、弱エンティティの一種として実装される。",
  },
  {
    q: "弱エンティティを強エンティティに書き直すこともできますか？",
    a: "できる。注文明細に独自の代理キー (明細ID) を付けて主キーにすれば強エンティティ扱いに近づく。ただし「親を消したら子は無意味」という業務ルールは残るので、実装上は FK に ON DELETE CASCADE を付けるなど、親子関係のライフサイクルは意識する必要がある。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="data-modeling" slug={slug}>
      <TopicJsonLd section="data-modeling" slug={slug} faq={faq} />

      <h2>まず身近な例で: 「注文書の 3 行目」だけを見せられたら？</h2>
      <p>
        紙の注文書を思い浮かべる。1 冊の注文書には表紙 (注文番号・注文日・顧客) があって、
        本文に商品明細が何行か書かれている。ここで <strong>「明細の 3 行目」だけを紙から切り取って渡す</strong>
        と、受け取った人は「これはどの注文の 3 行目ですか？」と聞き返したくなる。
      </p>
      <p>
        「明細の 3 行目」は、注文書というコンテキストがないと存在意味を持たない。
        こういう性質のエンティティを <strong>弱エンティティ (weak entity)</strong> と呼ぶ。
        親エンティティ (注文書) のキー (注文番号) を借りて初めて一意になる。
      </p>

      <h2>ER 図での見分け方 — 主キーの構造がすべて</h2>
      <p>
        弱エンティティかどうかは、視覚記号ではなく <strong>主キーの構造</strong> で決まる
        (キーの分類そのものについては <Link href="/data-modeling/normalization/keys">キーの階層</Link> を参照)。
        子側の主キーが親側の主キーを含んでいれば弱、独立の主キーだけで完結していれば強。
      </p>
      <p>
        「注文明細」なら、主キーは <code>(注文ID, 明細番号)</code>。
        明細番号だけでは「どの注文の 3 行目か」分からないので、
        必ず親の 注文ID を含めて初めて世界の中で 1 行に絞れる。
        この <strong>「親のキーを借りないと一意にならない」</strong> という性質そのものが、
        弱エンティティの正体。親との関連は <strong>識別関係 (identifying relationship)</strong> と呼ばれる (詳細は下の「対比 — 非識別関係の場合」節)。
      </p>
      <p>
        だから弱エンティティは <strong>名前で判断できない</strong>。
        「配送先」「部屋」「注文明細」「扶養家族」— どれも一見独立のモノに見えるが、
        意味的に親なしでは成立しないなら弱として扱い、主キーに親のキーを組み込む。
        逆に、独立の意味を持つエンティティに親のキーを無理に押し込むのは過剰な結合で、設計としては筋が悪い。
      </p>
      <p>
        弱と見抜くと、実装上の判断もいくつか自動的に決まる:
      </p>
      <ul>
        <li>
          <strong>削除の連鎖</strong>: 親を消したら子も消す (FK に ON DELETE CASCADE) が原則
        </li>
        <li>
          <strong>重複制御</strong>: 「同じ注文に同じ明細番号は 2 つない」が主キーで自動的に担保される
        </li>
        <li>
          <strong>単独 SELECT の意味の薄さ</strong>: 明細だけを取り出しても業務的にはほぼ役立たず、常に親と JOIN される
        </li>
      </ul>
      <p className="text-sm text-[var(--muted-foreground)]">
        (記法補足: Chen 記法 では弱エンティティを二重四角、識別関係を二重菱形で描く慣習があり、
        IPA データベーススペシャリスト試験や大学の教科書ではこの表記に出会うことがある。
        本サイトを含めモダンな作図ツールの既定である IE 記法 では特別な視覚記号を使わず、
        上に書いた通り主キーの構造で判別する。以下の図もこの流儀で描く。)
      </p>

      <ERDiagram
        title="注文と注文明細 — 典型的な弱エンティティ"
        width={800}
        height={280}
        entities={[
          {
            id: "order",
            label: "注文",
            x: 60,
            y: 90,
            width: 220,
            attributes: ["注文ID", "注文日", "顧客ID"],
            primaryKey: ["注文ID"],
          },
          {
            id: "line",
            label: "注文明細",
            x: 480,
            y: 90,
            width: 260,
            attributes: ["注文ID", "明細番号", "商品名", "数量"],
            primaryKey: ["注文ID", "明細番号"],
            isWeak: true,
          },
        ]}
        relationships={[
          {
            from: "order",
            to: "line",
            fromCardinality: "one",
            toCardinality: "one-many",
            isIdentifying: true,
          },
        ]}
        caption="「注文明細」は主キーが (注文ID, 明細番号) の複合キーで、親の注文ID を含むため弱エンティティ。IE 記法では見た目上は普通の箱で描き、主キー構造で判定する。"
      />

      <h2>弱エンティティ判定のチェックリスト</h2>
      <ul>
        <li>
          <strong>単独で識別できないか</strong>: 「明細番号 3」だけでは、どの注文の 3 行目か分からない
        </li>
        <li>
          <strong>親を消したら意味を失うか</strong>: 注文が消えたら明細は存在意義がゼロ
        </li>
        <li>
          <strong>親のライフサイクルに従属するか</strong>: 明細は注文と一緒に作られ、一緒に消える
        </li>
      </ul>
      <p>
        3 つとも Yes なら弱エンティティ。1 つでも No があるなら、独立の強エンティティにする方が自然。
      </p>

      <h2>典型的な例</h2>
      <ul>
        <li>
          <strong>注文 — 注文明細</strong> (主キー: 注文ID + 明細番号)
        </li>
        <li>
          <strong>建物 — 部屋</strong> (主キー: 建物ID + 部屋番号。「101号室」は建物なしには意味不明)
        </li>
        <li>
          <strong>従業員 — 扶養家族</strong> (主キー: 従業員ID + 家族番号)
        </li>
        <li>
          <strong>会計期 — 期別集計</strong> (主キー: 期ID + 集計項目)
        </li>
      </ul>

      <h2>対比 — 非識別関係の場合</h2>
      <p>
        弱エンティティを別名で呼ぶこともある。親との関連を <strong>関連の側</strong> から見たとき、
        「親のキーが子の主キーの一部として継承される関連」を
        {" "}<strong>識別関係 (identifying relationship)</strong> と呼び、
        その対義の「親のキーは子の外部キーとしてだけ現れる (子の主キーには含まれない) 関連」を
        {" "}<strong>非識別関係 (non-identifying relationship)</strong> と呼ぶ。
        つまり <strong>「弱エンティティ = 識別関係の子」「強エンティティ = 非識別関係の子」</strong>{" "}
        と読み替えても意味は変わらない。
      </p>
      <p>
        非識別関係の代表例が「顧客 — 注文」。顧客は 1 回だけ登録され、注文はその後何回も発生する。
        注文の主キーは注文ID 単独で十分 (顧客なしでも注文行を一意に指せる)、顧客ID は FK として属性欄に持つだけ。
        注文は顧客と一緒に消える存在ではなく、顧客が消えても履歴として残せる (実装上は SET NULL や履歴保持ルールで別途担保する)。
      </p>

      <ERDiagram
        title="非識別関係 — 顧客と注文"
        width={800}
        height={260}
        entities={[
          {
            id: "cust",
            label: "顧客",
            x: 60,
            y: 80,
            width: 220,
            attributes: ["顧客ID", "氏名"],
            primaryKey: ["顧客ID"],
          },
          {
            id: "ord",
            label: "注文",
            x: 480,
            y: 80,
            width: 260,
            attributes: ["注文ID", "顧客ID", "注文日"],
            primaryKey: ["注文ID"],
          },
        ]}
        relationships={[
          {
            from: "cust",
            to: "ord",
            fromCardinality: "one",
            toCardinality: "zero-many",
          },
        ]}
        caption="注文の主キーは 注文ID 単独。顧客ID は FK として属性欄にあるだけで、主キーに含まれていない。これが非識別関係 (= 注文は強エンティティ) の姿。IE 記法では線の見た目に差はない — 主キー欄の構造だけが違いを示す。"
      />
      <p>
        <strong>IE 記法では識別 / 非識別の線の見た目は同じ</strong>。判別は必ず子の主キー欄で行う。
        IDEF1X 記法では 実線 (識別) と 破線 (非識別) で描き分ける慣習がある。
        {" "}詳細は <Link href="/data-modeling/er-diagram/notation">記法比較ページ</Link>。
      </p>

      <h2>練習問題: 弱か強か</h2>
      <p>
        3 つの ER 図を用意した。それぞれ子側のエンティティが <strong>弱エンティティ</strong> か
        {" "}<strong>強エンティティ</strong> か、主キーの構造を見て判定してほしい。
        本サイトは IE 記法なので視覚記号のヒントはない — 主キー欄が親のキーを含んでいるかどうかがすべて。
      </p>

      <WeakEntityQuiz />

      <h2>変なER図 との対応: 違和感 #7「配送先」が独立主キーで単独存在</h2>

      <div className="not-prose my-6">
        <WeirdERDiagram highlightAnomalies={new Set([7])} />
      </div>

      <p>
        <Link href="/data-modeling/er-diagram">変なER図</Link> の「配送先」エンティティは、
        意味的には <strong>顧客に従属する弱エンティティ</strong> であるはず (「田中さんの自宅」「田中さんの会社宛」という
        文脈なしには成立しない) にもかかわらず、実装が <strong>「配送先ID」という独立の主キー</strong> になっており、
        顧客エンティティとの関連さえ引かれていない。
      </p>
      <p>
        正しくは「顧客 — 配送先」を関連で繋ぎ、配送先側の主キーを
        <code>(顧客ID, 配送先連番)</code> のような複合キーにする。
        これで「田中さんの自宅」「田中さんの会社宛」を配送先ID なしで一意に区別できる。
      </p>

      <h2>変なER図 との対応: 違和感 #8「注文明細」の識別関係 PK 非継承</h2>

      <div className="not-prose my-6">
        <WeirdERDiagram highlightAnomalies={new Set([8])} />
      </div>

      <p>
        変なER図 の「注文明細」は、意味的には <strong>注文に従属する弱エンティティ</strong> (識別関係の子) として描かれている。
        にもかかわらず、注文明細の主キーは <strong>「明細ID」単独</strong> になっており、
        親の 注文ID が主キーに継承されていない。
      </p>
      <p>
        識別関係で親と繋がっている以上、注文明細の主キーは
        <strong>(注文ID, 明細番号) の複合キー</strong>
        になるべき。
        設計意図 (識別関係 = 弱として扱う) と 主キー構成 (独立キー = 強として扱う) が矛盾している状態は、
        読み手に「どっちが正しい？」と迷わせる。
      </p>
      <p>
        #7 と #8 は、両方とも <strong>「本来弱として扱うべきものを強のように描いた」</strong>
        という大枠は共通するが、破綻の出方は違う。
        <strong>#7 (配送先)</strong> は関連そのものが引かれておらず「親が誰か不明」の
        {" "}<em>関係欠落型</em>。
        <strong>#8 (注文明細)</strong> は識別関係の線は引かれているのに主キーが親を継承しておらず
        「意匠と実装の不整合」の <em>PK 非継承型</em>。
        前者は「関連を追加する」、後者は「主キーを (親ID, 連番) の複合キーに直す」で修正する。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
