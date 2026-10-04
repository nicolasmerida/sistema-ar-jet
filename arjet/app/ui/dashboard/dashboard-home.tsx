import Link from "next/link";
import { FlightsTable } from "./flights-table";
import { SummaryCards } from "./summary-cards";

export function DashboardHome() {
  return (
    <div className="flex flex-col gap-8">
      <SummaryCards />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Próximos vuelos
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Salidas previstas para hoy.
            </p>
          </div>
          <Link
            href="/dashboard/vuelos"
            className="rounded-md border border-primary/40 px-3 py-2 text-sm font-medium text-secondary transition hover:border-primary hover:bg-primary/10"
          >
            Ver todos
          </Link>
        </div>
        <FlightsTable />
      </section>
    </div>
  );
}
