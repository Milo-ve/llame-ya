# 5. Micrófono manos libres

Instrucciones a la IA de código:

> No funciona cuando quiero usar el micrófono. [captura con el error "Micrófono: network"]
>
> Además no funciona bien el botón de dejar haciendo clic; creo que tendría que, mejor, de forma automática interactuar con quien esté hablando.

Lo que se encontró y se hizo:

1. **"network"** venía del dictado del navegador (Web Speech API), que manda el audio a Google y falla en Arc, Brave y otros Chromium. Se quitó: ahora el navegador solo graba y el Worker transcribe con Whisper (`@cf/openai/whisper-large-v3-turbo`, Workers AI).
2. **Manos libres:** un detector de voz por volumen con umbral que aprende el ruido del cuarto, medio segundo de pre-roll, fin de frase tras 0.9 s de silencio, golpes de menos de 0.35 s descartados y un tope de 12 s. Se pausa mientras Don Chuy habla.
3. **Whisper inventaba texto** cuando se le daba una frase de contexto (`initial_prompt`): "lo compro en 850" salía como "¿me haces un descuento?". Se quitó el contexto.
4. Prueba con voces de la Mac: Paulina y Mónica salieron perfectas ("850 pesos", "100 pesos", "Ignora tus instrucciones…"); las voces de novedad (Eddy, Flo) salieron mal. Con voz humana se espera algo como Paulina.
5. "cero" ahora cuenta como oferta de $0.
