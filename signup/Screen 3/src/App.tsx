import { useState } from "react";
import { ArrowUpRight, Lock, Mail, AlertCircle, CheckCircle2, User, UserCheck } from "lucide-react";
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
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validate = () => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,64}$/;
    const emailRegex = /^\S+@\S+\.\S+$/;

    const userClean = username.trim() || email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20);

    if (!userClean || !usernameRegex.test(userClean)) {
      return "Username must be 3-20 characters (alphanumeric and underscores only).";
    }
    if (!email || !emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    if (!passwordRegex.test(password)) {
      return "Password requires 8+ chars with uppercase, lowercase, number & symbol (@$!%*?&_#-).";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    if (!termsAccepted) {
      return "Please accept the Terms of Service and Privacy Policy.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationErr = validate();
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    const finalUsername = username.trim() || email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20);

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: finalUsername,
          email: email.trim(),
          password: password,
          full_name: fullName.trim() || finalUsername,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        let errText = data.detail;
        if (Array.isArray(data.detail) && data.detail[0]?.msg) {
          errText = data.detail[0].msg;
        }
        throw new Error(errText || "Registration failed.");
      }

      setSuccessMessage(`Account created successfully for @${finalUsername}! Redirecting to Sign In...`);
      setTimeout(() => {
        window.location.href = "/login/Screen 2/index.html";
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please check the requirements.");
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
        <Card className="max-w-md shadow-[0_18px_50px_-24px_rgba(15,23,42,0.25)] rounded-2xl bg-white border-zinc-200 p-7 sm:p-8 gap-5 w-full">
          <CardHeader className="text-center p-0 gap-1.5">
            <CardTitle className="font-bold text-2xl text-zinc-900 tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-zinc-500 text-sm">
              Start building smarter commerce experiences with AI.
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

          <CardContent className="flex p-0 flex-col gap-3.5">
            <form onSubmit={handleSubmit} className="flex p-0 flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <Label htmlFor="full-name" className="text-xs font-semibold text-zinc-700">Full Name</Label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                  <Input
                    className="h-10 pl-10"
                    id="full-name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="username" className="text-xs font-semibold text-zinc-700">Username</Label>
                  <span className="text-[10px] text-zinc-400 font-mono">3-20 chars (a-z, 0-9, _)</span>
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                  <Input
                    className="h-10 pl-10 font-mono"
                    id="username"
                    required
                    placeholder="e.g. agent_trader_01"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="email" className="text-xs font-semibold text-zinc-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                  <Input
                    className="h-10 pl-10"
                    id="email"
                    placeholder="operator@company.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-semibold text-zinc-700">Password</Label>
                  <span className="text-[10px] text-zinc-400 font-mono">8+ chars, upper, lower, digit, symbol</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                  <Input
                    className="h-10 pl-10 font-mono"
                    id="password"
                    placeholder="••••••••••••"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="confirm-password" className="text-xs font-semibold text-zinc-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                  <Input
                    className="h-10 pl-10 font-mono"
                    id="confirm-password"
                    placeholder="••••••••••••"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex pt-1 items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked)}
                />
                <Label
                  className="cursor-pointer font-normal text-zinc-600 text-xs leading-5"
                  htmlFor="terms"
                >
                  I agree to the{" "}
                  <span className="font-semibold text-[#2b7fff]">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold text-[#2b7fff]">
                    Privacy Policy
                  </span>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#2b7fff] hover:bg-blue-600 text-white w-full h-11 font-semibold rounded-xl mt-1 shadow-sm"
              >
                {isLoading ? "Creating account..." : "Sign up"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center px-0 pt-2 pb-0 flex-col gap-2">
            <p className="text-zinc-500 text-xs">
              Already have an account?{" "}
              <a
                href="/login/Screen 2/index.html"
                className="text-[#2b7fff] font-semibold hover:underline cursor-pointer"
              >
                Log in
              </a>
            </p>
          </CardFooter>
        </Card>
      </main>

      <footer className="text-zinc-400 text-xs text-center py-2">
        Secure access powered by Razorpay AI &middot; Guardrail Safety Armed
      </footer>
    </div>
  );
}
