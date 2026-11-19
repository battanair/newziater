// Revisa la web arrancada en local (http://localhost:3000) en español e inglés:
// estado HTTP, <html lang>, título, canonical, hreflang, errores de consola y capturas en móvil.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const PAGINAS = (process.env.PAGINAS || "").split(",").filter(Boolean);
fs.mkdirSync("revision", { recursive: true });
const browser = await chromium.launch();
const out = [];
for (const [ancho, alto, nombre] of [[390, 844, "movil"], [1280, 900, "escritorio"]]) {
  const ctx = await browser.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
  for (const p of PAGINAS) {
    if (nombre === "escritorio" && !["/", "/en", "/en/obra/PCdBR7E4UAdtuq0kEW9u", "/en/persona/3RCVwO2G7iX53oPpBXxK"].includes(p)) continue;
    const page = await ctx.newPage();
    const errores = [];
    page.on("console", (m) => { if (m.type() === "error") errores.push(m.text().slice(0, 200)); });
    page.on("pageerror", (e) => errores.push("pageerror: " + e.message.slice(0, 200)));
    let estado = 0;
    try {
      const r = await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 30000 });
      estado = r?.status() ?? 0;
    } catch (e) { errores.push("goto: " + e.message.slice(0, 120)); }
    await page.waitForTimeout(800);
    const info = await page.evaluate(() => ({
      url: location.pathname,
      lang: document.documentElement.lang,
      titulo: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute("hreflang") + "=" + l.getAttribute("href")),
      h1: document.querySelector("h1")?.textContent?.trim().slice(0, 80),
      enlacesSinPrefijo: document.documentElement.lang === "en" ? [...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("/en") && !h.startsWith("/api")).slice(0, 10) : [],
      texto: document.body.innerText.slice(0, 6000),
      desborde: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    const archivo = `revision/${nombre}_${p.replace(/[/?=]/g, "_") || "_"}.jpg`;
    await page.screenshot({ path: archivo, fullPage: true, type: "jpeg", quality: 70 });
    out.push({ pagina: p, vista: nombre, estado, errores, ...info });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync("revision/resultado.json", JSON.stringify(out, null, 1));
console.log(out.map((o) => `${o.vista} ${o.estado} ${o.pagina} lang=${o.lang} «${o.titulo}» h1=«${o.h1}» desborde=${o.desborde}\n   errores: ${JSON.stringify(o.errores)}\n   sinPrefijo: ${JSON.stringify(o.enlacesSinPrefijo.filter((h) => h !== "/" && !h.startsWith("/?")))}\n   canonical: ${o.canonical} hreflang: ${o.hreflang.join(" ")}`).join("\n"));
