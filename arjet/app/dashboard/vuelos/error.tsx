"use client";

export default function VuelosError({ retry }: { retry: () => void }) {
  return (
    <div className="w-full p-6">
      <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>No se pudieron cargar los vuelos. Por favor, contactá al equipo técnico.</p>
        <button type="button" onClick={retry} className="mt-3 font-semibold underline underline-offset-4">Reintentar</button>
      </div>
    </div>
  );
}
