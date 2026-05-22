"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await auth.login({ email, password });
      setAuthToken(res.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-bg px-4 transition-colors duration-200">
      {/* Theme toggle — top right corner */}
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
          <CardTitle className="text-xl text-theme-text">Welcome back</CardTitle>
          <CardDescription className="text-theme-text-muted">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-theme-text-secondary">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-violet-500 hover:text-violet-400"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-10 w-full border-theme-border bg-theme-bg-secondary text-theme-text hover:bg-theme-bg-hover"
              onClick={() => alert("Google login coming soon")}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-theme-text-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-violet-500 hover:text-violet-400"
            >
              Create account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
