# Catalyst AppSail Deployment — Final Manual Steps

The database (Neon) is fully migrated and the backend code is Catalyst-ready.
Three short manual steps remain. Each takes ~2 minutes.

## Step 1 — Get your Catalyst project_id

Open https://catalyst.zoho.com → click the **SpiceTradeApp** project.
Look at the URL. It contains a number like `https://console.catalyst.zoho.com/baas/v1/project/12345678901/...`.
That number is your `project_id`.

Alternatively: Project Settings → General → "Project ID".

## Step 2 — Create catalyst.json at the repo root

```json
{
  "project": {
    "id": "PASTE_YOUR_PROJECT_ID_HERE",
    "projectName": "SpiceTradeApp"
  },
  "appsail": {
    "targets": ["."],
    "source": "."
  }
}
```

Commit and push to main.

## Step 3 — Create the Pipeline & deploy

In Catalyst console:
1. Pipelines → Create Pipeline
2. Name: `SpiceTradeApp-deploy`
3. Source: GitHub → Foodlobbyin/index → branch `main`
4. The YAML editor will detect the `catalyst-pipelines.yaml` already in the repo. Save it.
5. Add Global Variables:
   - `CATALYST_TOKEN` — generate locally: install `npm i -g zcatalyst-cli@beta`, run `catalyst auth:login`, then `catalyst auth:tokens` → copy the token
   - `CATALYST_ORG` — your org ID (visible in the same URL after `/org/`)
   - `CATALYST_PROJECT_NAME` — `SpiceTradeApp`
   - `CI` = `false`
6. Click "Run Pipeline" — it will build and deploy.

## After deployment

The Catalyst console will show a live URL like `https://spicetradeapp-12345.development.catalystserverless.com`.

Test:
- `curl <URL>/api/health` — should return `{"status":"OK", ...}`
- Login at the frontend with `nerihaidapak@gmail.com` (admin user already bootstrapped in DB)

## Already-configured environment variables in Catalyst
(These were set during Task 4. Confirm they appear in AppSail → Configuration → Environment Variables after first deploy.)

| Key | Value |
|-----|-------|
| DB_USER | neondb_owner |
| DB_PASSWORD | npg_z0Mutdc6BHAI |
| DB_HOST | ep-mute-cherry-a1pll609-pooler.ap-southeast-1.aws.neon.tech |
| DB_PORT | 5432 |
| DB_NAME | neondb |
| NODE_ENV | production |
| PGSSLMODE | require |
| JWT_SECRET | a1b2c3d4...e1f2 (long string) |
| FRONTEND_URL | * |

⚠️ The env vars in Task 4 were set on a Functions resource. For AppSail, they may need to be re-set on the AppSail service itself after first deployment. Catalyst keeps these scoped per resource.

## Keep-alive cron (Task 7)

The repo has `/api/health` endpoint at `backend/src/index.ts:71` and routes also mounted at `/api/health`.
Once the live URL is up, set up at https://cron-job.org:
- URL: `<live-url>/api/health`
- Schedule: every 5 minutes
- This prevents Neon free-tier cold starts.
