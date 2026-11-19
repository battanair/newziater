import type { Metadata } from "next";
import Link from "@/components/Idioma";
import { LegalPage } from "@/components/LegalPage";
import { alternos, idiomaDe } from "@/lib/i18n";
import { TITULAR } from "@/lib/titular";


export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = idiomaDe((await params).lang);
  return lang === "en"
    ? { title: "Legal notice", description: "Details of the owner of Ziater.", alternates: alternos(lang, "/aviso-legal") }
    : { title: "Aviso legal", description: "Datos del titular de Ziater.", alternates: alternos(lang, "/aviso-legal") };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return idiomaDe((await params).lang) === "en" ? <En /> : <Es />;
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="h3" style={{ marginTop: 36 }}>{children}</h2>;

function Es() {
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

// English version
function En() {
  return (
    <LegalPage title="Legal notice">
      <p>In accordance with Spanish Law 34/2002 on information society services and electronic commerce (LSSI), these are the details of the owner of Ziater:</p>
      <dl className="dl">
        <dt>Owner</dt><dd>{TITULAR.nombre}</dd>
        {TITULAR.nif ? <><dt>Tax ID (NIF)</dt><dd>{TITULAR.nif}</dd></> : null}
        {TITULAR.domicilio ? <><dt>Address</dt><dd>{TITULAR.domicilio}</dd></> : null}
        {TITULAR.email ? <><dt>Email</dt><dd><a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a></dd></> : null}
        <dt>Contact</dt><dd><Link href="/contacto">Contact form</Link></dd>
        <dt>Website</dt><dd>ziater.com</dd>
        <dt>Activity</dt><dd>Free-access database of the performing arts.</dd>
      </dl>
      <H>Terms and privacy</H>
      <p>
        Use of Ziater is governed by the <Link href="/terminos-de-uso">terms of use</Link>. The processing of personal data is explained in the{" "}
        <Link href="/politica-de-privacidad">privacy policy</Link> and the <Link href="/politica-de-cookies">cookie policy</Link>.
      </p>
    </LegalPage>
  );
}
