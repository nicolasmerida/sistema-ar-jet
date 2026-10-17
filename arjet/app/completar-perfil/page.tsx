import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { obtenerUsuarioPorClerkId } from "@/lib/usuarios/data";
import { Logo } from "../ui/logo";
import { CompletarPerfilForm } from "../ui/completar-perfil/completar-perfil-form";

export default async function CompletarPerfilPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const existente = await obtenerUsuarioPorClerkId(user.id);
  if (existente) redirect("/ingreso");

  const nombre = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Sin nombre";
  const email = user.primaryEmailAddress?.emailAddress ?? "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-tertiary px-6 py-12">
      <Logo />
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-secondary">Completá tu perfil</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Ya casi terminamos, {nombre}. Solo nos falta tu documento para crear
          tu cuenta en AR Jet.
        </p>
        {email && <p className="mt-1 text-xs text-zinc-400">{email}</p>}
        <CompletarPerfilForm />
      </div>
    </main>
  );
}
