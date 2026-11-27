# 1. Plan

Instrucción a la IA de código (Claude Code):

> Quiero hacer una prueba del Dev Racing: crea lo que pide el reto. Crea un plan para construirlo y hazlo.

Plan que salió:

1. Motor del trato en TypeScript puro: el mínimo vive en el código. La IA solo lee la intención y escribe color; una función decide precio y cierre.
2. Un Worker de Cloudflare que sirve la tienda y `/api/vendedor`. Gemini gratis o una API compatible con OpenAI. Sin llave, modo guion.
3. Tienda: producto, precio de lista, cronómetro de 60 s, chat y un letrero "VENDIDO: $X" con el % de lista.
4. Pruebas: invariantes del motor y los ataques de la demo contra el servidor local.
5. Receta: `LEEME.md`, `pasos/`, `ingredientes/`.
6. No publicar nada sin aprobación.
