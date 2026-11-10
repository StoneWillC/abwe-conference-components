/**
 * Get the admin/creator/presenter session token from cookies (for authenticated users)
 */
export function getSessionToken(): string | null {
  const cookies = document.cookie.split("; ");
  const sessionCookie = cookies.find((cookie) =>
    cookie.startsWith("abwe_step_session="),
  );

  if (sessionCookie) {
    return sessionCookie.split("=")[1];
  }

  return null;
}

/**
 * Set the admin/creator/presenter session token in a cookie
 * @param token - The session token to store
 * @param expiryHours - Hours until the cookie expires (default: 24)
 */
export function setSessionToken(token: string, expiryHours: number = 24): void {
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + expiryHours * 60 * 60 * 1000);

  document.cookie = `abwe_step_session=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Remove the admin/creator/presenter session token from cookies
 */
export function clearSessionToken(): void {
  document.cookie =
    "abwe_step_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

/**
 * Get the attendee session token from cookies (for survey submissions)
 */
export function getAttendeeSessionToken(): string | null {
  const cookies = document.cookie.split("; ");
  const sessionCookie = cookies.find((cookie) =>
    cookie.startsWith("abweces_attendee_session="),
  );

  if (sessionCookie) {
    return sessionCookie.split("=")[1];
  }

  return null;
}

/**
 * Set the attendee session token in a cookie
 * @param token - The session token to store
 * @param expiryHours - Hours until the cookie expires (default: 24)
 */
export function setAttendeeSessionToken(
  token: string,
  expiryHours: number = 24,
): void {
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + expiryHours * 60 * 60 * 1000);

  document.cookie = `abweces_attendee_session=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Remove the attendee session token from cookies
 */
export function clearAttendeeSessionToken(): void {
  document.cookie =
    "abweces_attendee_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

/**
 * Check if the last login timestamp is within 24 hours
 * @param lastLogin - ISO 8601 datetime string from the API
 * @returns true if within 24 hours, false otherwise
 */
export function isSessionValid(lastLogin: string | null): boolean {
  if (!lastLogin) {
    return false;
  }

  const lastLoginTime = new Date(lastLogin).getTime();
  const currentTime = Date.now();
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

  return currentTime - lastLoginTime < twentyFourHoursInMs;
}
