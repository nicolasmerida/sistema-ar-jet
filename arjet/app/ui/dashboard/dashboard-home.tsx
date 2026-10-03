import Link from "next/link";
import { FlightsTable } from "./flights-table";
import { Sidebar } from "./sidebar";
import { SummaryCards } from "./summary-cards";
import { Topbar } from "./topbar";

export function DashboardHome() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <section className="flex min-w-0 flex-col">
          <Topbar />
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
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
                    href="/vuelos"
                    className="rounded-md border border-primary/40 px-3 py-2 text-sm font-medium text-secondary transition hover:border-primary hover:bg-primary/10"
                  >
                    Ver todos
                  </Link>
                </div>
                <FlightsTable />
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
