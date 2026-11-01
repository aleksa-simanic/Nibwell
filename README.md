# Nibwell

Nibwell is a TypeScript fullstack app for fountain pen workshops. Express serves the API; React provides the bench board for nib jobs from quote through pickup.

## Stack

- **API:** Node.js, Express, Zod, in-memory store
- **Web:** React 19, Vite, TypeScript
- **Tooling:** npm scripts via `--prefix`

## Features

- Create nib jobs with customer, pen, nib size, grind, and issue
- Status workflow: `quoted` → `grinding` → `tuning` → `writing_test` → `ready` → `picked_up`
- Advance helper plus dedicated grind / tune / test / ready / pickup endpoints
- Filter by status, grind, tag, or free-text search
- CORS-enabled API for local Vite development
- Seeded demo jobs on API startup

## Architecture

```
web (React / Vite :5173)
        │
        ▼
api (Express :3000)
        │
        ├── health
        └── PensService (in-memory)
```

## Project layout

```
nibwell/
├── api/                 # Express API
│   └── src/
├── web/                 # React client
│   └── src/
├── package.json
├── LICENSE
└── README.md
```

## Setup

```bash
git clone https://github.com/<your-username>/nibwell.git
cd nibwell

npm install --prefix api
npm install --prefix web
```

Optional web env:

```bash
# web/.env
VITE_API_URL=http://localhost:3000
```

## Run

Terminal 1 — API:

```bash
npm run start:dev --prefix api
```

Terminal 2 — web:

```bash
npm run dev --prefix web
```

- Web: http://localhost:5173
- API: http://localhost:3000
- Health: http://localhost:3000/health

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `GET` | `/api/jobs` | List jobs (`status`, `grind`, `tag`, `q`) |
| `POST` | `/api/jobs` | Create a job |
| `GET` | `/api/jobs/:id` | Get one job |
| `PATCH` | `/api/jobs/:id` | Update a job |
| `DELETE` | `/api/jobs/:id` | Delete a job |
| `POST` | `/api/jobs/:id/advance` | Move to next status |
| `POST` | `/api/jobs/:id/grind` | quoted → grinding |
| `POST` | `/api/jobs/:id/tune` | grinding → tuning |
| `POST` | `/api/jobs/:id/test` | tuning → writing_test |
| `POST` | `/api/jobs/:id/ready` | writing_test → ready |
| `POST` | `/api/jobs/:id/pickup` | ready → picked_up |

### Example

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"NW-210\",\"customer\":\"Sam Ortega\",\"penBrand\":\"Pilot Custom 74\",\"nibSize\":\"f\",\"grind\":\"italic\",\"issue\":\"Crisp italic\",\"dueOn\":\"2026-09-01\",\"tags\":[\"studio\"]}"

curl -X POST http://localhost:3000/api/jobs/<job-id>/advance
```

## Tests

```bash
npm test --prefix api
```

## License

MIT
