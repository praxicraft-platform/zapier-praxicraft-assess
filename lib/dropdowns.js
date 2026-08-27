const { assessRequest, asList } = require("./request");

const PAGE = { page_size: 100 };

async function listPath(z, bundle, path, params = {}) {
  const data = await assessRequest(z, bundle, {
    method: "GET",
    path,
    params: { ...PAGE, ...params },
  });
  return asList(data);
}

function labelled(rows, labelFor) {
  return rows.map((row) => ({ ...row, label: labelFor(row) }));
}

function hiddenTrigger(key, noun, sample, perform) {
  return {
    key,
    noun,
    display: {
      label: `New ${noun}`,
      description: `Hidden. Powers ${noun.toLowerCase()} dropdowns.`,
      hidden: true,
    },
    operation: { perform, sample },
  };
}

const hidden_assessment = hiddenTrigger(
  "hidden_assessment",
  "Assessment",
  { slug: "senior-backend-screen", title: "Senior Backend", label: "Senior Backend" },
  async (z, bundle) =>
    labelled(await listPath(z, bundle, "/assessments/"), (row) => row.title || row.slug || row.id),
);

const hidden_org_task = hiddenTrigger(
  "hidden_org_task",
  "Task",
  { id: "task-uuid", title: "MCQ", label: "MCQ" },
  async (z, bundle) => labelled(await listPath(z, bundle, "/tasks/"), (row) => row.title || row.id),
);

const hidden_all_task = hiddenTrigger(
  "hidden_all_task",
  "Task",
  { id: "task-uuid", title: "MCQ", label: "MCQ (org)" },
  async (z, bundle) => {
    const org = labelled(await listPath(z, bundle, "/tasks/"), (row) => `${row.title || row.id} (org)`);
    let library = [];
    try {
      library = labelled(await listPath(z, bundle, "/platform-tasks/"), (row) => `${row.title || row.id} (library)`);
    } catch {
      library = [];
    }
    return org.concat(library);
  },
);

const hidden_assessment_task = hiddenTrigger(
  "hidden_assessment_task",
  "Task",
  { id: "task-uuid", title: "SQL joins", label: "SQL joins" },
  async (z, bundle) => {
    const slug = bundle.inputData && bundle.inputData.slug;
    if (!slug) return [];
    const rows = await listPath(z, bundle, `/assessments/${encodeURIComponent(slug)}/tasks/`);
    return labelled(rows, (row) => row.title || row.id);
  },
);

const hidden_invitation = hiddenTrigger(
  "hidden_invitation",
  "Invitation",
  { invite_token: "inv_abc", email: "ada@example.com", status: "pending", label: "ada@example.com · pending" },
  async (z, bundle) =>
    labelled(await listPath(z, bundle, "/invites/"), (row) =>
      [row.email, row.status].filter(Boolean).join(" · ") || row.invite_token,
    ),
);

const hidden_pipeline = hiddenTrigger(
  "hidden_pipeline",
  "Pipeline",
  { slug: "grad-2025", name: "Grad 2025", label: "Grad 2025" },
  async (z, bundle) => labelled(await listPath(z, bundle, "/pipelines/"), (row) => row.name || row.slug),
);

const hidden_enrollment = hiddenTrigger(
  "hidden_enrollment",
  "Enrollment",
  { id: "enr_abc", email: "ada@example.com", status: "active", label: "ada@example.com · active" },
  async (z, bundle) => {
    const slug = bundle.inputData && bundle.inputData.slug;
    if (!slug) return [];
    const rows = await listPath(z, bundle, `/pipelines/${encodeURIComponent(slug)}/enrollments/`);
    return labelled(rows, (row) => [row.email, row.status].filter(Boolean).join(" · ") || row.id);
  },
);

const hidden_webhook = hiddenTrigger(
  "hidden_webhook",
  "Webhook",
  { id: "wh_abc", name: "Zapier", url: "https://example.com/hook", label: "Zapier" },
  async (z, bundle) => labelled(await listPath(z, bundle, "/webhooks/"), (row) => row.name || row.url || row.id),
);

const hidden_interview = hiddenTrigger(
  "hidden_interview",
  "Interview",
  { id: "room-uuid", title: "AI Screen", candidate_email: "ada@example.com", label: "AI Screen" },
  async (z, bundle) =>
    labelled(await listPath(z, bundle, "/interviews/"), (row) => row.title || row.candidate_email || row.id),
);

const hidden_interview_template = hiddenTrigger(
  "hidden_interview_template",
  "Template",
  { id: "tpl-uuid", name: "Backend screen", label: "Backend screen" },
  async (z, bundle) => labelled(await listPath(z, bundle, "/interviews/templates/"), (row) => row.name || row.id),
);

const hidden_squad = hiddenTrigger(
  "hidden_squad",
  "Squad",
  { id: "squad-uuid", name: "Growth", label: "Growth" },
  async (z, bundle) => labelled(await listPath(z, bundle, "/org/squads/"), (row) => row.name || row.id),
);

const dropdownTriggers = {
  hidden_assessment,
  hidden_org_task,
  hidden_all_task,
  hidden_assessment_task,
  hidden_invitation,
  hidden_pipeline,
  hidden_enrollment,
  hidden_webhook,
  hidden_interview,
  hidden_interview_template,
  hidden_squad,
};

module.exports = { dropdownTriggers, listPath };
