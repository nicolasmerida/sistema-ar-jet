import Link from "next/link";
import { Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-foreground">
      <h1 className="text-3xl font-bold text-secondary">AR Jet</h1>

      <Show when="signed-in">
        <Link
          href="/ingreso"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Ir a mi panel
        </Link>
      </Show>

      <Show when="signed-out">
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="rounded-md border border-secondary/20 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Registrarse
          </Link>
        </div>
      </Show>
    </main>
  );
}
