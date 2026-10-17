import { SignOutButton } from "@clerk/nextjs";

export default function MostradorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="text-2xl font-bold text-secondary">Mostrador</h1>
      <p className="max-w-md text-sm text-zinc-500">
        Acá va a vivir la pantalla de empleados de mostrador (consulta de
        reservas, check-in, estado de vuelos). Todavía no está implementada.
      </p>
      <SignOutButton redirectUrl="/">
        <button
          type="button"
          className="rounded-md border border-secondary/20 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
        >
          Cerrar sesión
        </button>
      </SignOutButton>
    </main>
  );
}
