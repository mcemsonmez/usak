# How to start usak manually

Open Terminal and go to the project:

```bash
cd ~/Desktop/apifychallenge
```

## Every time (normal start)

1. Make sure **Docker Desktop** is running (whale icon in the menu bar).
2. Start the database:
   ```bash
   pnpm db:up
   ```
3. Start the app for presenting (production build, no dev warnings):
   ```bash
   pnpm demo
   ```
   Wait for `Ready` / `Local: http://localhost:3000`, then open http://localhost:3000.
   Keep this Terminal window open; closing it stops the app.

## Reset the demo data (before presenting)

```bash
pnpm db:seed
```

Back to: 3 properties, 7 units, 6 tenants, two months of payments, Petr owing last month's rent.

## Keep it running after closing Terminal (optional)

```bash
pnpm build
nohup caffeinate -is pnpm start > .next/server.log 2>&1 &
```

`caffeinate` stops the Mac from sleeping while the app runs. Logs: `.next/server.log`.

## Stop

```bash
pkill -f "next start"
```

The database can stay running. To stop it too: `pnpm db:down`.

## First time on a new computer

```bash
pnpm install
cp .env.example .env      # then fill in FEATHERLESS_API_KEY, APIFY_TOKEN, NEXT_PUBLIC_POSTHOG_KEY
pnpm db:up
pnpm db:reset             # creates the tables and the demo data
pnpm demo
```

## If something goes wrong

| Problem | Fix |
|---|---|
| `Cannot connect to the Docker daemon` | Start Docker Desktop, then `pnpm db:up` again |
| `Port 3000 is already in use` | `pkill -f "next start"`, then start again |
| Pages load but show no data | `pnpm db:seed` |
| AI or Market rent fails | Check the keys in `.env`, then restart the app |
