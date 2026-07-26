import { buildTopicMetadata } from "@/lib/metadata";
import Link from "next/link";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { FDArrowDiagram } from "@/components/viz/datamodel/FDArrowDiagram";
import { findTopic } from "@/content/topics";

const slug = "functional-dependency";
const topic = findTopic("data-modeling", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "関数従属とは要するに何ですか？",
    a: "X の値が決まれば Y の値も一意に決まる、という関係のことです。例えば社員ID → 氏名。正規化はすべてこの関係の分析から出発します。",
  },
  {
    q: "完全関数従属と部分関数従属はどう違いますか？",
    a: "複合キー (A, B) のうち一部 (A だけ) で従属が成立するのが部分関数従属、(A, B) 両方が揃わないと従属が成立しないのが完全関数従属です。",
  },
  {
    q: "推移関数従属とは？",
    a: "X → Y かつ Y → Z (Y は候補キー以外) の時に、X → Z が Y を経由して成立している関係のことです。3NF はこの経由を排除します。",
  },
  {
    q: "関数従属をどうやって見つければいい？",
    a: "「この列が決まれば必ずこの列が決まる」という業務ルールを洗い出すのが基本です。サンプルデータからの推定は反例が出た瞬間に崩れるので補助的手段に留めます。",
  },
  {
    q: "多値従属と関数従属はどう違いますか？",
    a: "関数従属 X → Y は「X が決まると Y が 1 つに決まる」。多値従属 X ↠ Y は「X が決まると Y の値の集合が決まり、しかもその集合が同じ行にある他の列とは独立している」関係です。1 対多の独立した繰り返しがあるときに現れ、第 4 正規形 (4NF) で分解の対象になります。",
  },
];

export default function Page() {
  return (
    <TopicLayout section="data-modeling" slug={slug}>
      <TopicJsonLd section="data-modeling" slug={slug} faq={faq} />

      <h2>「A が決まれば B も決まる」= 関数従属</h2>
      <p>
        「社員ID が分かれば、その人の氏名は 1 つに決まる」— これは当たり前に感じる関係だが、
        正規化の議論では大事なので名前が付いている。<strong>関数従属</strong> (functional dependency, FD) だ。
        矢印で書くと <code>社員ID → 氏名</code>。矢印の左が「決める側」、右が「決まる側」。
      </p>
      <p>
        「決まる」というのは、あるテーブルのどの行を見ても
        <strong>「社員ID が同じなら氏名も同じ」</strong> が成り立つ、という意味。
        たまたま同じだった、ではなく、業務ルールとして「社員ID が同じなら氏名も同じはず」と言えるものだけを関数従属として扱う
        (1 件でも例外が出れば関数従属とは呼ばない)。
      </p>

      <FDArrowDiagram
        title="社員・部署テーブルの関数従属"
        attributes={["社員ID", "氏名", "入社日", "部署ID", "部署名"]}
        primaryKey={["社員ID"]}
        dependencies={[
          { from: ["社員ID"], to: ["氏名"], kind: "full" },
          { from: ["社員ID"], to: ["入社日"], kind: "full" },
          { from: ["社員ID"], to: ["部署ID"], kind: "full" },
          { from: ["部署ID"], to: ["部署名"], kind: "full" },
          {
            from: ["社員ID"],
            to: ["部署名"],
            kind: "transitive",
            note: "部署ID を経由して成立",
          },
        ]}
        caption="社員ID → 部署名 も一見成り立っているが、実は「社員ID → 部署ID → 部署名」を経由して間接的に決まっているだけ。この「経由あり」の関数従属を「推移関数従属」と呼び、後で第3正規形が排除の対象にする。"
      />

      <h2>3 種類の関数従属 (これから何度も出てくる)</h2>
      <p>
        関数従属には 3 種類あり、それぞれが 2NF・3NF が扱うテーマに対応している。
        今は名前と雰囲気だけ覚えておけば OK。実例は各正規形のページで詳しく見る。
      </p>
      <ul>
        <li>
          <strong>完全関数従属</strong>: 「A と B が両方揃って初めて C が決まる」タイプ。
          例: <code>(注文ID, 商品ID) → 数量</code>。注文ID だけ、商品ID だけでは数量は決まらない。
          これは正常な関数従属で、排除の対象ではない。
        </li>
        <li>
          <strong>部分関数従属</strong>: 「(A, B) の一部分 (例えば B だけ) で決まってしまう」タイプ。
          例: <code>(注文ID, 商品ID) → 商品名</code> は実は <code>商品ID → 商品名</code> だけで成り立つので、注文ID は不要。
          これがあると同じ商品名が何度も繰り返されるので、
          <Link href="/data-modeling/normalization/2nf">第2正規形</Link> で切り出す対象になる。
        </li>
        <li>
          <strong>推移関数従属</strong>: 「A → B → C と経由してしまう」タイプ。
          例: <code>社員ID → 部署ID → 部署名</code>。社員ID から部署名を「直接」決めているのではなく、部署ID を経由している。
          これがあると同じ部署名が何度も繰り返されるので、
          <Link href="/data-modeling/normalization/3nf">第3正規形</Link> で切り出す対象になる。
        </li>
      </ul>

      <h2>なぜこの概念が正規化の判定基準になるのか</h2>
      <p>
        「同じ情報を 1 か所に書く」を判定するとき、関数従属で見るのが一番シンプル。
        例えば <code>部署ID → 部署名</code> という関数従属があるということは、
        「部署ID が同じ行は部署名も必ず同じ」= 部署名が繰り返し書かれている、ということ。
        つまり関数従属を見つけると、そのまま「重複している情報の場所」も見つけたことになる。
      </p>
      <p>
        正規化 (1NF → 2NF → 3NF) は、こうした「重複を生む関数従属」を段階的に切り出していく手順として理解できる。
        各正規形が「どのタイプの関数従属を排除するのか」を意識すると、全体の流れがすっきり見えてくる。
      </p>

      <h2>先に「キーの階層」を押さえておこう</h2>
      <p>
        関数従属の話を正確にするには <Link href="/data-modeling/normalization/keys">キーの階層</Link>
        (スーパーキー・候補キー・主キー) の理解が前提になる。
        「主キー全体で決まる」のか「主キーの一部で決まってしまう」のかが、2NF・3NF の判定を分けるからだ。
      </p>

      <h2>推移的関数従属を掘り下げる</h2>
      <p>
        <strong>推移的関数従属</strong> (transitive functional dependency) は、
        <code>X → Y → Z</code> のように「主キー X から直接 Z が決まっているのではなく、
        非キー属性 Y を経由して間接的に決まっている」関係を指す。
        「推移関数従属」「推移従属」とも呼ばれる。
      </p>
      <p>
        典型例が <code>社員ID → 部署ID → 部署名</code>。
        社員ID (主キー) から部署名を決めているように見えるが、実際は「社員ID がまず部署ID を決め、
        その部署ID が部署名を決めている」構造だ。ここで問題になるのは次の 3 点。
      </p>
      <ul>
        <li>
          <strong>更新異常</strong>: ある部署の名前を変えたい時、社員テーブルの全社員行を UPDATE することになる。
          1 行でも漏らすと同じ部署ID が別の部署名を持つ矛盾状態が生まれる。
        </li>
        <li>
          <strong>挿入異常</strong>: 「社員がまだ 1 人もいない部署」を登録できない。
          社員行がないと部署名を記録する場所がないからだ。
        </li>
        <li>
          <strong>削除異常</strong>: その部署に所属する最後の社員行を削除すると、部署の存在情報ごと消滅する。
        </li>
      </ul>
      <p>
        推移的関数従属を切り出し (別テーブル化) すれば、この 3 種の異常はすべて消える。
        これが <Link href="/data-modeling/normalization/3nf">3NF</Link> がやっていることの本質だ。
      </p>

      <h2>多値従属 — 関数従属の「1 対多」版</h2>
      <p>
        <strong>多値従属</strong> (multi-valued dependency, MVD) は、
        <code>X ↠ Y</code> と書く。関数従属 <code>X → Y</code> が「X が決まれば Y が 1 つに決まる」なら、
        多値従属は「X が決まれば Y の <em>集合</em> が決まり、
        しかも同じ行にある他の列 (Z) と Y は独立している」関係を指す。
        矢印を「二重矢印 ↠」で区別するのが慣例。
      </p>
      <p>
        典型例: 社員テーブルに「保有スキル」「担当プロジェクト」の 2 列を並べてしまったケース。
        1 人の社員が「Go, TypeScript」の 2 スキルを持ち、「A案件, B案件」の 2 プロジェクトを担当しているとする。
        両方を 1 テーブルに素直に並べると <code>(社員, スキル, プロジェクト)</code> の組み合わせで 4 行になる
        (2 × 2 の直積)。だがスキルとプロジェクトの間に本来関係はない — これが「独立した繰り返し」で、
        多値従属が現れているサイン。
      </p>
      <p>
        多値従属を排除するのが第 4 正規形 (4NF)。関数従属だけで判定する 3NF/BCNF では、
        この「独立した 1 対多の並列」までは検知できない。
        <Link href="/data-modeling/normalization/why">正規化の目的</Link>
        (重複を作らず更新異常を防ぐ) を突き詰めると、いずれ 4NF まで登る必要があるが、
        実務では 3NF まで到達していれば大半の異常は消える。
      </p>

      <h2>関数従属を洗い出す手順</h2>
      <p>
        設計段階で関数従属を漏れなく列挙するのが正規化の入り口。手順は以下の通り。
      </p>
      <ol>
        <li>
          <strong>属性を列挙する</strong>: 対象テーブルに載る全カラムを書き出す
          (社員ID, 氏名, 入社日, 部署ID, 部署名, …)。
        </li>
        <li>
          <strong>候補キーを特定する</strong>: 「この列 (または列の組) が決まれば他の全ての列が一意に決まる」
          最小の組を挙げる。<Link href="/data-modeling/normalization/keys">キーの階層</Link> を参照。
        </li>
        <li>
          <strong>候補キー → 非キー属性の関数従属を書く</strong>: これは定義上必ず成立する。
          例: <code>社員ID → 氏名</code>、<code>社員ID → 入社日</code>。
        </li>
        <li>
          <strong>非キー属性同士の関数従属を業務ルールから拾う</strong>: ここが実務の要点。
          「部署ID が決まれば部署名も決まる」など、業務上絶対に成立する規則を洗い出す。
          サンプルデータで「たまたま同じ」に見えるだけの関係は入れない (反例が出た瞬間に崩れる)。
        </li>
        <li>
          <strong>部分関数従属・推移関数従属を分類する</strong>: 挙げた FD のうち、
          「複合キーの一部だけで成立するもの (部分)」「経由が入っているもの (推移)」を色分けする。
          これが 2NF / 3NF で切り出す対象になる。
        </li>
      </ol>
      <p>
        コツは「サンプルデータではなく業務ルールから導く」こと。
        「今のデータでは重複していない」は関数従属の証拠にならない。
        「業務上、絶対に重複しない (してはいけない)」という制約が根拠になる。
      </p>

      <h2>関数従属と 2NF / 3NF の対応関係</h2>
      <p>
        どの正規形がどのタイプの関数従属を排除するのか、対応表で整理しておく。
      </p>
      <ul>
        <li>
          <Link href="/data-modeling/normalization/1nf"><strong>1NF</strong></Link>: そもそも関数従属を議論できる形にする段階。
          1 セル 1 値・繰り返しグループなしにする。関数従属の分類には踏み込まない。
        </li>
        <li>
          <Link href="/data-modeling/normalization/2nf"><strong>2NF</strong></Link>: <strong>部分関数従属</strong>を排除。
          複合主キーの一部で決まってしまう非キー属性を別テーブルに切り出す。
          単一列の主キーなら 1NF を満たした時点で自動的に 2NF になる。
        </li>
        <li>
          <Link href="/data-modeling/normalization/3nf"><strong>3NF</strong></Link>: <strong>推移関数従属</strong>を排除。
          「主キー → 非キー属性 → 別の非キー属性」の経由を、非キー属性を新テーブルの主キーとして独立させることで消す。
        </li>
        <li>
          <strong>BCNF</strong>: 3NF の抜け穴 (候補キーが複数あり、そのうち一部が別の候補キーの一部に対して従属する)
          を塞ぐ。実務では 3NF と BCNF の差が問題になるケースは少ない。
        </li>
        <li>
          <strong>4NF</strong>: <strong>多値従属</strong>を排除。関数従属では拾えない「独立した繰り返し」を分解する。
        </li>
      </ul>
      <p>
        つまり正規化とは、テーブル内に潜む関数従属を「無害なもの (候補キー → 非キー)」
        と「有害なもの (部分・推移・多値)」に分類し、有害なものを別テーブルに追い出す作業だ。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
