import type { OpcionAvion } from "@/lib/vuelos/tipos";
import { Campo, Seccion, claseControl } from "./campo";
import type { PropsSeccion } from "./vuelo-form";

export function SeccionAvion({ datos, errores, cambiar, tocar, bloqueado, aviones }: PropsSeccion & { aviones: OpcionAvion[] }) {
  const avion = aviones.find((opcion) => String(opcion.id) === datos.avion);
  const precios = [
    { campo: "precioEconomy", etiqueta: "Precio Economy", ejemplo: "85000" },
    { campo: "precioPrimera", etiqueta: "Precio Primera clase", ejemplo: "155000" },
  ] as const;

  return (
    <Seccion titulo="Avión y precios" descripcion="La capacidad se completa automáticamente según el avión seleccionado.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="vuelo-avion" etiqueta="Avión asignado" error={errores.avion}>
          <select id="vuelo-avion" value={datos.avion} disabled={bloqueado}
            aria-invalid={Boolean(errores.avion)} aria-describedby={errores.avion ? "vuelo-avion-error" : undefined}
            onChange={(event) => { cambiar("avion", event.target.value); tocar("avion"); }} onBlur={() => tocar("avion")}
            className={claseControl(errores.avion)}>
            <option value="">Seleccioná un avión</option>
            {aviones.map((opcion) => <option key={opcion.id} value={opcion.id}>{opcion.modelo} ({opcion.matricula})</option>)}
          </select>
        </Campo>
        <Campo id="vuelo-capacidad" etiqueta="Capacidad total" obligatorio={false}>
          <input id="vuelo-capacidad" readOnly tabIndex={-1} placeholder="Se completa al elegir el avión"
            value={avion ? `${avion.capacidadEconomy + avion.capacidadPrimera} asientos` : ""}
            className={`${claseControl()} bg-tertiary text-zinc-600`} />
        </Campo>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {[{ etiqueta: "Economy", asientos: avion?.capacidadEconomy }, { etiqueta: "Primera clase", asientos: avion?.capacidadPrimera }].map((clase) => (
          <div key={clase.etiqueta} className="rounded-xl border border-zinc-200 px-4 py-3">
            <p className="text-xs text-zinc-500">{clase.etiqueta}</p>
            <p className="mt-1 text-xl font-bold">{clase.asientos === undefined ? "—" : `${clase.asientos} asientos`}</p>
          </div>
        ))}
        {precios.map(({ campo, etiqueta, ejemplo }) => (
          <Campo key={campo} id={`vuelo-${campo}`} etiqueta={etiqueta} error={errores[campo]}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2 text-sm text-zinc-500">$</span>
              <input id={`vuelo-${campo}`} type="number" inputMode="decimal" min={0} step="0.01" value={datos[campo]} placeholder={ejemplo}
                disabled={bloqueado} aria-invalid={Boolean(errores[campo])} aria-describedby={errores[campo] ? `vuelo-${campo}-error` : undefined}
                onChange={(event) => cambiar(campo, event.target.value)} onBlur={() => tocar(campo)}
                className={`${claseControl(errores[campo])} pl-7`} />
            </div>
          </Campo>
        ))}
      </div>
    </Seccion>
  );
}
