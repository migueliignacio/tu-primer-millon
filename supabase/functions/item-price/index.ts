const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-retry-count",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let itemId: unknown;
  try {
    ({ itemId } = await request.json());
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!Number.isSafeInteger(itemId) || (itemId as number) <= 0) {
    return json({ error: "Invalid itemId" }, 400);
  }

  const apiKey = Deno.env.get("UNDERMINE_API_KEY");
  if (!apiKey) return json({ error: "Price service unavailable" }, 503);

  try {
    const response = await fetch(
      `https://api.undermine.exchange/v1/region/us/commodities/${itemId}/now.json`,
      { headers: { Authorization: `ApiKey ${apiKey}`, Accept: "application/json" } },
    );
    if (!response.ok) {
      return json({ error: "Price lookup failed", status: response.status }, 502);
    }

    const payload = await response.json();
    const item = payload?.result;
    if (!item || typeof item.price !== "number") {
      return json({ error: "Price data unavailable" }, 502);
    }

    return json({
      marketValue: item.price,
      quantity: item.quantity,
      lastUpdated: item.lastUpdated,
    });
  } catch {
    return json({ error: "Price lookup failed" }, 502);
  }
});
