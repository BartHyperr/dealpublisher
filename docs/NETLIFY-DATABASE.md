# Database-koppeling werkend krijgen op Netlify

## Stap 1: Environment variables in Netlify

1. Ga naar [app.netlify.com](https://app.netlify.com) → jouw site.
2. **Site configuration** → **Environment variables** (of **Build & deploy** → **Environment**).
3. Zorg dat deze variabelen bestaan (voor **Production** en eventueel **Deploy Previews**):

   | Variabele          | Waarde |
   |--------------------|--------|
   | `DATA_SOURCE`      | `postgres` |
   | `DATABASE_URL`     | Je volledige connection string, bijv. `postgresql://user:pass@34.32.128.18:5432/N8N_XML_Feed_store` |
   | `DEALS_BRAND`      | `fox` (als je Fox-deals gebruikt) |
   | `DEALS_GENERATE_BOOL` | `true` (als je tabel `generate` als boolean heeft) |
   | `OPENAI_API_KEY`   | Je OpenAI key (voor AI Regenerate) |
   | `LOGIN_USERNAME`   | (Optioneel) Gebruikersnaam voor het loginscherm |
   | `LOGIN_PASSWORD`   | (Optioneel) Wachtwoord; zonder dit is de app open |
   | `LOGIN_SECRET`     | (Optioneel) Geheim voor de sessie-cookie |

4. Klik **Save** of **Save all**.

## Stap 2: Nieuwe deploy triggeren

Env-variabelen worden alleen meegenomen bij een **nieuwe** build.

1. **Deploys** → **Trigger deploy** → **Deploy site** (of **Clear cache and deploy site**).
2. Wacht tot de deploy **Published** is.

## Stap 3: Database moet bereikbaar zijn vanaf internet

De app op Netlify draait op servers van Netlify. Die moeten **naar jouw database** kunnen verbinden.

- **Database op 34.32.128.18 (Google Cloud / andere host):**
  - Poort **5432** moet openstaan voor inkomend verkeer.
  - In de firewall of “Authorized networks” moet verbinding vanaf het internet toegestaan zijn (bijv. **0.0.0.0/0** of de IP-ranges van Netlify).
- Werkt het **lokaal** met dezelfde `DATABASE_URL`? Dan is de database vaak al bereikbaar; anders firewall/networks aanpassen.

## Stap 4: Controleren in de app

1. Open je **live Netlify-URL** (bijv. `https://jouw-site.netlify.app`).
2. Ga naar **Instellingen** (in het menu).
3. Bij **Database** zou **VERBONDEN** moeten staan en **Bron: Postgres**.
4. Optioneel: klik **Test verbinding** om te testen.

## Als het nog niet werkt

- **Bron: Mock** of **NIET VERBONDEN**  
  - Controleer of `DATA_SOURCE` precies `postgres` is (geen spaties).
  - Controleer of `DATABASE_URL` correct is (zelfde als in `.env.local`).
  - Trigger opnieuw een deploy na het aanpassen van env.

- **Deploy faalt**  
  - Bekijk het **deploy log** op Netlify; vaak gaat het mis bij `npm run build`. Los eventuele buildfouten eerst op.

- **Timeout of connection refused**  
  - De database (34.32.128.18) blokkeert verbindingen van buiten. Firewall of “Authorized networks” aanpassen zodat verbindingen vanaf het internet (of Netlify) zijn toegestaan.
