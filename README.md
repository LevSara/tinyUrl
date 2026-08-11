# TinyURL API

TinyURL is a Node.js backend for creating short links, redirecting visitors, and tracking click totals by referral source. It exposes public shortening and redirect endpoints plus authenticated account and link-management endpoints.

## Live API

The API is deployed as a portfolio demonstration on Render:

**https://tinyurl-pup3.onrender.com**

The health endpoint returns:

```json
{
  "name": "TinyURL API",
  "status": "ok"
}
```

The hosted service uses Render's free instance type. After approximately 15 minutes without incoming traffic, it may spin down. The first request after an idle period can take about one minute while the service starts and reconnects to MongoDB Atlas.

## Features

- Create generated or custom short codes
- Redirect short links to HTTP or HTTPS destinations
- Register and authenticate users with hashed passwords and expiring JWTs
- Manage links with per-user authorization
- Track total redirects and optional `src` attribution
- Validate URLs, short codes, request sizes, and identifiers
- Return consistent JSON errors for common failure cases

## Technology

- Node.js with ECMAScript modules
- Express 5
- MongoDB and Mongoose
- JSON Web Tokens and bcrypt
- nanoid
- Node.js built-in test runner

## Structure

```text
config/       Database connection
controllers/ HTTP request handling and business rules
middleware/  JWT authentication
models/      Mongoose schemas
routes/      Public and authenticated route definitions
scripts/     Repository checks
test/        Unit tests for validation and link behavior
utils/       Validation and short-code generation
index.js     Express application and startup
```

The Express application is exported independently from `startServer`, keeping startup and database connection concerns separate from request handling.

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB running locally or an accessible MongoDB deployment

## Local setup

```bash
git clone https://github.com/LevSara/tinyUrl.git
cd tinyUrl
npm ci
```

Copy `.env.example` to `.env`, then replace its placeholders:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/tinyurl
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
```

`MONGO_URI` is the MongoDB connection string. `JWT_SECRET` must be at least 32 characters and should be a randomly generated secret. The real `.env` file is ignored by Git.

Start the API:

```bash
npm start
```

The default address is `http://localhost:3000`. A successful `GET /` returns a small health response.

## Checks

```bash
npm test
npm run lint
```

The tests do not require MongoDB: database model methods are replaced with deterministic test doubles. `npm run lint` checks the syntax of every project JavaScript file.

## API

All request and response bodies are JSON unless the endpoint redirects. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | No | API health response |
| `POST` | `/links` | No | Create a public short link |
| `GET` | `/:shortCode` | No | Record a click and redirect |
| `POST` | `/api/auth/register` | No | Register and receive a JWT |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT |
| `GET` | `/api/users/:id` | Yes | Read the authenticated user's account |
| `PATCH` | `/api/users/:id` | Yes | Update supported account fields |
| `DELETE` | `/api/users/:id` | Yes | Delete the account and its links |
| `POST` | `/api/links` | Yes | Create a link owned by the authenticated user |
| `GET` | `/api/links` | Yes | List the authenticated user's links |
| `GET` | `/api/links/:id` | Yes | Read an owned link |
| `DELETE` | `/api/links/:id` | Yes | Delete an owned link |
| `GET` | `/api/links/:id/clicks` | Yes | Read total and per-source click counts |
| `GET` | `/api/links/:id/clicks/by-source?source=email` | Yes | Read one source's click count |

Create-link body:

```json
{
  "originalUrl": "https://example.com/documentation",
  "customShortCode": "docs-1",
  "source": "portfolio"
}
```

Only `originalUrl` is required. For compatibility, the existing `customerShortCode` spelling is also accepted, but new clients should use `customShortCode`. Custom codes allow 4-15 letters, numbers, hyphens, or underscores. A redirect can include `?src=email`; omitted attribution is recorded as `direct`.

## Design decisions

- Redirect destinations are restricted to HTTP and HTTPS URLs.
- Ownership is applied in database queries so authenticated users cannot inspect or delete another user's links.
- Passwords are excluded from normal Mongoose queries and login failures use a single response to avoid revealing registered accounts.
- Generated short codes are checked for collisions with a bounded retry count; the unique database index remains the final concurrency safeguard.
- Analytics stay intentionally simple: counters are stored with each link rather than introducing a separate event pipeline.

## Limitations and future improvements

- Click counters use a read-modify-save flow; atomic updates would be preferable under high concurrency.
- There is no rate limiting, refresh-token flow, password recovery, pagination, or link expiration.
- The current tests focus on business behavior with model doubles. Integration tests against an isolated MongoDB instance would add confidence in indexes and persistence.
- The Render deployment is intended for portfolio evaluation rather than production traffic.
- Production-scale use would require structured logging, managed secrets, monitoring, and abuse controls.
