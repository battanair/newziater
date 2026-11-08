import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { TITULAR } from "@/lib/titular";

export const metadata: Metadata = { title: "Aviso legal", description: "Datos del titular de Ziater.", alternates: { canonical: "/aviso-legal" } };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="h3" style={{ marginTop: 36 }}>{children}</h2>;

export default function Page() {
  return (
    <LegalPage title="Aviso legal">
      <p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI), estos son los datos del titular de Ziater:</p>
      <dl className="dl">
        <dt>Titular</dt><dd>{TITULAR.nombre}</dd>
        {TITULAR.nif ? <><dt>NIF</dt><dd>{TITULAR.nif}</dd></> : null}
        {TITULAR.domicilio ? <><dt>Domicilio</dt><dd>{TITULAR.domicilio}</dd></> : null}
        {TITULAR.email ? <><dt>Email</dt><dd><a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a></dd></> : null}
        <dt>Contacto</dt><dd><Link href="/contacto">Formulario de contacto</Link></dd>
        <dt>Sitio web</dt><dd>ziater.com</dd>
        <dt>Actividad</dt><dd>Base de datos de las artes escénicas, de acceso gratuito.</dd>
      </dl>
      <H>Condiciones y privacidad</H>
      <p>
        El uso de Ziater se rige por los <Link href="/terminos-de-uso">términos de uso</Link>. El tratamiento de datos personales se explica en la{" "}
        <Link href="/politica-de-privacidad">política de privacidad</Link> y en la <Link href="/politica-de-cookies">política de cookies</Link>.
      </p>
    </LegalPage>
  );
}
