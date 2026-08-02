import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: `${site.name}へのお問い合わせ`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Container size="narrow" className="py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        お問い合わせ
      </h1>
      <p className="mt-4 text-[var(--muted-foreground)] leading-relaxed">
        本サイトの内容に関するご質問、誤植の指摘、感想などは以下のいずれかからお願いします。
      </p>

      <ul className="mt-8 border-y border-[var(--border)] divide-y divide-[var(--border)]">
        <li>
          <a
            href={`mailto:${site.contact.email}`}
            className="group flex items-center justify-between py-5 px-2 -mx-2 hover:bg-[var(--muted)]/60 transition-colors"
          >
            <div>
              <Eyebrow size="compact" as="div">メール</Eyebrow>
              <div className="mt-1 font-bold group-hover:underline underline-offset-4">
                {site.contact.email}
              </div>
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">→</span>
          </a>
        </li>
        <li>
          <a
            href={site.author.mentorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between py-5 px-2 -mx-2 hover:bg-[var(--muted)]/60 transition-colors"
          >
            <div>
              <Eyebrow size="compact" as="div">メンタで無料相談</Eyebrow>
              <div className="mt-1 font-bold group-hover:underline underline-offset-4">
                個別指導・学習相談はこちら
              </div>
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">→</span>
          </a>
        </li>
      </ul>
    </Container>
  );
}
