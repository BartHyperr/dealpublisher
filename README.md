# Hyperr Poster

Desktop-first web app om deals te zoeken, in te plannen en (mock) te publiceren.

## Runnen

```bash
cd dealpublisher
npm install
npm run dev
```

Open `http://localhost:3000` (landt standaard op `/search-schedule`).

### Loginscherm (optioneel)

Om de app te beveiligen met een wachtwoord:

1. In `.env.local`:
   ```env
   LOGIN_USERNAME=admin
   LOGIN_PASSWORD=jouw-geheim-wachtwoord
   ```
   Optioneel: `LOGIN_SECRET` voor de sessie-cookie (anders wordt `LOGIN_PASSWORD` gebruikt). Zet je alleen `LOGIN_PASSWORD`, dan volstaat het wachtwoord (gebruikersnaam mag leeg).

2. Herstart de dev-server. Bezoekers worden dan naar `/login` gestuurd; na correct wachtwoord komen ze in de app. In de zijbalk staat **Uitloggen**.

Zet je `LOGIN_PASSWORD` niet, dan is er geen loginscherm en is de app open.

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

## Database koppelen aan Netlify

De app op Netlify praat direct met **jouw** Postgres-database. Die kan overal draaien: **Google Cloud**, Railway, een andere server, etc. Je koppelt de database niet aan Railway – je geeft Netlify alleen de connection string van je bestaande database.

### Database in Google Cloud (Cloud SQL of andere host)

1. **Connection string**  
   Gebruik dezelfde `DATABASE_URL` als lokaal (uit `.env.local`), bijvoorbeeld:
   ```text
   postgresql://gebruiker:wachtwoord@JOUW_GOOGLE_CLOUD_IP:5432/database_naam
   ```
   Voor Cloud SQL gebruik je vaak het **publieke IP** van het instance, of een hostnaam die je in de GCP-console ziet.

2. **Bereikbaarheid**  
   Netlify draait op het internet, dus je database moet vanaf het internet bereikbaar zijn:
   - **Cloud SQL:** bij het instance → **Connections** → zet **Public IP** aan (of gebruik Cloud SQL Auth Proxy als je geen open poort wilt).
   - In **Authorized networks** (of firewall) moet je óf **0.0.0.0/0** toestaan (alle IP’s) óf de [Netlify IP-ranges](https://docs.netlify.com/security/secure-third-party-services/) toevoegen, zodat alleen Netlify kan verbinden.
   - Poort **5432** (Postgres) moet openstaan voor inkomend verkeer.

3. **Netlify instellen**  
   - **Netlify** → jouw site → **Site configuration** → **Environment variables**.
   - Voeg toe:
     - **`DATA_SOURCE`** = `postgres`
     - **`DATABASE_URL`** = jouw Google Cloud connection string (zoals hierboven).
   - Optioneel: **`DEALS_BRAND`** = `fox`, **`DEALS_GENERATE_BOOL`** = `true` (zoals lokaal).
   - **Save** → **Deploys** → **Trigger deploy** → **Clear cache and deploy site**.

4. **Controleren**  
   Open de live site → **Instellingen**. Bij "Database" zou **VERBONDEN** moeten staan.

Geen Railway nodig: Netlify praat direct met je Google Cloud database.

### Alternatief: database op Railway

Als je **geen** bestaande database hebt, kun je er een op [Railway](https://railway.app) aanmaken (**+ New** → **Database** → **PostgreSQL**), de publieke `DATABASE_URL` kopiëren en die in Netlify als **`DATABASE_URL`** zetten. De app op Netlify verbindt dan met Railway in plaats van met Google Cloud.

---

## Deploy op Netlify – overige env

`.env.local` wordt **niet** meegedeployed. Op Netlify moeten dezelfde variabelen in **Environment variables** staan.

1. **Netlify** → jouw site → **Site configuration** → **Environment variables**.

2. **Voor database** (lokaal of Railway): zie hierboven (`DATA_SOURCE`, `DATABASE_URL`).

3. **Optioneel:**

   | Key                      | Gebruik |
   |--------------------------|--------|
   | `DEALS_BRAND`            | Bijv. `fox` – alleen deals met dit merk |
   | `DEALS_TABLE`            | Tabelnaam als die niet `deals` is |
   | `DEALS_GENERATE_BOOL`    | `true` als je tabel `generate` als boolean heeft |
   | `OPENAI_API_KEY`         | Voor **AI Regenerate** (Facebook-post genereren) |
   | `RESEND_API_KEY`         | Voor e-mailnotificaties |
   | `NOTIFICATION_FROM_EMAIL` | Afzender e-mail voor notificaties |
   | `CRON_SECRET`            | Geheim voor `/api/cron/notifications` (cron-job.org of Netlify Scheduled) |

4. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**.

5. **Controleren:** live site → **Instellingen** → Database-status.

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

