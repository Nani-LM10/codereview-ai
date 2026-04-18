import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { signUp, signIn, verifyEmail, resendVerification } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, EyeOff, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup" | "verify-pending" | "verify-success";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [mode, setMode] = React.useState<Mode>("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [pendingEmail, setPendingEmail] = React.useState("");

  // Handle email verification via URL token
  React.useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setLoading(true);
      verifyEmail(token)
        .then(() => setMode("verify-success"))
        .catch((err) => setError(err.message || "Verification failed."))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signUp(email, password, name);
        // devMode = true means auto-verified, go straight to login screen
        if (result.devMode) {
          setSuccess("Account created! You can now sign in.");
          setMode("login");
          setName("");
          setPassword("");
        } else {
          // Production: needs email verification
          setPendingEmail(email);
          setMode("verify-pending");
        }
      } else {
        await signIn(email, password);
        await refreshUser();
        navigate("/app/dashboard", { replace: true });
      }
    } catch (err: any) {
      if (err.code === "EMAIL_NOT_VERIFIED") {
        setPendingEmail(email);
        setMode("verify-pending");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await resendVerification(pendingEmail);
      setSuccess("Verification email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError("");
    setSuccess("");
  };

  // ── Verify pending screen ──────────────────────────────────
  if (mode === "verify-pending") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-md">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <Mail className="size-7 text-primary" />
              </div>
              <CardTitle className="text-lg">Check your email</CardTitle>
              <CardDescription>
                We sent a verification link to{" "}
                <span className="font-medium text-foreground">{pendingEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Click the link in the email to verify your account.
              </p>
              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              {success && <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">{success}</p>}
              <Button variant="outline" className="w-full" onClick={handleResend} disabled={loading}>
                {loading ? "Sending..." : "Resend verification email"}
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
                Back to sign in
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Verify success screen ──────────────────────────────────
  if (mode === "verify-success") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-md text-center">
            <CardHeader>
              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/20">
                <span className="text-3xl">✅</span>
              </div>
              <CardTitle>Email verified!</CardTitle>
              <CardDescription>Your account is now active. Sign in to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => { setMode("login"); setError(""); }}>
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main login/signup form ─────────────────────────────────
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-20 items-center justify-center rounded-xl bg-transparent transition-transform hover:scale-105">
            <img src="/logo.png" alt="CodeLensAI" className="size-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">CodeLensAI</h1>
            <p className="mt-1 text-sm text-muted-foreground">AI-Powered Code Reviewer</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="size-3" />
              Advanced AI Model
            </Badge>
            <Badge variant="outline" className="text-xs">Structured Feedback</Badge>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader className="">
            <CardTitle className="text-lg">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to access your code review history and analytics."
                : "Start reviewing code with AI-powered feedback today."}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Aryan Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
              {success && (
                <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">{success}</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className={cn(
                    "font-medium text-foreground underline-offset-4 hover:underline",
                    loading && "pointer-events-none opacity-50"
                  )}
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Madhav Institute of Technology &middot; B.Tech CSE 2025-26
        </p>
      </div>
    </div>
  );
}
