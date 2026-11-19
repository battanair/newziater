import { notFound } from "next/navigation";

// Cualquier dirección que no existe muestra la página 404 en su idioma.
export default function NoExiste() {
  notFound();
}
