// Relay: o trigger trg_sync_order_to_platform (service_orders) chama esta funcao
// a cada insert/update de OS. Ela repassa o evento para tracker-order-sync no
// projeto SSGEN Client, que tem as chaves da Platform e do Tracker e faz:
//   upsert da OS na Platform (mesmo client_id) + ingestao automatica do arquivo de resultado.
// Usa so secrets que o Tracker ja tem: SSGEN_CLIENT_URL e SSGEN_CLIENT_SERVICE_ROLE_KEY.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SSGEN_CLIENT_URL = Deno.env.get("SSGEN_CLIENT_URL") ?? "";
const SSGEN_CLIENT_KEY = Deno.env.get("SSGEN_CLIENT_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const res = await fetch(`${SSGEN_CLIENT_URL}/functions/v1/tracker-order-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SSGEN_CLIENT_KEY}`,
        apikey: SSGEN_CLIENT_KEY,
        "Content-Type": "application/json",
      },
      body,
    });
    const out = await res.text();
    console.log(`[sync] relay ${res.status}: ${out.slice(0, 300)}`);
    return new Response(out, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync relay error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
