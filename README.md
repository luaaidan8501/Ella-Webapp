# Ella Service Sync (MVP)

Real-time fine-dining coordination POS syncing FOH and BOH views with seat plans and course firing status.

## Run locally

```bash
npm install
npm run dev
```

Open:
- `http://localhost:3000/` for role selection (with training toggle)
- `http://localhost:3000/foh` or `http://localhost:3000/boh`
- Training session: `http://localhost:3000/foh?session=training`

## Architecture
- **Next.js App Router** for UI routes, **pages/api/socket** for Socket.IO server.
- **In-memory store** singleton in `lib/store.ts` holds reservations, tables, service statuses, and timeline events.
- **Session aware** store manager keeps separate state per session (`live`, `training`, or custom string).
- **Persistence (Supabase/Postgres)** via Prisma stores a JSON snapshot per session.
- **Socket.IO** broadcasts all updates: reservation changes, table assignment, seat updates, status updates, and timeline events.
- **Optimistic UI** in clients for seat/status updates with server reconciliation via versioned updates.

## Data model
- `Reservation`: guestName, partySize, datetime, notes, tableId, seats[]
- `Table`: name/number, capacity
- `Seat`: seatNumber, lateStatus, allergyNotes, drinkPreference
- `ServiceStatus`: tableId + courseIndex/drinkIndex, status, updatedBy, updatedAt
- `TimelineEvent`: tableId, message, createdBy, createdAt

## Key files
- `lib/store.ts` - source-of-truth state + seed data
- `pages/api/socket.ts` - Socket.IO event router
- `components/ServiceProvider.tsx` - client socket bridge
- `app/foh/page.tsx` - FOH workflow
- `app/boh/page.tsx` - BOH workflow

## Next steps for production
- Authentication + role permissions (FOH/BOH/manager)
- Durable persistence (SQLite/Postgres via Prisma)
- Conflict resolution with per-entity versioning and server-side validation
- Offline support + reconnection replay
- Audit trail export and service analytics

## Supabase persistence setup
1) Create a Supabase project and grab the Postgres connection string.
2) Create `.env.local` with:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres"
```

3) Install deps and push schema:

```bash
npm install
npm run prisma:generate
npm run prisma:push
```

4) Deploy (Vercel): add `DATABASE_URL` in Vercel environment settings.
