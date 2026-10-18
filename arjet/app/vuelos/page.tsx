import { BusquedaVuelos } from "@/app/ui/vuelos/busqueda-vuelos";
import { obtenerAeropuertosBusqueda, obtenerVuelosDisponibles } from "@/lib/pasajeros/data";
import { hoyEnArgentina } from "@/lib/vuelos/fechas";
import { validarBusqueda } from "@/lib/pasajeros/validacion";
import type { ResultadoBusqueda } from "@/lib/pasajeros/tipos";
import { exigirPasajero } from "@/lib/pasajeros/sesion";

export default async function VuelosPage({ searchParams }: PageProps<"/vuelos">) {
  await exigirPasajero("/vuelos");
  const params = await searchParams;
  const datos = {
    origen: typeof params.origen === "string" ? params.origen : "",
    destino: typeof params.destino === "string" ? params.destino : "",
    fecha: typeof params.fecha === "string" ? params.fecha : "",
  };
  const busquedaValida = Object.keys(validarBusqueda(datos)).length === 0;
  let resultado: ResultadoBusqueda | undefined;
  let aeropuertos: Awaited<ReturnType<typeof obtenerAeropuertosBusqueda>> = [];
  let errorCarga = false;
  try {
    aeropuertos = await obtenerAeropuertosBusqueda();
  } catch (error) {
    console.error("Error al cargar aeropuertos de búsqueda", error);
    errorCarga = true;
  }
  if (busquedaValida) {
    try { resultado = { ok: true, vuelos: await obtenerVuelosDisponibles(datos), fecha: datos.fecha }; }
    catch { resultado = { ok: false, mensaje: "No se pudo realizar la búsqueda. Por favor, reintentá más tarde." }; }
  }
  return (
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <h1 className="mb-6 text-2xl font-semibold">Buscar vuelos</h1>
        <BusquedaVuelos key={`${datos.origen}-${datos.destino}-${datos.fecha}-${params.aviso ?? ""}`} aeropuertos={aeropuertos} hoy={hoyEnArgentina()} errorCarga={errorCarga}
          datosIniciales={busquedaValida ? datos : undefined} resultadoInicial={resultado} agotado={params.aviso === "agotado"} />
      </section>
  );
}
