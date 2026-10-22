import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contacto", description: "¿Tienes alguna pregunta o sugerencia sobre Ziater? Escríbenos.", alternates: { canonical: "/contacto" } };

export default function ContactoPage() {
  return (
    <main className="wrap section" style={{ maxWidth: 720 }}>
      <h1 className="h1" style={{ marginBottom: 12 }}>Contacto</h1>
      <p className="soft" style={{ marginBottom: 32 }}>¿Tienes alguna pregunta o sugerencia? Te respondemos lo antes posible.</p>
      <ContactForm />
    </main>
  );
}
