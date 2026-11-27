# 4. Voz, muñeco animado y tono vulgar

Instrucción a la IA de código:

> Quiero que se pueda hacer no solamente interactuando por texto, sino por audio. Y que el vendedor que está viéndome es un vendedor animado. Que está hablando y me responde de forma graciosa. Y vulgar.

Lo que se hizo:

1. Botón para hablar mientras se mantiene apretado (y barra espaciadora), con el dictado del navegador en es-MX. Al soltar se envía.
2. Don Chuy en SVG: copete, bigote, traje de cuadros, corbata amarilla, micrófono y diente de oro. La boca se mueve mientras habla; las caras salen de la decisión del motor, no de la IA.
3. Voz del navegador, prendida por default, más un botón de inicio para desbloquear el audio.
4. Dos tonos (`vulgar` por default y `familiar`) en las líneas de precio, en el guion y en las instrucciones a la IA, con límites explícitos.
5. Cierre automático a los 55 s con la mejor oferta del comprador (61% o más) y pantalla de "SIN VENTA" a los 60 s.
6. El motor del trato no cambió: el tono solo cambia las palabras, no el precio.
