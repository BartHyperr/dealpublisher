# Hyperr Poster

Desktop-first web app om deals te zoeken, in te plannen en (mock) te publiceren.

## Runnen

```bash
cd dealpublisher
npm install
npm run dev
```

Open `http://localhost:3000` (landt standaard op `/search-schedule`).

### Node versie (belangrijk)

Gebruik **Node 20 LTS**. Next.js 14 dev-mode is instabiel op Node 22 (kan leiden tot ontbrekende `/_next/static/*` assets en een “verdwenen” frontend).

- Met nvm:

```bash
nvm install 20
nvm use 20
cd dealpublisher
rm -rf .next
npm run dev
```

Of gebruik `npm run dev:clean` om `.next` te resetten als je dev assets stuk gaan.

## Database koppelen (Postgres / Fox-deals)

Om de **externe database** (bijv. N8N_XML_Feed_store met Fox-deals) te gebruiken:

1. **Maak een bestand `.env.local`** in de projectmap (naast `package.json`).

2. **Vul de variabelen in:**

```env
DATA_SOURCE=postgres
DATABASE_URL="postgresql://hyperr-n8n:JOUW_WACHTWOORD@34.32.128.18:5432/N8N_XML_Feed_store"
DEALS_BRAND=fox
```

   - Vervang `JOUW_WACHTWOORD` door het echte wachtwoord van de gebruiker `hyperr-n8n`.
   - Met `DEALS_BRAND=fox` toont de app alleen deals waar `brand = 'fox'`.

3. **Optioneel:** als je tabel een andere naam heeft dan `deals`:

```env
DEALS_TABLE=naam_van_jouw_tabel
```

4. **Herstart de dev-server** (env wordt alleen bij start ingelezen):

```bash
npm run dev
```

5. **Controleren in de app:** ga naar **Instellingen**. Bij "Database" zou "VERBONDEN" moeten staan. Gebruik **Test verbinding** om te controleren.

   - **Let op:** de externe tabel heeft al het juiste schema (o.a. `id`, `brand`, `mainid`, `generate` boolean). Je hoeft **geen** "Initialiseer schema" te doen op de externe database.

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

