"use client";

import type { Profile } from "@/lib/daymark";
import { createClient } from "@/lib/supabase/client";

let generation = 0;
const profiles = new Map<number, Promise<Profile | null>>();

export function clearSessionCache() {
  generation += 1;
  profiles.clear();
}

export function sessionProfile() {
  const current = generation;
  const existing = profiles.get(current);
  if (existing) return existing;
  const pending = fetchProfile();
  profiles.set(current, pending);
  return pending;
}

async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("daymark_profiles")
    .select("id, login_id, display_name, role, active, created_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) return null;
  if (profile.role !== "admin" && profile.role !== "staff") return null;
  return profile as Profile;
}
