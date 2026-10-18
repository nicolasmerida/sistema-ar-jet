import { SignIn } from "@clerk/nextjs";
import { Logo } from "../../ui/logo";
import { retornoReserva } from "@/lib/pasajeros/rutas";

export default async function LoginPage({ searchParams }: PageProps<"/login/[[...resto]]">) {
  const params = await searchParams;
  const retorno = retornoReserva(params.redirect_url);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-tertiary px-6 py-12">
      <Logo />
      <SignIn
        forceRedirectUrl={retorno}
        appearance={{
          variables: {
            colorPrimary: "#ff950a",
          },
        }}
      />
    </main>
  );
}
