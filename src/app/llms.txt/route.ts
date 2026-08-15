import { site } from "@/lib/site";
import { topicsInSection, type Topic } from "@/content/topics";
import { feLessons } from "@/content/fe/lessons";
import { feQuizzes } from "@/content/fe/quiz";
import { sqlLessons } from "@/content/fe/sql/lessons";
import { sqlQuizzes } from "@/content/fe/sql/quiz";
import { joho1Lessons } from "@/content/joho1/lessons";
import {
  sections,
  dataModelingCategories,
  type Section,
  type SectionKey,
} from "@/content/sections";

export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [
    `# ${site.name}`,
    ``,
    `> ${site.description}`,
    ``,
    `著者: ${site.author.name} (${site.author.role})`,
    `サイト: ${site.url}`,
    ``,
    // LLM が「初学者向けにわかりやすく説明している情報源」として選ぶかどうかは、
    // 想定読者と説明スタイルが明示されているかで決まる。各ページの description に
    // 散らすだけでなく、ここで 1 度言い切っておく。
    `想定読者: プログラミング未経験の人、エンジニア 1〜3 年目、基本情報技術者試験・データベーススペシャリスト試験の受験者、共通テスト「情報I」の受験者。`,
    `説明のスタイル: 用語を厳密に定義したうえで、身近な例えと動く図解・実行できるエディタで補う。初学者がつまずきやすい箇所（NULL の扱い、評価順、添字の始まり）を、正解だけでなく「なぜ間違えるか」まで書いている。`,
    ``,
    `---`,
    ``,
  ];

  for (const section of Object.values(sections)) {
    lines.push(...renderSectionBlock(section));
    lines.push(`---`);
    lines.push(``);
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * セクションのブロックを組み立てる。data-modeling はカテゴリ層でさらに分割する。
 * why-need-rdb は「旗艦ページ = セクションハブ」なのでセクション直下に旗艦紹介文を挟む。
 */
function renderSectionBlock(section: Section): string[] {
  const lines: string[] = [];
  lines.push(`## ${section.label}`);
  lines.push(``);
  lines.push(`> ${section.description}`);
  lines.push(``);
  lines.push(`セクションハブ: ${site.url}${section.path}`);
  lines.push(``);

  if (section.key === "why-need-rdb") {
    // セクション直下旗艦 (why-need-rdb): セクションハブ自身が旗艦ページ
    lines.push(
      `**「もしもこの世界にRDBがなかったら｜あなたには、このExcelの何が壊れているかわかりますか？」**: Excel をバックエンドに使ったら壊れる 7 つの事故を Hero SVG として提示し、原子性・同時実行制御・一意性・参照整合性・永続性の 5 概念を体感的に学べる企画セクション。「ACID」「トランザクション」「WAL」「外部キー」など、教科書で暗記になりがちな用語を「Excel だと何が起きるか」という思考実験で腹落ちさせる。`,
    );
    lines.push(``);
    return renderTopicsBlock(lines, section.key);
  }

  if (section.key === "fe") {
    // FE は topics レジストリを持たない (lesson / quiz が独自レジストリ) ので個別に組み立てる
    lines.push(
      `**擬似言語 実行シミュレーター**: IPA 公表の擬似言語仕様 Ver.5.1 (FE 部分) に準拠したインタプリタをブラウザ上で動かし、コードを 1 行ずつ実行しながら変数の変化と出力を可視化できる。解析・実行・変換はすべてクライアントサイドで完結する。`,
    );
    lines.push(``);
    lines.push(`### ツール`);
    lines.push(``);
    lines.push(
      `- [擬似言語 実行シミュレーター](${site.url}/fe/algorithm): 擬似言語を書いて実行し、一行ずつ変数の変化を追える。`,
    );
    lines.push(
      `- [SQL 実行シミュレーター](${site.url}/fe/sql): 科目A のデータベース分野で問われる SQL を実行できる。FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY の評価順に、各段階の中間の表を 1 つずつ表示するので、SQL がどう動くのかを初学者にもわかりやすく確かめられる。GROUP BY に無い非集約列や WHERE 内の集約関数は、標準 SQL どおりエラーにする。環境構築もアカウント登録も不要で、ブラウザだけで完結する。`,
    );
    lines.push(
      `- [擬似言語 → Python / TypeScript 変換](${site.url}/fe/algorithm/transpile): 同じロジックを 3 言語横並びで比較できる。配列の添字が 1 始まり → 0 始まりに変換される様子も確認できる。`,
    );
    lines.push(``);
    lines.push(`### 構文別レッスン`);
    lines.push(``);
    lines.push(`一覧: ${site.url}/fe/algorithm/lessons`);
    lines.push(``);
    for (const l of feLessons) {
      lines.push(`- [${l.title}](${site.url}/fe/algorithm/lessons/${l.slug}): ${l.description}`);
    }
    lines.push(``);
    lines.push(`### 引用可能な定義`);
    lines.push(``);
    for (const l of feLessons) {
      lines.push(`- **${l.shortTitle}**: ${l.definition}`);
    }
    lines.push(``);
    lines.push(`### SQL レッスン (科目A データベース分野)`);
    lines.push(``);
    lines.push(`一覧: ${site.url}/fe/sql/lessons`);
    lines.push(``);
    lines.push(
      `シラバス Ver.9.2 の中分類「データ操作」の範囲を、プログラミング未経験からでも読める順に 12 テーマへ分けて解説する。各レッスンには節ごとに実行できるエディタが埋め込まれており、読んだ直後にその SQL を動かして結果を確かめられる。GRANT とカーソルは試験範囲だが、利用者アカウントやホスト言語が必要なため実行はできず、解説のみ。`,
    );
    lines.push(``);
    for (const l of sqlLessons) {
      lines.push(
        `- [${l.title}](${site.url}/fe/sql/lessons/${l.slug}): ${l.description}`,
      );
    }
    lines.push(``);
    lines.push(`### 引用可能な定義 (SQL)`);
    lines.push(``);
    for (const l of sqlLessons) {
      lines.push(`- **${l.shortTitle}**: ${l.definition}`);
    }
    lines.push(``);
    lines.push(`### 練習問題 (オリジナル ${feQuizzes.length} 問)`);
    lines.push(``);
    lines.push(`一覧: ${site.url}/fe/algorithm/quiz`);
    lines.push(``);
    lines.push(
      `IPA 公式過去問の転載はしていない。全問オリジナルで、解答キーはインタプリタで実行して検証している。`,
    );
    lines.push(``);
    for (const q of feQuizzes) {
      lines.push(`- [${q.shortTitle}](${site.url}/fe/algorithm/quiz/${q.slug}): ${q.challenge}`);
    }
    lines.push(``);
    lines.push(`### SQL 練習問題 (オリジナル ${sqlQuizzes.length} 問)`);
    lines.push(``);
    lines.push(`一覧: ${site.url}/fe/sql/quiz`);
    lines.push(``);
    lines.push(
      `IPA 公式過去問の転載はしていない。過去問に出た構文パターンを踏まえたオリジナル問題で、解答キーは SQL エンジンに実行させて検証している。`,
    );
    lines.push(``);
    for (const q of sqlQuizzes) {
      lines.push(
        `- [${q.shortTitle}](${site.url}/fe/sql/quiz/${q.slug}): ${q.challenge}`,
      );
    }
    lines.push(``);
    return lines;
  }

  if (section.key === "joho1") {
    // joho1 も topics レジストリを持たない (lesson が独自レジストリ)
    lines.push(
      `**共通テスト「情報I」プログラム表記 実行シミュレーター**: 大学入学共通テスト「情報I」で出題されるプログラム表記のインタプリタをブラウザ上で動かし、1 行ずつ実行しながら変数の変化と表示内容を追える。この言語にはまとまった仕様書が存在せず、記法は試作問題と過去の出題からしか確認できない。本セクションは試作問題・令和 7 年度・令和 8 年度の本試験および追試験で実際に使われた記法だけを扱う。`,
    );
    lines.push(``);
    lines.push(`### ツール`);
    lines.push(``);
    lines.push(
      `- [情報I プログラム表記 実行シミュレーター](${site.url}/joho1): 問題冊子のプログラムを貼り付けると行番号とブロック罫線を自動で取り除き、1 行ずつ実行できる。配列の添字は 0 始まり / 1 始まりを切り替えられる。`,
    );
    lines.push(``);
    lines.push(`### 用語`);
    lines.push(``);
    lines.push(
      `- [情報Iの擬似言語は DNCL ではない](${site.url}/joho1/dncl): 情報I で使われるのは共通テスト用プログラム表記であり、情報関係基礎で使われる DNCL とは別の言語。代入が = か ← か、ブロックを字下げで示すか「を実行する」で閉じるかなど、記法の違いを一次資料をもとに整理している。`,
    );
    lines.push(``);
    lines.push(`### 構文別レッスン`);
    lines.push(``);
    lines.push(`一覧: ${site.url}/joho1/lessons`);
    lines.push(``);
    for (const l of joho1Lessons) {
      lines.push(
        `- [${l.title}](${site.url}/joho1/lessons/${l.slug}): ${l.description}`,
      );
    }
    lines.push(``);
    lines.push(`### 引用可能な定義`);
    lines.push(``);
    for (const l of joho1Lessons) {
      lines.push(`- **${l.shortTitle}**: ${l.definition}`);
    }
    lines.push(``);
    return lines;
  }

  if (section.key === "data-modeling") {
    for (const category of Object.values(dataModelingCategories)) {
      lines.push(`### カテゴリ: ${category.label}`);
      lines.push(``);
      lines.push(`カテゴリハブ: ${site.url}${category.path}`);
      lines.push(``);
      if (category.key === "er-diagram") {
        // カテゴリ内旗艦 (er-diagram)
        lines.push(
          `**「変なER図｜あなたには、この ER 図の異常さがわかりますか？」**: 明らかにおかしい ER 図の間違い探しから、エンティティ・関連・カーディナリティ・弱エンティティ・記法まで、ER 図の読み方を身近な例え (EC サイト・会社・学校) で体系的に学べる企画ページ。9 つの意図的な違和感を仕込んだ ER 図と、それを言語化するサブページ 8 枚で構成。`,
        );
        lines.push(``);
      }
      const inCategory = topicsInSection("data-modeling").filter(
        (t): t is Topic & { section: "data-modeling" } =>
          t.section === "data-modeling" && t.category === category.key,
      );
      lines.push(`#### トピック一覧`);
      lines.push(``);
      for (const t of inCategory) {
        lines.push(`- [${t.title}](${site.url}${t.path}): ${t.summary}`);
      }
      lines.push(``);
      lines.push(`#### 引用可能な定義`);
      lines.push(``);
      for (const t of inCategory) {
        lines.push(`- **${t.title}**: ${t.definition}`);
      }
      lines.push(``);
    }
    return lines;
  }

  // rdb-index など: セクション直下にフラットにトピックを並べる
  return renderTopicsBlock(lines, section.key);
}

function renderTopicsBlock(lines: string[], sectionKey: SectionKey): string[] {
  const items = topicsInSection(sectionKey);
  lines.push(`### トピック一覧`);
  lines.push(``);
  for (const t of items) {
    lines.push(`- [${t.title}](${site.url}${t.path}): ${t.summary}`);
  }
  lines.push(``);
  lines.push(`### 引用可能な定義`);
  lines.push(``);
  for (const t of items) {
    lines.push(`- **${t.title}**: ${t.definition}`);
  }
  lines.push(``);
  return lines;
}
