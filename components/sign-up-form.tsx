"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();

  function validateEmail(emailToValidate: string) {
    return /^[^\s@]+@[^\s@]+\.com$/.test(emailToValidate);
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!username.trim()) {
      setError("Please enter a profile name");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
          data: { username },
        },
      });
      if (error) throw error;

      if (authData?.user?.id) {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          email,
          display_name: username,
        });
        if (profileError) {
          // Non-fatal if DB trigger also creates profiles
          console.warn("Profile creation failed:", profileError.message);
        }
      }
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
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

          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

          {emailValid && username.trim() && password && repeatPassword && password === repeatPassword ? (
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition cursor-pointer"
              disabled={isLoading}
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
