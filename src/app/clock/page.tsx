import type { Metadata } from "next";
import { ClockDesk } from "@/app/clock/clock-desk";
import { AppHeader } from "@/components/app-header";
import { loadOwnPunches } from "@/lib/punches";
import { requireRole } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clock",
};

export default async function ClockPage() {
  const profile = await requireRole("staff");
  const punches = await loadOwnPunches(profile.id);

  return (
    <>
      <AppHeader profile={profile} eyebrow="Your shift" />
      <main>
        <ClockDesk profile={profile} initialPunches={punches} />
      </main>
    </>
  );
}
