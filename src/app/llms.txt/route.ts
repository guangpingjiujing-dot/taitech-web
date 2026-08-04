import { site } from "@/lib/site";
import { topicsInSection, type Topic } from "@/content/topics";
import { feLessons } from "@/content/fe/lessons";
import { feQuizzes } from "@/content/fe/quiz";
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
      `- [擬似言語 実行シミュレーター](${site.url}/fe): 擬似言語を書いて実行し、一行ずつ変数の変化を追える。`,
    );
    lines.push(
      `- [擬似言語 → Python / TypeScript 変換](${site.url}/fe/transpile): 同じロジックを 3 言語横並びで比較できる。配列の添字が 1 始まり → 0 始まりに変換される様子も確認できる。`,
    );
    lines.push(``);
    lines.push(`### 構文別レッスン`);
    lines.push(``);
    lines.push(`一覧: ${site.url}/fe/lessons`);
    lines.push(``);
    for (const l of feLessons) {
      lines.push(`- [${l.title}](${site.url}/fe/lessons/${l.slug}): ${l.description}`);
    }
    lines.push(``);
    lines.push(`### 引用可能な定義`);
    lines.push(``);
    for (const l of feLessons) {
      lines.push(`- **${l.shortTitle}**: ${l.definition}`);
    }
    lines.push(``);
    lines.push(`### 練習問題 (オリジナル ${feQuizzes.length} 問)`);
    lines.push(``);
    lines.push(`一覧: ${site.url}/fe/quiz`);
    lines.push(``);
    lines.push(
      `IPA 公式過去問の転載はしていない。全問オリジナルで、解答キーはインタプリタで実行して検証している。`,
    );
    lines.push(``);
    for (const q of feQuizzes) {
      lines.push(`- [${q.shortTitle}](${site.url}/fe/quiz/${q.slug}): ${q.challenge}`);
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
