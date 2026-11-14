import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { ZONA_HORARIA } from "@/lib/vuelos/fechas";
import type { DatosDocumentacion } from "./tipos";

let fuente: Promise<Uint8Array> | undefined;
const tinta = rgb(0.1, 0.1, 0.1);
const secundario = rgb(0.39, 0.01, 0.07);
const gris = rgb(0.36, 0.38, 0.4);
const fecha = (valor: string) => new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: ZONA_HORARIA }).format(new Date(valor));

class Paginas {
  pagina: PDFPage;
  y = 730;
  constructor(private pdf: PDFDocument, private font: PDFFont, titulo: string) {
    this.pagina = pdf.addPage();
    this.pagina.drawRectangle({ x: 0, y: 780, width: 595.28, height: 62, color: rgb(1, 0.58, 0.04) });
    this.pagina.drawText("AR Jet", { x: 42, y: 801, size: 24, font, color: secundario });
    this.texto(titulo, 20, secundario);
  }
  espacio(alto: number) { if (this.y - alto < 65) { this.pagina = this.pdf.addPage(); this.y = 790; } }
  texto(valor: string, size = 10, color = tinta, ancho = 511) {
    const lineas: string[] = [];
    let linea = "";
    for (const palabra of valor.replace(/[\r\n\t]/g, " ").split(/\s+/)) {
      if (linea && this.font.widthOfTextAtSize(`${linea} ${palabra}`, size) > ancho) { lineas.push(linea); linea = ""; }
      for (const caracter of palabra) {
        if (this.font.widthOfTextAtSize(linea + caracter, size) > ancho) { lineas.push(linea); linea = ""; }
        linea += caracter;
      }
      linea += " ";
    }
    if (linea.trim()) lineas.push(linea.trim());
    for (const texto of lineas) {
      this.espacio(size + 7);
      this.pagina.drawText(texto, { x: 42, y: this.y, size, font: this.font, color });
      this.y -= size + 7;
    }
  }
  separador() {
    this.espacio(20); this.y -= 5;
    this.pagina.drawLine({ start: { x: 42, y: this.y }, end: { x: 553, y: this.y }, thickness: 0.5, color: rgb(0.84, 0.85, 0.86) });
    this.y -= 18;
  }
}

export async function generarDocumentoPdf(datos: DatosDocumentacion, documento: { numero: string; tipo: string; id_pasaje: number | null }): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  fuente ??= readFile(join(process.cwd(), "assets", "fonts", "NotoSans-Regular.ttf")).catch((error) => { fuente = undefined; throw error; });
  const font = await pdf.embedFont(await fuente, { subset: true });
  const esFactura = documento.tipo === "factura";
  const pagina = new Paginas(pdf, font, esFactura ? "Factura de compra" : "Ticket electrónico");
  const moneda = (importe: string) => new Intl.NumberFormat("es-AR", { style: "currency", currency: datos.moneda }).format(Number(importe));
  pdf.setTitle(`${esFactura ? "Factura" : "Ticket"} ${documento.numero}`);
  pdf.setAuthor("AR Jet");
  pdf.setCreationDate(new Date(datos.fecha));
  pagina.texto(documento.numero, 12, secundario);
  pagina.texto(`Reserva RES-${datos.codigo} | Emisión: ${fecha(datos.fecha)}`, 10, gris);
  pagina.separador();
  if (esFactura) {
    pagina.texto("Comprador", 12, secundario);
    pagina.texto(`${datos.comprador.nombre} ${datos.comprador.apellido}`);
    pagina.texto(`Documento: ${datos.comprador.dni}`);
    pagina.separador();
    pagina.texto("Detalle de los pasajes", 12, secundario);
    for (const p of datos.pasajes) {
      pagina.espacio(105);
      pagina.texto(`${p.nombre} ${p.apellido} | Documento ${p.dni}`, 11);
      pagina.texto(`Vuelo ${p.vuelo} | ${p.origen} a ${p.destino}`);
      pagina.texto(`Salida: ${fecha(p.partida)} | Clase: ${p.clase === "economy" ? "Economy" : "Primera"}`);
      pagina.texto(`Cantidad: 1 | Precio unitario: ${moneda(p.precio)}`);
      pagina.separador();
    }
    pagina.texto(`Total abonado: ${moneda(datos.importe)} (${datos.moneda})`, 16, secundario);
  } else {
    const pasaje = datos.pasajes.find((p) => p.idPasaje === documento.id_pasaje);
    if (!pasaje) throw new Error("El ticket no pertenece a esta compra");
    pagina.texto(`${pasaje.nombre} ${pasaje.apellido}`, 17, secundario);
    pagina.texto(`Documento: ${pasaje.dni}`);
    pagina.separador();
    pagina.texto(`Vuelo ${pasaje.vuelo}`, 17, secundario);
    pagina.texto(`Origen: ${pasaje.origen}`, 12);
    pagina.texto(`Destino: ${pasaje.destino}`, 12);
    pagina.texto(`Salida: ${fecha(pasaje.partida)}`, 12);
    pagina.texto(`Llegada: ${fecha(pasaje.llegada)}`, 12);
    pagina.texto(`Clase: ${pasaje.clase === "economy" ? "Economy" : "Primera"}`, 12);
    pagina.separador();
    pagina.texto("Estado al emitir: Emitido", 12, secundario);
    pagina.texto("La validez del pasaje se verifica al realizar el check-in.", 10, gris);
  }
  pdf.getPages().forEach((p, i, paginas) => {
    p.drawText("Comprobante interno - operación simulada", { x: 42, y: 35, size: 8, font, color: gris });
    p.drawText(`${i + 1} / ${paginas.length}`, { x: 515, y: 35, size: 8, font, color: gris });
  });
  return pdf.save();
}
