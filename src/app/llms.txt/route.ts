import { site } from "@/lib/site";
import { topicsInSection, type Topic } from "@/content/topics";
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
