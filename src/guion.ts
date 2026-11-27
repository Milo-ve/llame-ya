// The price sentence is always written by code. The AI's line only adds color and is scrubbed
// of anything that looks like a price, a discount or a sale.

import type { Accion, Motivo } from "./trato";
import type { Producto } from "./producto";

/** "vulgar" is the default show; "familiar" is the switch for a room with kids or a strict venue. */
export type Tono = "vulgar" | "familiar";

export function limpiarTono(raw: unknown): Tono {
  return raw === "familiar" ? "familiar" : "vulgar";
}

export function pesos(n: number): string {
  return `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

type Lineas = {
  vendido: (precio: string, p: Producto) => string;
  gratis: (precio: string) => string;
} & Record<Exclude<Motivo, never>, (precio: string, oferta: string) => string>;

const LINEAS: Record<Tono, Lineas> = {
  familiar: {
    vendido: (precio, p) =>
      `¡VENDIDO: ${precio}! Tu ${p.nombre} va en camino. ¡Gracias por llamar!`,
    gratis: (precio) =>
      `¿Gratis? Ni el aire es gratis, mi rey. Hoy te lo dejo en ${precio}.`,
    "oferta-baja": (precio, oferta) =>
      `Con ${oferta} no me alcanza ni para la lata. Para ti: ${precio}.`,
    regateo: (precio) =>
      `Porque me caes bien: ${precio}. Di "lo compro" y es tuyo.`,
    ataque: (precio) =>
      `Buen intento. El precio no lo decido yo, lo decide mi calculadora: ${precio}.`,
    "ultima-llamada": (precio) =>
      `¡ÚLTIMA LLAMADA! Precio final ${precio}. Di "lo compro" ahora.`,
    pitch: (precio) => `Hoy, solo hoy: ${precio}. ¡Llame ya! Di "lo compro".`,
  },
  vulgar: {
    vendido: (precio) =>
      `¡VENDIDO: ${precio}, cabrón! Ya te chingaste la mejor lata de aire del planeta. ¡Gracias por llamar!`,
    gratis: (precio) =>
      `¿Gratis? ¡No mames, güey! Ni el aire es gratis, y este es de Real de Catorce. Va en ${precio}.`,
    "oferta-baja": (precio, oferta) =>
      `¿${oferta}? ¿Me viste cara de pendejo? Con eso no pagas ni la lata, mi rey. Para ti: ${precio}.`,
    regateo: (precio) =>
      `Ándale pues, pinche codo: ${precio}. Di "lo compro" antes de que me arrepienta.`,
    ataque: (precio) =>
      `Jajaja, ¿me quieres hackear, cabrón? Aquí el precio lo pone mi calculadora, no yo: ${precio}.`,
    "ultima-llamada": (precio) =>
      `¡ÚLTIMA LLAMADA, güey! Precio final ${precio}. Di "lo compro" o te quedas oliendo smog.`,
    pitch: (precio) =>
      `Hoy, solo hoy: ${precio}. ¡Llame ya, carajo! Di "lo compro".`,
  },
};

export function lineaDePrecio(
  p: Producto,
  a: Accion,
  oferta: number | null,
  tono: Tono = "vulgar",
): string {
  const l = LINEAS[tono];
  const precio = pesos(a.precio);
  if (a.tipo === "vendido") return l.vendido(precio, p);
  if (a.motivo === "oferta-baja" && oferta === 0) return l.gratis(precio);
  return l[a.motivo](precio, pesos(oferta ?? 0));
}

const PROHIBIDO =
  /[\d$%]|gratis|regal|descuent|rebaj|precio|vendid|sold|peso|mitad|oferta|cuesta|valor|costo/i;

/** Keeps only the AI's sentences that cannot be read as a price or a deal. */
export function limpiarFrase(frase: string): string {
  const oraciones = frase
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?¡¿])\s+/)
    .map((s) => s.trim())
    .filter((s) => s && !PROHIBIDO.test(s));
  return oraciones.join(" ").slice(0, 220).trim();
}

const FRASES: Record<Tono, string[]> = {
  familiar: [
    "¡Respira hondo! Así huele el amanecer en Real de Catorce.",
    "Mis clientes lo abren en el tráfico y se les quita el estrés.",
    "Viene directo del Altiplano, sin conservadores ni smog.",
    "Mi abuelita lo usa para recordar su pueblo. Llora de felicidad.",
    "Es el regalo perfecto para el potosino que vive lejos.",
    "Unidades limitadas: el desierto no se enlata solo.",
  ],
  vulgar: [
    "Huélelo, güey: así huele el amanecer en Real de Catorce, no la pinche contaminación de tu ciudad.",
    "Lo abres en el tráfico y se te quita lo encabronado en dos segundos.",
    "Aire del Altiplano, sin conservadores, sin smog y sin pedos de tu primo.",
    "Mi abuelita lo huele y llora. Bueno, también llora con las novelas, pero esto es otro nivel.",
    "El regalo perfecto para el potosino que se fue a Monterrey y ya habla como regio.",
    "Unidades limitadas, cabrón: el desierto no se enlata solo.",
    "No es estafa, es experiencia. Bueno, un poquito estafa, pero muy bonita.",
  ],
};

export function fraseDeGuion(n: number, tono: Tono = "vulgar"): string {
  const lista = FRASES[tono];
  return lista[Math.abs(n) % lista.length] ?? lista[0]!;
}

export function bienvenida(p: Producto, tono: Tono = "vulgar"): string {
  return tono === "vulgar"
    ? `¡Qué onda, raza! Aquí ${p.vendedor}, el vendedor más chingón de la tele. Hoy les traigo ${p.nombre} a solo ${pesos(p.precioLista)}. ¡Llame ya, no sea codo!`
    : `¡Bienvenido a la teletienda! Soy ${p.vendedor}. Hoy te traigo ${p.nombre} a solo ${pesos(p.precioLista)}. ¡Llame ya!`;
}
