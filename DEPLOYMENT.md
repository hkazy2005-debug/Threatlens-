# ThreatLens deployment

This repository is prepared for a split deployment: the React/Vite frontend on Vercel and the Express API on Render, using a hosted PostgreSQL database (for example, Neon or Render Postgres).

## Before deploying

1. Push the repository to GitHub. Confirm `backend/.env` is not tracked; never place secrets in frontend variables prefixed with `VITE_`.
2. Create a PostgreSQL database. The repository currently has no checked-in schema or migrations, so initialize the hosted database from the schema of the working local database before deploying. From a machine with PostgreSQL client tools installed, export the schema with `pg_dump --schema-only --no-owner --no-privileges --dbname="YOUR_LOCAL_DATABASE_URL" --file=threatlens-schema.sql`, then import that file into the hosted database with `psql "YOUR_HOSTED_DATABASE_URL" --file=threatlens-schema.sql`. Keep connection strings private and do not commit the dump if it contains sensitive information.
3. Rotate any API keys or database credentials that were ever committed or shared. Generate a unique, high-entropy `JWT_SECRET` for production.

## Deploy the API on Render

1. In Render, create a new **Blueprint** from the GitHub repository and use the repository's `render.yaml`.
2. Set the blueprint's secret values when prompted:
   - `DATABASE_URL`: hosted PostgreSQL connection string.
   - `JWT_SECRET`: a long, random secret.
   - `CORS_ORIGIN`: the exact Vercel site origin, such as `https://your-app.vercel.app` (no trailing slash). You can update this after creating the frontend deployment.
   - `ABUSEIPDB_API_KEY` and `VIRUSTOTAL_API_KEY`: optional; enrichment features need them.
3. Wait for the service to deploy. Check `https://YOUR-API.onrender.com/api/health`; it should return JSON with `status: "ok"`.

The blueprint runs the API on Render's free web-service plan, then runs `npm ci`, builds the TypeScript API to `backend/dist`, starts it with `npm start`, and configures `/api/health` as its health check. Free services may sleep when idle and can take longer to respond on the first request; review the plan and any usage limits in Render before deployment.

## Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `frontend` and leave the framework as Vite (or allow Vercel to detect it). The build command is `npm run build`; the output directory is `dist`.
3. Add the environment variable `VITE_API_BASE_URL` with the Render API origin, for example `https://your-api.onrender.com` (no trailing slash). This is a public API address, not a secret.
4. Deploy. The Vercel configuration in `frontend/vercel.json` supports client-side routes.
5. Copy the deployed Vercel origin into Render's `CORS_ORIGIN` environment variable and redeploy/restart the API if Render does not restart automatically.

## Verify

- Open the Vercel URL and confirm the login page loads.
- Visit the Render `/api/health` endpoint.
- Register a test account, sign in, then verify that protected pages can reach the database.
- Test IOC creation and CSV export. Try enrichment only after adding the provider API keys.

The backend intentionally refuses to start without `JWT_SECRET`. Keep all credentials in the hosting providers' private environment-variable settings, not in source code or Vercel `VITE_*` variables.
