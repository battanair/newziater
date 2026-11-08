import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Condiciones para usar Ziater, crear una cuenta y publicar contenido.",
  alternates: { canonical: "/terminos-de-uso" },
};

const H = ({ children }: { children: React.ReactNode }) => <h2 className="h3" style={{ marginTop: 36 }}>{children}</h2>;

export default function Page() {
  return (
    <LegalPage title="Términos de uso">
      <p>Última actualización: 8 de noviembre de 2026.</p>
      <p>
        Ziater (ziater.com) es una base de datos abierta y gratuita de las artes escénicas (los datos del titular están en el{" "}
        <Link href="/aviso-legal">aviso legal</Link>). Al usar la web o
        crear una cuenta aceptas estos términos. Si no estás de acuerdo, por favor no la uses.
      </p>

      <H>1. El servicio</H>
      <p>
        Ziater permite consultar y publicar información sobre obras, artistas, compañías y salas: fichas, elencos, fechas de funciones, imágenes
        y valoraciones. Consultar la web es libre y gratuito. Para publicar, puntuar o guardar listas necesitas una cuenta, también gratuita.
      </p>

      <H>2. Tu cuenta</H>
      <ul>
        <li>Debes tener al menos 14 años y dar datos veraces.</li>
        <li>Eres responsable de lo que se haga con tu cuenta: guarda tu contraseña y no la compartas.</li>
        <li>Puedes dejar de usar Ziater cuando quieras y pedirnos que borremos tu cuenta desde el <Link href="/contacto">formulario de contacto</Link>.</li>
      </ul>

      <H>3. Lo que publicas</H>
      <ul>
        <li>Lo que publiques debe ser verdadero y respetuoso. Ziater es una base de datos: corrige errores, no inventes datos.</li>
        <li>Solo puedes subir imágenes y textos que sean tuyos o que tengas permiso para usar (por ejemplo, el cartel o las fotos de tu compañía), indicando la autoría cuando corresponda.</li>
        <li>No está permitido suplantar a otras personas, publicar datos personales que no sean profesionales (como teléfonos o direcciones particulares), ni contenido ofensivo, discriminatorio, ilegal o publicitario ajeno a las artes escénicas.</li>
        <li>
          Sigues siendo titular de tus textos e imágenes. Al publicarlos, nos concedes una licencia gratuita, no exclusiva y mundial para
          mostrarlos, adaptarlos al formato de la web (por ejemplo, recortar o comprimir imágenes) y difundirlos dentro de Ziater y en sus
          redes, mientras estén publicados.
        </li>
        <li>Los datos sobre obras (títulos, fechas, elencos, salas) forman parte de la base de datos común y pueden seguir visibles aunque borres tu cuenta.</li>
      </ul>

      <H>4. Fichas de otras personas</H>
      <p>
        Al añadir una obra puedes incluir a las personas que participaron en ella; se crea así una ficha profesional que la persona puede
        reclamar después. Incluye solo información profesional y pública. Si existe una ficha sobre ti, puedes reclamarla para gestionarla,
        sugerir cambios o pedirnos que la corrijamos o la retiremos (consulta la <Link href="/politica-de-privacidad">política de privacidad</Link>).
        Quien crea una obra o una sala es quien la gestiona; los demás pueden sugerir cambios.
      </p>

      <H>5. Moderación</H>
      <p>
        Podemos corregir, ocultar o retirar contenido que incumpla estos términos o la ley, y suspender cuentas que abusen del servicio. Si
        crees que algo publicado en Ziater infringe tus derechos (por ejemplo, una imagen tuya usada sin permiso), avísanos desde el
        <Link href="/contacto"> formulario de contacto</Link> y lo revisaremos lo antes posible.
      </p>

      <H>6. Enlaces y entradas</H>
      <p>
        Ziater enlaza a webs de terceros, como las de venta de entradas, las salas o las redes sociales. No vendemos entradas ni somos
        responsables de esas webs, de sus precios ni de cambios o cancelaciones de funciones: confirma siempre los datos con la sala o la
        ticketera.
      </p>

      <H>7. Responsabilidad</H>
      <p>
        Gran parte del contenido lo aportan los usuarios. Trabajamos para que sea correcto, pero no podemos garantizar que todo esté completo o
        actualizado, ni que la web esté siempre disponible. Ziater se ofrece tal cual, y no seremos responsables de daños derivados del uso de
        la información publicada, salvo en los casos en que la ley no permita esta limitación.
      </p>

      <H>8. Propiedad intelectual de Ziater</H>
      <p>El nombre, el logotipo, el diseño y el código de Ziater son de su titular. No puedes copiarlos ni usarlos para crear servicios que se hagan pasar por Ziater.</p>

      <H>9. Cambios en los términos</H>
      <p>Podemos actualizar estos términos. Si el cambio es importante, lo avisaremos en la web. Seguir usando Ziater después implica aceptar la nueva versión.</p>

      <H>10. Ley aplicable</H>
      <p>Estos términos se rigen por la ley española. Si eres consumidor, podrás acudir a los tribunales de tu domicilio.</p>
    </LegalPage>
  );
}
