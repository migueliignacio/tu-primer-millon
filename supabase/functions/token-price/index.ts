const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-retry-count",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PriceData = {
  price: number; // Blizzard devuelve cobre; 10 000 cobre = 1 oro.
  lastUpdated: number | null; // Marca de tiempo Unix en milisegundos.
  region: "us";
};

let cachedToken: { value: string; expiresAt: number } | null = null;
let cachedPrice: { value: PriceData; expiresAt: number } | null = null;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const clientId = Deno.env.get("BLIZZARD_CLIENT_ID");
  const clientSecret = Deno.env.get("BLIZZARD_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("BLIZZARD_CREDENTIALS_MISSING");
  }

  const response = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("BLIZZARD_AUTH_FAILED");

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!payload.access_token) throw new Error("BLIZZARD_AUTH_FAILED");

  const lifetime = typeof payload.expires_in === "number" && Number.isFinite(payload.expires_in)
    ? Math.max(0, (payload.expires_in as number) - 60)
    : 0;
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + lifetime * 1000,
  };
  return payload.access_token;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  if (cachedPrice && Date.now() < cachedPrice.expiresAt) {
    return json(cachedPrice.value);
  }

  try {
    const token = await getAccessToken();
    const response = await fetch(
      "https://us.api.blizzard.com/data/wow/token/index?namespace=dynamic-us&locale=en_US",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (response.status === 401) cachedToken = null;
    if (!response.ok) return json({ error: "Blizzard no devolvió el precio" }, 502);

    const payload = (await response.json()) as {
      price?: number;
      last_updated_timestamp?: number;
    };
    if (typeof payload.price !== "number" || !Number.isSafeInteger(payload.price) || payload.price < 0) {
      return json({ error: "Precio de token no disponible" }, 502);
    }

    const data: PriceData = {
      price: payload.price,
      lastUpdated: typeof payload.last_updated_timestamp === "number" && Number.isSafeInteger(payload.last_updated_timestamp)
        ? payload.last_updated_timestamp
        : null,
      region: "us",
    };
    cachedPrice = { value: data, expiresAt: Date.now() + 5 * 60 * 1000 };
    return json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "BLIZZARD_CREDENTIALS_MISSING") {
      return json({ error: "Faltan las credenciales de Blizzard en Supabase" }, 503);
    }
    return json({ error: "No se pudo consultar el precio del WoW Token" }, 502);
  }
});
