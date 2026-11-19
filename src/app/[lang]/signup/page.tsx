import type { Metadata } from "next";
import { Suspense } from "react";
import { idiomaDe, traductor } from "@/lib/i18n";
import { AuthForm } from "@/components/AuthForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { title: traductor(idiomaDe((await params).lang))("Crear cuenta"), robots: { index: false } };
}

export default function SignupPage() {
  return <Suspense><AuthForm mode="signup" /></Suspense>;
}
