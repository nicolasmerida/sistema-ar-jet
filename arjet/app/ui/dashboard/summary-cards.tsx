import { summaryCards } from "./dashboard-data";

type SummaryCardProps = (typeof summaryCards)[number];

export function SummaryCards() {
  return (
    <section
      aria-label="Resumen de vuelos"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {summaryCards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </section>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }: SummaryCardProps) {
  const toneClasses = {
    primary: "bg-primary/15 text-primary-foreground ring-primary/30",
    secondary: "bg-secondary/10 text-secondary ring-secondary/20",
    danger: "bg-red-50 text-red-600 ring-red-100",
  }[tone];

  return (
    <article className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-500">{label}</h2>
          <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <span className={`rounded-md p-3 ring-1 ${toneClasses}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
