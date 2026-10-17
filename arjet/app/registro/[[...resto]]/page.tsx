import { SignUp } from "@clerk/nextjs";
import { Logo } from "../../ui/logo";

export default function RegistroPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-tertiary px-6 py-12">
      <Logo />
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#ff950a",
          },
        }}
      />
    </main>
  );
}
