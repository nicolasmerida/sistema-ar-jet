"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { AeropuertoListado, VueloDeAeropuerto } from "@/lib/aeropuertos/data";
import { diaYMesDeInstante, diasDeOperacion, fechaCortaDeInstante } from "../vuelos/formato";

const DEMORA_MS = 300;
const DEMORA_CIERRE_MS = 150;
const MAXIMO_VUELOS = 5;
const SEPARACION_PX = 6;

/**
 * Tooltip con los vuelos vigentes del aeropuerto. Se abre al pasar el mouse (con demora),
 * con el foco del teclado o con un tap, y se cierra al salir, perder el foco o con Esc.
 */
export function TooltipAeropuerto({ aeropuerto, enfocable = true, children }: {
  aeropuerto: AeropuertoListado;
  /** El código es enfocable; el nombre solo responde al mouse para no duplicar paradas de tabulación. */
  enfocable?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null);
  const contenedor = useRef<HTMLSpanElement>(null);
  const disparador = useRef<HTMLSpanElement>(null);
  const globo = useRef<HTMLDivElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cerrar = useCallback(() => {
    clearTimeout(temporizador.current);
    setAbierto(false);
    setPosicion(null);
  }, []);

  function abrirConDemora() {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAbierto(true), DEMORA_MS);
  }

  // Margen para cruzar la separación hasta el tooltip sin que se cierre.
  function cerrarConDemora() {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(cerrar, DEMORA_CIERRE_MS);
  }

  // Posición fija calculada al abrir: la tabla tiene overflow y recortaría un absolute.
  // Si no entra abajo, se abre arriba.
  useLayoutEffect(() => {
    if (!abierto || !disparador.current || !globo.current) return;
    const ancla = disparador.current.getBoundingClientRect();
    const alto = globo.current.offsetHeight;
    const ancho = globo.current.offsetWidth;
    const entraAbajo = ancla.bottom + SEPARACION_PX + alto <= window.innerHeight;
    setPosicion({
      top: entraAbajo ? ancla.bottom + SEPARACION_PX : Math.max(SEPARACION_PX, ancla.top - SEPARACION_PX - alto),
      left: Math.max(SEPARACION_PX, Math.min(ancla.left, window.innerWidth - ancho - SEPARACION_PX)),
    });
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function alTeclear(event: KeyboardEvent) {
      if (event.key === "Escape") cerrar();
    }
    // Un tap fuera lo cierra (en pantallas táctiles no hay mouseleave).
    function alTocarFuera(event: PointerEvent) {
      if (!contenedor.current?.contains(event.target as Node)) cerrar();
    }
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("pointerdown", alTocarFuera);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("pointerdown", alTocarFuera);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [abierto, cerrar]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  return (
    <span
      ref={contenedor}
      className="relative inline-block"
      onMouseEnter={() => (abierto ? clearTimeout(temporizador.current) : abrirConDemora())}
      onMouseLeave={cerrarConDemora}
      onBlur={(event) => {
        // Pasar el foco al link "Ver detalle" del tooltip no lo cierra.
        if (!event.currentTarget.contains(event.relatedTarget)) cerrar();
      }}
    >
      <span
        ref={disparador}
        tabIndex={enfocable ? 0 : undefined}
        aria-describedby={abierto ? id : undefined}
        onFocus={() => setAbierto(true)}
        onClick={() => setAbierto(true)}
        className="cursor-help rounded-sm underline decoration-zinc-300 decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {children}
      </span>
      {abierto && (
        <div
          ref={globo}
          id={id}
          role="tooltip"
          style={posicion ? { top: posicion.top, left: posicion.left } : { visibility: "hidden" }}
          className="fixed z-50 w-[22rem] max-w-[calc(100vw-1rem)] rounded-lg border border-zinc-200 bg-white p-4 text-left font-sans text-sm font-normal text-zinc-700 shadow-xl"
        >
          <ContenidoTooltip aeropuerto={aeropuerto} />
        </div>
      )}
    </span>
  );
}

function ContenidoTooltip({ aeropuerto }: { aeropuerto: AeropuertoListado }) {
  const vuelos = aeropuerto.vuelosVigentesDetalle;
  const salidas = vuelos.filter((vuelo) => vuelo.sentido === "salida");
  const llegadas = vuelos.filter((vuelo) => vuelo.sentido === "llegada");
  // Como máximo 5 líneas en total, primero las salidas.
  const salidasVisibles = salidas.slice(0, MAXIMO_VUELOS);
  const llegadasVisibles = llegadas.slice(0, MAXIMO_VUELOS - salidasVisibles.length);
  const ubicacion = [aeropuerto.ciudad, aeropuerto.pais].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-semibold text-foreground">
          <span className="font-mono">{aeropuerto.codigo}</span> – {aeropuerto.nombre}
        </p>
        <p className="text-xs text-zinc-500">{ubicacion}</p>
      </div>
      {aeropuerto.estado === "de_baja" && aeropuerto.fechaBaja && (
        <p className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
          Dado de baja el {fechaCortaDeInstante(aeropuerto.fechaBaja)}
        </p>
      )}
      {aeropuerto.descripcion && <p className="text-xs text-zinc-600">{aeropuerto.descripcion}</p>}

      {vuelos.length === 0 ? (
        <p className="text-xs text-zinc-500">Sin vuelos vigentes</p>
      ) : (
        <>
          <GrupoVuelos titulo="Salidas" total={salidas.length} vuelos={salidasVisibles} />
          <GrupoVuelos titulo="Llegadas" total={llegadas.length} vuelos={llegadasVisibles} />
        </>
      )}

      <Link href={`/dashboard/aeropuertos/${aeropuerto.id}`} className="text-xs font-medium text-secondary underline-offset-4 hover:underline">
        {vuelos.length > MAXIMO_VUELOS ? `Ver los ${vuelos.length} vuelos` : "Ver detalle"}
      </Link>
    </div>
  );
}

function GrupoVuelos({ titulo, total, vuelos }: { titulo: string; total: number; vuelos: VueloDeAeropuerto[] }) {
  if (total === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-zinc-500">{titulo} ({total})</p>
      <ul className="mt-1 flex flex-col gap-1">
        {vuelos.map((vuelo) => (
          <li key={`${vuelo.sentido}-${vuelo.id}`} className="text-xs leading-relaxed">
            <LineaVuelo vuelo={vuelo} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "AN 520 → AEP · 20:00–02:00⁺¹ · Lun · Mié · Vie · próximo: mié 14/10" */
function LineaVuelo({ vuelo }: { vuelo: VueloDeAeropuerto }) {
  return (
    <>
      <span className="font-mono font-medium text-foreground">{vuelo.numero}</span>{" "}
      {vuelo.sentido === "salida" ? "→" : "←"} <span className="font-mono">{vuelo.otroAeropuerto}</span>
      {" · "}
      <span className="whitespace-nowrap">
        {vuelo.horaSalida}–{vuelo.horaLlegada}
        {vuelo.llegaDiaSiguiente && <sup title="Llega al día siguiente">+1</sup>}
      </span>
      {" · "}{diasDeOperacion(vuelo.dias)}
      {vuelo.proximoViaje && <>{" · "}próximo: {diaYMesDeInstante(vuelo.proximoViaje)}</>}
    </>
  );
}
