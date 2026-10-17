import { SignOutButton } from "@clerk/nextjs";

export default function VuelosPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="text-2xl font-bold text-secondary">Buscar vuelos</h1>
      <p className="max-w-md text-sm text-zinc-500">
        Acá va a vivir la búsqueda y compra de pasajes para pasajeros.
        Todavía no está implementada.
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
