import { beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSession } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession } }),
}));
vi.mock("@/lib/auth-redirect", () => import("../../../lib/auth-redirect"));

import { GET } from "./route";

describe("auth callback redirect", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it.each([
    ["//example.org/path", "/rooms"],
    ["/\\example.org/path", "/rooms"],
    ["/\n/example.org/path", "/rooms"],
    ["https://example.org/path", "/rooms"],
    ["/estimates?sort=new#list", "/estimates?sort=new#list"],
    ["/rooms", "/rooms"],
    [null, "/rooms"],
  ])("redirects successful exchange safely for %j", async (next, expected) => {
    const url = new URL("https://app.example/auth/callback?code=valid-code");
    if (next !== null) url.searchParams.set("next", next);
    const response = await GET(new Request(url));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(response.headers.get("location")).toBe(
      `https://app.example${expected}`,
    );
  });

  it("keeps the failure redirect when exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: new Error("invalid code"),
    });
    const response = await GET(
      new Request("https://app.example/auth/callback?code=bad&next=/estimates"),
    );
    expect(response.headers.get("location")).toBe(
      "https://app.example/login?error=callback",
    );
  });

  it("does not exchange a missing code", async () => {
    const response = await GET(
      new Request("https://app.example/auth/callback?next=//example.org"),
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://app.example/login?error=callback",
    );
  });
});
