"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();

  function validateEmail(emailToValidate: string) {
    return /^[^\s@]+@[^\s@]+\.com$/.test(emailToValidate);
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!acceptedTerms) {
      setError("You must accept the Terms and Privacy Policy");
      toast.error("Please accept the Terms and Privacy Policy");
      setIsLoading(false);
      return;
    }

    if (!username.trim()) {
      setError("Please enter a profile name");
      toast.error("Please enter a profile name");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
          data: { username },
        },
      });
      if (error) {
        toast.error(error.message || "Error signing up");
        throw error;
      }
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full flex flex-col items-center gap-6", className)} {...props}>
      <form onSubmit={handleSignUp} className="w-full">
        <div className="flex flex-col w-full">
          <input
            id="username"
            type="text"
            placeholder="Profile name"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-4 h-12 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
          />

          <input
            id="email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => { const v = e.target.value; setEmail(v); setEmailValid(validateEmail(v)); }}
            className="w-full mb-4 h-12 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
          />

          <input
            id="password"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 h-12 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
          />

          <input
            id="repeat-password"
            type="password"
            placeholder="Repeat Password"
            required
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className="w-full mb-4 h-12 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
          />

          <div className="flex gap-3 mb-4 text-sm text-gray-600 items-center justify-center">
            <Checkbox
              id="accept"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
              className="mt-1"
            />
            <Label htmlFor="accept" className="text-gray-600  translate-y-0.5">
              I agree to the {" "}
              <Link href="/terms" className="underline underline-offset-4 hover:opacity-80">Terms of Service</Link>
              {" "} and {" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:opacity-80">Privacy Policy</Link>.
            </Label>
          </div>

          {/* Errors displayed via toast */}

          {emailValid && username.trim() && password && repeatPassword && password === repeatPassword ? (
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition cursor-pointer"
              disabled={isLoading || !acceptedTerms}
            >
              {isLoading ? "Creating an account..." : "Sign up"}
            </Button>
          ) : (
            <p className="text-xs text-gray-400 text-center">Enter profile name, a valid .com email, and matching passwords to continue.</p>
          )}
        </div>
      </form>

    </div>
  );
}
