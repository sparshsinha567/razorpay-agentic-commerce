import { useState } from "react";
import { ArrowUpRight, Lock, Mail, AlertCircle, CheckCircle2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function App() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!identifier.trim()) {
      setErrorMessage("Please enter your email or username.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: identifier.trim(),
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials. Please try again.");
      }

      localStorage.setItem("agent_jwt_token", data.access_token);
      localStorage.setItem("agent_user_name", data.username);
      setSuccessMessage(`Welcome back, ${data.username}! Redirecting to workspace...`);

      setTimeout(() => {
        if (window.opener) {
          window.close();
        } else {
          window.location.href = "/";
        }
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setIdentifier("demo_user");
    setPassword("Demo@12345");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "demo_user",
          password: "Demo@12345",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Demo sign-in failed.");
      }

      localStorage.setItem("agent_jwt_token", data.access_token);
      localStorage.setItem("agent_user_name", data.username);
      setSuccessMessage("Signed in as Demo Operator! Redirecting to workspace...");

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Demo sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-zinc-950 flex flex-col justify-between p-6 sm:p-8">
      <header className="flex items-center gap-2.5 max-w-7xl mx-auto w-full">
        <a href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="size-9 rounded-xl bg-white border border-zinc-200 shadow-xs flex justify-center items-center group-hover:border-[#2b7fff]/40 transition">
            <ArrowUpRight className="size-5 text-[#2b7fff]" strokeWidth={2.5} />
          </div>
          <div className="leading-none flex flex-col">
            <span className="font-bold text-sm text-zinc-900 tracking-tight">
              Razorpay
            </span>
            <span className="text-[#2b7fff] text-xs font-semibold mt-0.5">
              AI_Payhelper
            </span>
          </div>
        </a>
      </header>

      <main className="flex py-8 justify-center items-center flex-1">
        <Card className="max-w-md shadow-[0_18px_50px_-24px_rgba(15,23,42,0.25)] rounded-2xl bg-white border-zinc-200 p-7 sm:p-8 gap-6 w-full">
          <CardHeader className="text-center p-0 gap-1.5">
            <CardTitle className="font-bold text-2xl text-zinc-900 tracking-tight">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-zinc-500 text-sm">
              Access your AI-powered commerce workspace
            </CardDescription>
          </CardHeader>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 font-medium">
              <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <CardContent className="flex p-0 flex-col gap-4">
            <form onSubmit={handleSubmit} className="flex p-0 flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-zinc-700">Email or Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                  <Input
                    className="h-11 pl-10"
                    id="email"
                    placeholder="demo_user or operator@company.com"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-zinc-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                  <Input
                    className="h-11 pl-10"
                    id="password"
                    placeholder="••••••••••••"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked)}
                  />
                  <Label
                    className="cursor-pointer font-normal text-zinc-600 text-xs"
                    htmlFor="remember"
                  >
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage("For demo testing, use demo_user / Demo@12345 or register a new user.")}
                  className="text-[#2b7fff] hover:underline font-medium p-0"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#2b7fff] hover:bg-blue-600 text-white w-full h-11 font-semibold rounded-xl mt-1 shadow-sm"
              >
                {isLoading ? "Signing in securely..." : "Sign in"}
              </Button>

              <div className="relative flex py-1 items-center gap-3">
                <div className="bg-zinc-200 flex-1 h-px" />
                <span className="text-zinc-400 text-xs font-medium">
                  or continue with
                </span>
                <div className="bg-zinc-200 flex-1 h-px" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDemoSignIn}
                  className="gap-2 h-10 rounded-xl text-xs font-medium border-zinc-200 hover:bg-zinc-50"
                >
                  <Sparkles className="size-3.5 text-amber-500" />
                  Demo 1-Click
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIdentifier("demo_user");
                    setPassword("Demo@12345");
                  }}
                  className="gap-2 h-10 rounded-xl text-xs font-medium border-zinc-200 hover:bg-zinc-50"
                >
                  <User className="size-3.5 text-zinc-600" />
                  Autofill
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="text-center px-0 pt-3 pb-0 flex-col gap-2">
            <p className="text-zinc-500 text-xs">
              Don't have an account?{" "}
              <a
                href="/signup/Screen 3/index.html"
                className="text-[#2b7fff] font-semibold hover:underline cursor-pointer"
              >
                Sign up
              </a>
            </p>
          </CardFooter>
        </Card>
      </main>

      <footer className="text-zinc-400 text-xs text-center py-2">
        Secure access powered by Razorpay AI &middot; JWT HS256 Guardrails Active
      </footer>
    </div>
  );
}
