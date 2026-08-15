const { assessRequest, fillPath, paginationParams } = require("./request");

function normalizeSearch(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [data];
}

function performOperation(op) {
  return async (z, bundle) => {
    const input = bundle.inputData || {};
    const path = fillPath(op.path, input);
    const params = op.paginated ? paginationParams(input) : undefined;
    const body = op.buildBody ? op.buildBody(input) : undefined;
    const data = await assessRequest(z, bundle, {
      method: op.method,
      path,
      body,
      params,
    });
    if (op.kind === "search") {
      return normalizeSearch(data);
    }
    if (data == null) {
      return { ok: true, resource: op.resource, operation: op.operation };
    }
    return data;
  };
}

function toZapier(op, key) {
  const def = {
    key,
    noun: op.noun,
    display: {
      label: op.label,
      description: op.description,
    },
    operation: {
      inputFields: op.inputFields || [],
      perform: performOperation(op),
      sample: op.sample || { id: "sample" },
    },
  };
  return def;
}

function registerCatalog(catalog, zapierKey) {
  const creates = {};
  const searches = {};
  for (const op of catalog) {
    const key = zapierKey(op);
    const def = toZapier(op, key);
    if (op.kind === "search") searches[key] = def;
    else creates[key] = def;
  }
  return { creates, searches };
}

module.exports = { performOperation, toZapier, registerCatalog, normalizeSearch };
