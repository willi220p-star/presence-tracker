import type { Metadata } from "next";
import { AdminDesk } from "@/app/admin/admin-desk";
import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const profile = await requireRole("admin");

  return (
    <>
      <AppHeader profile={profile} eyebrow="Admin desk" />
      <main>
        <AdminDesk profile={profile} />
      </main>
    </>
  );
}
