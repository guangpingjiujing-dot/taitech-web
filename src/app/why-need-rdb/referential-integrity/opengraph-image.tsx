import { findTopic } from "@/content/topics";
import {
  renderTopicOGImage,
  topicOGContentType,
  topicOGSize,
} from "@/lib/og/topic-image";

const topic = findTopic("why-need-rdb", "referential-integrity")!;

export const size = topicOGSize;
export const contentType = topicOGContentType;
export const alt = topic.title;

export default function OGImage() {
  return renderTopicOGImage(topic);
}
