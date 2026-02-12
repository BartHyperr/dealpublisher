# DealPublisher

Desktop-first web app om deals te zoeken, in te plannen en (mock) te publiceren.

## Runnen

```bash
cd dealpublisher
npm install
npm run dev
```

Open `http://localhost:3000` (landt standaard op `/search-schedule`).

## Routes

- `/search-schedule`: deal grid + filters + klik naar edit modal
- `/calendar`: maandweergave + drag & drop reschedule + “Upcoming Posts”
- `/active-trips`: Active Trips tabel (TanStack Table) + bulk acties
- `/settings`: placeholder

## Mock API (Next.js route handlers)

- `GET /api/deals`: mock seed data
- `PATCH /api/deals/:id`: update deal (in-memory)
- `POST /api/webhook/publish`: simuleert publish en zet status op `PUBLISHED`
- `POST /api/ai/regenerate`: simuleert AI post tekst

In-memory persistence gebeurt via een singleton in `src/lib/deals/mock-db.ts` (blijft leven tijdens dev).

## State management (Zustand)

Store: `src/store/deals-store.ts`

- `deals`, `filters`, `selection` (Set), `modal`
- acties voor `updateDeal`, bulk schedule/publish/end, AI regenerate

## UI / componenten

- shadcn-achtige UI primitives in `src/components/ui/*` (Radix + Tailwind)
- Deal card en modal in `src/components/deals/*`
- Calendar in `src/components/calendar/*`
- Active Trips table in `src/components/active-trips/*`

## Design referentie (Stitch)

De pixel-close layout/styling is afgeleid uit de Stitch HTML exports die in de bovenliggende map staan:

- `FB poster stitch design/deal_search_&_schedule_dashboard/code.html`
- `FB poster stitch design/content_calendar_planner/code.html`

