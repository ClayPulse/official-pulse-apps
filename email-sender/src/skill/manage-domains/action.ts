/**
 * @typedef {Object} Input - The input parameters for domain management.
 * @property {"list" | "get" | "create" | "verify" | "delete"} action - The domain action to perform.
 * @property {string} [apiKey] - Resend API key (optional, uses Pulse Editor managed service if omitted).
 * @property {string} [domainId] - The domain ID (required for get, verify, delete).
 * @property {string} [name] - The domain name (required for create).
 * @property {string} [region] - Region for email sending (optional, for create).
 */
type Input = {
  action: "list" | "get" | "create" | "verify" | "delete";
  apiKey?: string;
  domainId?: string;
  name?: string;
  region?: string;
};

/**
 * @typedef {Object} Output - The output of the domain management action.
 * @property {boolean} success - Whether the operation succeeded.
 * @property {any} [data] - The normalized response data.
 * @property {string} [error] - Error message if the operation failed.
 */
type Output = {
  success: boolean;
  data?: any;
  error?: string;
};

/**
 * Normalize a domain object so the UI always sees { name, records, ... }
 * regardless of whether the source is BYOK (Resend API) or managed (Pulse Editor backend).
 */
function normalizeDomain(d: any): any {
  return {
    ...d,
    name: d.name || d.domain,
    records: d.records || d.dnsRecords,
  };
}

/**
 * Manage email sending domains via the Resend API or Pulse Editor backend.
 * Supports list, get, create, verify, and delete operations.
 *
 * @param {Input} input - The input parameters for domain management.
 *
 * @returns {Output} The result of the domain management operation.
 */
export default async function manageDomains(input: Input): Promise<Output> {
  const { apiKey, ...params } = input;

  const response = await fetch("/server-function/domains", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, ...(apiKey ? { apiKey } : {}) }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: JSON.stringify(data.error) };
  }

  // Normalize response shapes between BYOK (Resend API) and managed (Pulse Editor backend)
  if (input.action === "list") {
    // BYOK returns { data: [...] }, managed returns [...]
    const items = Array.isArray(data) ? data : data.data || [];
    return { success: true, data: items.map(normalizeDomain) };
  }

  if (input.action === "get" || input.action === "create") {
    return { success: true, data: normalizeDomain(data) };
  }

  return { success: true, data };
}
