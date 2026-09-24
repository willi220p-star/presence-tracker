# Daymark

A shift clock with two logins. Admins create a login ID and password for each person. People clock a shift and a break, and every punch stores a photo plus the place they were standing. Worked time is the shift minus breaks.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:41731](http://127.0.0.1:41731).

The public site is [https://willi220p-star.github.io/presence-tracker/](https://willi220p-star.github.io/presence-tracker/). Pushes to `main` publish it with GitHub Pages.

Starter admin:

- Login ID: `admin`
- Password: `Daymark-Admin-1842`

Change that password from the admin desk after you sign in.

## What each person sees

**Admin** can add people, pause a login, and read every time card: who, which punch (shift or break), the date and time, the photo, and the location.

**Staff** see a live clock, today's worked time with breaks taken out, a live location, and buttons for shift clock in, shift clock out, break clock in, and break clock out. The camera asks for access on the punch and the photo is saved with the location.

## Supabase

The browser client lives in `src/lib/supabase/client.ts`. Server components use `src/lib/supabase/server.ts`.

Daymark tables are in the personal Supabase project. A new project could not be created because the free plan already has two projects. The campaign project was left alone.

Schema, row-level security, and the private photo bucket are in `supabase/migrations/20260924040000_daymark.sql`. Admins create staff through the `create-staff` edge function, which keeps the service role off the browser.
