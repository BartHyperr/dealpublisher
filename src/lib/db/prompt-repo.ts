import { getPgPool } from "@/lib/db/postgres";
import { isPostgresEnabled } from "@/lib/db/postgres";

export const DEFAULT_SYSTEM_PROMPT = `Je bent een copywriter voor Facebook-posts van Fox (reizen/rondreizen). Herschrijf de gegeven deal-informatie tot één Facebook-post volgens de onderstaande structuur.

STRUCTUUR:

Headline (2 regels):
- Start met een pakkende hook in caps (bijv. VAKANTIETIP!, WAUW!, ONTDEK!, DROOMREIS!)
- Voeg relevante emoji toe + vlag van het land
- Baseer op de titel
- Herschrijf (niet kopiëren)
- Enthousiasmerend en activerend

Klikregel (exact zo, gebruik de gegeven Url):
👉 Bekijk hier deze reis: [Url]

Korte herschreven samenvatting (max 3 zinnen, focus op beleving + inbegrepen onderdelen). Baseer op de omschrijving.

Altijd toevoegen:
👉 Bekijk https://fox.nl/ voor nog meer prachtige vakanties!

Hashtags (exact zo plaatsen):
#foxgaatverder #foxrondreizen #foxexpertinrondreizen #foxreizen #rondreis #reizen #reisinspiratie
{{12.2}}

OUTPUTREGELS:
- Geef alleen de Facebook post
- Geen uitleg
- Geen markdown
- Geen extra witregels boven of onder de tekst`;

export type PromptSettings = {
  systemPrompt: string;
  updatedAt: string;
};

let inMemoryPrompt: PromptSettings = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  updatedAt: new Date().toISOString(),
};

export async function pgInitPromptSchema() {
  const pool = getPgPool();
  await pool.query(`
    create table if not exists ai_prompt_settings (
      id int primary key default 1 check (id = 1),
      system_prompt text not null default '',
      updated_at timestamptz not null default now()
    );
  `);
  await pool.query(
    `insert into ai_prompt_settings (id, system_prompt, updated_at)
     values (1, $1, now())
     on conflict (id) do nothing`,
    [DEFAULT_SYSTEM_PROMPT]
  );
}

export async function getPromptSettings(): Promise<PromptSettings> {
  if (isPostgresEnabled()) {
    try {
      const pool = getPgPool();
      const res = await pool.query(
        `select system_prompt, updated_at from ai_prompt_settings where id = 1`
      );
      const row = res.rows[0];
      if (row && typeof row.system_prompt === "string" && row.system_prompt.trim() !== "") {
        return {
          systemPrompt: row.system_prompt,
          updatedAt: row.updated_at ?? new Date().toISOString(),
        };
      }
    } catch {
      // fallback to in-memory
    }
  }
  return { ...inMemoryPrompt };
}

export async function savePromptSettings(patch: { systemPrompt?: string }): Promise<PromptSettings> {
  const now = new Date().toISOString();
  const current = await getPromptSettings();
  const updated: PromptSettings = {
    systemPrompt: typeof patch.systemPrompt === "string" ? patch.systemPrompt : current.systemPrompt,
    updatedAt: now,
  };

  if (isPostgresEnabled()) {
    try {
      const pool = getPgPool();
      await pool.query(
        `insert into ai_prompt_settings (id, system_prompt, updated_at)
         values (1, $1, $2::timestamptz)
         on conflict (id) do update set
           system_prompt = excluded.system_prompt,
           updated_at = excluded.updated_at`,
        [updated.systemPrompt, updated.updatedAt]
      );
      return updated;
    } catch {
      // fallback
    }
  }

  inMemoryPrompt = updated;
  return updated;
}
