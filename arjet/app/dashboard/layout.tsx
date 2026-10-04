import { Sidebar } from "../ui/dashboard/sidebar";
import { Topbar } from "../ui/dashboard/topbar";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <section className="flex min-w-0 flex-col">
          <Topbar />
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
