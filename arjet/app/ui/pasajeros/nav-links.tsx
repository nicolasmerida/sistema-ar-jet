"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlaneTakeoff, Tickets } from "lucide-react";

const enlaces = [
  { nombre: "Vuelos", href: "/vuelos", icono: PlaneTakeoff },
  { nombre: "Reservas", href: "/vuelos/reservas", icono: Tickets },
];

function useSeccionPasajero() {
  const pathname = usePathname();
  return pathname.startsWith("/vuelos/reservas") ? "Reservas" : "Vuelos";
}

export function TituloPasajero() { return <>{useSeccionPasajero()}</>; }

export function NavLinksPasajero() {
  const seccion = useSeccionPasajero();
  return enlaces.map(({ nombre, href, icono: Icono }) => (
    <Link key={href} href={href} aria-current={nombre === seccion ? "page" : undefined}
      className={`flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition lg:min-w-0 ${nombre === seccion ? "bg-primary text-primary-foreground shadow-sm" : "text-zinc-700 hover:bg-white hover:text-secondary"}`}>
      <Icono className="size-4 shrink-0" aria-hidden="true" />{nombre}
    </Link>
  ));
}
