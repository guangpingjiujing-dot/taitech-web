import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { topics } from "@/content/topics";
import { sections, dataModelingCategories } from "@/content/sections";
import { feLessons } from "@/content/fe/lessons";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = ["/", "/about", "/privacy", "/terms", "/contact"];
  const sectionHubs = Object.values(sections).map((s) => s.path);
  const categoryHubs = Object.values(dataModelingCategories).map((c) => c.path);
  const topicPaths = topics.map((t) => t.path);
  const feExtraPaths = [
    "/fe/transpile",
    "/fe/lessons",
    ...feLessons.map((l) => `/fe/lessons/${l.slug}`),
  ];

  const priorityFor = (p: string): number => {
    if (p === "/") return 1.0;
    // 「変なER図」旗艦ページはカテゴリハブ扱いだが、バイラル+evergreen 両狙いの
    // 主戦場ページなのでセクションハブと同格に上げる
    if (p === "/data-modeling/er-diagram") return 0.9;
    if (sectionHubs.includes(p)) return 0.9;
    if (categoryHubs.includes(p)) return 0.8;
    return 0.7;
  };

  return [
    ...staticPaths,
    ...sectionHubs,
    ...categoryHubs,
    ...topicPaths,
    ...feExtraPaths,
  ].map((p) => ({
    url: `${site.url}${p}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: priorityFor(p),
  }));
}
