// The deal engine. The AI never sets a price: it only reports what the buyer seems to want.
// This function decides the asking price and when the sale closes, and it can never sell below the floor.

import type { Producto } from "./producto";

/** Challenge rule: selling below 60% of list scores 0. */
export const REGLA_MINIMO = 0.6;

export interface Politica {
  /** Asking price ladder as fractions of list. Each haggle moves one step down. */
  escalera: number[];
  /** From this second on, the seller drops to its final price and pushes to close. */
  ultimaLlamada: number;
  /** From this second on, a sale beats a 0: take the buyer's best offer if it clears `minimoPanico`. */
  panico: number;
  minimoPanico: number;
}

/** Our reserve (last ladder step) stays well above the 60% rule; only the last seconds go lower. */
export const POLITICA: Politica = {
  escalera: [1, 0.95, 0.9, 0.85, 0.8],
  ultimaLlamada: 40,
  panico: 50,
  minimoPanico: 0.61,
};

export type Intencion =
  "oferta" | "acepta" | "regatea" | "ataque" | "rechaza" | "pregunta" | "otro";

export interface Entrada {
  intencion: Intencion;
  /** Amount the buyer offered, in pesos, or null. */
  oferta: number | null;
}

export interface Estado {
  /** Ladder step the buyer has been shown. */
  escalon: number;
  /** Highest amount the buyer has offered so far. */
  mejorOferta: number | null;
  vendido: number | null;
}

export type Motivo =
  "oferta-baja" | "regateo" | "ataque" | "ultima-llamada" | "pitch";

export type Accion =
  | { tipo: "vendido"; precio: number }
  | { tipo: "contraoferta"; precio: number; motivo: Motivo };

export const ESTADO_INICIAL: Estado = {
  escalon: 0,
  mejorOferta: null,
  vendido: null,
};

export function minimoAbsoluto(p: Producto): number {
  return Math.ceil(p.precioLista * REGLA_MINIMO);
}

export function precioEscalon(
  p: Producto,
  escalon: number,
  politica: Politica = POLITICA,
): number {
  const f =
    politica.escalera[escalon] ??
    politica.escalera[politica.escalera.length - 1] ??
    1;
  return Math.max(Math.round(p.precioLista * f), minimoAbsoluto(p));
}

function numeroValido(n: unknown, max: number): number | null {
  if (n == null) return null;
  const v = Number(n);
  return Number.isFinite(v) && v >= 0 ? Math.min(Math.round(v), max) : null;
}

/** State comes from the browser, so it is never trusted: clamp it into range. */
export function limpiarEstado(
  raw: unknown,
  p: Producto,
  politica: Politica = POLITICA,
): Estado {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const max = politica.escalera.length - 1;
  const e = Number(o.escalon);
  const escalon = Number.isInteger(e) ? Math.min(Math.max(e, 0), max) : 0;
  // A standing offer above list would have sold on the spot, so list is its ceiling.
  const mejorOferta = numeroValido(o.mejorOferta, p.precioLista);
  const v = numeroValido(o.vendido, Number.MAX_SAFE_INTEGER);
  const vendido = v !== null && v >= minimoAbsoluto(p) ? v : null;
  return { escalon, mejorOferta, vendido };
}

export function decidir(
  p: Producto,
  estado: Estado,
  entrada: Entrada,
  segundos: number,
  politica: Politica = POLITICA,
): { estado: Estado; accion: Accion } {
  if (estado.vendido !== null) {
    return { estado, accion: { tipo: "vendido", precio: estado.vendido } };
  }
  const ultimo = politica.escalera.length - 1;
  const reserva = precioEscalon(p, ultimo, politica);
  const enUltimaLlamada = segundos >= politica.ultimaLlamada;
  const enPanico = segundos >= politica.panico;
  const visto = precioEscalon(p, estado.escalon, politica);
  const oferta =
    entrada.oferta !== null &&
    Number.isFinite(entrada.oferta) &&
    entrada.oferta >= 0
      ? Math.round(entrada.oferta)
      : null;
  const esAtaque = entrada.intencion === "ataque";
  const mejorOferta =
    oferta !== null && !esAtaque
      ? Math.max(oferta, estado.mejorOferta ?? 0)
      : estado.mejorOferta;
  let escalon = estado.escalon;

  const vender = (precio: number) =>
    cerrar(p, { escalon, mejorOferta, vendido: precio }, precio);
  const contra = (motivo: Motivo) => {
    if (enUltimaLlamada) escalon = ultimo;
    const m: Motivo = enUltimaLlamada ? "ultima-llamada" : motivo;
    return {
      estado: { escalon, mejorOferta, vendido: null },
      accion: {
        tipo: "contraoferta",
        precio: precioEscalon(p, escalon, politica),
        motivo: m,
      } as Accion,
    };
  };

  // Accepting means the price the buyer was shown, never a lower one the clock would allow.
  if (entrada.intencion === "acepta" && oferta === null) return vender(visto);

  if (oferta !== null) {
    const pideAhora = enUltimaLlamada ? reserva : visto;
    if (oferta >= pideAhora) return vender(oferta);
    if (oferta >= reserva) {
      escalon = Math.min(escalon + 1, ultimo);
      if (oferta >= precioEscalon(p, escalon, politica)) return vender(oferta);
    } else if (oferta >= minimoAbsoluto(p) && !esAtaque) {
      // Lowballs at or above the rule earn one step so the deal keeps moving; insulting ones earn nothing.
      escalon = Math.min(escalon + 1, ultimo);
    }
  } else if (entrada.intencion === "regatea") {
    escalon = Math.min(escalon + 1, ultimo);
  }

  // Last seconds: a sale at 61% beats a 0. Take the buyer's best standing offer.
  const minimoPanico = Math.max(
    Math.ceil(p.precioLista * politica.minimoPanico),
    minimoAbsoluto(p),
  );
  if (enPanico && mejorOferta !== null && mejorOferta >= minimoPanico)
    return vender(mejorOferta);

  if (oferta !== null)
    return contra(
      esAtaque ? "ataque" : oferta >= reserva ? "regateo" : "oferta-baja",
    );
  switch (entrada.intencion) {
    case "regatea":
      return contra("regateo");
    case "ataque":
      return contra("ataque");
    default:
      return contra("pitch");
  }
}

/** Last guard, separate from the policy: a sale below the floor is impossible, whatever the code above did. */
function cerrar(
  p: Producto,
  estado: Estado,
  precio: number,
): { estado: Estado; accion: Accion } {
  if (!(precio >= minimoAbsoluto(p))) {
    const seguro = Math.max(Math.round(p.precioLista * 0.8), minimoAbsoluto(p));
    return {
      estado: { ...estado, vendido: null },
      accion: { tipo: "contraoferta", precio: seguro, motivo: "oferta-baja" },
    };
  }
  return { estado, accion: { tipo: "vendido", precio } };
}

export function porcentajeDeLista(p: Producto, precio: number): number {
  return Math.round((precio / p.precioLista) * 100);
}
