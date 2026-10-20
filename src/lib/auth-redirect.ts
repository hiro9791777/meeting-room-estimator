/** Only accept root-relative paths that remain internal in browsers and Next.js. */
export function getAuthRedirectPath(next: string | null): string {
  if (
    !next?.startsWith("/") ||
    next.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(next)
  ) {
    return "/rooms";
  }

  // Dot segments can normalize an apparently safe path to a leading double slash.
  const url = new URL(next, "https://auth.invalid");
  return url.pathname.startsWith("//") ? "/rooms" : next;
}
