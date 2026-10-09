import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { replaceRoomImage } from "./replace-room-image";

const oldPath = "rooms/1/11111111-1111-4111-8111-111111111111.png";
const newPath = "rooms/1/22222222-2222-4222-8222-222222222222.webp";
const file = new File(["image"], "new.webp", { type: "image/webp" });

type Options = {
  old?: string | null;
  readFails?: boolean;
  uploadFails?: boolean;
  rpcFails?: boolean;
  rpcThrows?: boolean;
  rpcCommitted?: boolean;
  shared?: boolean;
  queryFails?: boolean;
  queryThrows?: boolean;
  removeFails?: boolean;
  removeThrows?: boolean;
  removeEmpty?: boolean;
};

function setup(options: Options = {}) {
  let current = options.old === undefined ? oldPath : options.old;
  const events: string[] = [];
  const deleted: string[] = [];
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    const failed = () =>
      json({ message: "test failure", error: "test failure" }, 400);
    if (url.pathname === "/rest/v1/meeting_rooms") {
      if (url.searchParams.has("id")) {
        events.push("read");
        expect(url.searchParams.get("id")).toBe("eq.1");
        return options.readFails ? failed() : json({ image_path: current });
      }
      const path = url.searchParams.get("image_path")?.slice(3);
      events.push(`check:${path}`);
      expect(url.searchParams.has("is_active")).toBe(false);
      expect(url.searchParams.has("id")).toBe(false);
      if (options.queryThrows) throw new Error("offline");
      if (options.queryFails) return failed();
      // Include an inactive shared room, outside the updated room's scope.
      return json(
        current === path || (options.shared && path === oldPath)
          ? [{ id: 2 }]
          : [],
      );
    }
    if (url.pathname === "/rest/v1/rpc/set_meeting_room_image") {
      events.push("rpc");
      expect(JSON.parse(String(init?.body))).toEqual({
        target_image_path: newPath,
        target_room_id: 1,
      });
      if (options.rpcCommitted) current = newPath;
      if (options.rpcThrows) throw new Error("offline");
      if (options.rpcFails) return failed();
      current = newPath;
      return new Response(null, { status: 204 });
    }
    if (
      init?.method === "POST" &&
      url.pathname.includes("/storage/v1/object/")
    ) {
      events.push("upload");
      return options.uploadFails ? failed() : json({ Key: newPath });
    }
    if (
      init?.method === "DELETE" &&
      url.pathname === "/storage/v1/object/meeting-room-images"
    ) {
      const paths = JSON.parse(String(init.body)).prefixes as string[];
      events.push(`remove:${paths[0]}`);
      if (options.removeThrows) throw new Error("offline");
      if (options.removeFails) return failed();
      if (options.removeEmpty) return json([]);
      deleted.push(...paths);
      return json(paths.map((name) => ({ name })));
    }
    throw new Error(`Unexpected request: ${init?.method} ${url}`);
  });
  const supabase = createClient("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { retry: false },
    global: { fetch },
  });
  return {
    run: () => replaceRoomImage(supabase, 1, file, newPath),
    events,
    deleted,
    current: () => current,
  };
}

describe("replaceRoomImage", () => {
  it("deletes the previous upload only after a successful DB update and reference check", async () => {
    const s = setup();
    expect(await s.run()).toEqual({ error: null, warning: null });
    expect(s.events).toEqual([
      "read",
      "upload",
      "rpc",
      `check:${oldPath}`,
      `remove:${oldPath}`,
    ]);
    expect(s.deleted).toEqual([oldPath]);
    expect(s.current()).toBe(newPath);
  });

  it("preserves the old image and removes only the new upload when RPC fails", async () => {
    const s = setup({ rpcFails: true });
    expect((await s.run()).error).toContain("登録できませんでした");
    expect(s.events).toEqual([
      "read",
      "upload",
      "rpc",
      `check:${newPath}`,
      `remove:${newPath}`,
    ]);
    expect(s.deleted).toEqual([newPath]);
    expect(s.current()).toBe(oldPath);
  });

  it("protects images referenced by another room, including inactive rooms", async () => {
    const s = setup({ shared: true });
    expect(await s.run()).toEqual({ error: null, warning: null });
    expect(s.deleted).toEqual([]);
    expect(s.events).toContain(`check:${oldPath}`);
    expect(s.current()).toBe(newPath);
  });

  it.each([
    null,
    "focus-6.png",
    "creative-12.png",
    "seminar-24.png",
    "huddle-4.png",
    "boardroom-10.png",
    "workshop-18.png",
    "shared/common.png",
    oldPath.replace("rooms/1/", "rooms/2/"),
    "rooms/1/seed.png",
    "rooms/1/../seed.png",
    `https://example.com/${oldPath}`,
    newPath,
  ])("does not delete protected or non-owned paths: %s", async (old) => {
    const s = setup({ old });
    expect(await s.run()).toEqual({ error: null, warning: null });
    expect(s.events).toEqual(["read", "upload", "rpc"]);
    expect(s.deleted).toEqual([]);
  });

  it.each(["readFails", "uploadFails"] as const)(
    "does not delete or update after %s",
    async (key) => {
      const s = setup({ [key]: true });
      expect((await s.run()).error).toBeTruthy();
      expect(s.events).not.toContain("rpc");
      expect(s.deleted).toEqual([]);
    },
  );

  it.each([
    "queryFails",
    "queryThrows",
    "removeFails",
    "removeThrows",
    "removeEmpty",
  ] as const)(
    "keeps the successful replacement and warns on %s",
    async (key) => {
      const s = setup({ [key]: true });
      const result = await s.run();
      expect(result.error).toBeNull();
      expect(result.warning).toContain("旧画像");
      expect(s.current()).toBe(newPath);
      expect(s.deleted).toEqual([]);
      if (key.startsWith("query"))
        expect(s.events.some((e) => e.startsWith("remove:"))).toBe(false);
    },
  );

  it("reports failed rollback cleanup without hiding the original RPC error", async () => {
    const s = setup({ rpcFails: true, removeFails: true });
    const result = await s.run();
    expect(result.error).toContain("登録できませんでした");
    expect(result.warning).toContain("新しい画像");
    expect(s.deleted).toEqual([]);
  });

  it("cleans an unreferenced new upload after an RPC transport exception", async () => {
    const s = setup({ rpcThrows: true });
    expect((await s.run()).error).toBeTruthy();
    expect(s.deleted).toEqual([newPath]);
  });

  it("does not delete a committed new image if the RPC response was lost", async () => {
    const s = setup({ rpcThrows: true, rpcCommitted: true });
    expect((await s.run()).error).toBeTruthy();
    expect(s.deleted).toEqual([]);
    expect(s.current()).toBe(newPath);
  });
});
