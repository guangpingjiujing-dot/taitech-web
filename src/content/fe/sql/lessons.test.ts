import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "@/lib/sql/parser";
import { evaluate } from "@/lib/sql/evaluator";
import { findDataset } from "./datasets";
import { sqlLessons } from "./lessons";

/**
 * レッスン本文に埋め込んだ SQL が、実際に実行できることを検査する。
 *
 * **1 ページに Playground を何台も置くようになったので、目視では担保できない。**
 * 本文の SQL が動かないと、学習者はページを開いた瞬間にエラーを見ることになる。
 * `sampleSql` (メタデータ側) だけでなく、**本文に直接書いた SQL も全部**通す。
 */

/** レッスン本文の `sql={`...`}` を全部拾う */
function embeddedSql(source: string): string[] {
  const found: string[] = [];
  // sql={`...`} または sql={lesson.sampleSql!}
  const re = /sql=\{`([\s\S]*?)`\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) found.push(m[1]);
  return found;
}

const lessonFiles = sqlLessons.map((l) => ({
  slug: l.slug,
  datasetKey: l.datasetKey,
  source: readFileSync(`src/content/fe/sql/lessons/${l.slug}.tsx`, "utf8"),
}));

describe("SQL レッスンに埋め込んだ SQL", () => {
  it("実行できるレッスンには Playground が 1 台以上ある", () => {
    for (const lesson of sqlLessons) {
      const file = lessonFiles.find((f) => f.slug === lesson.slug)!;
      const count = (file.source.match(/<SqlLessonPlayground/g) ?? []).length;
      if (lesson.runnable) {
        expect(count, `${lesson.slug} に Playground が無い`).toBeGreaterThan(0);
      } else {
        // 解説のみのレッスンには置かない (動かないものを置くと嘘になる)
        expect(count, `${lesson.slug} は解説のみなのに Playground がある`).toBe(0);
      }
    }
  });

  it("複数台置くレッスンには caption が付いている", () => {
    for (const file of lessonFiles) {
      const count = (file.source.match(/<SqlLessonPlayground/g) ?? []).length;
      if (count < 2) continue;
      const captions = (file.source.match(/caption=/g) ?? []).length;
      expect(
        captions,
        `${file.slug}: Playground ${count} 台に対して caption ${captions} 個`,
      ).toBe(count);
    }
  });

  /**
   * **「エラーにならないこと」を検査してはいけない。**
   * 制約違反・GROUP BY 違反・ビューの更新など、**わざとエラーを見せる台**がある
   * (それが教材としての主題)。検査したいのは「書き間違い」で、それは
   * 存在しない表や列を指したときにだけ出る。
   */
  const MISTAKE_KINDS = new Set([
    "UNKNOWN_TABLE",
    "UNKNOWN_COLUMN",
    "AMBIGUOUS_COLUMN",
    "COLUMN_COUNT_MISMATCH",
  ]);

  /** 構文は必ず通り、実行時エラーが出るとしても「書き間違い」ではないこと */
  function expectUsableSql(sql: string, datasetKey: string, where: string) {
    // 構文エラーはどんな場合でも意図した教材にならない
    expect(() => parse(sql), `構文が通らない (${where}):\n${sql}`).not.toThrow();

    try {
      evaluate(parse(sql), findDataset(datasetKey).build());
    } catch (e) {
      const kind = (e as { kind?: string }).kind;
      expect(
        kind !== undefined && !MISTAKE_KINDS.has(kind),
        `表や列の指定ミス (${where}, kind=${kind}):\n${sql}\n→ ${(e as Error).message}`,
      ).toBe(true);
    }
  }

  it.each(lessonFiles.map((f) => [f.slug, f] as const))(
    "%s: 本文の SQL が構文的に正しく、表と列の指定が合っている",
    (slug, file) => {
      const statements = embeddedSql(file.source);
      for (const sql of statements) expectUsableSql(sql, file.datasetKey, slug);
    },
  );

  it.each(sqlLessons.filter((l) => l.runnable).map((l) => [l.slug, l] as const))(
    "%s: sampleSql が使える",
    (slug, lesson) => {
      expect(lesson.sampleSql).toBeTruthy();
      expectUsableSql(lesson.sampleSql!, lesson.datasetKey, `${slug} の sampleSql`);
    },
  );

  it("解説のみのレッスンは sampleSql を持たない", () => {
    for (const lesson of sqlLessons.filter((l) => !l.runnable)) {
      expect(lesson.sampleSql, lesson.slug).toBeNull();
    }
  });
});
