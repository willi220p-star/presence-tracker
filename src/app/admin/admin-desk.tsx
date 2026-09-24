"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EVENT_LABEL,
  errorText,
  formatCoord,
  formatWhen,
  localDateInput,
  mapLink,
  type Profile,
  type Punch,
} from "@/lib/daymark";
import { createClient } from "@/lib/supabase/client";

type Person = Profile;

type TimeCard = Punch & {
  photoUrl: string | null;
  displayName: string;
  loginId: string;
};

type CreatedLogin = {
  displayName: string;
  loginId: string;
  password: string;
};

export function AdminDesk({ profile }: { profile: Profile }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [cards, setCards] = useState<TimeCard[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [personFilter, setPersonFilter] = useState("all");
  const [date, setDate] = useState(() => localDateInput(new Date()));
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedLogin | null>(null);
  const [nextPassword, setNextPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    void loadPeople();
  }, []);

  useEffect(() => {
    void loadCards(date, personFilter);
  }, [date, personFilter]);

  const staff = useMemo(
    () => people.filter((person) => person.role === "staff"),
    [people],
  );

  async function loadPeople() {
    setPeopleError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("daymark_profiles")
      .select("id, login_id, display_name, role, active, created_at")
      .order("display_name");

    if (error) setPeopleError(error.message);
    else setPeople((data ?? []) as Person[]);
    setLoadingPeople(false);
  }

  async function loadCards(selectedDate: string, selectedPerson: string) {
    setLoadingCards(true);
    setCardsError(null);
    const supabase = createClient();
    const start = new Date(`${selectedDate}T00:00:00`);
    const end = new Date(`${selectedDate}T23:59:59.999`);

    let query = supabase
      .from("daymark_punches")
      .select(
        "id, user_id, event_type, occurred_at, latitude, longitude, accuracy_m, photo_path, daymark_profiles(display_name, login_id)",
      )
      .gte("occurred_at", start.toISOString())
      .lte("occurred_at", end.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(300);

    if (selectedPerson !== "all") query = query.eq("user_id", selectedPerson);

    const { data, error } = await query;
    if (error) {
      setCardsError(error.message);
      setLoadingCards(false);
      return;
    }

    const rows = (data ?? []) as Array<
      Punch & {
        daymark_profiles: { display_name: string; login_id: string } | { display_name: string; login_id: string }[] | null;
      }
    >;
    const urls = await signedPhotoUrls(
      supabase,
      rows.map((row) => row.photo_path),
    );

    setCards(
      rows.map((row) => {
        const linked = Array.isArray(row.daymark_profiles) ? row.daymark_profiles[0] : row.daymark_profiles;
        return {
          id: row.id,
          user_id: row.user_id,
          event_type: row.event_type,
          occurred_at: row.occurred_at,
          latitude: row.latitude,
          longitude: row.longitude,
          accuracy_m: row.accuracy_m,
          photo_path: row.photo_path,
          photoUrl: urls.get(row.photo_path) ?? null,
          displayName: linked?.display_name ?? "Unknown person",
          loginId: linked?.login_id ?? "",
        };
      }),
    );
    setLoadingCards(false);
  }

  async function createPerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreated(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_staff_login", {
        display_name: name.trim(),
        login_id: loginId.trim().toLowerCase(),
        password,
      });

      if (error) throw new Error(error.message);
      if (!data || typeof data !== "object") throw new Error("Could not create that login.");

      const person = data as Person;
      setPeople((current) => [...current, { ...person, created_at: new Date().toISOString() }].sort(byName));
      setCreated({
        displayName: person.display_name,
        loginId: person.login_id,
        password,
      });
      setName("");
      setLoginId("");
      setPassword("");
      toast.success(`${person.display_name} can sign in now.`);
    } catch (error) {
      toast.error(errorText(error, "Could not create that login."));
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(person: Person) {
    if (person.id === profile.id) {
      toast.error("You can't pause your own admin login.");
      return;
    }
    const supabase = createClient();
    const next = !person.active;
    const { error } = await supabase.from("daymark_profiles").update({ active: next }).eq("id", person.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPeople((current) => current.map((item) => (item.id === person.id ? { ...item, active: next } : item)));
    toast.success(next ? `${person.display_name} can sign in again.` : `${person.display_name} is paused.`);
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nextPassword.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: nextPassword });
      if (error) throw error;
      setNextPassword("");
      toast.success("Admin password updated.");
    } catch (error) {
      toast.error(errorText(error, "Could not change the password."));
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[340px_1fr] md:px-8">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Add a person</CardTitle>
            <CardDescription>
              They sign in with this login ID and password. Daymark does not email it, so pass it on yourself.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" action="." onSubmit={createPerson} className="flex flex-col gap-4">
              <Field label="Name" id="display-name">
                <Input
                  id="display-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Maya Chen"
                  className="h-11 rounded-xl bg-background px-3"
                  required
                />
              </Field>
              <Field label="Login ID" id="new-login">
                <Input
                  id="new-login"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder="maya.chen"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="h-11 rounded-xl bg-background px-3"
                  required
                />
              </Field>
              <Field label="Password" id="new-password">
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 rounded-xl bg-background px-3 pr-11"
                    minLength={8}
                    required
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
              </Field>
              <Button type="submit" className="h-11 rounded-xl" disabled={creating}>
                {creating ? "Creating…" : "Create login"}
              </Button>
            </form>
            {created ? (
              <div className="mt-4 rounded-2xl bg-secondary px-3 py-3 text-sm">
                <p className="font-medium">{created.displayName} is ready.</p>
                <p className="mt-1 text-muted-foreground">
                  Login ID <span className="font-medium text-foreground">{created.loginId}</span>
                </p>
                <p className="text-muted-foreground">
                  Password <span className="font-medium text-foreground">{created.password}</span>
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your admin password</CardTitle>
            <CardDescription>Replace the starter password before anyone else uses this desk.</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" action="." onSubmit={changePassword} className="flex flex-col gap-3">
              <Label htmlFor="admin-password">New password</Label>
              <Input
                id="admin-password"
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                minLength={8}
                className="h-11 rounded-xl bg-background px-3"
              />
              <Button type="submit" variant="outline" className="h-10" disabled={changingPassword}>
                {changingPassword ? "Saving…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
            <CardDescription>Pause a login to stop new punches without deleting the history.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {loadingPeople ? <p className="text-sm text-muted-foreground">Loading people…</p> : null}
            {peopleError ? <p className="text-sm text-destructive">{peopleError}</p> : null}
            {!loadingPeople && staff.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                No one can clock in yet. Add a login ID and password above.
              </p>
            ) : null}
            <ul className="flex flex-col gap-2">
              {people.map((person) => (
                <li key={person.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{person.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {person.login_id} · {person.role === "admin" ? "Admin" : "Staff"}
                    </p>
                  </div>
                  {person.role === "admin" ? (
                    <Badge variant="outline">Admin</Badge>
                  ) : (
                    <Button type="button" variant="ghost" className="h-8" onClick={() => toggleActive(person)}>
                      {person.active ? "Pause" : "Restore"}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl tracking-tight">Time cards</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Clock in, clock out, and breaks, with the photo, date, time, and place.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-card"
            onClick={() => void loadCards(date, personFilter)}
          >
            <RefreshCw />
            Refresh
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Person" id="person-filter">
            <select
              id="person-filter"
              value={personFilter}
              onChange={(event) => setPersonFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            >
              <option value="all">Everyone</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.display_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date" id="date-filter">
            <Input
              id="date-filter"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 rounded-xl bg-card px-3"
            />
          </Field>
        </div>

        {loadingCards ? <p className="text-sm text-muted-foreground">Loading time cards…</p> : null}
        {cardsError ? (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {cardsError}
          </p>
        ) : null}
        {!loadingCards && !cardsError && cards.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-sm leading-relaxed text-muted-foreground">
              No punches on this date. When someone clocks in, the photo, time, and location show up here.
            </CardContent>
          </Card>
        ) : null}

        <ul className="flex flex-col gap-3">
          {cards.map((card) => (
            <li key={card.id}>
              <Card className="bg-card/90">
                <CardContent className="flex flex-col gap-4 sm:flex-row">
                  {card.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.photoUrl}
                      alt={`Photo from ${card.displayName}'s ${EVENT_LABEL[card.event_type].toLowerCase()}`}
                      className="h-40 w-full rounded-xl object-cover sm:h-28 sm:w-36"
                    />
                  ) : (
                    <div className="grid h-28 w-full place-items-center rounded-xl bg-muted text-xs text-muted-foreground sm:w-36">
                      Photo unavailable
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{card.displayName}</p>
                      <Badge variant="secondary">{EVENT_LABEL[card.event_type]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{card.loginId}</p>
                    <p className="mt-2 text-sm">{formatWhen(card.occurred_at)}</p>
                    <p className="text-sm">{formatCoord(card.latitude, card.longitude)}</p>
                    {card.accuracy_m != null ? (
                      <p className="text-xs text-muted-foreground">Accurate to about {Math.round(card.accuracy_m)} m</p>
                    ) : null}
                    <a
                      className="mt-1 inline-block text-sm text-primary underline-offset-4 hover:underline"
                      href={mapLink(card.latitude, card.longitude)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open location
                    </a>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function byName(a: Person, b: Person) {
  return a.display_name.localeCompare(b.display_name);
}

async function signedPhotoUrls(supabase: ReturnType<typeof createClient>, paths: string[]) {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data } = await supabase.storage.from("daymark-photos").createSignedUrls(paths, 60 * 60);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}
