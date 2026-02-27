/**
 * Eenvoudige login: gebruikersnaam + wachtwoord uit env, sessie in cookie (LOGIN_SECRET).
 * Zet LOGIN_PASSWORD (verplicht) en optioneel LOGIN_USERNAME in .env.local; zonder LOGIN_PASSWORD is login uit.
 */

export const AUTH_COOKIE_NAME = "hyperr_auth";

export function isAuthEnabled(): boolean {
  return normalizeEnv(process.env.LOGIN_PASSWORD) !== "";
}

export function getAuthSecret(): string {
  return (
    normalizeEnv(process.env.LOGIN_SECRET) ||
    normalizeEnv(process.env.LOGIN_PASSWORD) ||
    ""
  );
}

function normalizeEnv(value: string | undefined): string {
  if (value == null) return "";
  const s = value.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

export function verifyCredentials(username: string, password: string): boolean {
  const expectedPassword = normalizeEnv(process.env.LOGIN_PASSWORD);
  if (!expectedPassword) return false;
  const expectedUsername = normalizeEnv(process.env.LOGIN_USERNAME);
  if (expectedUsername) {
    return (
      username.trim() === expectedUsername && password.trim() === expectedPassword
    );
  }
  return password.trim() === expectedPassword;
}
