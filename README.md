# Recall

`Recall` is a lightweight web app for tracking Magic: The Gathering match results and analyzing whether custom in-game signals correlate with winning. It runs locally with a Cloudflare Worker-compatible server and deploys through OpenAI Sites with persistent D1 storage.

## What this first version does

- Create reusable custom signals at either the `match` or `game` level
- Log BO1 or BO3 matches quickly with notes and per-game outcomes
- Create dashboards and assign matches directly into them from each dashboard's dedicated page
- Compare win rates when a chosen signal was present versus absent
- Persist everything in hosted SQLite-compatible D1 storage

## Files

- [index.html](/Users/papichulo/Projects/Recall/index.html)
- [styles.css](/Users/papichulo/Projects/Recall/styles.css)
- [app.js](/Users/papichulo/Projects/Recall/app.js)
- [worker/index.js](/Users/papichulo/Projects/Recall/worker/index.js)
- [db/schema.ts](/Users/papichulo/Projects/Recall/db/schema.ts)
- [package.json](/Users/papichulo/Projects/Recall/package.json)

## Running it

Install dependencies and start the local app server:

```bash
npm install
npm run dev
```

Use the local URL printed by Vite, normally [http://localhost:5173](http://localhost:5173).

The checked-in Drizzle migrations create the database schema and import the original local dataset. The old local database under `data/` is intentionally excluded from Git.

## Validation

Create a production deployment bundle with:

```bash
npm run build
```

## Good next steps

- Add editing and deletion for dashboards and matches
- Add exports/imports so your friend group can share datasets
- Add authentication and a hosted database before wider sharing
- Support adding one match to multiple dashboards from the UI
- Add more MTG-specific built-ins like mulligan decisions, sideboard plans, and on-the-play win rate
