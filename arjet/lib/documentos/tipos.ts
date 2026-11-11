export type LineaDocumento = {
  idPasaje: number;
  nombre: string;
  apellido: string;
  dni: string;
  vuelo: string;
  origen: string;
  destino: string;
  partida: string;
  llegada: string;
  clase: string;
  precio: string;
};

export type DatosDocumentacion = {
  version: 1;
  codigo: number;
  numeroFactura: string;
  fecha: string;
  importe: string;
  moneda: string;
  comprador: { dni: string; nombre: string; apellido: string };
  pasajes: LineaDocumento[];
};

export const DOCUMENTACION_PENDIENTE = "Su compra fue registrada. La documentación estará disponible en breve en Mis compras";

export function leerDatosDocumentacion(entrada: unknown): DatosDocumentacion {
  if (!entrada || typeof entrada !== "object") throw new Error("Documentación inválida");
  const datos = entrada as DatosDocumentacion;
  if (datos.version !== 1 || !Number.isSafeInteger(datos.codigo) || !datos.comprador || !Array.isArray(datos.pasajes) || !datos.pasajes.length ||
    ![datos.numeroFactura, datos.fecha, datos.importe, datos.moneda, datos.comprador.nombre, datos.comprador.apellido, datos.comprador.dni].every((v) => typeof v === "string")) throw new Error("Documentación incompleta");
  for (const p of datos.pasajes) {
    if (!p || !Number.isSafeInteger(p.idPasaje) || ![p.nombre, p.apellido, p.dni, p.vuelo, p.origen, p.destino, p.partida, p.llegada, p.clase, p.precio].every((v) => typeof v === "string")) throw new Error("Pasaje inválido");
  }
  return datos;
}
