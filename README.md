# DGK Clock

A shift clock for Regus Australia at 1 Palmerston Circuit, Palmerston. Admins create a login ID and password for each person, and can change or delete those logins. Anyone can reset a forgotten password from the sign-in page. People clock a shift and a break. Clock in and clock out only work within 200 metres of Regus. Every punch stores a photo and the full address. Worked time is the shift minus breaks.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:41731](http://127.0.0.1:41731).

The public site is [https://willi220p-star.github.io/presence-tracker/](https://willi220p-star.github.io/presence-tracker/). Pushes to `main` publish it with GitHub Pages.

The starter admin password is changed from the admin desk. It is not shown on the sign-in page.

## What each person sees

**Admin** can add people, pause a login, and read every time card: who, which punch (shift or break), the date and time, the photo, and the location.

**Staff** see a live clock, today's worked time with breaks taken out, a live location, and buttons for shift clock in, shift clock out, break clock in, and break clock out. The camera asks for access on the punch and the photo is saved with the location.

## Supabase

The browser client lives in `src/lib/supabase/client.ts`. Server components use `src/lib/supabase/server.ts`.

DGK Clock tables are in the personal Supabase project. A new project could not be created because the free plan already has two projects. The campaign project was left alone.

Schema, row-level security, and the private photo bucket are in `supabase/migrations/20260924040000_daymark.sql`. Admins create staff with the `create_staff_login` database function, so the service role stays off the browser.
