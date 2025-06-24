import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="bg-white flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-3">
        <Image src="/finova-logo.svg" alt="Finova" width={200} height={100} />
        <p className="text-zinc-500 text-center mb-6">Log in or sign up to get started.</p>

        <LoginForm />
      </div>
    </div>
  );
}
