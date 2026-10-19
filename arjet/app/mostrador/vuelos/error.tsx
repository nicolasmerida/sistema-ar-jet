"use client";

export default function EstadoVuelosError({ retry }: { retry: () => void }) {
  return (
    <div className="w-full p-6">
      <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>No se pudo consultar el estado de los vuelos. Por favor, reintentá más tarde.</p>
        <button type="button" onClick={retry} className="mt-3 font-semibold underline underline-offset-4">Reintentar</button>
      </div>
    </div>
  );
}
