import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DefinitionBox } from "@/components/layout/DefinitionBox";
import { sections } from "@/content/sections";
import { Joho1PageJsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/site";

const sectionMeta = sections.joho1;

export const metadata: Metadata = {
  title: "情報Iの擬似言語はDNCLではない｜違いを整理",
  description:
    "共通テスト「情報I」で出題されるのは DNCL ではなく「共通テスト用プログラム表記」。DNCL は情報関係基礎で使われる別の言語で、代入が ← であるなど記法も違う。両者の違いと、どちらを勉強すべきかを一次資料をもとに整理する。",
  keywords: [
    "DNCL",
    "情報I",
    "情報1",
    "共通テスト",
    "プログラム表記",
    "擬似言語",
    "情報関係基礎",
  ],
  alternates: { canonical: "/joho1/dncl" },
};

export default function Joho1DnclPage() {
  return (
    <>
      <Joho1PageJsonLd
        path="/joho1/dncl"
        name="情報Iの擬似言語は DNCL ではない"
        description={metadata.description as string}
        keywords={metadata.keywords as string[]}
        learningResourceType="Reference"
        breadcrumb={[
          { name: "ホーム", item: site.url },
          {
            name: sectionMeta.shortLabel,
            item: `${site.url}${sectionMeta.path}`,
          },
          { name: "DNCL との違い", item: `${site.url}/joho1/dncl` },
        ]}
      />
      <Container size="wide" className="py-8 md:py-12">
      <article className="mx-auto w-full min-w-0 max-w-3xl">
        <Breadcrumb
          className="mb-6"
          items={[
            { href: "/", label: "ホーム" },
            { href: sectionMeta.path, label: "情報I プログラム表記" },
            { label: "DNCL との違い" },
          ]}
        />

        <Eyebrow>大学入学共通テスト「情報I」— 用語</Eyebrow>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
          情報Iの擬似言語は DNCL ではない — 違いを整理する
        </h1>

        <DefinitionBox className="mt-6">
          DNCL は「情報関係基礎」で使われる言語で、大学入試センターが仕様を公開している。
          一方「情報I」で出題されるのは共通テスト用プログラム表記という別のもので、
          まとまった仕様書は存在せず、試作問題と過去の出題に例が示されているだけである。
        </DefinitionBox>

        <div className="prose-jp mt-10 max-w-none">
          <h2>まぎらわしい理由</h2>
          <p>
            「情報I 擬似言語」で検索すると DNCL という言葉が大量に出てきます。
            ところが実際に情報Iの問題を開くと、DNCL の仕様書に書かれている記法とは
            見た目が違います。混乱の原因は、
            <strong>よく似た 2 つの試験で、別々の言語が使われていること</strong>です。
          </p>

          <table>
            <thead>
              <tr>
                <th></th>
                <th>DNCL</th>
                <th>共通テスト用プログラム表記</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">使われる試験</th>
                <td>情報関係基礎</td>
                <td>情報I（2025 年〜）</td>
              </tr>
              <tr>
                <th scope="row">正式名称</th>
                <td>共通テスト手順記述標準言語</td>
                <td>特に名前は付けられていない</td>
              </tr>
              <tr>
                <th scope="row">仕様</th>
                <td>大学入試センターが説明資料を公開</td>
                <td>
                  <strong>まとまった仕様書は無い</strong>。試作問題などに例示のみ
                </td>
              </tr>
              <tr>
                <th scope="row">受験する人</th>
                <td>主に専門学科・総合学科の出身者</td>
                <td>ほぼすべての受験生</td>
              </tr>
            </tbody>
          </table>

          <p>
            つまり、<strong>情報Iを受けるなら勉強すべきは後者</strong>です。
            DNCL の解説記事を読んでも、記法がところどころ違うので混乱します。
          </p>

          <h2>書き方はどのくらい違うのか</h2>
          <p>
            同じ「変数に値を入れて、条件で分けて、くり返す」処理を書いても、
            見た目はかなり変わります。主な違いは次のとおりです。
          </p>

          <table>
            <thead>
              <tr>
                <th>やりたいこと</th>
                <th>DNCL</th>
                <th>情報I のプログラム表記</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">代入</th>
                <td>
                  <code>kosu ← 3</code>
                </td>
                <td>
                  <code>kosu = 3</code>
                </td>
              </tr>
              <tr>
                <th scope="row">表示</th>
                <td>
                  <code>kosu を表示する</code>
                </td>
                <td>
                  <code>表示する(kosu)</code>
                </td>
              </tr>
              <tr>
                <th scope="row">条件分岐</th>
                <td>
                  <code>もし 〜 ならば 〜 を実行する</code>
                </td>
                <td>
                  <code>もし 〜 ならば：</code> のあと字下げ
                </td>
              </tr>
              <tr>
                <th scope="row">ブロックの終わり</th>
                <td>
                  <code>を実行する</code> / <code>を繰り返す</code> の行で閉じる
                </td>
                <td>字下げと、行の左の罫線で示す</td>
              </tr>
              <tr>
                <th scope="row">配列を作る</th>
                <td>
                  <code>{"Tokuten ← {87, 45, 72}"}</code>
                </td>
                <td>
                  <code>Tokuten = [87, 45, 72]</code>
                </td>
              </tr>
              <tr>
                <th scope="row">かつ / または</th>
                <td>
                  <code>かつ</code> / <code>または</code>
                </td>
                <td>
                  <code>and</code> / <code>or</code>
                </td>
              </tr>
            </tbody>
          </table>

          <p>
            代入がいちばん目につく違いです。<code>←</code> が出てきたらそれは DNCL で、
            情報Iの問題ではありません。逆に <code>=</code> で代入していて、
            行末が <code>：</code> で終わっていれば情報Iのほうです。
          </p>

          <h2>似ているところもある</h2>
          <p>
            全部違うわけではありません。次の点は共通しているので、
            DNCL 向けの解説がそのまま役に立つ場面もあります。
          </p>
          <ul>
            <li>
              くり返しの日本語が
              <code>〜 から 〜 まで 〜 ずつ増やしながら</code> でほぼ同じ
            </li>
            <li>変数名はローマ字で、配列だけ大文字で始める慣習も同じ</li>
            <li>
              プログラムに <code>(01)</code> のような行番号が付き、
              ブロックが縦線で示される紙面の作りも同じ
            </li>
            <li>
              <strong>配列の添字が 0 からか 1 からかを問題文で指定する</strong>
              点も同じ
            </li>
          </ul>

          <h2>「仕様書が無い」ことをどう受け止めるか</h2>
          <p>
            情報Iのプログラム表記には、参照できる仕様書がありません。
            試作問題の資料にも、記法をまとめて説明したページはなく、
            プログラムの例が載っているだけです。しかも
            「問題文中では簡潔にするため異なる形式を使うことがある」と断られています。
          </p>
          <p>
            これは裏を返すと、
            <strong>細かい記法を暗記する対策には意味がない</strong>ということです。
            出題側も、受験者が記法を覚えている前提を置いていません。
            実際、<code>and</code> の意味は問題文のなかで毎回説明されますし、
            使う関数もその問題の中で定義されます。
          </p>
          <p>
            必要なのは、<strong>初めて見る書き方をその場で読み解く力</strong>です。
            そのためには実際に動かして、変数がどう変わるかを目で見るのがいちばん早道です。
          </p>

          <p>
            <Link href="/joho1">実行シミュレーター</Link> に問題のプログラムを貼り付けると、
            行番号と罫線は自動で取り除かれ、1 行ずつ実行できます。
            記法そのものは{" "}
            <Link href="/joho1/lessons">構文別レッスン</Link>{" "}
            で 1 つずつ確認できます。
          </p>
        </div>
      </article>
      </Container>
    </>
  );
}
