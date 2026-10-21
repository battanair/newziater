# Ziater

La base de datos de las artes escénicas: obras, artistas, compañías y sus vínculos.

- **Next.js 15** (App Router) desplegado en **Vercel** (plan gratuito).
- **Firebase Auth** para el login (email + Google) y **Firestore** (`ziater2`) para los datos.
- **Cloudinary** para las imágenes, con subida firmada desde el servidor.
- Usa las **mismas colecciones** que la web anterior, así que no hay que migrar datos.

## Cómo está pensado

| Objetivo | Cómo se consigue |
|---|---|
| **Gratis al empezar** | Vercel Hobby + Firebase Spark + Cloudinary Free. Las fichas se sirven desde caché (ISR), así que cada visita no gasta lecturas de Firestore: se regeneran como mucho una vez por hora o al momento cuando alguien las edita. |
| **Escalable** | Las páginas públicas son estáticas en el CDN. Si crece mucho: pasar la búsqueda a Algolia/Typesense (`src/lib/data.ts → indiceBusqueda`) y Firestore a plan Blaze. |
| **SEO** | Cada ficha se genera en el servidor con título, descripción, URL canónica, imagen Open Graph 1200×630 (para WhatsApp, Instagram, X…), datos estructurados schema.org (`CreativeWork`, `Person`, `PerformingGroup`, `BreadcrumbList`), `sitemap.xml` con todas las fichas y `robots.txt`. Las URLs antiguas (`/obra/:id`, `/persona/:id`) se mantienen y `/todoelequipo/:id` redirige con 301. |
| **Seguridad** | Reglas de Firestore estrictas (`firestore.rules`), cabeceras HTTP (CSP, HSTS, anti-clickjacking…), secreto de Cloudinary solo en el servidor, tokens verificados en cada ruta `/api`, reclamación de fichas con revisión manual y sin redirecciones abiertas. |

## Puesta en marcha

### 1. Reglas de seguridad (urgente, también para la web actual)

```bash
npm i -g firebase-tools
firebase login
npm run deploy:rules
```

O copia `firestore.rules` en la consola de Firebase → Firestore → Reglas → Publicar.

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellénalo:

- Firebase: Consola → ⚙ Configuración del proyecto → Tus apps → Ziater.
- Cloudinary: Consola de Cloudinary → Settings → API Keys. **`CLOUDINARY_API_SECRET` es secreto**: solo en `.env.local` y en Vercel, nunca con prefijo `NEXT_PUBLIC_`.

### 3. Desarrollo local

```bash
npm install
npm run dev
```

### 4. Despliegue en Vercel

1. vercel.com → Add New → Project → importa `battanair/newziater`.
2. Añade las variables de `.env.example` en Settings → Environment Variables.
3. Deploy. Cada pull request tendrá su propia vista previa.
4. Firebase → Authentication → Settings → Dominios autorizados: añade el dominio de Vercel y `ziater.com`.
5. Cuando todo esté bien, apunta `ziater.com` a Vercel (Settings → Domains) y retira el hosting antiguo.
6. Google Search Console: añade `ziater.com` y envía `https://ziater.com/sitemap.xml`.

### 5. Cloudinary

- Settings → Upload → desactiva cualquier *upload preset* **unsigned**: ya no hace falta y permite que cualquiera suba archivos a tu cuenta.
- Settings → Security → activa «Strict transformations» si no usas transformaciones dinámicas fuera de Ziater.

### 6. Hacerte administrador

Necesario para aprobar reclamaciones de fichas en `/panel/admin` y editar fichas antiguas sin dueño:

```bash
# Descarga una clave de cuenta de servicio como service-account.json (ver scripts/set-admin.mjs)
npm run admin:set -- tu-email@ejemplo.com
```

## Modelo de datos

| Colección | Uso | Campos nuevos (opcionales) |
|---|---|---|
| `obra` | Fichas de obra | `duracion`, `edad`, `idioma`, `id_productora` |
| `persona` | Fichas de artista. `coincide` = uid del artista que la reclamó | `roles`, `ciudad`, `verificado`, `destacadas` |
| `persona_obra` | Créditos (el vínculo persona ↔ obra) | `estado` (`pendiente`/`confirmado`), `creado_por` |
| `premios_obras` | Premios | — |
| `productoras` | Compañías | — |
| `users` | Cuenta privada: `favoritos_obra` («Quiero verla»), `vistas` («La he visto») | — |
| `fallos` | Mensajes del formulario de contacto (privado) | — |
| `reclamaciones` | **Nueva.** Solicitudes para reclamar una ficha | — |

Los créditos antiguos no tienen `estado` y se muestran como confirmados.

## Cómo funcionan los vínculos

1. Quien crea una obra añade al elenco y al equipo escribiendo nombres. Si la persona ya tiene ficha, queda enlazada; si no, se le crea una ficha que podrá reclamar.
2. El crédito nace `pendiente` y la persona lo confirma en **Panel → Vínculos**.
3. Un artista también puede añadirse a una obra ajena desde **Mi ficha → Añadir crédito**; quien creó la obra lo confirma.
4. Para reclamar una ficha existente se envía una solicitud que un administrador aprueba. Así nadie puede apropiarse de la ficha de otra persona.
