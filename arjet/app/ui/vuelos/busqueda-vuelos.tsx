"use client";

import { useState, useTransition } from "react";
import { buscarVuelos } from "@/lib/pasajeros/actions";
import { validarBusqueda, type DatosBusqueda, type ErroresBusqueda } from "@/lib/pasajeros/validacion";
import type { ResultadoBusqueda } from "@/lib/pasajeros/tipos";
import type { OpcionAeropuerto } from "@/lib/vuelos/tipos";
import { FormularioBusqueda } from "./formulario-busqueda";
import { ResultadosVuelos } from "./resultados-vuelos";

export function BusquedaVuelos({ aeropuertos, hoy, errorCarga, datosIniciales, resultadoInicial, agotado = false }: {
  aeropuertos: OpcionAeropuerto[]; hoy: string; errorCarga: boolean;
  datosIniciales?: DatosBusqueda; resultadoInicial?: ResultadoBusqueda; agotado?: boolean;
}) {
  const [datos, setDatos] = useState<DatosBusqueda>(datosIniciales ?? { origen: "", destino: "", fecha: "" });
  const [tocados, setTocados] = useState<Partial<Record<keyof DatosBusqueda, boolean>>>({});
  const [resultado, setResultado] = useState<ResultadoBusqueda | null>(resultadoInicial ?? null);
  const [mostrarAgotado, setMostrarAgotado] = useState(agotado);
  const [pendiente, iniciar] = useTransition();
  const validacion = validarBusqueda(datos, hoy);
  const errores: ErroresBusqueda = {};
  for (const campo of ["origen", "destino", "fecha"] as const) {
    if (tocados[campo]) errores[campo] = validacion[campo];
    if (resultado && !resultado.ok && resultado.errores?.[campo]) errores[campo] = resultado.errores[campo];
  }

  function buscar() {
    setMostrarAgotado(false);
    setTocados({ origen: true, destino: true, fecha: true });
    if (Object.keys(validacion).length || pendiente) return;
    setResultado(null);
    iniciar(async () => {
      try {
        setResultado(await buscarVuelos(datos));
      } catch {
        setResultado({ ok: false, mensaje: "No se pudo realizar la búsqueda. Por favor, reintentá más tarde." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {mostrarAgotado && <p role="alert" className="rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">El asiento ya no está disponible. Los resultados se actualizaron para que puedas elegir otro vuelo.</p>}
      {errorCarga && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">No se pudieron cargar los aeropuertos. Por favor, recargá la página o reintentá más tarde.</p>}
      {!errorCarga && !aeropuertos.length && <p role="status" className="bg-tertiary p-4 text-sm text-zinc-600">No hay aeropuertos disponibles en este momento.</p>}
      <FormularioBusqueda datos={datos} errores={errores} aeropuertos={aeropuertos} hoy={hoy} pendiente={pendiente}
        bloqueado={errorCarga || !aeropuertos.length}
        cambiar={(campo, valor) => { setDatos({ ...datos, [campo]: valor }); setTocados({ ...tocados, [campo]: true }); setResultado(null); }}
        tocar={(campo) => setTocados({ ...tocados, [campo]: true })} buscar={buscar} />
      <div aria-live="polite" aria-busy={pendiente}>
        {pendiente && <p className="py-8 text-center text-sm text-zinc-500">Buscando vuelos disponibles...</p>}
        {resultado && !resultado.ok && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{resultado.mensaje}</p>}
        {resultado?.ok && <ResultadosVuelos vuelos={resultado.vuelos} fecha={resultado.fecha} />}
      </div>
    </div>
  );
}
