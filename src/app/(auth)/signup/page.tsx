"use client";

import { useState } from "react";
import Link from "next/link";
import { auth, setAuthToken } from "@/lib/api";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Sun, Moon } from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await auth.register({
        full_name: fullName,
        email,
        password,
        password_confirmation: confirmPassword,
      });
      setAuthToken(res.data.token);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-bg px-4 transition-colors duration-200">
        <Card className="w-full max-w-md border-theme-border bg-theme-bg-card">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <CheckCircle className="h-6 w-6 text-violet-500" />
            </div>
            <CardTitle className="text-xl text-theme-text">
              Check your email
            </CardTitle>
            <CardDescription className="text-theme-text-muted">
              We&apos;ve sent a confirmation link to{" "}
              <span className="text-theme-text">{email}</span>. Please check your
              inbox and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full border-theme-border text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text"
              >
                Back to sign in
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-bg px-4 transition-colors duration-200">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-theme-bg-card text-theme-text-secondary shadow-lg transition-colors hover:bg-theme-bg-hover hover:text-theme-text"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      <Card className="w-full max-w-md border-theme-border bg-theme-bg-card">
        <CardHeader className="items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-theme-bg-secondary p-1">
            <img
              src="/company_logo.png"
              className="h-14 w-14 object-contain rounded-lg"
              alt="Watches Traders Logo"
            />
          </div>
          <CardTitle className="text-xl text-theme-text">Create account</CardTitle>
          <CardDescription className="text-theme-text-muted">
            Get started with CRM Watches Traders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName" className="text-theme-text-secondary">
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-theme-text-secondary">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-theme-text-secondary">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className="text-theme-text-secondary">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-theme-text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-violet-500 hover:text-violet-400"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
