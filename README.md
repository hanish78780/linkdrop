# linkdrop

A tiny shared reading list. Paste a link, say why it is worth reading. Everyone with the address sees the 20 newest links, newest first.

One Node.js process and one PostgreSQL table. No framework, one dependency (`pg`).

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer

## Run it locally

```bash
npm ci
cp .env.example .env        # then edit PG_URL
export $(cat .env | xargs)
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

On Selfhost, create a private project PostgreSQL database and set its connection
string as a private environment variable. `npm start` runs `setup-db.js` to apply
the idempotent `db/schema.sql` before starting the server. Do not commit `.env`
or publish the connection string.

Run `npm test` for configuration, HTTP input validation and HTML escaping checks.
The HTTP tests use a PostgreSQL test double. These checks do not prove a successful
platform deployment or live database connection. Link listing orders by
`created_at DESC, id DESC` so ties remain deterministic and the newest 20 win.

## Health check

`GET /healthz` answers `ok` once the process is up.
