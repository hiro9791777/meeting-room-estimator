import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const port = 54329;
const usersByEmail = new Map();
const usersByAccessToken = new Map();
const usersByRefreshToken = new Map();
const estimates = [];
const estimateEquipments = [];
const estimateDrinks = [];

const meetingRooms = [
  {
    id: 1,
    name: "Focus 6",
    capacity: 6,
    hourly_rate: 3200,
    description: "少人数の打ち合わせに適した、自然光の入る会議室です。",
    image_path: null,
    facilities: {
      name: "新宿駅前店",
      prefecture: "東京都",
      city: "新宿区",
      address_line: "西新宿1-1-1",
      companies: { name: "コネクトスペース" },
    },
  },
];

const equipments = [
  { id: 1, name: "プロジェクター", unit_price: 2200, charge_unit: "per_use" },
  { id: 2, name: "追加モニター", unit_price: 1500, charge_unit: "per_use" },
];

const drinks = [
  { id: 1, name: "ミネラルウォーター", unit_price: 150 },
  { id: 2, name: "コーヒー", unit_price: 250 },
];

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
createUser("other@example.com", "correct-password", "別のE2Eユーザー");

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
      "accept-profile,authorization,apikey,content-profile,content-type,prefer,range,x-client-info,x-supabase-api-version",
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

function equalsFilter(url, column) {
  const value = url.searchParams.get(column);
  return value?.startsWith("eq.") ? value.slice(3) : null;
}

function selectedColumns(url, row) {
  const select = url.searchParams.get("select");
  if (!select) return row;
  return Object.fromEntries(
    select
      .split(",")
      .filter((column) => column in row)
      .map((column) => [column, row[column]]),
  );
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
    sendJson(request, response, 200, meetingRooms, {
      "content-range": `0-${meetingRooms.length - 1}/${meetingRooms.length}`,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/rest/v1/equipments") {
    sendJson(request, response, 200, equipments);
    return;
  }

  if (request.method === "GET" && url.pathname === "/rest/v1/drinks") {
    sendJson(request, response, 200, drinks);
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/rest/v1/rpc/create_estimate"
  ) {
    const user = authenticatedUser(request);
    if (!user) {
      sendJson(request, response, 401, {
        code: "42501",
        message: "ログインが必要です",
      });
      return;
    }

    const body = await readJson(request);
    const room = meetingRooms.find(
      (candidate) => candidate.id === body.p_meeting_room_id,
    );
    if (!room) {
      sendJson(request, response, 400, {
        code: "22023",
        message: "選択された会議室は利用できません",
      });
      return;
    }

    const equipmentSelections = body.p_equipments ?? [];
    const drinkSelections = body.p_drinks ?? [];
    const equipmentFee = equipmentSelections.reduce((total, selection) => {
      const item = equipments.find(
        (candidate) => candidate.id === selection.id,
      );
      return total + (item?.unit_price ?? 0) * selection.quantity;
    }, 0);
    const drinkFee = drinkSelections.reduce((total, selection) => {
      const item = drinks.find((candidate) => candidate.id === selection.id);
      return total + (item?.unit_price ?? 0) * selection.quantity;
    }, 0);
    const roomFee = room.hourly_rate * body.p_usage_hours;
    const id = estimates.length + 1;
    const createdAt = nowIso();

    estimates.push({
      id,
      user_id: user.id,
      created_at: createdAt,
      company_name_snapshot: room.facilities.companies.name,
      facility_name_snapshot: room.facilities.name,
      meeting_room_name_snapshot: room.name,
      hourly_rate_snapshot: room.hourly_rate,
      usage_hours: body.p_usage_hours,
      number_of_people: body.p_number_of_people,
      room_fee: roomFee,
      equipment_fee: equipmentFee,
      drink_fee: drinkFee,
      total_amount: roomFee + equipmentFee + drinkFee,
    });
    equipmentSelections.forEach((selection) => {
      const item = equipments.find(
        (candidate) => candidate.id === selection.id,
      );
      if (!item) return;
      estimateEquipments.push({
        id: estimateEquipments.length + 1,
        estimate_id: id,
        equipment_name_snapshot: item.name,
        unit_price: item.unit_price,
        quantity: selection.quantity,
      });
    });
    drinkSelections.forEach((selection) => {
      const item = drinks.find((candidate) => candidate.id === selection.id);
      if (!item) return;
      estimateDrinks.push({
        id: estimateDrinks.length + 1,
        estimate_id: id,
        drink_name_snapshot: item.name,
        unit_price: item.unit_price,
        quantity: selection.quantity,
      });
    });

    sendJson(request, response, 200, id);
    return;
  }

  if (request.method === "GET" && url.pathname === "/rest/v1/estimates") {
    const user = authenticatedUser(request);
    if (!user) {
      sendJson(request, response, 401, {
        code: "PGRST301",
        message: "Invalid JWT",
      });
      return;
    }

    const requestedId = equalsFilter(url, "id");
    const rows = estimates
      .filter((estimate) => estimate.user_id === user.id)
      .filter(
        (estimate) =>
          requestedId === null || estimate.id === Number(requestedId),
      )
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
      .map((estimate) => selectedColumns(url, estimate));
    const wantsObject = request.headers.accept?.includes(
      "application/vnd.pgrst.object+json",
    );
    if (wantsObject && rows.length === 0) {
      sendJson(request, response, 406, {
        code: "PGRST116",
        details: "The result contains 0 rows",
        message: "JSON object requested, multiple (or no) rows returned",
      });
      return;
    }
    sendJson(request, response, 200, wantsObject ? rows[0] : rows);
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === "/rest/v1/estimate_equipments"
  ) {
    const user = authenticatedUser(request);
    const estimateId = Number(equalsFilter(url, "estimate_id"));
    const ownsEstimate = estimates.some(
      (estimate) => estimate.id === estimateId && estimate.user_id === user?.id,
    );
    const rows = ownsEstimate
      ? estimateEquipments
          .filter((item) => item.estimate_id === estimateId)
          .map((item) => selectedColumns(url, item))
      : [];
    sendJson(request, response, 200, rows);
    return;
  }

  if (request.method === "GET" && url.pathname === "/rest/v1/estimate_drinks") {
    const user = authenticatedUser(request);
    const estimateId = Number(equalsFilter(url, "estimate_id"));
    const ownsEstimate = estimates.some(
      (estimate) => estimate.id === estimateId && estimate.user_id === user?.id,
    );
    const rows = ownsEstimate
      ? estimateDrinks
          .filter((item) => item.estimate_id === estimateId)
          .map((item) => selectedColumns(url, item))
      : [];
    sendJson(request, response, 200, rows);
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
