# Recall

`Recall` is a Vue application for tracking trading card game match results and analyzing whether custom in-game signals correlate with winning. It uses Vue Router for page navigation and a small Node/SQLite API for persistence.

## What it does

- Create universal reusable signals at either the `match` or `game` level
- Define dashboard-specific signals that appear only in that dashboard's logging and analysis
- Log BO1, BO3, or BO5 matches through a guided modal with notes and per-game outcomes
- Create dashboards and assign matches directly into them from each dashboard's dedicated page
- Compare win rates when a chosen signal was present versus absent
- Create an account and keep dashboards, signals, matches, and statistics private
- Persist everything in SQLite

## Files

- [index.html](/Users/papichulo/Projects/Recall/index.html)
- [styles.css](/Users/papichulo/Projects/Recall/styles.css)
- [src](/Users/papichulo/Projects/Recall/src)
- [vite.config.js](/Users/papichulo/Projects/Recall/vite.config.js)
- [server.js](/Users/papichulo/Projects/Recall/server.js)
- [render.yaml](/Users/papichulo/Projects/Recall/render.yaml)
- [package.json](/Users/papichulo/Projects/Recall/package.json)

## Running it

Install dependencies and start the Vite frontend and Node API together:

```bash
npm install
npm run dev
```

Then visit [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite proxies `/api` requests to the Node server on port 3000.

To run the production build locally:

```bash
npm run build
npm start
```

The Node server serves the built single-page application from `dist` and falls back to `index.html` for Vue Router URLs.

The local database is stored at `data/recall.sqlite` and intentionally excluded from Git. On a new server, the checked-in SQL migrations create the database and import the original dataset.

## Deploying on Render

The included `render.yaml` defines a Node web service with a 1 GB persistent disk mounted at `/var/data`. Render can connect to the Git repository, deploy each commit automatically, and expose the service at an `onrender.com` URL.

SQLite requires the persistent disk configuration. Render's free web tier uses an ephemeral filesystem and would lose logged matches whenever the service restarts or redeploys.

Recall includes built-in email/password accounts. Passwords are salted and hashed with scrypt,
sessions are stored server-side, and all tracker data is isolated by account. When accounts are
enabled on an existing deployment, the first account created adopts the original single-user data;
later accounts start empty.

## Good next steps

- Add editing and deletion for dashboards and matches
- Add exports/imports so your friend group can share datasets
- Add password reset and email verification before wider public distribution
- Support adding one match to multiple dashboards from the UI
- Add more TCG-wide built-ins like mulligan decisions, sideboard plans, and on-the-play win rate
