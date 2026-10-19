"use client";

import { useState, useTransition } from "react";
import { buscarReservasAction } from "@/lib/mostrador/actions";
import type { Criterio, FiltroEstado, ResultadoBusqueda } from "@/lib/mostrador/tipos";
import { validarBusqueda } from "@/lib/mostrador/validacion";
import { FormularioBusqueda } from "./formulario-busqueda";
import { Resultados } from "./resultados";

export function ConsultaReservas() {
  const [criterio, setCriterio] = useState<Criterio>("dni");
  const [valor, setValor] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("pendientes");
  const [resultado, setResultado] = useState<ResultadoBusqueda | null>(null);
  const [filtroUsado, setFiltroUsado] = useState<FiltroEstado>("pendientes");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [buscando, iniciarBusqueda] = useTransition();

  const errorValor =
    errorLocal ?? (resultado && !resultado.ok && resultado.campo === "valor" ? resultado.mensaje : null);

  function cambiarCriterio(nuevo: Criterio) {
    setCriterio(nuevo);
    setErrorLocal(null);
    setResultado(null);
  }

  function buscar() {
    // Campo vacío o inválido: se marca el campo y no se consulta la base.
    const validacion = validarBusqueda(criterio, valor, filtro);
    if (!validacion.ok) {
      setErrorLocal(validacion.mensaje);
      setResultado(null);
      return;
    }
    setErrorLocal(null);
    setFiltroUsado(filtro);
    iniciarBusqueda(async () => {
      setResultado(await buscarReservasAction({ criterio, valor, filtro }));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <FormularioBusqueda
        criterio={criterio}
        valor={valor}
        filtro={filtro}
        error={errorValor}
        buscando={buscando}
        onCriterio={cambiarCriterio}
        onValor={(nuevo) => {
          setValor(nuevo);
          setErrorLocal(null);
        }}
        onFiltro={setFiltro}
        onBuscar={buscar}
      />
      <Resultados resultado={resultado} buscando={buscando} filtro={filtroUsado} />
    </div>
  );
}
