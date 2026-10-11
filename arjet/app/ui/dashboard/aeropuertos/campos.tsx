import type { DatosAeropuerto } from "@/lib/aeropuertos/validacion";

type Campo = keyof DatosAeropuerto;

const CLASES_CONTROL =
  "rounded-md border px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500";

function clasesSegunError(error?: string) {
  return error
    ? "border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-red-200"
    : "border-zinc-300 focus:border-primary focus:ring-primary/30";
}

type CampoProps = {
  id: Campo;
  label: string;
  valor: string;
  error?: string;
  maxLength: number;
  placeholder: string;
  disabled?: boolean;
  onCambiar: (valor: string) => void;
  onSalir: () => void;
};

function Etiqueta({
  id,
  label,
  obligatorio,
}: {
  id: Campo;
  label: string;
  obligatorio: boolean;
}) {
  return (
    <label htmlFor={id} className="text-sm font-medium text-foreground">
      {label}{" "}
      {obligatorio ? (
        <span className="text-red-600">*</span>
      ) : (
        <span className="font-normal text-zinc-500">(opcional)</span>
      )}
    </label>
  );
}

function MensajeCampo({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="text-xs text-red-600">
      {error}
    </p>
  );
}

type CampoTextoProps = CampoProps & {
  autoFocus?: boolean;
  className?: string;
  obligatorio?: boolean;
};

export function CampoTexto({
  id,
  label,
  valor,
  error,
  maxLength,
  placeholder,
  autoFocus,
  className = "",
  disabled = false,
  obligatorio = true,
  onCambiar,
  onSalir,
}: CampoTextoProps) {
  const idError = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta id={id} label={label} obligatorio={obligatorio} />
      <input
        id={id}
        name={id}
        type="text"
        value={valor}
        maxLength={maxLength}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        required={obligatorio}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        onChange={(event) => onCambiar(event.target.value)}
        onBlur={onSalir}
        className={`${CLASES_CONTROL} ${clasesSegunError(error)} ${className}`}
      />
      <MensajeCampo id={idError} error={error} />
    </div>
  );
}

// Texto largo y opcional, con contador de caracteres.
export function CampoAreaTexto({
  id,
  label,
  valor,
  error,
  maxLength,
  placeholder,
  disabled = false,
  onCambiar,
  onSalir,
}: CampoProps) {
  const idError = `${id}-error`;
  const idContador = `${id}-contador`;

  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta id={id} label={label} obligatorio={false} />
      <textarea
        id={id}
        name={id}
        value={valor}
        rows={3}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${idError} ${idContador}` : idContador}
        onChange={(event) => onCambiar(event.target.value)}
        onBlur={onSalir}
        className={`${CLASES_CONTROL} resize-y ${clasesSegunError(error)}`}
      />
      <div className="flex justify-between gap-3">
        <MensajeCampo id={idError} error={error} />
        <p id={idContador} className="ml-auto text-xs text-zinc-500">
          {valor.length}/{maxLength}
        </p>
      </div>
    </div>
  );
}
