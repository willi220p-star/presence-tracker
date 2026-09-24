import type { Metadata } from "next";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary px-12 py-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px 280px at 20% 10%, oklch(0.72 0.12 55 / 0.55), transparent 60%), radial-gradient(500px 320px at 90% 90%, oklch(0.55 0.08 160 / 0.7), transparent 55%)",
          }}
        />
        <p className="relative font-heading text-2xl tracking-tight">Daymark</p>
        <div className="relative max-w-md">
          <p className="font-heading text-5xl leading-[1.05] tracking-tight">
            The shift clock that keeps the place and the face.
          </p>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-primary-foreground/80">
            Clock a whole shift, step out for a break, and see the hours that remain
            after the break is taken out. Every punch stores a photo and where you were.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/70">
          Admins create the logins. People only clock in with the ID they were given.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-heading text-3xl tracking-tight">Daymark</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Clock in, take a break, and keep the worked time after breaks are removed.
            </p>
          </div>
          <h1 className="font-heading text-3xl tracking-tight">Sign in</h1>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
            Use the login ID an admin created. The same door opens the admin desk and the clock.
          </p>
          <LoginForm />
          <div className="mt-6 rounded-2xl bg-secondary px-4 py-3 text-sm">
            <p className="font-medium">Starter admin</p>
            <p className="mt-1 text-muted-foreground">
              Login ID <span className="font-medium text-foreground">admin</span>
            </p>
            <p className="text-muted-foreground">
              Password <span className="font-medium text-foreground">Daymark-Admin-1842</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Change this password from the admin desk. New people are added there, with their own login ID.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
