# linkdrop

A tiny shared reading list. Paste a link, say why it is worth reading. Everyone with the address sees the 20 newest links, newest first.

One Node.js process and one PostgreSQL table. No framework, one dependency (`pg`).

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer

## Run it locally

```bash
npm install
cp .env.example .env        # then edit PG_URL
export $(cat .env | xargs)
psql "$PG_URL" -f db/schema.sql
npm start
```

The app defaults to port 3000. Open http://localhost:3000 and drop a link.
`HOST` defaults to `0.0.0.0` so a container reverse proxy can reach it;
use `HOST=127.0.0.1` for a local-only development server.

## Configuration

| Variable | What it is |
|---|---|
| `PG_URL` | PostgreSQL connection string, e.g. `postgresql://user:password@host:5432/linkdrop` |
| `DATABASE_URL` | Alternative PostgreSQL connection string; takes precedence over `PG_URL` when both are set |
| `HOST` | Interface to listen on (default `0.0.0.0`) |
| `PORT` | Listening port (default `3000`); set to the platform's assigned application port |

On Selfhost, create a project PostgreSQL database, set its connection string
as a private environment variable, and run `db/schema.sql` before serving the
first request. Do not commit `.env` or publish the connection string.

Run the local configuration regression checks with `npm test`.
These checks do not prove a successful platform deployment or database connection.

## Health check

`GET /healthz` answers `ok` once the process is up.
