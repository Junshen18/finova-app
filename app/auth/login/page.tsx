import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="bg-white flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-3">

        <Link href="/">
          <Image src="/finova-logo.svg" alt="Finova" className="cursor-pointer" width={200} height={100} />
        </Link>
        <p className="text-zinc-800 text-center mb-6">Welcome back!</p>

        <LoginForm />
        <div className="text-sm text-gray-500 mt-2">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="underline underline-offset-4 hover:opacity-80">
            Sign up
          </Link>
        </div>
      </div>
      {/* Footer Links */}
      <div className="absolute bottom-10 flex gap-2 mt-8 text-xs text-gray-400">
          <a href="#" className="hover:underline">Developers</a>
          <span>·</span>
          <a href="#" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:underline">Terms</a>
        </div>
    </div>
  );
}
