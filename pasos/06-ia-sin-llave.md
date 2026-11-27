# 6. IA sin llave (Workers AI)

Instrucción a la IA de código:

> ¿Hay alguna manera de hacer que esto funcione con LLMs? ¿Con IA? No solamente con el guion.

Lo que se hizo:

1. La tienda ya tenía el enlace `AI` de Workers AI para el micrófono. Se usa también para el vendedor, con `@cf/meta/llama-3.3-70b-instruct-fp8-fast` en modo JSON. No hace falta ninguna llave.
2. Orden de preferencia: `GEMINI_API_KEY`, luego `LLM_API_KEY` (Groq, OpenRouter) y luego Workers AI. El modelo se cambia con la variable `CF_MODELO`.
3. Como `env.AI.run` no acepta tiempo límite, se compite contra un temporizador de 6 s; si pierde, entra el guion.
4. En la primera prueba el humor salió repetitivo y genérico. Se le pidió contestar a lo que dijo el comprador ("¿jefe?", "¿abuelita?", "¿codo?") y variar las groserías.

Resultado con los 4 guiones de ataque: 90%, 80%, 100% y 0, igual que con el guion, con 1.1 a 4 s por respuesta. La IA nunca movió un precio.
