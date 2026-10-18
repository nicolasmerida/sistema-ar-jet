"use server";

import { currentUser } from "@clerk/nextjs/server";
import { ROL_POR_DEFECTO } from "@/lib/usuarios/tipos";
import { obtenerVuelosDisponibles } from "./data";
import type { ResultadoBusqueda } from "./tipos";
import { validarBusqueda } from "./validacion";

export async function buscarVuelos(entrada: unknown): Promise<ResultadoBusqueda> {
  try {
    const usuario = await currentUser();
    if (!usuario || usuario.banned || (usuario.publicMetadata.role ?? ROL_POR_DEFECTO) !== ROL_POR_DEFECTO) {
      return { ok: false, mensaje: "No tiene permisos para acceder a esta sección" };
    }
    const valores = entrada as Record<string, unknown> | null;
    const datos = {
      origen: typeof valores?.origen === "string" ? valores.origen : "",
      destino: typeof valores?.destino === "string" ? valores.destino : "",
      fecha: typeof valores?.fecha === "string" ? valores.fecha : "",
    };
    const errores = validarBusqueda(datos);
    if (Object.keys(errores).length) return { ok: false, mensaje: "Revisá los campos marcados en rojo", errores };
    return { ok: true, vuelos: await obtenerVuelosDisponibles(datos), fecha: datos.fecha };
  } catch (error) {
    console.error("Error al buscar vuelos de pasajeros", error);
    return { ok: false, mensaje: "No se pudo realizar la búsqueda. Por favor, reintentá más tarde." };
  }
}
