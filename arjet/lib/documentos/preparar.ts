import type { DatosDocumentacion } from "./tipos";

export function prepararEmision(entrada: Omit<DatosDocumentacion, "version" | "numeroFactura">) {
  const numeroFactura = `FAC-${entrada.fecha.slice(0, 4)}-${String(entrada.codigo).padStart(8, "0")}`;
  const datos: DatosDocumentacion = { ...entrada, comprador: { ...entrada.comprador }, pasajes: entrada.pasajes.map((p) => ({ ...p })), version: 1, numeroFactura };
  return {
    datos,
    documentos: { create: [
      { clave: `factura:${entrada.codigo}`, numero: numeroFactura, tipo: "factura" },
      ...entrada.pasajes.map((p) => ({ clave: `ticket:${p.idPasaje}`, numero: `TKT-${entrada.codigo}-${p.idPasaje}`, tipo: "ticket", id_pasaje: p.idPasaje })),
    ] },
  };
}
