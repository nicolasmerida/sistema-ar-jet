import type { OpcionAeropuerto } from "@/lib/vuelos/tipos";
import { Campo, Seccion, claseControl } from "./campo";
import type { PropsSeccion } from "./vuelo-form";

export function SeccionRuta({ datos, errores, cambiar, tocar, bloqueado, edicion, aeropuertos }: PropsSeccion & {
  aeropuertos: OpcionAeropuerto[];
}) {
  const descripcionError = (campo: string) => (errores[campo as keyof typeof errores] ? `vuelo-${campo}-error` : undefined);

  return (
    <Seccion titulo="Ruta y horarios" descripcion="Los campos con * son obligatorios.">
      <div className="grid gap-5 sm:grid-cols-3">
        <Campo id="vuelo-numero" etiqueta="Número de vuelo" error={errores.numero}>
          <input id="vuelo-numero" value={datos.numero} placeholder="AN 520" autoComplete="off" maxLength={10}
            disabled={bloqueado} readOnly={edicion} aria-invalid={Boolean(errores.numero)} aria-describedby={descripcionError("numero")}
            onChange={(event) => cambiar("numero", event.target.value.toUpperCase())} onBlur={() => tocar("numero")}
            className={`${claseControl(errores.numero)} read-only:bg-tertiary`} />
        </Campo>
        <Campo id="vuelo-horaSalida" etiqueta="Hora de salida" error={errores.horaSalida}>
          <input id="vuelo-horaSalida" type="time" value={datos.horaSalida} disabled={bloqueado}
            aria-invalid={Boolean(errores.horaSalida)} aria-describedby={descripcionError("horaSalida")}
            onChange={(event) => cambiar("horaSalida", event.target.value)} onBlur={() => tocar("horaSalida")}
            className={claseControl(errores.horaSalida)} />
        </Campo>
        <Campo id="vuelo-horaLlegada" etiqueta="Hora de llegada" error={errores.horaLlegada}>
          <input id="vuelo-horaLlegada" type="time" value={datos.horaLlegada} disabled={bloqueado}
            aria-invalid={Boolean(errores.horaLlegada)} aria-describedby={descripcionError("horaLlegada")}
            onChange={(event) => cambiar("horaLlegada", event.target.value)} onBlur={() => tocar("horaLlegada")}
            className={claseControl(errores.horaLlegada)} />
        </Campo>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {(["origen", "destino"] as const).map((campo) => (
          <Campo key={campo} id={`vuelo-${campo}`} etiqueta={`Aeropuerto de ${campo}`} error={errores[campo]}>
            <select id={`vuelo-${campo}`} value={datos[campo]} disabled={bloqueado || edicion}
              aria-invalid={Boolean(errores[campo])} aria-describedby={descripcionError(campo)}
              onChange={(event) => { cambiar(campo, event.target.value); tocar(campo); }} onBlur={() => tocar(campo)}
              className={claseControl(errores[campo])}>
              <option value="">Seleccioná un aeropuerto</option>
              {aeropuertos.map((aeropuerto) => (
                <option key={aeropuerto.id} value={aeropuerto.id}>{aeropuerto.ciudad} - {aeropuerto.nombre} ({aeropuerto.codigo})</option>
              ))}
            </select>
          </Campo>
        ))}
      </div>
    </Seccion>
  );
}
