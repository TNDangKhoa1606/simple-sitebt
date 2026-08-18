# Simple Site (NestJS + selectable database + Redis)

This site can store visits and messages in **PostgreSQL, MySQL, MongoDB, or
ClickHouse**. Redis continues to cache the visit count and last-visit time.

## Choose a database

Copy `.env.example` to `.env`, then set `DB_TYPE` and the matching connection
values:

| Database          | `DB_TYPE`    | Default port | Default user |
| ----------------- | ------------ | -----------: | ------------ |
| PostgreSQL        | `postgres`   |         5432 | `postgres`   |
| MySQL             | `mysql`      |         3306 | `root`       |
| MongoDB           | `mongodb`    |        27017 | `root`       |
| ClickHouse (HTTP) | `clickhouse` |         8123 | `default`    |

`DB_URL` is optional and supported for MongoDB and ClickHouse. It takes
precedence over `DB_HOST` and `DB_PORT` for those backends.

`DB_AUTO_CREATE_SCHEMA=true` creates missing tables at startup. PostgreSQL and
MySQL use relational tables, MongoDB uses collections, and ClickHouse uses
`MergeTree` tables. Set it to `false` when schema creation is managed outside
the app. Existing PostgreSQL `POSTGRES_*` variables remain supported when
`DB_TYPE=postgres`.

## Run with Docker Compose

Each database is a Compose profile, so only the selected backend is started.
The `.env` values must name the Compose service as `DB_HOST`.

PostgreSQL:

```dotenv
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
```

```bash
docker compose --profile postgres up -d
```

MySQL:

```dotenv
DB_TYPE=mysql
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
```

```bash
docker compose --profile mysql up -d
```

MongoDB:

```dotenv
DB_TYPE=mongodb
DB_HOST=mongodb
DB_PORT=27017
DB_USER=root
DB_PASSWORD=root
```

```bash
docker compose --profile mongodb up -d
```

ClickHouse:

```dotenv
DB_TYPE=clickhouse
DB_HOST=clickhouse
DB_PORT=8123
DB_USER=default
DB_PASSWORD=
```

```bash
docker compose --profile clickhouse up -d
```

The app may restart once while the selected database finishes becoming ready.
Open <http://localhost:3000> after the containers are healthy.

## Run locally

Start the chosen database and Redis, then:

```bash
npm install
npm run start:dev
```

## Endpoints

- `GET /api/health`
- `GET /api/stats`
- `GET /api/messages`
- `POST /api/messages` with `{ "text": "hello" }`
- `GET /api/deploy/check-db` (includes the selected database type)
- `GET /api/deploy/check-redis`

## Tests

```bash
npm test
npm run test:e2e
```

The legacy `migration:run` and `migration:revert` scripts remain available for
existing PostgreSQL deployments. The cross-database startup path uses
`DB_AUTO_CREATE_SCHEMA` instead.

## Jenkins delivery

This repository uses the shared `hemidi-iac-products-ci` pipeline defined by
`Jenkinsfile.ci` in `hemidi-iac-products`. The local `.hemidi-ci.json` file is
the product-specific build contract.

The shared Jenkins pipeline accepts two GitLab webhook events:

- a push to `development` or `staging` builds and pushes an image tagged with
  the commit SHA, then asks `hemidi-iac-products` to deploy the matching
  non-production contract; and
- creation of a semantic-version Release (for example `v1.4.0`) promotes the
  already-tested commit image to the release tag, then asks
  `hemidi-iac-products` to create a pending production deployment.

The GitLab project webhook points to the shared Generic Webhook Trigger URL and
enables **Push events** plus **Release events**. The shared pipeline filters
pushes to `development` or `staging` and Release actions to `create`.

The Jenkins service account also needs permission to run the
`hemidi-iac-products` job. That job must contain development, staging, and
production contracts under `products/simple-site/`.
