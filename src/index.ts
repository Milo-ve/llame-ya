// Cloudflare Worker: static store from public/ plus the seller API.

import type { Env } from "./ia";
import { hayIA } from "./ia";
import { PRODUCTO } from "./producto";
import { bienvenida } from "./guion";
import { minimoAbsoluto } from "./trato";
import { atender, limpiarPedido } from "./vendedor";
import { MAX_BYTES, transcribir } from "./oir";

interface WorkerEnv extends Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export default {
  async fetch(req: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/api/producto" && req.method === "GET") {
      return json({
        ...PRODUCTO,
        minimo: minimoAbsoluto(PRODUCTO),
        ia: hayIA(env),
        bienvenida: {
          vulgar: bienvenida(PRODUCTO, "vulgar"),
          familiar: bienvenida(PRODUCTO, "familiar"),
        },
      });
    }
    if (url.pathname === "/api/vendedor") {
      if (req.method !== "POST") return json({ error: "usa POST" }, 405);
      const pedido = limpiarPedido(await req.json().catch(() => null));
      if (!pedido) return json({ error: "falta texto" }, 400);
      return json(await atender(env, PRODUCTO, pedido));
    }
    if (url.pathname === "/api/oir") {
      if (req.method !== "POST") return json({ error: "usa POST" }, 405);
      const largo = Number(req.headers.get("content-length") ?? 0);
      if (largo > MAX_BYTES) return json({ error: "muy-largo" }, 413);
      const r = await transcribir(env.AI, await req.arrayBuffer());
      return r.ok ? json({ texto: r.texto }) : json({ error: r.error }, r.status);
    }
    return env.ASSETS.fetch(req);
  },
};
