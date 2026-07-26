import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function WhyNeedRdbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header section="why-need-rdb" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
