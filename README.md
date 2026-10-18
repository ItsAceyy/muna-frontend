# Muna frontend

The web app for Muna, the property and visitor management platform. Next.js with
TypeScript and Tailwind, styled with the Haven design system (tokens in
`app/globals.css`).

The API lives in a separate repository, `ItsAceyy/muna-vms`.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

`NEXT_PUBLIC_API_URL` in `.env.local` points the app at a backend. Without it, the
app talks to the deployed backend. The variable is inlined at build time, so a
change needs a restart (locally) or a redeploy (on Vercel).

## Areas

| Path | Who it is for |
| --- | --- |
| `/admin` | Platform admin - client roster and approvals |
| `/dashboard` | Organization owners - organizations, properties, units |
| `/manager` | Property managers - home, residences, staff, maintenance |
| `/guard` | Reception - live occupancy, check-in, visitor log |
| `/resident` | Residents - visitors, deliveries, maintenance requests |
| `/checkin/[token]` | Guests - self check-in from an invite link |

## Checks

CI runs these on every push and pull request:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deploying

Vercel, from `master`. The steps, and the backend variables that have to follow a
new frontend URL, are in `DEPLOYMENT.md` in the backend repository.
