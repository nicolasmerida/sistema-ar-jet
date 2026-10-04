import type { Metadata } from "next";
import { AvionesManager } from "../../ui/dashboard/aviones/aviones-manager";

export const metadata: Metadata = { title: "Aviones | AR Jet" };

export default function AvionesPage() {
  return (
    <div className="w-full p-6">
      <AvionesManager />
    </div>
  );
}
