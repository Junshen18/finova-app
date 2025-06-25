"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.com$/.test(email);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setEmail(value);
    setEmailValid(validateEmail(value));
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 text-black w-full", className)} {...props}>
      {success ? (
          <div>
            <h1 className="text-2xl">Check Your Email</h1>
            <div>Password reset instructions sent</div>

            <p className="text-sm text-muted-foreground">
              If you registered using your email and password, you will receive
              a password reset email.
            </p>
          </div>

      ) : (
          <div>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col">
                <div className="grid gap-2">
                  <input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={handleInputChange}
                    className="w-full mb-4 h-12 px-4 py-3 rounded-xl font-medium bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 placeholder-gray-300 transition"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {emailValid ? (
            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition cursor-pointer" type="submit">Continue</Button>
              ) : (
                <p className="text-xs text-gray-400 text-center">Please enter a valid email address.</p>
              )}
              </div>
              <div className="mt-4 text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Login
                </Link>
              </div>
            </form>
            
            </div>
      )}
    </div>
  );
}
