import { SignUpForm } from "@/components/sign-up-form";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="bg-white flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-3">
        <Link href="/">
          <Image src="/finova-logo.svg" alt="Finova" className="cursor-pointer" width={200} height={100} />
        </Link>
        <p className="text-zinc-800 text-center mb-6">Sign up to get started.</p>

        <SignUpForm />

        <div className="text-sm text-gray-500 mt-2">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline underline-offset-4 hover:opacity-80">
            Log in
          </Link>
        </div>
      </div>
      {/* Footer Links */}
      <div className="absolute bottom-10 flex gap-2 mt-8 text-xs text-gray-400">
          <a href="#" className="hover:underline">Developers</a>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
    </div>
  );
}
