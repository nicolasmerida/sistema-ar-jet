import { SignIn } from "@clerk/nextjs";
import { Logo } from "../../ui/logo";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-tertiary px-6 py-12">
      <Logo />
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#ff950a",
          },
        }}
      />
    </main>
  );
}
