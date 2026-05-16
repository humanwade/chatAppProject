export const GUIDELINES_ROOM_NAME = "Guidelines";

export const GUIDELINES_ADMIN_STORAGE_KEY = "chatApp_guidelinesAdminPassword";

export function getStoredGuidelinesAdminPassword() {
  try {
    return localStorage.getItem(GUIDELINES_ADMIN_STORAGE_KEY);
  } catch (_) {
    return null;
  }
}

export function setStoredGuidelinesAdminPassword(pwd) {
  try {
    localStorage.setItem(GUIDELINES_ADMIN_STORAGE_KEY, pwd);
  } catch (_) {}
}

export function clearStoredGuidelinesAdminPassword() {
  try {
    localStorage.removeItem(GUIDELINES_ADMIN_STORAGE_KEY);
  } catch (_) {}
}
