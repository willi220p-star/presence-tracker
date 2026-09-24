"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rememberProfile } from "@/lib/browser-session";
import { emailForLogin, errorText } from "@/lib/daymark";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [email, setEmail] = useState("");
  const [nextPassword, setNextPassword] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const id = loginId.trim().toLowerCase();
    if (!id || !password) {
      setError("Enter a login ID and password.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailForLogin(id),
        password,
      });

      if (signInError || !data.user) {
        setError("That login ID and password do not match.");
        return;
      }

      const { data: profile } = await supabase
        .from("daymark_profiles")
        .select("id, login_id, display_name, role, active, created_at")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
        await supabase.auth.signOut();
        setError("This login is not set up in DGK Clock.");
        return;
      }

      if (!profile.active) {
        await supabase.auth.signOut();
        setError("This login is paused. Ask an admin to turn it back on.");
        return;
      }

      rememberProfile(profile);
      router.push(profile.role === "admin" ? "/admin" : "/clock");
    } catch (caught) {
      setError(errorText(caught, "Could not sign in. Try again."));
    } finally {
      setPending(false);
    }
  }

  async function onReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const mail = email.trim().toLowerCase();
    if (!mail || nextPassword.length < 8) {
      setError("Enter your email and a new password of at least 8 characters.");
      return;
    }
    if (nextPassword !== password) {
      setError("Type the new password the same way in both fields.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { data, error: resetError } = await supabase.rpc("reset_password_by_email", {
        email: mail,
        password: nextPassword,
      });
      if (resetError) throw new Error(resetError.message);

      const login =
        data && typeof data === "object" && "login_id" in data && typeof data.login_id === "string"
          ? data.login_id
          : mail.includes("@")
            ? mail.split("@")[0]
            : mail;

      const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailForLogin(login),
        password: nextPassword,
      });
      if (signInError || !signedIn.user) {
        setResetting(false);
        setLoginId(login);
        setPassword("");
        setError("Password updated. Sign in with your login ID and the new password.");
        return;
      }

      const { data: profile } = await supabase
        .from("daymark_profiles")
        .select("id, login_id, display_name, role, active, created_at")
        .eq("id", signedIn.user.id)
        .maybeSingle();

      if (!profile || (profile.role !== "admin" && profile.role !== "staff") || !profile.active) {
        await supabase.auth.signOut();
        setResetting(false);
        setError("Password updated. Sign in with your login ID and the new password.");
        return;
      }

      rememberProfile(profile);
      router.push(profile.role === "admin" ? "/admin" : "/clock");
    } catch (caught) {
      setError(errorText(caught, "Could not update that password."));
    } finally {
      setPending(false);
    }
  }

  if (resetting) {
    return (
      <form method="post" action="." onSubmit={onReset} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@daymark.example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 rounded-xl bg-card px-3"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Use the email on this login, like alex.rivera@daymark.example.com, or the login ID itself.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
            className="h-11 rounded-xl bg-card px-3"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-xl bg-card px-3"
          />
        </div>
        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="h-11 rounded-xl text-base" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground"
          onClick={() => {
            setResetting(false);
            setError(null);
          }}
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form method="post" action="." onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-id">Login ID</Label>
        <Input
          id="login-id"
          name="loginId"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="alex.rivera"
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          className="h-11 rounded-xl bg-card px-3"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-xl bg-card px-3 pr-11"
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      {error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 rounded-xl text-base" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <button
        type="button"
        className="text-sm text-primary"
        onClick={() => {
          setResetting(true);
          setError(null);
          setPassword("");
        }}
      >
        Forgot password
      </button>
    </form>
  );
}
