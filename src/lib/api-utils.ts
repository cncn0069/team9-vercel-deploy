/** Convert snake_case keys to camelCase for API responses (schema compatibility) */
function toCamelKey(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function toCamel<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamel) as T;
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamelKey(k), toCamel(v)])
    ) as T;
  }
  return obj;
}

export const keysToCamel = toCamel;
