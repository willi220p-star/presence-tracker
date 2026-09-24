import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getProfile();
  if (!profile) redirect("/auth/sign-out");
  redirect(profile.role === "admin" ? "/admin" : "/clock");
}
