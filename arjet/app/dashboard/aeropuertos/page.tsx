import type { Metadata } from "next";
import { connection } from "next/server";
import { obtenerAeropuertos } from "@/lib/aeropuertos/data";
import { AeropuertosManager } from "../../ui/dashboard/aeropuertos/aeropuertos-manager";

export const metadata: Metadata = {
  title: "Aeropuertos | AR Jet",
};

export default async function AeropuertosPage() {
  // El listado siempre se lee de la base al momento del pedido.
  await connection();
  const aeropuertos = await obtenerAeropuertos();

  return (
    <div className="w-full p-6">
      <AeropuertosManager aeropuertos={aeropuertos} />
    </div>
  );
}
