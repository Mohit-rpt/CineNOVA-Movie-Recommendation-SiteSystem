/**
 * Constructs a fully qualified TMDB image URL.
 * Handles:
 * - Valid relative paths with or without leading slash (e.g. '/abc123.jpg' or 'abc123.jpg')
 * - Already-absolute URLs (returns as-is)
 * - Null, undefined, empty, or string "null"/"undefined" (returns null)
 * - Prevents duplicate slashes, null paths, and duplicated base URLs
 */
export function getTmdbImageUrl(
  path?: string | null,
  size: 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'
): string | null {
  if (!path || typeof path !== 'string') return null;
  const cleanPath = path.trim();
  if (!cleanPath || cleanPath === 'null' || cleanPath === 'undefined') return null;

  // If already an absolute URL, return as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // Ensure single leading slash
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `https://image.tmdb.org/t/p/${size}${normalized}`;
}
