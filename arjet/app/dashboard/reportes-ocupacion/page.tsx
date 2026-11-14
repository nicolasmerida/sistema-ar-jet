import type { Metadata } from "next";
import { connection } from "next/server";
import { administradorActual } from "@/lib/reportes/ocupacion/sesion";
import { obtenerVuelosReporte } from "@/lib/reportes/ocupacion/data";
import { SIN_PERMISOS } from "@/lib/reportes/ocupacion/tipos";
import { ReportesOcupacion } from "@/app/ui/dashboard/reportes-ocupacion/reportes-manager";

export const metadata: Metadata = { title: "Reportes de ocupación | AR Jet" };

export default async function ReportesOcupacionPage() {
  await connection();
  if (!(await administradorActual())) {
    return <div className="p-6"><p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{SIN_PERMISOS}</p></div>;
  }
  const vuelos = await obtenerVuelosReporte();
  return <div className="w-full p-6"><ReportesOcupacion vuelos={vuelos} /></div>;
}
