# 2. Motor y vendedor

Instrucciones, en el orden en que se construyó:

1. **Motor** (`src/trato.ts`): una escalera de precios de 100, 95, 90, 85 y 80% de lista. Cada regateo o cada oferta de 60% o más baja un escalón; los ataques no bajan nada. Si la oferta alcanza el precio pedido, se vende a esa oferta. Hay un candado aparte que impide vender abajo del 60%, pase lo que pase. El estado viene del navegador y se limpia en el servidor.
2. **Lector sin IA** (`src/interpretar.ts`): saca la cifra ("$1,200", "1.5k", "quinientos", "la mitad", "20% de descuento", "gratis"), la aceptación ("lo compro", "va") y los ataques ("ignora", "jefe", "system", "JSON"). Al combinarlo con la IA, ganan las reglas y la IA nunca puede dar una venta por aceptada.
3. **IA** (`src/ia.ts`): un solo llamado que devuelve JSON `{intencion, oferta, frase}`. El mensaje del comprador va entre comillas triples y marcado como dato. Tiene un tope de 6 s y, si falla, se usa el guion.
4. **Guion** (`src/guion.ts`): la línea del precio siempre la escribe el código. La frase de la IA se queda solo con oraciones sin cifras ni palabras de trato.
5. **Tienda** (`public/index.html`): estilo teletienda, cronómetro que arranca con el primer mensaje, voz opcional del navegador y letrero de VENDIDO con el % y los segundos.
