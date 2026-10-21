import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <main className="wrap section" style={{ minHeight: "60vh" }}>
      <p className="eyebrow">Error 404</p>
      <h1 className="h1" style={{ margin: "12px 0 16px" }}>Esta función no está en cartel.</h1>
      <p className="soft" style={{ marginBottom: 28 }}>La página que buscas no existe o ha cambiado de dirección.</p>
      <div style={{ maxWidth: 640, marginBottom: 24 }}><SearchBox hero /></div>
      <Link href="/" className="btn">Volver al inicio</Link>
    </main>
  );
}
