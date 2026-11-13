"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";

/** Barra lateral con logo fijo y menú que, en mobile, se reemplaza por un desplegable con ícono de hamburguesa. */
export function MenuLateral({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const [pathnamePrevio, setPathnamePrevio] = useState(pathname);

  // Si el usuario navega a otra sección, el desplegable no debe quedar abierto.
  if (pathname !== pathnamePrevio) {
    setPathnamePrevio(pathname);
    setAbierto(false);
  }

  return (
    <aside className="border-b border-zinc-200 bg-tertiary px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center justify-between px-2">
        <Logo />
        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          aria-expanded={abierto}
          aria-controls="menu-principal"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="rounded-md p-2 text-secondary transition hover:bg-white lg:hidden"
        >
          {abierto ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>

      <nav
        id="menu-principal"
        aria-label={etiqueta}
        className={`mt-4 flex-col gap-2 lg:mt-8 lg:flex ${abierto ? "flex" : "hidden"}`}
      >
        {children}
      </nav>
    </aside>
  );
}
