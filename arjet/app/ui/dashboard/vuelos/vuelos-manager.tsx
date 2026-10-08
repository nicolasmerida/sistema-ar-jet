"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VueloListado } from "@/lib/vuelos/tipos";
import { Aviso } from "../aviones/aviso";
import { Filtros, type ValoresFiltros } from "./filtros";
import { VuelosTable } from "./vuelos-table";

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function VuelosManager({ vuelos, aviso }: { vuelos: VueloListado[]; aviso?: string }) {
  const router = useRouter();
  const [filtros, setFiltros] = useState<ValoresFiltros>({ numero: "", ruta: "", estado: "" });
  const numero = normalizar(filtros.numero).replace(/\s+/g, "");
  const ruta = normalizar(filtros.ruta);
  const filtrados = vuelos.filter((vuelo) =>
    normalizar(vuelo.numero).replace(/\s+/g, "").includes(numero) &&
    normalizar(`${vuelo.origen} ${vuelo.origenCiudad} ${vuelo.destino} ${vuelo.destinoCiudad}`).includes(ruta) &&
    (!filtros.estado || vuelo.estado === filtros.estado),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de vuelos</h1>
          <p className="mt-1 text-sm text-zinc-500">Administrá los vuelos, sus horarios y la cancelación de sus viajes.</p>
        </div>
        <Link href="/dashboard/vuelos/nuevo" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
          <Plus className="size-4" aria-hidden="true" />Nuevo vuelo
        </Link>
      </div>
      <Filtros valores={filtros} onCambiar={setFiltros} />
      {/* El aviso llega por la URL después de crear o editar en otra pantalla. */}
      {aviso && <Aviso tipo="exito" mensaje={aviso} onCerrar={() => router.replace("/dashboard/vuelos", { scroll: false })} />}
      <VuelosTable vuelos={filtrados} hayFiltros={Boolean(numero || ruta || filtros.estado)} />
    </div>
  );
}
