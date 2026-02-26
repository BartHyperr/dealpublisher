/**
 * Eenvoudige login: gebruikersnaam + wachtwoord uit env, sessie in cookie (LOGIN_SECRET).
 * Zet LOGIN_PASSWORD (verplicht) en optioneel LOGIN_USERNAME in .env.local; zonder LOGIN_PASSWORD is login uit.
 */

export const AUTH_COOKIE_NAME = "hyperr_auth";

export function isAuthEnabled(): boolean {
  return Boolean(
    process.env.LOGIN_PASSWORD != null && process.env.LOGIN_PASSWORD.trim() !== ""
  );
}

export function getAuthSecret(): string {
  return process.env.LOGIN_SECRET ?? process.env.LOGIN_PASSWORD ?? "";
}

export function verifyCredentials(username: string, password: string): boolean {
  const expectedPassword = process.env.LOGIN_PASSWORD?.trim();
  if (!expectedPassword) return false;
  const expectedUsername = process.env.LOGIN_USERNAME?.trim();
  if (expectedUsername) {
    return (
      username.trim() === expectedUsername && password.trim() === expectedPassword
    );
  }
  return password.trim() === expectedPassword;
}
