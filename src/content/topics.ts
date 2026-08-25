import { rdbTopics, type RdbTopic } from "./topics.rdb-index";
import { dataModelingTopics, type DataModelingTopic } from "./topics.data-modeling";
import { whyNeedRdbTopics, type WhyNeedRdbTopic } from "./topics.why-need-rdb";
import { queryPlanTopics, type QueryPlanTopic } from "./topics.query-plan";
import type { SectionKey } from "./sections";

export type TopicLevel = "basic" | "advanced";

export type { RdbTopic, DataModelingTopic, WhyNeedRdbTopic, QueryPlanTopic };
export type Topic = RdbTopic | DataModelingTopic | WhyNeedRdbTopic | QueryPlanTopic;

export { rdbTopics, dataModelingTopics, whyNeedRdbTopics, queryPlanTopics };

export const topics: Topic[] = [
  ...rdbTopics,
  ...dataModelingTopics,
  ...whyNeedRdbTopics,
  ...queryPlanTopics,
];

export function findTopic(section: SectionKey, slug: string): Topic | undefined {
  return topics.find((t) => t.section === section && t.slug === slug);
}

export function topicsInSection(section: SectionKey): Topic[] {
  return topics.filter((t) => t.section === section);
}

export function rdbTopicsBy(group: RdbTopic["group"]): RdbTopic[] {
  return rdbTopics.filter((t) => t.group === group);
}

export function dataModelingTopicsIn(
  category: DataModelingTopic["category"],
): DataModelingTopic[] {
  return dataModelingTopics.filter((t) => t.category === category);
}

/** 実行計画セクションのトピックを学習順に返す（`stageOrder` が唯一の順序の正） */
export function queryPlanTopicsInOrder(): QueryPlanTopic[] {
  return [...queryPlanTopics].sort((a, b) => a.stageOrder - b.stageOrder);
}
