// Tipos que reflejan las colecciones que ya existen en Firestore (proyecto ziater2).
// Los nombres de campo se respetan tal cual para no romper los datos actuales.

export interface Obra {
  id: string;
  titulo: string;
  sinopsis?: string;
  anoinicio?: string | number;
  anofin?: string | number; // 0 o vacío = sigue en activo
  cartel?: string;
  fotos_obra?: string[];
  fotosObra?: string[]; // nombre que usaba la web antigua
  funciones?: Funcion[]; // «Dónde verla»
  ultima?: string; // fecha de la última función (AAAA-MM-DD): sirve para buscar las obras en cartel
  salas_ids?: string[]; // salas enlazadas desde sus funciones
  categoria?: string[];
  instagram?: string;
  trailer?: string;
  creacion?: string; // uid de quien creó la ficha
  // Campos nuevos (opcionales)
  duracion?: number;
  edad?: string;
  idioma?: string;
  id_productora?: string;
  // Valoraciones (las mantiene el componente de nota, validadas por las reglas)
  votos?: number;
  suma_notas?: number;
  nota?: number; // media simple
  puntuacion?: number; // media ponderada: ordena «mejor valoradas»
  creado?: unknown; // fecha de alta (Timestamp)
  claves?: string[]; // prefijos para la búsqueda
}

export interface Persona {
  id: string;
  Nombre: string;
  Apellidos?: string;
  biografia?: string;
  foto?: string;
  instagram?: string;
  artesEscenicas?: string;
  coincide?: string; // uid del artista que ha reclamado la ficha
  creacion?: string;
  // Campos nuevos (opcionales)
  roles?: string[];
  ciudad?: string;
  verificado?: boolean;
  destacadas?: string[]; // ids de obra para "Conocida por"
  claves?: string[];
}

export type EstadoCredito = "confirmado" | "pendiente";

export interface Credito {
  id: string;
  id_obra: string;
  id_persona: string;
  puesto?: string; // departamento: "Dirección", "Interpretación"...
  titulo?: string; // personaje o descripción del cargo
  fecha_inicio?: string;
  fecha_fin?: string;
  /** Relevos: mes de entrada ("AAAA-MM"; vacío = desde el estreno) y de salida (vacío = sigue). */
  desde?: string;
  hasta?: string;
  // Campos nuevos (opcionales; los créditos antiguos se tratan como confirmados)
  estado?: EstadoCredito;
  creado_por?: string;
}

export interface Productora {
  id: string;
  nombre_prod: string;
  descripcion?: string;
  foto_prod?: string;
  instagram?: string;
  creacion?: string;
}

/** Sala o teatro: la da de alta la propia sala (o cualquiera) y la gestiona quien la creó. */
export interface Sala {
  id: string;
  nombre: string;
  ciudad: string;
  direccion?: string;
  web?: string;
  instagram?: string;
  aforo?: number;
  descripcion?: string;
  foto?: string;
  creacion?: string;
}

export interface PremioObra {
  id: string;
  id_obra: string;
  id_premio?: string;
  galardon_obra?: string;
  anio_premobr?: string | number;
}

export interface UserDoc {
  Nombre?: string;
  Apellidos?: string;
  favoritos_obra?: string[]; // «Quiero verla»
  vistas?: string[]; // «La he visto»
  favoritos_persona?: string[]; // artistas que sigue
}

export interface SearchItem {
  t: "obra" | "persona" | "productora" | "sala";
  id: string;
  n: string; // nombre visible
  s?: string; // subtítulo
  img?: string;
}

/** Una función (pase) de una obra: dónde y cuándo verla. */
export interface Funcion {
  fecha: string; // AAAA-MM-DD
  hora?: string; // HH:MM
  sala: string;
  sala_id?: string; // ficha de la sala en Ziater, si existe
  ciudad?: string;
  entradas?: string; // enlace para comprar entradas
}
