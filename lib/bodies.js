const { ASSESS_WEBHOOK_EVENTS } = require("./events");

function omitEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}

function asBool(value, defaultValue) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return defaultValue;
}

function asNumber(value, fallback) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseJson(raw, label) {
  if (raw == null || raw === "") return undefined;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
}

function parseCommaIds(raw) {
  const parts = Array.isArray(raw) ? raw : String(raw || "").split(",");
  return parts.map((s) => String(s).trim()).filter(Boolean);
}

function parseCandidates(raw) {
  if (raw == null || raw === "") return [];
  if (typeof raw === "string") {
    const parsed = parseJson(raw, "Candidates");
    return parseCandidates(parsed);
  }
  if (!Array.isArray(raw)) {
    throw new Error("Candidates must be a JSON array of objects with an email field.");
  }
  const rows = raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const email = String(row.email || "").trim();
      if (!email) return null;
      const out = { email };
      if (row.name) out.name = String(row.name).trim();
      if (row.resume_text) out.resume_text = String(row.resume_text);
      if (row.external_id) out.external_id = String(row.external_id).trim();
      return out;
    })
    .filter(Boolean);
  if (!rows.length) {
    throw new Error("Candidates must be a JSON array of objects with an email field.");
  }
  return rows;
}

function assessmentBody(input, mode) {
  const body = {};
  if (mode === "create") {
    body.title = input.title;
    if (input.description) body.description = input.description;
    body.time_limit_minutes = asNumber(input.time_limit_minutes, 60);
    body.passing_score = asNumber(input.passing_score, 70);
  } else {
    if (input.title) body.title = input.title;
    if (input.description) body.description = input.description;
    if (input.status) body.status = input.status;
  }
  if (input.proctoring_enabled != null && input.proctoring_enabled !== "") {
    body.proctoring_enabled = asBool(input.proctoring_enabled, false);
  }
  if (input.team_id) body.team_id = input.team_id;
  return omitEmpty(body);
}

function taskBody(input, mode) {
  const body = {};
  if (mode === "create") {
    body.title = input.title;
    body.task_type = input.task_type || "mcq";
    body.difficulty = input.difficulty || "medium";
    body.points = asNumber(input.points, 10);
    body.question = input.question || "";
    body.description = input.description || "";
  } else {
    if (input.title) body.title = input.title;
    if (input.question) body.question = input.question;
    if (input.description) body.description = input.description;
    if (input.task_type) body.task_type = input.task_type;
    if (input.difficulty) body.difficulty = input.difficulty;
    if (input.points != null && input.points !== "") body.points = asNumber(input.points, undefined);
  }
  if (input.tags) body.tags = parseCommaIds(input.tags);
  if (input.language) body.language = input.language;
  if (input.starter_code) body.starter_code = input.starter_code;
  if (input.expected_output) body.expected_output = input.expected_output;
  if (input.rubric) body.rubric = input.rubric;
  if (input.allow_multiple != null && input.allow_multiple !== "") {
    body.allow_multiple = asBool(input.allow_multiple, false);
  }
  if (input.options_json) {
    const options = parseJson(input.options_json, "MCQ Options JSON");
    if (options !== undefined) body.options = options;
  }
  return omitEmpty(body);
}

function webhookBody(input, mode) {
  const body = {};
  if (mode === "create") {
    body.url = input.url;
    body.events = Array.isArray(input.events) ? input.events : parseCommaIds(input.events);
  } else {
    if (input.url) body.url = input.url;
    if (input.events) body.events = Array.isArray(input.events) ? input.events : parseCommaIds(input.events);
    if (input.is_active === true || input.is_active === "true") body.is_active = true;
    if (input.is_active === false || input.is_active === "false") body.is_active = false;
  }
  if (input.name) body.name = input.name;
  return omitEmpty(body);
}

function interviewBody(input, mode) {
  const body = {
    title: input.title || "AI Screening Interview",
    interviewer_mode: input.interviewer_mode || "ai_only",
    interview_type: input.interview_type || "mixed",
    send_invite: asBool(input.send_invite, true),
  };
  if (input.job_description) body.job_description = input.job_description;
  if (input.resume_text) body.resume_text = input.resume_text;
  if (input.scheduled_at) body.scheduled_at = input.scheduled_at;
  if (input.coding_task_ids) body.coding_task_ids = parseCommaIds(input.coding_task_ids);
  if (input.org_task_ids) body.org_task_ids = parseCommaIds(input.org_task_ids);
  if (input.target_role) body.target_role = input.target_role;
  if (input.target_company) body.target_company = input.target_company;
  if (input.time_limit_minutes) body.time_limit_minutes = asNumber(input.time_limit_minutes, undefined);
  if (input.difficulty) body.difficulty = input.difficulty;
  if (mode === "create") {
    body.candidate_email = input.candidate_email;
    if (input.candidate_name) body.candidate_name = input.candidate_name;
  } else {
    body.candidates = parseCandidates(input.candidates);
  }
  return omitEmpty(body);
}

function templateBody(input, mode) {
  const body = {};
  if (mode === "create") {
    body.name = input.name;
    body.config = parseJson(input.config_json, "Config JSON") || {};
  } else {
    if (input.name) body.name = input.name;
    if (input.config_json) body.config = parseJson(input.config_json, "Config JSON");
  }
  return omitEmpty(body);
}

const eventChoices = ASSESS_WEBHOOK_EVENTS.map((e) => ({ label: e.label, value: e.value, sample: e.value }));

module.exports = {
  omitEmpty,
  asBool,
  asNumber,
  parseJson,
  parseCommaIds,
  parseCandidates,
  assessmentBody,
  taskBody,
  webhookBody,
  interviewBody,
  templateBody,
  eventChoices,
};
