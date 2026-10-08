"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { actualizarVuelo, crearVuelo } from "@/lib/vuelos/actions";
import { hoyEnArgentina } from "@/lib/vuelos/fechas";
import type { OpcionAeropuerto, OpcionAvion, VueloEditable } from "@/lib/vuelos/tipos";
import {
  type DatosVuelo,
  type ErroresVuelo,
  tieneErrores,
  validarVuelo,
} from "@/lib/vuelos/validacion";
import { SeccionAvion } from "./seccion-avion";
import { SeccionOperacion } from "./seccion-operacion";
import { SeccionRuta } from "./seccion-ruta";

type Campo = keyof DatosVuelo;

export type PropsSeccion = {
  datos: DatosVuelo;
  /** Errores visibles: los de campos ya tocados y los que devolvió el servidor. */
  errores: ErroresVuelo;
  cambiar: <C extends Campo>(campo: C, valor: DatosVuelo[C]) => void;
  tocar: (campo: Campo) => void;
  bloqueado: boolean;
  edicion: boolean;
};

const VACIO: DatosVuelo = {
  numero: "", horaSalida: "", horaLlegada: "", origen: "", destino: "", dias: [],
  inicio: "", fin: "", avion: "", precioEconomy: "", precioPrimera: "",
};
const ERROR_CONEXION = "No se pudieron guardar los datos. Por favor, contactá al equipo técnico";

export function VueloForm({ vuelo, aeropuertos, aviones }: {
  vuelo?: VueloEditable; aeropuertos: OpcionAeropuerto[]; aviones: OpcionAvion[];
}) {
  const router = useRouter();
  const edicion = Boolean(vuelo);
  const [hoy] = useState(() => hoyEnArgentina());
  const [datos, setDatos] = useState<DatosVuelo>(vuelo?.datos ?? VACIO);
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [erroresGuardado, setErroresGuardado] = useState<ErroresVuelo>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, startTransition] = useTransition();
  const errores = validarVuelo(datos, edicion ? "editar" : "crear", hoy);
  const puedeGuardar = !tieneErrores(errores) && !guardando;

  const visibles: ErroresVuelo = {};
  for (const campo of Object.keys(VACIO) as Campo[]) {
    const error = erroresGuardado[campo] ?? (tocados[campo] ? errores[campo] : undefined);
    if (error) visibles[campo] = error;
  }

  function cambiar<C extends Campo>(campo: C, valor: DatosVuelo[C]) {
    setDatos((previos) => ({ ...previos, [campo]: valor }));
    // Origen y destino se validan juntos: corregir uno limpia el error del otro.
    setErroresGuardado((previos) => ({ ...previos, [campo]: undefined, ...(campo === "origen" ? { destino: undefined } : {}) }));
    setErrorGeneral(null);
  }

  function tocar(campo: Campo) {
    setTocados((previos) => (previos[campo] ? previos : { ...previos, [campo]: true }));
  }

  function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTocados(Object.fromEntries(Object.keys(VACIO).map((campo) => [campo, true])));
    if (!puedeGuardar) return;
    startTransition(async () => {
      setErrorGeneral(null);
      try {
        const resultado = vuelo ? await actualizarVuelo(vuelo.id, datos) : await crearVuelo(datos);
        if (resultado.ok) {
          router.push(`/dashboard/vuelos?aviso=${encodeURIComponent(resultado.mensaje)}`);
          return;
        }
        const erroresServidor = resultado.errores ?? {};
        setErroresGuardado(erroresServidor);
        if (!tieneErrores(erroresServidor)) setErrorGeneral(resultado.mensaje);
      } catch {
        setErrorGeneral(ERROR_CONEXION);
      }
    });
  }

  const props: PropsSeccion = { datos, errores: visibles, cambiar, tocar, bloqueado: guardando, edicion };

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-8 rounded-2xl border border-zinc-200 bg-background p-6 shadow-sm sm:p-8">
      {edicion && (
        <p className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          La ruta, los días de operación y la vigencia no se pueden modificar porque definen los viajes ya generados.
          Los cambios de horario y de avión se aplican a los viajes que todavía no salieron.
        </p>
      )}
      <SeccionRuta {...props} aeropuertos={aeropuertos} />
      <SeccionOperacion {...props} hoy={hoy} />
      <SeccionAvion {...props} aviones={aviones} />
      {errorGeneral && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorGeneral}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {!puedeGuardar && !guardando && (
          <p className="mr-auto text-xs text-zinc-500">Completá los campos obligatorios para habilitar el guardado.</p>
        )}
        <Link href="/dashboard/vuelos" aria-disabled={guardando} className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-tertiary aria-disabled:pointer-events-none aria-disabled:opacity-50">Cancelar</Link>
        <button type="submit" disabled={!puedeGuardar} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
          {guardando ? "Guardando..." : edicion ? "Guardar cambios" : "Guardar vuelo"}
        </button>
      </div>
    </form>
  );
}

