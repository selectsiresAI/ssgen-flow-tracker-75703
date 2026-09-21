const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_URL = "https://odactdxpecpiyiyaqfgi.supabase.co";
const PLATFORM_SR = Deno.env.get("PLATFORM_SERVICE_ROLE_KEY") ?? "";

const TRACKER_URL = "https://cevsigsqiroeomtbrzpe.supabase.co";
const TRACKER_SR = Deno.env.get("TRACKER_SERVICE_ROLE_KEY") ?? "";

const hdrs = (key: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

async function platformGet(path: string) {
  const res = await fetch(`${PLATFORM_URL}/rest/v1/${path}`, {
    headers: hdrs(PLATFORM_SR),
  });
  return res.json();
}

async function platformPost(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${PLATFORM_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...hdrs(PLATFORM_SR), Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function platformPatch(
  table: string,
  filter: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`${PLATFORM_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { ...hdrs(PLATFORM_SR), Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function trackerGet(path: string) {
  const res = await fetch(`${TRACKER_URL}/rest/v1/${path}`, {
    headers: hdrs(TRACKER_SR),
  });
  return res.json();
}

async function trackerPatch(
  table: string,
  filter: string,
  body: Record<string, unknown>,
) {
  await fetch(`${TRACKER_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { ...hdrs(TRACKER_SR), Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
}

async function findClientInPlatform(
  trackerClientId: string,
): Promise<{ id: string | null; error: string | null; clientName: string }> {
  const clients = await trackerGet(
    `clients?id=eq.${trackerClientId}&select=nome,cpf_cnpj&limit=1`,
  );
  const tc = Array.isArray(clients) ? clients[0] : null;
  if (!tc?.nome) {
    return { id: null, error: "Cliente sem nome no Tracker", clientName: "" };
  }

  const name = tc.nome.trim();

  // 1. Try exact name match
  const byName = await platformGet(
    `clients?nome=ilike.${encodeURIComponent(name)}&select=id&limit=1`,
  );
  if (Array.isArray(byName) && byName.length > 0) {
    return { id: byName[0].id, error: null, clientName: name };
  }

  // 2. Try CPF match as fallback
  if (tc.cpf_cnpj) {
    const byCpf = await platformGet(
      `clients?cpf_cnpj=eq.${encodeURIComponent(tc.cpf_cnpj)}&select=id,nome&limit=1`,
    );
    if (Array.isArray(byCpf) && byCpf.length > 0) {
      return { id: byCpf[0].id, error: null, clientName: name };
    }
  }

  // 3. NOT FOUND — do NOT create, return error
  return {
    id: null,
    error: `Cliente "${name}" (CPF: ${tc.cpf_cnpj || "sem CPF"}) nao encontrado na Platform. Cadastre o cliente na Platform primeiro ou corrija o nome no Tracker para bater exatamente.`,
    clientName: name,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record) {
      return new Response(JSON.stringify({ error: "No record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (record.deleted_at || !record.client_id) {
      return new Response(
        JSON.stringify({ skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const osId = record.id;
    const osNum = record.ordem_servico_ssgen;

    // Find client in Platform — NO auto-creation
    const { id: platformClientId, error: clientError } =
      await findClientInPlatform(record.client_id);

    if (!platformClientId) {
      // Write error back to Tracker OS
      await trackerPatch("service_orders", `id=eq.${osId}`, {
        sync_status: "erro",
        sync_error: clientError,
      });
      console.log(`[sync] OS ${osNum} ERRO: ${clientError}`);
      return new Response(
        JSON.stringify({ error: clientError }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const existingOS = await platformGet(
      `service_orders?ordem_servico_ssgen=eq.${osNum}&select=id&limit=1`,
    );

    const orderData: Record<string, unknown> = {
      client_id: platformClientId,
      ordem_servico_ssgen: osNum,
      ordem_servico_neogen: record.ordem_servico_neogen || null,
      nome_produto: record.nome_produto || null,
      numero_amostras: record.numero_amostras || null,
      etapa_atual: record.etapa_atual || "Recebida",
      prioridade: record.prioridade || null,
      cra_data: record.cra_data || null,
      envio_planilha_data: record.envio_planilha_data || null,
      lpr_data: record.lpr_data || null,
      envio_resultados_data: record.envio_resultados_data || null,
      liberacao_data: record.liberacao_data || null,
      dt_faturamento: record.dt_faturamento || null,
      result_file_path: record.result_file_path || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (Array.isArray(existingOS) && existingOS.length > 0) {
      const updated = await platformPatch(
        "service_orders",
        `id=eq.${existingOS[0].id}`,
        orderData,
      );
      result = {
        action: "updated",
        id: Array.isArray(updated) ? updated[0]?.id : null,
      };
    } else {
      const inserted = await platformPost("service_orders", {
        ...orderData,
        created_at: record.created_at || new Date().toISOString(),
      });
      result = {
        action: "inserted",
        id: Array.isArray(inserted) ? inserted[0]?.id : null,
      };
    }

    // Write success back to Tracker OS
    await trackerPatch("service_orders", `id=eq.${osId}`, {
      sync_status: "ok",
      sync_error: null,
    });

    console.log(
      `[sync] OS ${osNum} ${result.action} => ${result.id ?? "FAIL"}`,
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
