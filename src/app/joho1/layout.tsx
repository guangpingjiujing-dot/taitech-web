import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Joho1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header section="joho1" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
