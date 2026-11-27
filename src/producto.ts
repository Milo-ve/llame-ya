// The product is invented (see ingredientes/producto.md). One place for its data.

export interface Producto {
  id: string;
  nombre: string;
  lema: string;
  vendedor: string;
  precioLista: number;
  moneda: "MXN";
  detalles: string[];
}

export const PRODUCTO: Producto = {
  id: "aire-potosino",
  nombre: "Aire Potosino Enlatado",
  lema: "Respira el Altiplano donde estés",
  vendedor: "Don Chuy",
  precioLista: 1000,
  moneda: "MXN",
  detalles: [
    "Aire de Real de Catorce, cosechado al amanecer",
    "Lata de 330 ml con abre fácil",
    "Trae un suspiro de nostalgia potosina",
    "Garantía total: si no te gusta, te devolvemos el aire",
  ],
};
