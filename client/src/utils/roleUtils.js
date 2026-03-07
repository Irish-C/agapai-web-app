// Helper utilities for normalizing and displaying role strings.

/**
 * Normalize a role string to lowercase.
 * Returns null if input is not a string.
 */
export function normalizeRole(role) {
  return typeof role === 'string' ? role.toLowerCase() : null;
}

/**
 * Convert a normalized role into a title-cased display value (e.g. "admin" -> "Admin").
 */
export function displayRole(role) {
  const normalized = normalizeRole(role);
  if (!normalized) return normalized;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
