export function EstadoReserva({ estado }: { estado: string }) {
  const etiquetas: Record<string, string> = {
    pendiente: "Pago pendiente", pagado: "Pagado", cancelado: "Cancelado", reembolsado: "Reembolsado",
    programado: "Programado", demorado: "Demorado", en_curso: "En curso", finalizado: "Finalizado",
    presentado: "Presentado", sin_checkin: "Sin check-in",
  };
  return <span className={`inline-flex w-fit whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium ${
    estado === "cancelado" ? "border-red-200 bg-red-50 text-red-700" : estado === "pagado" || estado === "presentado" ? "border-green-200 bg-green-50 text-green-700" : "border-zinc-200 bg-tertiary text-zinc-600"
  }`}>{etiquetas[estado] ?? estado}</span>;
}
