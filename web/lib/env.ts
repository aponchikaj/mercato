const DEFAULT_BACKEND_URL = "http://localhost:4000";

export function getBackendUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL;
  const sanitized = raw.replace(/^\uFEFF/, "").trim().replace(/\/+$/, "");

  if (
    !sanitized.startsWith("http://") &&
    !sanitized.startsWith("https://")
  ) {
    return DEFAULT_BACKEND_URL;
  }

  return sanitized;
}
