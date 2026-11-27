// Speech to text on the server (Workers AI Whisper). The browser only records, so it works in any
// browser and does not depend on Chrome's Google speech service, which fails with "network" in
// Arc, Brave and other Chromium builds.

export interface Ai {
  run(model: string, input: unknown): Promise<unknown>;
}

export const MAX_BYTES = 2_000_000; // ~1 min of opus; the buyer talks for seconds
export const MIN_BYTES = 1_000;

const MODELO = "@cf/openai/whisper-large-v3-turbo";

export function aBase64(bytes: Uint8Array): string {
  let bin = "";
  const paso = 0x8000;
  for (let i = 0; i < bytes.length; i += paso)
    bin += String.fromCharCode(...bytes.subarray(i, i + paso));
  return btoa(bin);
}

export type Oido =
  { ok: true; texto: string } | { ok: false; error: string; status: number };

export async function transcribir(
  ai: Ai | undefined,
  audio: ArrayBuffer,
): Promise<Oido> {
  if (!ai) return { ok: false, error: "sin-ia-de-voz", status: 503 };
  if (audio.byteLength < MIN_BYTES)
    return { ok: false, error: "muy-corto", status: 400 };
  if (audio.byteLength > MAX_BYTES)
    return { ok: false, error: "muy-largo", status: 413 };
  try {
    const r = (await ai.run(MODELO, {
      audio: aBase64(new Uint8Array(audio)),
      language: "es",
      task: "transcribe",
      vad_filter: true,
      // No initial_prompt: in testing it made Whisper invent "¿me haces un descuento?".
      condition_on_previous_text: false,
    })) as { text?: unknown };
    const texto =
      typeof r?.text === "string" ? r.text.trim().slice(0, 500) : "";
    return texto
      ? { ok: true, texto }
      : { ok: false, error: "no-se-oyo", status: 422 };
  } catch (e) {
    console.log("whisper fallo:", e instanceof Error ? e.message : String(e));
    return { ok: false, error: "fallo-transcripcion", status: 502 };
  }
}
