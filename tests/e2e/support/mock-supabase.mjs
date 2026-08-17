import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const port = 54329;
const usersByEmail = new Map();
const usersByAccessToken = new Map();
const usersByRefreshToken = new Map();

function nowIso() {
  return new Date().toISOString();
}

function createUser(email, password, displayName) {
  const timestamp = nowIso();
  const user = {
    app_metadata: { provider: "email", providers: ["email"] },
    aud: "authenticated",
    confirmed_at: timestamp,
    created_at: timestamp,
    email,
    email_confirmed_at: timestamp,
    id: randomUUID(),
    identities: [],
    is_anonymous: false,
    last_sign_in_at: timestamp,
    phone: "",
    role: "authenticated",
    updated_at: timestamp,
    user_metadata: { display_name: displayName },
  };
  usersByEmail.set(email, { password, user });
  return user;
}

createUser("e2e@example.com", "correct-password", "E2Eユーザー");

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function createSession(user) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const accessToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    aud: "authenticated",
    email: user.email,
    exp: expiresAt,
    iat: Math.floor(Date.now() / 1000),
    role: "authenticated",
    session_id: randomUUID(),
    sub: user.id,
  })}.e2e-signature`;
  const refreshToken = randomUUID();
  usersByAccessToken.set(accessToken, user);
  usersByRefreshToken.set(refreshToken, user);

  return {
    access_token: accessToken,
    expires_at: expiresAt,
    expires_in: 3600,
    refresh_token: refreshToken,
    token_type: "bearer",
    user,
  };
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function corsHeaders(request) {
  return {
    "access-control-allow-headers":
      "authorization,apikey,content-type,x-client-info,x-supabase-api-version",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-origin": request.headers.origin ?? "*",
    "access-control-expose-headers": "content-range,x-supabase-api-version",
    "x-supabase-api-version": "2024-01-01",
  };
}

function sendJson(request, response, status, body, extraHeaders = {}) {
  response.writeHead(status, {
    ...corsHeaders(request),
    ...extraHeaders,
    "content-type": "application/json",
  });
  response.end(JSON.stringify(body));
}

function bearerToken(request) {
  const authorization = request.headers.authorization ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
}

function authenticatedUser(request) {
  const token = bearerToken(request);
  return token ? usersByAccessToken.get(token) : undefined;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders(request));
    response.end();
    return;
  }

  if (url.pathname === "/health") {
    sendJson(request, response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/v1/signup") {
    const body = await readJson(request);
    if (!body.email || !body.password) {
      sendJson(request, response, 400, {
        code: "validation_failed",
        msg: "Email and password are required",
      });
      return;
    }
    if (usersByEmail.has(body.email)) {
      sendJson(request, response, 422, {
        code: "user_already_exists",
        msg: "User already registered",
      });
      return;
    }

    const user = createUser(
      body.email,
      body.password,
      body.data?.display_name ?? "ユーザー",
    );
    sendJson(request, response, 200, createSession(user));
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/auth/v1/token" &&
    url.searchParams.get("grant_type") === "password"
  ) {
    const body = await readJson(request);
    const account = usersByEmail.get(body.email);
    if (!account || account.password !== body.password) {
      sendJson(request, response, 400, {
        code: "invalid_credentials",
        msg: "Invalid login credentials",
      });
      return;
    }

    sendJson(request, response, 200, createSession(account.user));
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/auth/v1/token" &&
    url.searchParams.get("grant_type") === "refresh_token"
  ) {
    const body = await readJson(request);
    const user = usersByRefreshToken.get(body.refresh_token);
    if (!user) {
      sendJson(request, response, 400, {
        code: "refresh_token_not_found",
        msg: "Invalid Refresh Token",
      });
      return;
    }
    sendJson(request, response, 200, createSession(user));
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/v1/user") {
    const user = authenticatedUser(request);
    if (!user) {
      sendJson(request, response, 401, {
        code: "bad_jwt",
        msg: "Invalid JWT",
      });
      return;
    }
    sendJson(request, response, 200, user);
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/v1/logout") {
    const token = bearerToken(request);
    if (token) usersByAccessToken.delete(token);
    response.writeHead(204, corsHeaders(request));
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/rest/v1/profiles") {
    const user = authenticatedUser(request);
    if (!user) {
      sendJson(request, response, 401, {
        code: "PGRST301",
        message: "Invalid JWT",
      });
      return;
    }
    const profile = {
      display_name: user.user_metadata.display_name,
      is_admin: false,
    };
    const wantsObject = request.headers.accept?.includes(
      "application/vnd.pgrst.object+json",
    );
    sendJson(request, response, 200, wantsObject ? profile : [profile]);
    return;
  }

  if (request.method === "GET" && url.pathname === "/rest/v1/meeting_rooms") {
    sendJson(request, response, 200, [], { "content-range": "0-0/0" });
    return;
  }

  sendJson(request, response, 404, {
    message: `Unhandled mock endpoint: ${request.method} ${url.pathname}`,
  });
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Mock Supabase listening on http://127.0.0.1:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
