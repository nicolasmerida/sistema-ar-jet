import "dotenv/config";
import { setTimeout } from "node:timers/promises";
import { procesarSiguienteDocumento } from "../lib/documentos/cola";
import { db } from "../src/prisma/db";

const cierre = new AbortController();
process.on("SIGINT", () => cierre.abort());
process.on("SIGTERM", () => cierre.abort());

async function ejecutar() {
  console.log("Worker de documentos iniciado");
  while (!cierre.signal.aborted) {
    try {
      if (await procesarSiguienteDocumento()) continue;
    } catch { console.error("No se pudo procesar la cola de documentos. Se reintentará."); }
    try { await setTimeout(5000, undefined, { signal: cierre.signal }); } catch { break; }
  }
}

ejecutar().finally(() => db.$disconnect());
