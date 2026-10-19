import { SidebarMostrador } from "../ui/mostrador/sidebar";
import { TopbarMostrador } from "../ui/mostrador/topbar";

export default function MostradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <SidebarMostrador />
        <section className="flex min-w-0 flex-col">
          <TopbarMostrador />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </section>
      </div>
    </div>
  );
}
