import { findTopic } from "@/content/topics";
import {
  renderTopicOGImage,
  topicOGContentType,
  topicOGSize,
} from "@/lib/og/topic-image";

const topic = findTopic("query-plan", "explain-basics")!;

export const size = topicOGSize;
export const contentType = topicOGContentType;
export const alt = topic.title;

export default function OGImage() {
  return renderTopicOGImage(topic);
}
