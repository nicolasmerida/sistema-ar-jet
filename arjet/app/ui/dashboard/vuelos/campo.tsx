export function claseControl(error?: string) {
  return `w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:bg-tertiary disabled:text-zinc-500 focus:ring-2 ${
    error ? "border-red-500 bg-red-50/40 focus:ring-red-200" : "border-zinc-300 focus:border-primary focus:ring-primary/30"
  }`;
}

export function Campo({ id, etiqueta, error, obligatorio = true, children }: {
  id: string; etiqueta: string; error?: string; obligatorio?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta} {obligatorio && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error && <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Seccion({ titulo, descripcion, children }: {
  titulo: string; descripcion: string; children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-b border-zinc-200 pb-8 last:border-b-0">
      <div>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="mt-1 text-sm text-zinc-500">{descripcion}</p>
      </div>
      {children}
    </section>
  );
}
