# Moving the database to Supabase

The application talks to Postgres directly through Sequelize. That means it needs
a **Postgres connection string**, not the Supabase API keys.

## The keys you already have are for something else

| Value | What it is for | Works with Sequelize? |
| ----- | -------------- | --------------------- |
| `SUPABASE_URL` | The PostgREST/HTTP endpoint used by `@supabase/supabase-js` | No |
| `SUPABASE_PUBLISHABLE_KEY` | Browser-side key for that HTTP client, constrained by RLS | No |
| `SUPABASE_SECRET_KEY` | Server-side key for that HTTP client; **bypasses RLS** | No |
| `SUPABASE_JWKS_URL` | Public keys for verifying Supabase Auth JWTs | No |

Those four belong to Supabase's HTTP data API. This project does not use it: it
opens a TCP connection to Postgres on port 5432 and runs SQL through Sequelize,
with its own JWT authentication. So none of the four are needed, and none of them
will make the connection work.

> **If a secret key has ever been shared or pasted anywhere, rotate it.**
> Dashboard → Project Settings → API → *Rotate*. `sb_secret_…` bypasses row level
> security, so anyone holding it can read and write every table over HTTPS
> regardless of what the database password is.

## What is actually needed

One value: the **database password**.

1. Supabase Dashboard → **Project Settings → Database**
2. Under **Database password**, click **Reset database password** if you do not
   have it saved, and copy the new one.
3. Under **Connection string**, choose **URI**. It looks like:

```
postgresql://postgres:[YOUR-PASSWORD]@db.dcsnzspzxrysgttjobgx.supabase.co:5432/postgres
```

Reachability from this machine has already been confirmed:
`db.dcsnzspzxrysgttjobgx.supabase.co:5432` accepts connections.

## Point the backend at it

Edit `backend/.env` — put the password in the file, never in a chat window or a
commit:

```bash
# Supabase takes priority over the discrete DB_* values below it.
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.dcsnzspzxrysgttjobgx.supabase.co:5432/postgres
DB_SSL=true
```

`DB_SSL=true` is required — Supabase refuses unencrypted connections. Leave the
`DB_HOST`/`DB_NAME`/`DB_USER` lines as they are; they are ignored whenever
`DATABASE_URL` is set, and they remain a working local fallback.

### Direct connection vs the pooler

| Use | Host | Username |
| --- | ---- | -------- |
| Migrations, long-lived server | `db.<ref>.supabase.co:5432` | `postgres` |
| Serverless / many short connections | `aws-0-<region>.pooler.supabase.com:5432` | `postgres.<ref>` |

Use the **direct** connection for this project. Sequelize keeps a connection
pool of its own, and migrations need session-level features the transaction
pooler does not support.

## Build the schema

```bash
cd backend
npm run db:migrate     # 17 migrations
npm run db:seed        # roles, admin user, categories, products, settings, coupons
```

Do **not** run `npm run db:create` — Supabase has already created the `postgres`
database for you.

Verify:

```bash
npm run dev
curl http://localhost:5000/api/v1/health     # "database": "connected"
curl http://localhost:5000/api/v1/products   # 8 seeded products
```

## Carrying the existing local data across

Seeding gives a clean catalogue. If the orders and accounts currently in the
local Docker container matter, copy them instead:

```bash
# 1. Dump data only — the schema comes from the migrations
docker exec honeybee-postgres pg_dump -U postgres -d honeybee \
  --data-only --disable-triggers > backup.sql

# 2. Create the schema on Supabase (migrations only, no seed —
#    the dump already contains those rows)
cd backend && npm run db:migrate

# 3. Load it
psql "postgresql://postgres:YOUR_PASSWORD@db.dcsnzspzxrysgttjobgx.supabase.co:5432/postgres" \
  -f ../backup.sql
```

Then reset the sequences, or the next insert will collide with an existing id:

```sql
SELECT setval(pg_get_serial_sequence(tablename, 'id'),
              COALESCE((SELECT MAX(id) FROM users), 1))
FROM (VALUES ('users')) AS t(tablename);
```

Simpler: run this for every table with a serial `id`.

```sql
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT c.relname AS table_name
           FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format(
      'SELECT setval(pg_get_serial_sequence(%L, ''id''), COALESCE((SELECT MAX(id) FROM %I), 1))',
      r.table_name, r.table_name);
  END LOOP;
END $$;
```

## After the switch

- Change the seeded administrator password immediately — `SEED_ADMIN_PASSWORD`
  in `.env` is a placeholder and the account is now on the public internet.
- The local Docker container can be stopped: `docker stop honeybee-postgres`.
  Keep it until the Supabase data has been verified.
- `backend/.env` is gitignored and stays that way. Set `DATABASE_URL` through the
  hosting provider's environment variables in production, not in a file.
