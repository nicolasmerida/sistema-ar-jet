import { Campo, claseControl } from "@/app/ui/dashboard/vuelos/campo";
import type { DatosPago, ErroresPago } from "@/lib/pasajeros/pago-validacion";

export function CamposTarjeta({ datos, errores, pendiente, cambiar, tocar }: {
  datos: DatosPago; errores: ErroresPago; pendiente: boolean;
  cambiar: (campo: keyof DatosPago, valor: string) => void; tocar: (campo: keyof DatosPago) => void;
}) {
  return (
    <fieldset disabled={pendiente} className="grid min-w-0 gap-5 sm:grid-cols-2">
      <legend className="mb-5 text-lg font-semibold">Datos de la tarjeta</legend>
      {([
        { campo: "titular", etiqueta: "Nombre del titular", placeholder: "Como figura en la tarjeta", autocomplete: "cc-name", max: 100 },
        { campo: "numero", etiqueta: "Número de tarjeta", placeholder: "0000 0000 0000 0000", autocomplete: "cc-number", max: 23 },
        { campo: "vencimiento", etiqueta: "Vencimiento", placeholder: "MM/AA", autocomplete: "cc-exp", max: 5 },
        { campo: "seguridad", etiqueta: "Código de seguridad", placeholder: "CVV", autocomplete: "cc-csc", max: 4 },
      ] as const).map(({ campo, etiqueta, placeholder, autocomplete, max }) => (
        <div key={campo} className={`min-w-0 ${campo === "titular" || campo === "numero" ? "sm:col-span-2" : ""}`}>
          <Campo id={`pago-${campo}`} etiqueta={etiqueta} error={errores[campo]}>
            <input id={`pago-${campo}`} name={campo} type={campo === "seguridad" ? "password" : "text"} inputMode={campo === "titular" ? "text" : "numeric"}
              required autoComplete={autocomplete} maxLength={max} placeholder={placeholder} value={datos[campo]}
              onChange={(e) => cambiar(campo, e.target.value)} onBlur={() => tocar(campo)}
              aria-invalid={Boolean(errores[campo])} aria-describedby={errores[campo] ? `pago-${campo}-error` : undefined} className={claseControl(errores[campo])} />
          </Campo>
        </div>
      ))}
    </fieldset>
  );
}
