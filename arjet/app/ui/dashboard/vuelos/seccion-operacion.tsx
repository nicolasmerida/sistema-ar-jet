import { DIAS_SEMANA } from "@/lib/vuelos/fechas";
import { Campo, Seccion, claseControl } from "./campo";
import type { PropsSeccion } from "./vuelo-form";

export function SeccionOperacion({ datos, errores, cambiar, tocar, bloqueado, edicion, hoy }: PropsSeccion & { hoy: string }) {
  function alternarDia(valor: number) {
    const dias = datos.dias.includes(valor) ? datos.dias.filter((dia) => dia !== valor) : [...datos.dias, valor];
    cambiar("dias", dias.sort((a, b) => a - b));
    tocar("dias");
  }

  return (
    <Seccion titulo="Operación y vigencia" descripcion="Seleccioná al menos un día de operación y el período de venta.">
      <fieldset aria-describedby={errores.dias ? "vuelo-dias-error" : undefined}>
        <legend className="text-sm font-medium">Días de operación <span className="text-red-600">*</span></legend>
        <div className={`mt-2 flex flex-wrap gap-2 rounded-md p-1 ${errores.dias ? "ring-1 ring-red-500" : ""}`}>
          {DIAS_SEMANA.map((dia) => {
            const marcado = datos.dias.includes(dia.valor);
            return (
              <label key={dia.valor} title={dia.largo}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition has-disabled:cursor-not-allowed has-disabled:opacity-60 ${marcado ? "border-primary bg-primary/15" : "border-zinc-300 hover:bg-tertiary"}`}>
                <input type="checkbox" checked={marcado} disabled={bloqueado || edicion} onChange={() => alternarDia(dia.valor)}
                  className="size-4 accent-primary" />
                {dia.corto}
              </label>
            );
          })}
        </div>
        {errores.dias && <p id="vuelo-dias-error" className="mt-1.5 text-xs text-red-600">{errores.dias}</p>}
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="vuelo-inicio" etiqueta="Fecha de inicio" error={errores.inicio}>
          <input id="vuelo-inicio" type="date" value={datos.inicio} min={edicion ? undefined : hoy} disabled={bloqueado || edicion}
            aria-invalid={Boolean(errores.inicio)} aria-describedby={errores.inicio ? "vuelo-inicio-error" : undefined}
            onChange={(event) => cambiar("inicio", event.target.value)} onBlur={() => tocar("inicio")}
            className={claseControl(errores.inicio)} />
        </Campo>
        <Campo id="vuelo-fin" etiqueta="Fecha de fin" error={errores.fin}>
          <input id="vuelo-fin" type="date" value={datos.fin} min={datos.inicio || hoy} disabled={bloqueado || edicion}
            aria-invalid={Boolean(errores.fin)} aria-describedby={errores.fin ? "vuelo-fin-error" : undefined}
            onChange={(event) => cambiar("fin", event.target.value)} onBlur={() => tocar("fin")}
            className={claseControl(errores.fin)} />
        </Campo>
      </div>
    </Seccion>
  );
}
