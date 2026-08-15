const DEFAULT_BASE = "https://assess.praxicraft.com";

function baseUrl(bundle) {
  const raw = (bundle.authData.base_url || DEFAULT_BASE).replace(/\/$/, "");
  return raw;
}

function publicUrl(bundle, path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl(bundle)}/api/v1/public${p}`;
}

function unwrap(body) {
  if (body == null || body === "") return null;
  if (typeof body !== "object") return { value: body };
  if (typeof body.status === "string" && Object.prototype.hasOwnProperty.call(body, "data")) {
    if (body.status === "success" || body.status === "ok") {
      return body.data ?? null;
    }
  }
  return body;
}

function asList(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [data];
}

async function assessRequest(z, bundle, { method, path, body, params }) {
  const options = {
    method,
    url: publicUrl(bundle, path),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  };
  if (params && Object.keys(params).length) {
    options.params = params;
  }
  if (body && method !== "GET" && method !== "HEAD") {
    options.headers["Content-Type"] = "application/json";
    options.body = body;
    options.json = true;
  }

  const response = await z.request(options);
  if (response.status >= 400) {
    const err = response.json && response.json.error;
    const message = err && err.message ? err.message : `Assess API ${response.status}`;
    const code = err && err.code ? err.code : String(response.status);
    throw new z.errors.Error(message, code, response.status);
  }
  if (response.status === 204 || response.content === "") {
    return { ok: true };
  }
  return unwrap(response.json);
}

function fillPath(template, input) {
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const value = input[name];
    if (value == null || String(value).trim() === "") {
      throw new Error(`Missing path parameter: ${name}`);
    }
    return encodeURIComponent(String(value).trim());
  });
}

function paginationParams(input) {
  const params = {};
  if (input.cursor) params.cursor = input.cursor;
  if (input.page_size) params.page_size = input.page_size;
  return params;
}

module.exports = {
  DEFAULT_BASE,
  baseUrl,
  publicUrl,
  unwrap,
  asList,
  assessRequest,
  fillPath,
  paginationParams,
};
