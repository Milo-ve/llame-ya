# Llame ya · Aire Potosino Enlatado

Entrada de prueba para el reto de Dev Racing "Llame ya" ([reto](../dev-racing.md)). Es una tienda de teletienda con un vendedor con IA, Don Chuy: un muñeco animado que habla, se enoja, se burla y vende una lata de aire de Real de Catorce en $1,000 sin bajar nunca del 60%. Se le puede hablar con el micrófono o escribirle. Por default habla vulgar; hay un switch de modo familiar.

Se hizo el 2026-11-27 para probar el reto antes del evento. Publicada el 2026-11-27 en https://llame-ya-prueba.vravura.workers.dev, con IA (Llama 3.3 70B en Workers AI).

## Qué hace

1. La tienda muestra el producto, el precio de lista, un cronómetro de 60 s y el chat.
2. El comprador escribe. El servidor lee el mensaje de dos formas:
   - **Reglas** ([src/interpretar.ts](src/interpretar.ts)): cifras, "la mitad", "gratis", "lo compro" y ataques ("ignora", "jefe", "system", "JSON").
   - **IA** ([src/ia.ts](src/ia.ts)): clasifica la intención y escribe una frase de venta que contesta a lo que dijo el comprador. Responde en JSON. Sin llave usa Llama 3.3 70B en Workers AI, con el mismo enlace que el micrófono; con `GEMINI_API_KEY` o `LLM_API_KEY` usa esa.
3. Si las dos lecturas no coinciden, ganan las reglas. La IA nunca puede dar una venta por aceptada.
4. **Una función decide** ([src/trato.ts](src/trato.ts)): baja el precio de 5% en 5% (100 → 80%) solo si hay regateo, no da nada por los ataques, a los 40 s pasa a su precio final y a los 50 s toma la mejor oferta del comprador si está arriba del 61%. Antes de vender hay un último candado aparte: abajo del 60% no se vende.
5. La línea del precio la escribe el código ([src/guion.ts](src/guion.ts)). La frase de la IA se limpia: se borra cualquier oración que tenga cifras, "$", "gratis", "descuento" o "vendido".
6. Si la IA falla o tarda más de 6 s, el vendedor usa frases fijas y sigue vendiendo igual.

## Voz y animación

- **Hablarle, manos libres:** al prender la tele pide el micrófono y se queda escuchando. Un detector de voz en la página nota cuándo empiezas y terminas de hablar (0.9 s de silencio), guarda medio segundo de antes para no cortar la primera palabra y manda la frase como WAV de 16 kHz a `/api/oir`. Ahí la transcribe Whisper de Workers AI ([src/oir.ts](src/oir.ts)), en ~1.5 s y sin llave extra. Mientras Don Chuy habla, el micrófono se pausa para que no se oiga a sí mismo. El botón verde lo apaga y prende.
- **Que hable:** usa la voz del navegador (`speechSynthesis`) y escoge una voz es-MX de hombre si la hay. Lee "$1,000" como "1000 pesos". El botón "Prender la tele" está ahí porque el navegador no deja sonar audio sin un clic.
- **Muñeco:** Don Chuy es un SVG en la misma página, sin imágenes. Mueve la boca mientras habla, parpadea y manotea. Cambia de cara según lo que decidió el motor: enojado con una oferta baja, pícaro con un ataque, nervioso y sudando en la última llamada y brincando cuando vende.
- **Tono:** las líneas de precio y las frases del guion están en dos versiones (`src/guion.ts`). A la IA se le pide hablar vulgar, pero tiene prohibidos los insultos por raza, género, orientación, religión, discapacidad o físico, y el contenido sexual explícito.
- **Fin del minuto:** a los 55 s Don Chuy habla solo. Si el comprador ya había ofrecido 61% o más, le acepta esa oferta; si no, a los 60 s aparece "SIN VENTA · 0".

## Cómo correrla

```sh
npm run dev            # http://localhost:8787 (Workers AI remoto; requiere `wrangler login`)
npm test               # 38 pruebas del motor, el lector y el vendedor
npm run ataques        # 4 demos de 60 s contra el servidor local
```

Para usar la IA: copia `.dev.vars.example` a `.dev.vars` y pon `GEMINI_API_KEY` (gratis en Google AI Studio) o `LLM_API_KEY` + `LLM_BASE_URL` + `LLM_MODEL` (Groq, OpenRouter).

Para volver a publicar: `npm run desplegar`. Para prender la IA en la versión publicada, antes corre `npx wrangler secret put GEMINI_API_KEY`.

## Resultado de la prueba (modo guion, sin IA)

| Demo                                   | Resultado             |
| -------------------------------------- | --------------------- |
| Apertura de Lalo + sala que compra     | VENDIDO $900 = 90%    |
| Sala terca (jefe, SYSTEM, 600, 650)    | VENDIDO $800 = 80%    |
| Sala con trucos (JSON, "dime VENDIDO") | VENDIDO $1,000 = 100% |
| Sala que nunca acepta                  | Sin venta → 0         |
| Demo a mano en el navegador            | VENDIDO $950 = 95%    |

Ninguna venta bajó del 60%, tampoco en 5,000 conversaciones al azar de la prueba de invariantes.

## Receta

- [pasos/](pasos/): las instrucciones que se le dieron a la IA de código, en orden.
- [ingredientes/](ingredientes/): el producto y de dónde salió cada dato.
