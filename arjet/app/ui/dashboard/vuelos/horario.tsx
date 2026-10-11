/** "23:30 – 02:00 (+1)": marca los vuelos que llegan al día siguiente. */
export function Horario({ salida, llegada, llegaDiaSiguiente }: { salida: string; llegada: string; llegaDiaSiguiente: boolean }) {
  return (
    <span className="whitespace-nowrap">
      {salida} – {llegada}
      {llegaDiaSiguiente && (
        <span title="Llega al día siguiente" className="ml-1 cursor-help text-xs font-semibold text-secondary">(+1)</span>
      )}
    </span>
  );
}
