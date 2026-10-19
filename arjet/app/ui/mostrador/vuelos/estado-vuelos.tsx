"use client";

import { useState, useTransition } from "react";
import { buscarEstadoVuelosAction } from "@/lib/mostrador/vuelos/actions";
import type { FiltrosVuelos, ResultadoEstadoVuelos } from "@/lib/mostrador/vuelos/tipos";
import { validarFiltros } from "@/lib/mostrador/vuelos/validacion";
import type { OpcionAeropuerto } from "@/lib/vuelos/tipos";
import { FiltrosEstadoVuelos } from "./filtros-vuelos";
import { ListaVuelos } from "./lista-vuelos";

type Errores = Partial<Record<keyof FiltrosVuelos, string>>;

export function EstadoVuelos({ aeropuertos, hoy, inicial }: {
  aeropuertos: OpcionAeropuerto[];
  hoy: string;
  inicial: ResultadoEstadoVuelos;
}) {
  const vacios: FiltrosVuelos = { fecha: hoy, origen: "", destino: "", numero: "" };
  const [filtros, setFiltros] = useState<FiltrosVuelos>(vacios);
  const [aplicados, setAplicados] = useState<FiltrosVuelos>(vacios);
  const [resultado, setResultado] = useState<ResultadoEstadoVuelos>(inicial);
  const [errorLocal, setErrorLocal] = useState<{ campo: keyof FiltrosVuelos; mensaje: string } | null>(null);
  const [consultando, iniciarConsulta] = useTransition();

  const errores: Errores = {};
  if (errorLocal) errores[errorLocal.campo] = errorLocal.mensaje;
  else if (!resultado.ok && resultado.campo) errores[resultado.campo] = resultado.mensaje;

  function consultar(valores: FiltrosVuelos) {
    // Filtros inválidos: se marca el campo y no se consulta la base.
    const validacion = validarFiltros(valores);
    if (!validacion.ok) {
      setErrorLocal({ campo: validacion.campo, mensaje: validacion.mensaje });
      return;
    }
    setErrorLocal(null);
    setAplicados(valores);
    iniciarConsulta(async () => {
      setResultado(await buscarEstadoVuelosAction(valores));
    });
  }

  function cambiar(campo: keyof FiltrosVuelos, valor: string) {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
    setErrorLocal(null);
  }

  function limpiar() {
    setFiltros(vacios);
    consultar(vacios);
  }

  return (
    <div className="flex flex-col gap-6">
      <FiltrosEstadoVuelos
        filtros={filtros}
        errores={errores}
        aeropuertos={aeropuertos}
        consultando={consultando}
        onCambiar={cambiar}
        onBuscar={() => consultar(filtros)}
        onLimpiar={limpiar}
      />
      <ListaVuelos resultado={resultado} consultando={consultando} onActualizar={() => consultar(aplicados)} />
    </div>
  );
}
