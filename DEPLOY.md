# Deploy to Railway (Railpack)

The repo is ready for Railway's default builder, **Railpack**. No Dockerfile is needed.

| File | Purpose |
|---|---|
| `railpack.json` | Pins Node 22 and sets runtime variables (`TZ=America/New_York`, `LANG`). |
| `Caddyfile` | Custom Caddy config that Railpack uses instead of its default SPA template. It adds SPA fallback, `/health`, gzip/zstd, long-term caching for `/assets/*`, `no-cache` for HTML, security headers (CSP, HSTS, X-Frame-Options…) and `noindex` (private demo). |
| `.dockerignore` | Keeps the build context small (no `node_modules`, `dist`, screenshots, archives). |
| `package.json → engines` | Node range for local and CI use. |

What Railpack does (checked with `railpack info` v0.43):

```
↳ Detected Node · npm · Deploying as vite static site · Output directory: dist
↳ Using custom Caddyfile: Caddyfile
install  $ npm install
build    $ npm run build
deploy   $ caddy run --config /Caddyfile --adapter caddyfile
```

The app is served as static files by Caddy on `$PORT`. There is no Node process at runtime.

## Option A: from GitHub (recommended)

1. Push the repo to a **private** GitHub repository.
2. In Railway: **New Project → Deploy from GitHub repo** and pick the repo. Railway detects Railpack automatically.
3. In the service, open **Settings → Deploy → Healthcheck Path** and set it to `/health`.
4. In **Settings → Networking**, click **Generate Domain** (or add a custom domain).
5. Every push to the default branch redeploys.

## Option B: from your computer, without GitHub

```bash
npm i -g @railway/cli
railway login
railway init        # create a project (or: railway link)
railway up          # uploads this folder and builds it with Railpack
railway domain      # generate a public URL
```

Then set the Healthcheck Path to `/health`, as in step 3 of Option A.

## Environment variables

None are required in phase 1 (mock data only). `PORT` is injected by Railway.
When the backend is connected later, add the `VITE_*` variables in Railway. Vite reads them **at build time**, so redeploy after changing them.
Also add the API/Supabase origins to `connect-src` (and to `img-src` for storage) in the `Content-Security-Policy` line of `Caddyfile`.

## PWA

The build outputs `sw.js`, `workbox-*.js` and `manifest.webmanifest` in `dist/`. The `Caddyfile` already serves them correctly (`no-cache`, manifest MIME type, CSP `worker-src`/`manifest-src`). After each deploy, open tabs and installed apps show "New version available → Reload". Installing requires HTTPS, which the Railway domain provides.

## Notes

- `railway.json` / `railway.toml` (Config as Code) is deprecated on Railway and new services can't opt into it, so this repo doesn't include one. The healthcheck is set in the dashboard. If you want file-based infra later, use Railway's Infrastructure as Code (`railway config init`).
- To test the production server locally: `npm run build`, then `PORT=8080 caddy run --config Caddyfile --adapter caddyfile` after replacing `{{.DIST_DIR}}` with `dist`. Or simply use `npm run preview`.
