// One buyer message in, one seller reply out. Shared by the Worker and the attack script.

import { combinar, interpretar } from "./interpretar";
import { fraseDeGuion, limpiarFrase, limpiarTono, lineaDePrecio, type Tono } from "./guion";
import { leerConIA, type Env, type Turno } from "./ia";
import type { Producto } from "./producto";
import {
  decidir,
  limpiarEstado,
  porcentajeDeLista,
  precioEscalon,
  type Accion,
  type Estado,
} from "./trato";

export interface Pedido {
  texto: string;
  estado: unknown;
  segundos: number;
  historial: Turno[];
  tono: Tono;
}

export interface Respuesta {
  respuesta: string;
  estado: Estado;
  accion: Accion;
  porcentaje: number | null;
  fuente: "ia" | "guion";
}

export function limpiarPedido(raw: unknown): Pedido | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.texto !== "string" || !o.texto.trim()) return null;
  const s = Number(o.segundos);
  const historial = Array.isArray(o.historial)
    ? o.historial
        .filter(
          (t): t is Turno =>
            typeof t?.texto === "string" &&
            (t?.rol === "comprador" || t?.rol === "vendedor"),
        )
        .slice(-10)
        .map((t) => ({ rol: t.rol, texto: t.texto.slice(0, 500) }))
    : [];
  return {
    texto: o.texto.slice(0, 500),
    estado: o.estado,
    segundos: Number.isFinite(s) ? Math.min(Math.max(s, 0), 600) : 0,
    historial,
    tono: limpiarTono(o.tono),
  };
}

export async function atender(
  env: Env,
  p: Producto,
  pedido: Pedido,
): Promise<Respuesta> {
  const estado = limpiarEstado(pedido.estado, p);
  const precioActual = precioEscalon(p, estado.escalon);
  const reglas = interpretar(pedido.texto, precioActual);
  const ia = await leerConIA(env, p, pedido.historial, pedido.texto, pedido.tono);
  const entrada = combinar(reglas, ia);
  const r = decidir(p, estado, entrada, pedido.segundos);
  const color =
    (ia && limpiarFrase(ia.frase)) || fraseDeGuion(pedido.historial.length, pedido.tono);
  const precio = lineaDePrecio(p, r.accion, entrada.oferta, pedido.tono);
  return {
    respuesta: r.accion.tipo === "vendido" ? precio : `${color} ${precio}`,
    estado: r.estado,
    accion: r.accion,
    porcentaje:
      r.accion.tipo === "vendido"
        ? porcentajeDeLista(p, r.accion.precio)
        : null,
    fuente: ia ? "ia" : "guion",
  };
}
