import { Sidebar } from "../ui/dashboard/sidebar";
import { Topbar } from "../ui/dashboard/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <section className="flex min-w-0 flex-col">
          <Topbar />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </section>
      </div>
    </div>
  );
}
