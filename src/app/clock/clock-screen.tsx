"use client";

import { use, useMemo } from "react";
import { ClockDesk } from "@/app/clock/clock-desk";
import { DeskGate } from "@/components/desk-gate";
import { AppHeader } from "@/components/app-header";
import type { Profile } from "@/lib/daymark";
import { loadOwnPunches } from "@/lib/punches";

export function ClockScreen() {
  return <DeskGate role="staff">{(profile) => <ClockReady profile={profile} />}</DeskGate>;
}

function ClockReady({ profile }: { profile: Profile }) {
  const punchesPromise = useMemo(() => loadOwnPunches(profile.id), [profile.id]);
  const punches = use(punchesPromise);

  return (
    <>
      <AppHeader profile={profile} eyebrow="Your shift" />
      <main>
        <ClockDesk profile={profile} initialPunches={punches} />
      </main>
    </>
  );
}
