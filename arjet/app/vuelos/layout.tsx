import { SidebarPasajero } from "@/app/ui/pasajeros/sidebar";
import { CabeceraPasajero } from "@/app/ui/vuelos/cabecera-pasajero";

export default function PasajeroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[260px_1fr]">
      <SidebarPasajero />
      <div className="flex min-w-0 flex-col">
        <CabeceraPasajero />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
