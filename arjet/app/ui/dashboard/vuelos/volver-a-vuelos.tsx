import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function VolverAVuelos() {
  return (
    <Link href="/dashboard/vuelos" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-secondary underline-offset-4 hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" />Volver a Gestión de vuelos
    </Link>
  );
}
