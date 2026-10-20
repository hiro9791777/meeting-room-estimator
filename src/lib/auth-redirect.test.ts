import { describe, expect, it } from "vitest";

import { getAuthRedirectPath } from "./auth-redirect";

describe("getAuthRedirectPath", () => {
  it.each([
    null,
    "",
    "https://example.org/path",
    "//example.org/path",
    "///example.org",
    "/\\example.org",
    "/\t/example.org",
    "/\n/example.org",
    "/\r/example.org",
    "javascript:alert(1)",
    "rooms",
    "/foo/..//example.org",
    "/%2e%2e//example.org",
  ])("falls back for unsafe or missing next: %j", (next) => {
    expect(getAuthRedirectPath(next)).toBe("/rooms");
  });

  it.each([
    "/",
    "/rooms",
    "/estimates",
    "/rooms/1?tab=details#price",
    "/rooms?return=https%3A%2F%2Fexample.org",
    "/rooms#details",
  ])("preserves internal path: %s", (next) => {
    expect(getAuthRedirectPath(next)).toBe(next);
  });
});
