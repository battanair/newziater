import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { verifyRequest } from "@/lib/firebase-admin";

// Firma subidas a Cloudinary solo para usuarios con sesión iniciada.
// El secreto de Cloudinary nunca sale del servidor, y cada usuario solo puede
// subir a su propia carpeta y con formatos de imagen.
const TIPOS = new Set(["cartel", "foto", "galeria", "logo"]);

const intentos = new Map<string, number[]>(); // límite sencillo por usuario e instancia

export async function POST(req: Request) {
  const user = await verifyRequest(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ahora = Date.now();
  const recientes = (intentos.get(user.uid) ?? []).filter((t) => ahora - t < 60_000);
  if (recientes.length >= 20) return NextResponse.json({ error: "Demasiadas subidas, espera un minuto" }, { status: 429 });
  intentos.set(user.uid, [...recientes, ahora]);

  const secret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!secret || !apiKey || !cloud) return NextResponse.json({ error: "Cloudinary no está configurado" }, { status: 500 });

  const { tipo } = (await req.json().catch(() => ({}))) as { tipo?: string };
  if (!tipo || !TIPOS.has(tipo)) return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });

  const params: Record<string, string> = {
    allowed_formats: "jpg,jpeg,png,webp,heic",
    folder: `ziater/${user.uid}/${tipo}`,
    timestamp: String(Math.floor(ahora / 1000)),
  };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const signature = createHash("sha1").update(toSign + secret).digest("hex");

  return NextResponse.json({ ...params, signature, api_key: apiKey, url: `https://api.cloudinary.com/v1_1/${cloud}/image/upload` });
}
