import type { Metadata } from "next";
import { idiomaDe, traductor } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { title: traductor(idiomaDe((await params).lang))("Reclamar ficha"), robots: { index: false, follow: false } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
