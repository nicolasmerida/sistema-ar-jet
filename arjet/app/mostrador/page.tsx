import { redirect } from "next/navigation";

// Por ahora la única sección del mostrador es la consulta de reservas.
export default function MostradorPage() {
  redirect("/mostrador/reservas");
}
