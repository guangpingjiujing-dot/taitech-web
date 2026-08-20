import { buildTopicMetadata } from "@/lib/metadata";
import Link from "next/link";
import { TopicLayout } from "@/components/layout/TopicLayout";
import { TopicJsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/components/layout/FAQ";
import { IsolationLevelViz } from "@/components/viz/rdb-fundamentals/IsolationLevelViz";
import { findTopic } from "@/content/topics";
import {
  ISOLATION_LEVELS,
  ISOLATION_LEVEL_INFO,
  ISOLATION_LOCK_MODEL,
  isolationMatrix,
  isolationScenarios,
} from "@/components/viz/rdb-fundamentals/isolation-scenarios";

const slug = "isolation-levels";
const topic = findTopic("why-need-rdb", slug)!;

export const metadata = buildTopicMetadata(topic);

const faq = [
  {
    q: "分離レベルは実務では何を選べばいい？",
    a: "多くのアプリケーションは既定の READ COMMITTED で足ります。残高や在庫のように「読んだ値を根拠に書き込む」処理だけ、その処理に限って REPEATABLE READ や SERIALIZABLE に上げるのが現実的です。全体を SERIALIZABLE にすると競合時のリトライとコストが跳ね上がります。",
  },
  {
    q: "ファントムリードとノンリピータブルリードの違いは？",
    a: "ノンリピータブルリードは「同じ行の値が変わる」、ファントムリードは「条件に合う行の数が変わる」異常です。前者は UPDATE、後者は INSERT や DELETE によって起こります。行単位のロックでは後者を防げないのが本質的な違いです。",
  },
  {
    q: "PostgreSQL の REPEATABLE READ ならファントムリードは起きない？",
    a: "起きません。PostgreSQL の REPEATABLE READ はスナップショットを固定するため、SQL 標準が許容しているファントムリードも実際には防ぎます。標準の定義は「そのレベルで許される最低ライン」であって、実装がそれより強く防ぐのは違反ではありません。",
  },
  {
    q: "MySQL の既定は何？",
    a: "InnoDB の既定は REPEATABLE READ です。PostgreSQL の既定 (READ COMMITTED) と違うため、同じコードを両方で動かすと挙動が変わることがあります。移植時に最初に確認すべき設定の一つです。",
  },
  {
    q: "なぜファントムリードだけ行ロックで防げないのですか？",
    a: "行ロックは既に存在する行にしか掛けられないためです。読んだ行をすべてロックし続けても、まだ存在しない行は誰もロックできないので INSERT を止められません。防ぐには「条件に合う範囲」そのものを押さえる述語ロックやギャップロックが必要になります。REPEATABLE READ と SERIALIZABLE の差はここにあります。",
  },
  {
    q: "SERIALIZABLE にすればすべて安全？",
    a: "読み取り異常は防げますが、代わりに競合したトランザクションが失敗するようになります。SERIALIZABLE を使うならアプリケーション側にリトライ処理が必要です。「遅くなる」だけでなく「エラーが増える」ことを織り込んでください。",
  },
];

export default function Page() {
  const matrix = isolationMatrix();

  return (
    <TopicLayout section="why-need-rdb" slug={slug}>
      <TopicJsonLd section="why-need-rdb" slug={slug} faq={faq} />

      <h2>分離レベルとは — 「他人の途中経過がどこまで見えるか」の設定</h2>
      <p>
        データベースは複数のトランザクションを同時に走らせる。このとき、
        <strong>他人がまだ書き換えている途中のデータが自分にどこまで見えるか</strong>
        を決めるのが分離レベルである。
      </p>
      <p>
        完全に見えなくすれば安全だが、その分だけ待ち時間が増えて遅くなる。
        逆にすべて見せれば速いが、存在しなかった値を読んでしまう。
        <strong>分離レベルは、この安全性と性能のトレードオフをどこで切るかを選ぶダイヤル</strong>で、
        SQL 標準では 4 段階が定義されている。
      </p>
      <h2>4 段階 — 緩い順に、見える範囲が狭くなる</h2>
      <p>
        まず 4 段階それぞれが何なのかを、<strong>見え方だけで</strong>押さえておく。
        上に行くほど緩く、下に行くほど厳しい。
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>分離レベル</th>
              <th>ひとことで</th>
              <th>何が見えるか</th>
            </tr>
          </thead>
          <tbody>
            {ISOLATION_LEVELS.map((level) => (
              <tr key={level}>
                {/* レベル名は語中で折らない (READ UNCOMMITTE / D になる) */}
                <td className="whitespace-nowrap">
                  <code>{level}</code>
                </td>
                <td>{ISOLATION_LEVEL_INFO[level].headline}</td>
                <td>{ISOLATION_LEVEL_INFO[level].visibility}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>仕組みから見ると「読み取りロックをどれだけ長く持つか」の違い</h3>
      <p>
        この見え方の差は、どこから生まれるのか。
        ロックで実装した場合の古典的なモデルで見ると、4 段階の正体がはっきりする。
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>分離レベル</th>
              <th>読み取りロック</th>
              <th>書き込みロック</th>
              <th>結果として</th>
            </tr>
          </thead>
          <tbody>
            {ISOLATION_LEVELS.map((level) => (
              <tr key={level}>
                <td className="whitespace-nowrap">
                  <code>{level}</code>
                </td>
                <td>{ISOLATION_LOCK_MODEL[level].readLock}</td>
                <td className="whitespace-nowrap">
                  {ISOLATION_LOCK_MODEL[level].writeLock}
                </td>
                <td>{ISOLATION_LOCK_MODEL[level].consequence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        見るべきなのは、<strong>書き込みロックの列が 4 段階すべてで同じ</strong>だということ。
        書き込みは常にトランザクション終了まで排他される。
        つまり<strong>4 段階の違いは、読み取りロックをどれだけ長く持つかだけに現れる</strong>。
        分離レベルが「読み取り側の設定」と言われるのはこのためである。
      </p>
      <p className="text-sm text-[var(--muted-foreground)]">
        ※ これは<strong>ロックで実装した場合</strong>のモデルで、標準がロックの掛け方を
        規定しているわけではない。主要な DBMS の通常の読み取りはロックを取らない方式で動いている
        (後述)。どの行を明示的にロックするかを自分で制御する話は
        <Link href="/why-need-rdb/concurrency">同時実行制御</Link>で扱う。
      </p>
      <p>
        緩いほど待たされず速いが、その分だけ
        <strong>「本来読むべきでないもの」が見えてしまう</strong>。
        では具体的に何が見えると困るのか。それを整理したのが、次の 3 つの読み取り異常である。
      </p>

      <h2>3 つの読み取り異常</h2>
      <ul>
        {isolationScenarios.map((s) => (
          <li key={s.key}>
            <strong>{s.anomaly}</strong> — {s.summary}
          </li>
        ))}
      </ul>
      <p>
        文章で読むと似て見えるが、<strong>実際に起きている順序を見ると別物だと分かる</strong>。
        下のシミュレーターで、2 つのトランザクション (T1 = 自分 / T2 = 他人) の操作を
        1 ステップずつ進めてみてほしい。
      </p>

      <div className="not-prose my-8">
        <IsolationLevelViz />
      </div>

      <p>
        <strong>操作列は変えずに分離レベルだけを切り替えられる</strong>ようにしてある。
        同じ順序で同じ SQL を実行しているのに、
        <code>READ UNCOMMITTED</code> では見えていたものが
        <code>READ COMMITTED</code> では見えなくなる。これが分離レベルの働きそのものである。
      </p>

      <h2>4 段階 × 3 異常のマトリクス</h2>
      <p>
        SQL 標準の定義をまとめると次のようになる。
        <strong>「起きうる」は許容されているという意味</strong>で、
        実装が実際に起こすとは限らない (次の節)。
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>分離レベル</th>
              {isolationScenarios.map((s) => (
                <th key={s.key}>{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.level}>
                <td className="whitespace-nowrap">
                  <code>{row.level}</code>
                </td>
                {row.cells.map((c) => (
                  <td key={c.scenario.key}>
                    {c.occurs ? "起きうる" : "起きない"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        表を上から下へ読むと、<strong>防げる異常が 1 つずつ増えていく</strong>のが分かる。
        分離レベルが 4 段階なのは、3 つの異常を順に潰していった結果である。
      </p>
      <p>
        ここで<strong>ファントムリードだけが 1 段階遅れて防がれている</strong>ことに気付く。
        理由は前に見たロックの表にある。
        <strong>行ロックは既に存在する行にしか掛けられない</strong>ので、
        <code>REPEATABLE READ</code> で読んだ行を全部ロックし続けても、
        <strong>まだ存在しない行は誰もロックできず</strong> <code>INSERT</code> を止められない。
        条件に合う<strong>範囲そのもの</strong>を押さえる別の道具 (述語ロック / ギャップロック) が要る。
        3 つのうちファントムだけ防ぐのが遅れるのは、必要な道具が違うからである。
      </p>

      <h2>標準の定義と、実際の DBMS の挙動は違う</h2>
      <p>
        ここが分離レベルの解説でいちばん混乱しやすい。
        <strong>SQL 標準が定めているのは「そのレベルで最低限これは防ぐ」という下限</strong>であって、
        実装がそれより強く防ぐことは違反ではない。
      </p>
      <p>
        しかも<strong>手段も標準が決めているわけではない</strong>。前節はロックで説明したが、
        PostgreSQL や InnoDB の通常の <code>SELECT</code> は
        <strong>読み取りロックを取らない</strong>。行の複数バージョンを保持しておき、
        自分に見えるべきバージョンを選んで返す方式 (MVCC) で同じ保証を実現している。
        読み取りが書き込みを待たせないぶん速い。
      </p>
      <ul>
        <li>
          <strong>PostgreSQL の <code>REPEATABLE READ</code> はファントムリードも防ぐ</strong>。
          トランザクション開始時点のスナップショットを固定するため、
          標準が許容しているファントムリードも実際には現れない
        </li>
        <li>
          <strong>PostgreSQL には <code>READ UNCOMMITTED</code> が実質的に存在しない</strong>。
          指定はできるが <code>READ COMMITTED</code> として扱われるため、ダーティリードは起こらない
        </li>
        <li>
          <strong>MySQL (InnoDB) の既定は <code>REPEATABLE READ</code></strong>。
          PostgreSQL の既定 (<code>READ COMMITTED</code>) と違う。
          さらに InnoDB はギャップロックによって範囲検索の隙間も押さえるため、ファントムリードを防ぐ
        </li>
      </ul>
      <p>
        つまり<strong>「REPEATABLE READ ならファントムリードが起きる」は標準の話であって、
        主要な DBMS の実挙動ではない</strong>。試験では標準の定義が問われ、
        実務では使っている DBMS の挙動が効く。この 2 つを分けて覚えておくと混乱しない。
      </p>

      <h2>実務でどれを選ぶか</h2>
      <p>
        既定のまま (<code>READ COMMITTED</code> または <code>REPEATABLE READ</code>) で動かし、
        <strong>必要な処理だけ局所的に上げる</strong>のが基本方針になる。
      </p>
      <ul>
        <li>
          <strong>大半の処理</strong>: 既定のまま。読んで表示するだけの処理に強い分離は要らない
        </li>
        <li>
          <strong>読んだ値を根拠に書き込む処理</strong> (残高チェックしてから引き落とす、
          在庫を見てから確保する): ここだけ引き上げるか、
          <code>SELECT ... FOR UPDATE</code> で明示的に行をロックする
        </li>
        <li>
          <strong><code>SERIALIZABLE</code> を使うならリトライ処理を書く</strong>。
          競合したトランザクションは待たされるのではなく失敗することがある。
          「遅くなる」より「エラーが増える」ほうが実装上の影響は大きい
        </li>
      </ul>
      <p>
        なお、分離レベルを上げても防げない事故もある。2 人が同じ行を読んで別々に書き戻し、
        後の書き込みが先の書き込みを消してしまう
        <Link href="/why-need-rdb/concurrency">更新消失 (Lost Update)</Link>
        は、分離レベルではなくロックの設計で対処する問題である。
      </p>

      <FAQ items={faq} />
    </TopicLayout>
  );
}
