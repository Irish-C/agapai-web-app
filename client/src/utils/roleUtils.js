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

/**
 * Get Tailwind CSS classes for role badge styling.
 * Returns { bgColor, textColor } object with Tailwind classes
 */
export function getRoleColors(role) {
  const normalized = normalizeRole(role);
  
  const colorMap = {
    'superadmin': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'admin': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'supervisor': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'guard': { bg: 'bg-green-100', text: 'text-green-800' },
    'caregiver': { bg: 'bg-purple-100', text: 'text-purple-800' },
  };
  
  return colorMap[normalized] || { bg: 'bg-gray-100', text: 'text-gray-800' };
}
