# FleetCore API - Fleet Maintenance Management

REST API to manage the life cycle of preventive and corrective maintenance for the vehicles of FleetCore. It manages vehicles, mechanics, workshops and maintenances, with JWT authentication, role-based access and an integration endpoint protected by an API Key.

## Coder information

- **Name:** Dilant Murillo
- **Clan:** [YOUR CLAN]
- **GitHub:** MrDilant
- **Repository:** [REPOSITORY URL]

## Technologies

NestJS, TypeScript, TypeORM, PostgreSQL, JWT (`@nestjs/jwt`), bcrypt (password hashing), class-validator, Swagger (OpenAPI), Jest, Docker.

## Option A: Run with Docker (recommended)

Requirements: Docker and Docker Compose.

```bash
git clone [REPOSITORY URL]
cd fleetcore
cp .env.example .env
docker compose up -d --build
docker compose exec api node dist/database/seed.js
```

- API: http://localhost:3000
- **Swagger:** http://localhost:3000/docs

`docker-compose.yml` starts two services in an internal network (`fleetcore-net`):

| Service | Description |
|---|---|
| `db` | PostgreSQL 16 with the `pgdata` volume, so data is kept when containers restart |
| `api` | The NestJS API, built with the multi-stage `Dockerfile` |

The API waits for PostgreSQL to be healthy before it starts. Inside Docker, the API connects to the database with `DB_HOST=db` (set in `docker-compose.yml`), so the value in `.env` is not used there.

Useful commands:

```bash
docker compose ps            # check the services
docker compose logs -f api   # see the API logs
docker compose down          # stop (data is kept in the volume)
docker compose down -v       # stop and delete the data
```

## Option B: Run locally

Requirements: Node.js (LTS), npm and PostgreSQL 14 or higher.

### 1. Install dependencies

```bash
git clone [REPOSITORY URL]
cd fleetcore
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | API port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_NAME` | Database name | `fleetcore` |
| `JWT_SECRET` | Secret used to sign the JWT | `cambia-este-secreto` |
| `JWT_EXPIRES_IN` | Token duration | `1h` |
| `API_KEYS` | Valid API Keys, separated by commas | `demo-key-partner-1,demo-key-partner-2` |

### 3. Database

A database called `fleetcore` must exist. If PostgreSQL is installed on your system:

```bash
sudo -u postgres psql -c "CREATE DATABASE fleetcore;"
```

If you prefer to use only the database with Docker (stop Option A first with `docker compose down`, because both use the container name and the port):

```bash
docker run --name fleetcore-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fleetcore -p 5432:5432 -d postgres:16
```

Tables are created automatically when the seeder or the API starts (`synchronize: true`, used only for this test).

### 4. Run the seeder

```bash
npm run seed
```

The seeder is **idempotent**: running it many times does not duplicate records.

| Entity | Seeded data |
|---|---|
| Users | 1 ADMIN and 2 TECHNICIAN |
| Mechanics | 3: 2 active (linked to the technicians) and 1 inactive |
| Workshops | 2: 1 active and 1 inactive |
| Vehicles | 4: 2 AVAILABLE, 1 IN_MAINTENANCE (with an IN_PROGRESS maintenance) and 1 INACTIVE |
| Maintenances | 1 COMPLETED (history of `ABC123`) and 1 IN_PROGRESS (`GHI789`) |

### 5. Start the API

```bash
npm run start:dev
```

- API: http://localhost:3000
- **Swagger:** http://localhost:3000/docs

## Test credentials

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@fleetcore.com | Admin123* |
| TECHNICIAN | tech1@fleetcore.com | Tech123* |
| TECHNICIAN | tech2@fleetcore.com | Tech123* |

API Keys for the integration endpoint: `demo-key-partner-1` and `demo-key-partner-2`.

## How to use the API (Swagger)

1. Open http://localhost:3000/docs
2. Run `POST /auth/login` with one of the test credentials.
3. Copy the `accessToken` from the response.
4. Click **Authorize**, paste the token in the Bearer field and confirm.
5. Try the endpoints. For `/integrations/...` use the `x-api-key` lock.

## Roles and permissions

| Role | Permissions |
|---|---|
| **ADMIN** | Manages vehicles, mechanics, workshops and maintenances. Can read lists and histories. |
| **TECHNICIAN** | Reads only the maintenances assigned to them (with vehicle and workshop) and updates their status (cannot cancel). |

## Main endpoints

| Method | Route | Access |
|---|---|---|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/vehicles` | ADMIN |
| GET | `/vehicles` | Authenticated |
| GET | `/vehicles/:id` | Authenticated |
| GET | `/vehicles/plate/:plate` | Authenticated |
| PATCH | `/vehicles/:id` | ADMIN |
| DELETE | `/vehicles/:id` | ADMIN (deactivates, does not delete) |
| PATCH | `/vehicles/:id/activate` | ADMIN |
| POST | `/mechanics` | ADMIN |
| GET | `/mechanics`, `/mechanics/:id` | ADMIN |
| PATCH | `/mechanics/:id` | ADMIN |
| PATCH | `/mechanics/:id/status` | ADMIN (activate / deactivate) |
| POST | `/workshops` | ADMIN |
| GET | `/workshops` | Authenticated (active workshops only) |
| GET | `/workshops/all` | ADMIN (active and inactive) |
| GET | `/workshops/:id` | Authenticated |
| PATCH | `/workshops/:id` | ADMIN |
| PATCH | `/workshops/:id/status` | ADMIN (activate / deactivate) |
| POST | `/maintenances` | ADMIN |
| GET | `/maintenances` | ADMIN |
| GET | `/maintenances/active` | ADMIN |
| GET | `/maintenances/my` | TECHNICIAN |
| GET | `/maintenances/vehicle/:vehicleId` | ADMIN |
| GET | `/maintenances/vehicle/:vehicleId/history` | ADMIN |
| GET | `/maintenances/mechanic/:mechanicId` | ADMIN |
| GET | `/maintenances/:id` | ADMIN, TECHNICIAN (only their own) |
| PATCH | `/maintenances/:id/status` | ADMIN, TECHNICIAN |
| GET | `/integrations/vehicles/:plate/history` | `x-api-key` header |

## Security

- Passwords are stored with **bcrypt** (hash with salt).
- Authentication with **JWT**. A global `JwtAuthGuard` protects all routes, except the ones marked with `@Public()`.
- Role-based authorization with the `@Roles()` decorator and a global `RolesGuard`.
- Custom decorators: `@Roles()`, `@Public()` and `@CurrentUser()`.
- The external integration uses an `ApiKeyGuard` that checks `x-api-key` against `API_KEYS` (environment variable, several keys allowed).

## Business rules implemented

- A maintenance cannot be created for a non-existent vehicle, mechanic or workshop. It also cannot use an inactive mechanic, an inactive workshop or an INACTIVE vehicle.
- A vehicle cannot have more than one active maintenance (SCHEDULED or IN_PROGRESS).
- A mechanic cannot have active maintenances with overlapping schedules, in any workshop. A maintenance that starts exactly when another one ends is allowed (7:30-9:00 and 9:00-10:00).
- The maintenance mileage cannot be lower than the current mileage of the vehicle.
- The initial status is always `SCHEDULED`.
- `IN_PROGRESS` sets the vehicle to `IN_MAINTENANCE`. `COMPLETED` sets it back to `AVAILABLE` and updates its mileage.
- Valid transitions: `SCHEDULED → IN_PROGRESS | CANCELLED` and `IN_PROGRESS → COMPLETED | CANCELLED`. `COMPLETED` and `CANCELLED` are final states.
- To complete a maintenance these fields are required: `workDone`, `finalCost`, `finishedAt` and `finalMileage`.
- The status change of the maintenance and of the vehicle runs in one **transaction** (both change or none).
- Vehicles and mechanics are never deleted. They are deactivated, and their history is kept.

## Responses and errors

Success format (interceptor):

```json
{ "success": true, "statusCode": 200, "data": {}, "timestamp": "2026-10-28T19:00:00.000Z" }
```

Error format (Exception Filter):

```json
{
  "success": false,
  "statusCode": 409,
  "message": "El vehículo ABC123 ya tiene un mantenimiento activo",
  "path": "/maintenances",
  "timestamp": "2026-10-28T19:00:00.000Z"
}
```

### HTTP status codes used

| Code | When | Reason |
|---|---|---|
| 200 / 201 | Successful operation / resource created | REST standard |
| 400 | Invalid DTO, wrong dates, invalid mileage, missing closing data | The data sent is wrong |
| 401 | No token, invalid or expired token, wrong API Key | The caller cannot be identified |
| 403 | Role without permission, technician on someone else's maintenance or trying to cancel | The caller is identified but not allowed |
| 404 | Resource does not exist | Not found |
| 409 | Duplicate plate or email, busy vehicle or mechanic, inactive resources, invalid transition | The request is valid but conflicts with the current state |

## Unit tests (Jest)

```bash
npm run test       # run the tests
npm run test:cov   # run the tests with the coverage report
```

The tests use mocks (no real database) and cover:

- **MaintenancesService:** valid and invalid status transitions, effect on the vehicle status and mileage, required closing data, technician permissions and creation rules (inactive resources, mileage, busy vehicle, mechanic schedule overlap).
- **VehiclesService:** unique plate, logical deactivation and activation.
- **AuthService:** password hashing, register with a duplicate email and login.
- **RolesGuard and ApiKeyGuard:** access by role and validation of several API Keys.

Coverage is measured on **services and guards** (`src/**/*.service.ts` and `src/**/*.guard.ts`), where the business rules are. It is set in `jest.config.ts`.

**Coverage obtained:** [X]% (verify with `npm run test:cov`)

## Project structure

```
src/
├── common/        # guards, decorators, interceptor, filter, shared DTOs
├── auth/          # register, login and JWT
├── users/         # user entity and service
├── vehicles/      # vehicle management
├── mechanics/     # mechanic management
├── workshops/     # workshop management
├── maintenances/  # maintenances and business rules
├── integrations/  # endpoint protected with x-api-key
└── database/      # seeder
Dockerfile
docker-compose.yml
```

Test files (`*.spec.ts`) are next to the code they test.

## Design decisions

- The schedule of a maintenance uses `scheduledStart` and `scheduledEnd`. Both are needed to detect schedule overlaps for a mechanic.
- A mechanic is optionally linked to a TECHNICIAN user, so the technician can read their own maintenances.
- A technician cannot cancel maintenances. Only ADMIN can do it.
- The register endpoint receives the role in the body, as the requirements ask (this would not be allowed in production).
- The `Dockerfile` uses two stages: the first one compiles the project and the second one has only the production dependencies and the compiled code.

## Database dump and evidence

- SQL dump with structure and data: `fleetcore.sql`
- To generate it with Docker:

```bash
docker compose exec -T db pg_dump -U postgres fleetcore > fleetcore.sql
```

- To generate it with a local PostgreSQL:

```bash
pg_dump -U postgres -h localhost -d fleetcore -f fleetcore.sql
```
