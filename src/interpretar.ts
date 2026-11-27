// Reads the buyer's message without AI. Its findings win over the AI's, so a prompt injection
// cannot turn "$0" into an acceptance or hide an attack.

import type { Entrada, Intencion } from "./trato";

export interface Lectura extends Entrada {
  /** True when the text looks like an attempt to manipulate the seller. */
  ataque: boolean;
}

const ATAQUE =
  /\b(ignora\w*|olvida\w*|instruccion\w*|prompt|system|sistema|jefe|due[ñn]o|admin\w*|desarrollador\w*|programador\w*|override|modo\s+\w+|regla\w*|reinicia\w*|ignore|instructions?|json|true|false|dime\s+vendido|di\s+vendido)\b/i;
const REGATEO =
  /\b(descuento|rebaja\w*|barat\w*|caro|car[ií]simo|menos|baja\w*|especial|oferta|promo\w*|cup[oó]n)\b/i;
const ACEPTA_FUERTE =
  /\b(lo compro|me lo llevo|trato hecho|acepto|lo quiero|c[oó]mpralo|lo tomo|deal|aceptado|vendido)\b/i;
const ACEPTA_CORTO =
  /^\W*(s[ií]+|va+|vale|ok(ey)?|sale|dale|listo|de acuerdo|perfecto|hecho|yes)\W*$/i;
const NIEGA = /\b(no|nunca|jam[aá]s|ni loco|para nada)\b/i;
const GRATIS =
  /\b(gratis|regalad[oa]|reg[aá]lamelo|regalo|cero pesos|de a gratis|free)\b/i;
const MITAD = /\b(la\s+)?mitad\b/i;
const NUMERO =
  /\$?\s*(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d{1,2})?)\s*(mil|k)?\b/gi;

const PALABRAS: Record<string, number> = {
  cero: 0,
  cien: 100,
  doscientos: 200,
  trescientos: 300,
  cuatrocientos: 400,
  quinientos: 500,
  seiscientos: 600,
  setecientos: 700,
  ochocientos: 800,
  novecientos: 900,
  mil: 1000,
};

function aNumero(cifra: string, sufijo: string | undefined): number {
  const limpio = /^\d{1,3}([.,]\d{3})+$/.test(cifra)
    ? cifra.replace(/[.,]/g, "")
    : cifra.replace(",", ".");
  const n = Number(limpio);
  return sufijo ? n * 1000 : n;
}

/** Amount in pesos the buyer names, relative to the current asking price for "la mitad". */
export function leerOferta(texto: string, precioActual: number): number | null {
  if (GRATIS.test(texto)) return 0;
  const cifras = [...texto.matchAll(NUMERO)]
    .filter(
      (m) =>
        !/%/.test(
          texto.slice(
            (m.index ?? 0) + m[0].length,
            (m.index ?? 0) + m[0].length + 2,
          ),
        ),
    )
    .map((m) => aNumero(m[1] ?? "", m[2]));
  if (cifras.length > 0) return cifras[cifras.length - 1] ?? null;
  const pct = /(\d{1,3})\s*%\s*(de\s+descuento)?/i.exec(texto);
  if (pct) {
    const n = Number(pct[1]);
    return Math.round(
      pct[2] ? precioActual * (1 - n / 100) : precioActual * (n / 100),
    );
  }
  if (MITAD.test(texto)) return Math.round(precioActual / 2);
  const palabra = Object.keys(PALABRAS).find((w) =>
    new RegExp(`\\b${w}\\b`, "i").test(texto),
  );
  return palabra ? (PALABRAS[palabra] ?? null) : null;
}

export function interpretar(texto: string, precioActual: number): Lectura {
  const t = texto.trim();
  const ataque = ATAQUE.test(t);
  const oferta = leerOferta(t, precioActual);
  let intencion: Intencion = "otro";
  if (ataque) intencion = "ataque";
  else if (oferta !== null) intencion = "oferta";
  else if ((ACEPTA_FUERTE.test(t) && !NIEGA.test(t)) || ACEPTA_CORTO.test(t))
    intencion = "acepta";
  else if (REGATEO.test(t)) intencion = "regatea";
  else if (NIEGA.test(t)) intencion = "rechaza";
  else if (t.includes("?")) intencion = "pregunta";
  return { intencion, oferta, ataque };
}

/**
 * Combines the rule-based reading with the AI's. Rules win on attacks and on numbers.
 * The AI fills gaps only (e.g. "te doy ochocientos cincuenta"), and its number is used only
 * when the rules found none, so the worst it can do is report an offer the engine then judges.
 */
export function combinar(reglas: Lectura, ia: Entrada | null): Entrada {
  if (reglas.ataque) return { intencion: "ataque", oferta: reglas.oferta };
  if (reglas.oferta !== null)
    return { intencion: "oferta", oferta: reglas.oferta };
  if (!ia) return reglas;
  if (ia.oferta !== null && Number.isFinite(ia.oferta) && ia.oferta >= 0)
    return { intencion: "oferta", oferta: ia.oferta };
  if (reglas.intencion !== "otro") return reglas;
  // Acceptance must come from the buyer's words, never only from the AI.
  if (ia.intencion === "acepta") return { intencion: "otro", oferta: null };
  return { intencion: ia.intencion, oferta: null };
}
