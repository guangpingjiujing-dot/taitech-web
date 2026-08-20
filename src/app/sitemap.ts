import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { topics } from "@/content/topics";
import { sections, dataModelingCategories } from "@/content/sections";
import { feLessons } from "@/content/fe/lessons";
import { feQuizzes } from "@/content/fe/quiz";
import { sqlLessons } from "@/content/fe/sql/lessons";
import { sqlQuizzes } from "@/content/fe/sql/quiz";
import { joho1Lessons } from "@/content/joho1/lessons";
import { joho1Quizzes } from "@/content/joho1/quiz";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = ["/", "/about", "/books", "/privacy", "/terms", "/contact"];
  const sectionHubs = Object.values(sections).map((s) => s.path);
  const categoryHubs = Object.values(dataModelingCategories).map((c) => c.path);
  const topicPaths = topics.map((t) => t.path);
  const feExtraPaths = [
    // `/fe` 自体は sectionHubs 側に入っている。ツールのトップはここ
    "/fe/algorithm",
    "/fe/sql",
    "/fe/sql/lessons",
    ...sqlLessons.map((l) => `/fe/sql/lessons/${l.slug}`),
    "/fe/sql/quiz",
    ...sqlQuizzes.map((q) => `/fe/sql/quiz/${q.slug}`),
    "/fe/algorithm/transpile",
    "/fe/algorithm/lessons",
    ...feLessons.map((l) => `/fe/algorithm/lessons/${l.slug}`),
    "/fe/algorithm/quiz",
    ...feQuizzes.map((q) => `/fe/algorithm/quiz/${q.slug}`),
  ];

  const joho1ExtraPaths = [
    "/joho1/dncl",
    "/joho1/transpile",
    "/joho1/lessons",
    ...joho1Lessons.map((l) => `/joho1/lessons/${l.slug}`),
    "/joho1/quiz",
    ...joho1Quizzes.map((q) => `/joho1/quiz/${q.slug}`),
  ];

  const priorityFor = (p: string): number => {
    if (p === "/") return 1.0;
    // 「変なER図」旗艦ページはカテゴリハブ扱いだが、バイラル+evergreen 両狙いの
    // 主戦場ページなのでセクションハブと同格に上げる
    if (p === "/data-modeling/er-diagram") return 0.9;
    if (sectionHubs.includes(p)) return 0.9;
    // 分野横断の書籍まとめ。セクションハブではないがカテゴリハブと同格に扱う
    if (p === "/books") return 0.8;
    if (categoryHubs.includes(p)) return 0.8;
    return 0.7;
  };

  return [
    ...staticPaths,
    ...sectionHubs,
    ...categoryHubs,
    ...topicPaths,
    ...feExtraPaths,
    ...joho1ExtraPaths,
  ].map((p) => ({
    url: `${site.url}${p}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: priorityFor(p),
  }));
}
