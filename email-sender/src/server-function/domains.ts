/**
 * Server function for domain management.
 * Accessible at /server-function/domains (POST)
 *
 * Supports actions: list, get, create, verify, delete
 *
 * In BYOK mode, calls Resend API directly.
 * In managed mode, proxies to the configured backend.
 */
export default async function domains(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { action, apiKey, ...params } = await req.json();

  if (apiKey) {
    return handleByok(action, apiKey, params);
  }

  return handleManaged(action, params);
}

async function handleManaged(
  action: string,
  params: Record<string, any>,
) {
  const backendUrl = process.env.BACKEND_URL;
  const pulseApiKey = process.env.PULSE_API_KEY;
  if (!backendUrl || !pulseApiKey) {
    return jsonError("Managed service not configured", 500);
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${pulseApiKey}`,
  };

  let response: Response;

  switch (action) {
    case "list": {
      response = await fetch(`${backendUrl}/api/email/domains`, {
        method: "GET",
        headers,
      });
      break;
    }
    case "get": {
      if (!params.domainId) {
        return jsonError("Missing required field: domainId", 400);
      }
      // The managed backend list endpoint returns all domains;
      // filter client-side or fetch all and find by ID
      response = await fetch(`${backendUrl}/api/email/domains`, {
        method: "GET",
        headers,
      });
      if (response.ok) {
        const allDomains = await response.json();
        const domain = allDomains.find(
          (d: any) => d.id === params.domainId,
        );
        if (!domain) {
          return jsonError("Domain not found", 404);
        }
        return jsonOk(domain);
      }
      break;
    }
    case "create": {
      if (!params.name) {
        return jsonError("Missing required field: name", 400);
      }
      response = await fetch(`${backendUrl}/api/email/domains`, {
        method: "POST",
        headers,
        body: JSON.stringify({ domain: params.name }),
      });
      break;
    }
    case "verify": {
      if (!params.domainId) {
        return jsonError("Missing required field: domainId", 400);
      }
      response = await fetch(`${backendUrl}/api/email/domains/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify({ domainId: params.domainId }),
      });
      break;
    }
    case "delete": {
      if (!params.domainId) {
        return jsonError("Missing required field: domainId", 400);
      }
      response = await fetch(
        `${backendUrl}/api/email/domains?id=${params.domainId}`,
        { method: "DELETE", headers },
      );
      break;
    }
    default:
      return jsonError(`Unknown action: ${action}`, 400);
  }

  const data = await response.json();
  if (!response.ok) {
    return new Response(JSON.stringify({ error: data.error || data }), {
      status: response.status,
    });
  }
  return jsonOk(data);
}

async function handleByok(
  action: string,
  apiKey: string,
  params: Record<string, any>,
) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const base = "https://api.resend.com/domains";

  let response: Response;

  switch (action) {
    case "list": {
      const qs = new URLSearchParams();
      if (params.limit) qs.set("limit", String(params.limit));
      if (params.after) qs.set("after", params.after);
      if (params.before) qs.set("before", params.before);
      const url = qs.toString() ? `${base}?${qs}` : base;
      response = await fetch(url, { method: "GET", headers });
      break;
    }
    case "get": {
      if (!params.domainId) {
        return jsonError("Missing required field: domainId", 400);
      }
      response = await fetch(`${base}/${params.domainId}`, {
        method: "GET",
        headers,
      });
      break;
    }
    case "create": {
      if (!params.name) {
        return jsonError("Missing required field: name", 400);
      }
      const body: Record<string, unknown> = { name: params.name };
      if (params.region) body.region = params.region;
      if (params.custom_return_path)
        body.custom_return_path = params.custom_return_path;
      if (params.click_tracking !== undefined)
        body.click_tracking = params.click_tracking;
      if (params.open_tracking !== undefined)
        body.open_tracking = params.open_tracking;
      if (params.tls) body.tls = params.tls;
      if (params.capabilities) body.capabilities = params.capabilities;
      response = await fetch(base, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      break;
    }
    case "verify": {
      if (!params.domainId) {
        return jsonError("Missing required field: domainId", 400);
      }
      response = await fetch(`${base}/${params.domainId}/verify`, {
        method: "POST",
        headers,
      });
      break;
    }
    case "delete": {
      if (!params.domainId) {
        return jsonError("Missing required field: domainId", 400);
      }
      response = await fetch(`${base}/${params.domainId}`, {
        method: "DELETE",
        headers,
      });
      break;
    }
    default:
      return jsonError(`Unknown action: ${action}`, 400);
  }

  const data = await response.json();
  if (!response.ok) {
    return new Response(JSON.stringify({ error: data }), {
      status: response.status,
    });
  }
  return jsonOk(data);
}

function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
