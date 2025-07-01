"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const router = useRouter();

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.com$/.test(email);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setEmail(value);
    setEmailValid(validateEmail(value));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const supabase = createClient();
    if (!isSignUpMode) {
      // Try to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) {
        console.log("success");
        router.push("/protected");
        setIsLoading(false);
        return;
      }
      // If user not found, switch to sign up mode
      // if (error.message && error.message.toLowerCase().includes("user not found")) {
      console.log("failed");
      setIsSignUpMode(true);
      // setError("Email not found. Please re-enter your password and confirm to sign up.");
      setIsLoading(false);
      // return;
      // }
      // Other errors
      return;
    } else {
      console.log("perform sign up");
      // Sign up mode
      if (password !== repeatPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/protected`,
            data: {
              username,
            },
          },
        });
        if (error) {
          console.error("Error signing up", error);
        }else{
          const { error: profileError } = await supabase.from("profiles").insert({
            user_id: data.user?.id,
            email,
            display_name: username,
          });
          if (profileError) {
            console.error("Error creating profile", profileError);
          }else{
            console.log("Profile created successfully");
            router.push("/auth/sign-up-success");
          }
        };
      } catch (error: any) {
        setError(error.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/protected`,
      },
    });
    if (error) {
      console.error("Error signing in with Google", error);
    } else {
      console.log("Successfully signed in with Google");
    }
  };

  return (
    <div
      className={cn("w-full flex flex-col items-center gap-6 h-56", className)}
      {...props}
    >
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex flex-col w-full">
          <div className="grid gap-2">
            <input
              id="email"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={handleInputChange}
              className="w-full mb-4 h-12 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
            />
          </div>
          <div className="grid gap-2">
            <input
              id="password"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 h-12 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
            />
          </div>
          {/* Repeat password field for sign up mode */}
          {isSignUpMode && (
            <div className="flex flex-col w-full">
              <div className="grid gap-2">
                <input
                  id="repeat-password"
                  type="password"
                  placeholder="Repeat Password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="w-full mb-4 h-12 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
                />
              </div>
              <div className="grid gap-2">
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full mb-4 h-12 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
                />
              </div>
            </div>
          )}
          {emailValid ? (
            <Button
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition cursor-pointer"
              type="submit"
              disabled={isLoading}
            >
              {isSignUpMode
                ? isLoading
                  ? "Signing up..."
                  : "Sign Up"
                : isLoading
                ? "Logging in..."
                : "Continue"}
            </Button>
          ) : (
            <p className="text-xs text-gray-400 text-center">
              We'll create an account if you don't have one yet.
            </p>
          )}
        </div>
      </form>
      <div className="flex items-center">
        <Link
          href="/auth/forgot-password"
          className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-zinc-500"
        >
          Forgot your password?
        </Link>
      </div>
      {/* <Button
        type="button"
        className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-semibold transition cursor-pointer mt-2"
        onClick={handleGoogleLogin}
      >
        Continue with Google
      </Button> */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
