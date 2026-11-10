# Demo accounts (phase 1, mock data)

The sign-in screen (`/login`) looks like it will in production: **no demo hints on it**. Use these fictional accounts to sign in. They exist only in the mock data (`src/data/mock/users.js`) and in the mock `authService`. The domain is `example.com`, so none of these mailboxes is real.

**Password for every account:** `greatstone`

| Name | Email | Role | Job title | What they can do (default permissions) |
|---|---|---|---|---|
| Tessa Monroe | `tessa@example.com` | **Admin** | Principal Designer | Everything, including Settings (users, permissions, billing, integrations) |
| Luis Herrera | `luis@example.com` | Designer | Project Manager | CRM, Projects and AI in full. Finance view only. Settings read-only |
| Priya Natarajan | `priya@example.com` | Designer | Interior Designer | Same as Luis |
| Owen Castellanos | `owen@example.com` | Accounting | Operations & Accounting | Finance in full. CRM, Projects and AI view only. Settings read-only |
| Mia Delgado | `mia@example.com` | Viewer | Studio Coordinator | Dashboard, CRM and Projects view only. **No access** to Finance, AI or Settings |

The permission matrix can be changed in **Settings → Users & roles** (as Tessa). The changes last until the page is reloaded.

## Things to try

- **Wrong password** → "That email and password don't match". **5 wrong tries** → locked for 30 seconds.
- **Keep me signed in** checked → session survives closing the browser (30 days); unchecked → only this tab (max 12 h).
- **Deep link while signed out** (e.g. `/finance/invoices?status=overdue`) → sign in → you land back on that page.
- **Forgot password?** → always answers "If an account exists…" (no email is sent in the demo).
- **Sign out:** user menu (top-right avatar) → *Sign out*.
- **Preview another role without signing out:** as Tessa, user menu → *View as role (demo)*.
- A user **deactivated** in Settings → Users & roles can't sign in ("This account is deactivated").

## For automated checks

`scripts/qa/session.cjs` signs the browser in as Tessa (`u_1`) before the app loads. `npm run qa:audit` and `npm run qa:shot` use it. Use `SIGNED_OUT=1 npm run qa:shot -- /login login.png` to capture the sign-in screen.

## Before going live

Delete this file, `DEMO_PASSWORD` in `src/services/authService.js` and the mock users. Real accounts come from the backend (see `docs/API_INTEGRATION.md` → Auth).
