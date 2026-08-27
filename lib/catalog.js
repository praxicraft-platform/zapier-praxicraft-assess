const {
  assessmentBody,
  taskBody,
  webhookBody,
  interviewBody,
  templateBody,
  parseCommaIds,
  parseCandidates,
  eventChoices,
  asBool,
  asNumber,
} = require("./bodies");

const f = (key, label, extra = {}) => {
  const field = {
    key,
    label,
    type: extra.type || "string",
    required: Boolean(extra.required),
  };
  if (extra.helpText) field.helpText = extra.helpText;
  if (extra.choices) field.choices = extra.choices;
  if (extra.list) field.list = extra.list;
  if (extra.default !== undefined) field.default = extra.default;
  if (extra.altersDynamicFields) field.altersDynamicFields = extra.altersDynamicFields;
  if (extra.dynamic) field.dynamic = extra.dynamic;
  if (extra.search) field.search = extra.search;
  return field;
};

const slug = f("slug", "Assessment", {
  required: true,
  dynamic: "hidden_assessment.slug.label",
  search: "assessment_get.slug",
  altersDynamicFields: true,
  helpText: "Pick an assessment, or map a slug from a previous step.",
});
const cursor = f("cursor", "Cursor", { helpText: "Pagination cursor" });
const pageSize = f("page_size", "Page Size", { type: "integer", helpText: "Default 20, max 100" });
const taskId = f("id", "Task", {
  required: true,
  dynamic: "hidden_org_task.id.label",
  search: "task_get.id",
  helpText: "Pick an organisation task, or map a task UUID.",
});
const token = f("token", "Invitation", {
  required: true,
  dynamic: "hidden_invitation.invite_token.label",
  search: "invitation_get.token",
  helpText: "Pick an invitation, or map invite_token from a previous step.",
});
const pipelineSlug = f("slug", "Pipeline", {
  required: true,
  dynamic: "hidden_pipeline.slug.label",
  search: "pipeline_get.slug",
  altersDynamicFields: true,
  helpText: "Pick a pipeline, or map a slug from a previous step.",
});
const pipelinePicker = f("slug", "Pipeline", {
  dynamic: "hidden_pipeline.slug.label",
  search: "pipeline_get.slug",
  altersDynamicFields: true,
  helpText: "Optional. Limits the enrollment dropdown. You can still map a custom enrollment id.",
});
const enrollmentId = f("id", "Enrollment", {
  required: true,
  dynamic: "hidden_enrollment.id.label",
  search: "pipeline_get_enrollment.id",
  helpText: "Pick a pipeline first, or map an enrollment id.",
});
const webhookId = f("id", "Webhook", {
  required: true,
  dynamic: "hidden_webhook.id.label",
  search: "webhook_get.id",
});
const squadId = f("id", "Squad", {
  required: true,
  dynamic: "hidden_squad.id.label",
  search: "organisation_get_squad.id",
});
const interviewId = f("id", "Interview", {
  required: true,
  dynamic: "hidden_interview.id.label",
  search: "interview_get.id",
});
const templateId = f("id", "Template", {
  required: true,
  dynamic: "hidden_interview_template.id.label",
});
const provider = f("provider", "ATS Provider", {
  required: true,
  choices: [
    { label: "Greenhouse", value: "greenhouse", sample: "greenhouse" },
    { label: "Lever", value: "lever", sample: "lever" },
    { label: "Ashby", value: "ashby", sample: "ashby" },
    { label: "Workday", value: "workday", sample: "workday" },
    { label: "BambooHR", value: "bamboohr", sample: "bamboohr" },
  ],
});
const email = f("email", "Email", { required: true });
const name = f("name", "Name");
const sendEmail = f("send_email", "Send Email", { type: "boolean", default: "false" });
const expiresDays = f("expires_days", "Expires (Days)", { type: "integer", default: "7" });
const taskIds = f("taskIds", "Tasks", {
  required: true,
  list: true,
  dynamic: "hidden_all_task.id.label",
  helpText: "Select org or library tasks. You can also map task UUIDs from a previous step.",
});

function tasksPayloadFromIds(input) {
  const ids = parseCommaIds(input.taskIds || input.task_ids || "");
  return {
    tasks: ids.map((task_id) => ({ task_id, source: "platform" })),
  };
}
const candidates = f("candidates", "Candidates JSON", {
  required: true,
  helpText: 'JSON array: [{"email":"a@b.com","name":"Ada"}]',
});
const connectedAccount = f("connected", "Use connected account", {
  helpText: "Leave blank. This step returns data for the connected Assess organisation.",
});

const CATALOG = [
  { resource: "assessment", operation: "list", kind: "search", noun: "Assessment", label: "Find Assessments", description: "List assessments in the organisation.", method: "GET", path: "/assessments/", paginated: true, inputFields: [cursor, pageSize], sample: { slug: "senior-backend-screen", title: "Senior Backend", status: "active" } },
  { resource: "assessment", operation: "get", kind: "search", noun: "Assessment", label: "Find Assessment", description: "Get one assessment by slug.", method: "GET", path: "/assessments/{slug}/", inputFields: [slug], sample: { slug: "senior-backend-screen", title: "Senior Backend" } },
  { resource: "assessment", operation: "create", kind: "create", noun: "Assessment", label: "Create Assessment", description: "Create an assessment.", method: "POST", path: "/assessments/create/", inputFields: [f("title", "Title", { required: true }), f("description", "Description"), f("time_limit_minutes", "Time Limit (Minutes)", { type: "integer", default: "60" }), f("passing_score", "Passing Score", { type: "integer", default: "70" }), f("team_id", "Squad", { dynamic: "hidden_squad.id.label", search: "organisation_get_squad.id" })], buildBody: (i) => assessmentBody(i, "create"), sample: { slug: "senior-backend-screen", title: "Senior Backend" } },
  { resource: "assessment", operation: "update", kind: "create", noun: "Assessment", label: "Update Assessment", description: "Update an assessment.", method: "PATCH", path: "/assessments/{slug}/update/", inputFields: [slug, f("title", "Title"), f("description", "Description"), f("status", "Status", { choices: [{ label: "Draft", value: "draft", sample: "draft" }, { label: "Active", value: "active", sample: "active" }, { label: "Archived", value: "archived", sample: "archived" }] })], buildBody: (i) => assessmentBody(i, "update"), sample: { slug: "senior-backend-screen", status: "active" } },
  { resource: "assessment", operation: "duplicate", kind: "create", noun: "Assessment", label: "Duplicate Assessment", description: "Duplicate an assessment.", method: "POST", path: "/assessments/{slug}/duplicate/", inputFields: [slug], sample: { slug: "senior-backend-screen-copy" } },
  { resource: "assessment", operation: "listResults", kind: "search", noun: "Result", label: "Find Assessment Results", description: "List results for an assessment.", method: "GET", path: "/assessments/{slug}/results/", paginated: true, inputFields: [slug, cursor, pageSize], sample: { invite_token: "inv_abc", overall_score: 82, passed: true } },
  { resource: "assessment", operation: "listTasks", kind: "search", noun: "Task", label: "Find Assessment Tasks", description: "List tasks attached to an assessment.", method: "GET", path: "/assessments/{slug}/tasks/", paginated: true, inputFields: [slug, cursor, pageSize], sample: { id: "task-uuid", title: "SQL joins" } },
  { resource: "assessment", operation: "attachTasks", kind: "create", noun: "Assessment", label: "Attach Tasks", description: "Attach tasks to an assessment.", method: "POST", path: "/assessments/{slug}/tasks/attach/", inputFields: [slug, taskIds], buildBody: tasksPayloadFromIds, sample: { ok: true } },
  { resource: "assessment", operation: "replaceTasks", kind: "create", noun: "Assessment", label: "Replace Tasks", description: "Replace all tasks on an assessment.", method: "PUT", path: "/assessments/{slug}/tasks/replace/", inputFields: [slug, taskIds], buildBody: tasksPayloadFromIds, sample: { ok: true } },
  { resource: "assessment", operation: "removeTask", kind: "create", noun: "Assessment", label: "Remove Task", description: "Remove one task from an assessment.", method: "DELETE", path: "/assessments/{slug}/tasks/remove/", inputFields: [slug, f("assessmentTaskId", "Assessment Task", { required: true, dynamic: "hidden_assessment_task.id.label" })], buildBody: (i) => ({ assessment_task_id: i.assessmentTaskId }), sample: { ok: true } },

  { resource: "task", operation: "list", kind: "search", noun: "Task", label: "Find Org Tasks", description: "List organisation tasks.", method: "GET", path: "/tasks/", paginated: true, inputFields: [cursor, pageSize], sample: { id: "task-uuid", title: "MCQ" } },
  { resource: "task", operation: "listPlatform", kind: "search", noun: "Task", label: "Find Platform Tasks", description: "List Praxicraft platform library tasks.", method: "GET", path: "/platform-tasks/", paginated: true, inputFields: [cursor, pageSize], sample: { id: "plat-uuid", title: "Python ETL" } },
  { resource: "task", operation: "create", kind: "create", noun: "Task", label: "Create Task", description: "Create an organisation task.", method: "POST", path: "/tasks/create/", inputFields: [f("title", "Title", { required: true }), f("task_type", "Task Type", { choices: [{ label: "MCQ", value: "mcq", sample: "mcq" }, { label: "Coding", value: "coding", sample: "coding" }, { label: "Text", value: "text", sample: "text" }], default: "mcq" }), f("difficulty", "Difficulty", { choices: [{ label: "Easy", value: "easy", sample: "easy" }, { label: "Medium", value: "medium", sample: "medium" }, { label: "Hard", value: "hard", sample: "hard" }], default: "medium" }), f("points", "Points", { type: "integer", default: "10" }), f("question", "Question"), f("description", "Description"), f("tags", "Tags"), f("options_json", "MCQ Options JSON")], buildBody: (i) => taskBody(i, "create"), sample: { id: "task-uuid", title: "MCQ" } },
  { resource: "task", operation: "get", kind: "search", noun: "Task", label: "Find Task", description: "Get an organisation task.", method: "GET", path: "/tasks/{id}/", inputFields: [taskId], sample: { id: "task-uuid", title: "MCQ" } },
  { resource: "task", operation: "update", kind: "create", noun: "Task", label: "Update Task", description: "Update an organisation task.", method: "PATCH", path: "/tasks/{id}/", inputFields: [taskId, f("title", "Title"), f("question", "Question"), f("description", "Description")], buildBody: (i) => taskBody(i, "update"), sample: { id: "task-uuid" } },
  { resource: "task", operation: "delete", kind: "create", noun: "Task", label: "Delete Task", description: "Delete an organisation task.", method: "DELETE", path: "/tasks/{id}/", inputFields: [taskId], sample: { ok: true } },

  { resource: "invitation", operation: "list", kind: "search", noun: "Invitation", label: "Find Invitations", description: "List invitations.", method: "GET", path: "/invites/", paginated: true, inputFields: [cursor, pageSize], sample: { invite_token: "inv_abc", email: "ada@example.com", status: "pending" } },
  { resource: "invitation", operation: "invite", kind: "create", noun: "Invitation", label: "Invite Candidate", description: "Invite a candidate to an active assessment.", method: "POST", path: "/assessments/{slug}/invites/", inputFields: [slug, email, name, sendEmail, expiresDays, f("external_id", "External ID", { helpText: "ATS candidate id. Retries with the same id return the existing invite." })], buildBody: (i) => {
    const body = { email: i.email, send_email: asBool(i.send_email, false), expires_days: asNumber(i.expires_days, 7) };
    if (i.name) body.name = i.name;
    if (i.external_id) body.external_id = i.external_id;
    return body;
  }, sample: { invite_token: "inv_abc", invite_url: "https://assess.praxicraft.com/take/inv_abc", email: "ada@example.com" } },
  { resource: "invitation", operation: "bulkInvite", kind: "create", noun: "Invitation", label: "Bulk Invite Candidates", description: "Invite many candidates to an assessment.", method: "POST", path: "/assessments/{slug}/invites/bulk/", inputFields: [slug, candidates, sendEmail, expiresDays], buildBody: (i) => ({ candidates: parseCandidates(i.candidates), send_email: asBool(i.send_email, false), expires_days: asNumber(i.expires_days, 7) }), sample: { invited: [], skipped: [] } },
  { resource: "invitation", operation: "get", kind: "search", noun: "Invitation", label: "Find Invitation", description: "Get an invitation by invite_token.", method: "GET", path: "/invites/{token}/", inputFields: [token], sample: { invite_token: "inv_abc", status: "pending" } },
  { resource: "invitation", operation: "getResult", kind: "search", noun: "Result", label: "Find Invitation Result", description: "Get the scored result for an invitation.", method: "GET", path: "/invites/{token}/result/", inputFields: [token], sample: { invite_token: "inv_abc", overall_score: 82, passed: true } },
  { resource: "invitation", operation: "remind", kind: "create", noun: "Invitation", label: "Remind Candidate", description: "Send an invitation reminder.", method: "POST", path: "/invites/{token}/remind/", inputFields: [token], sample: { ok: true } },
  { resource: "invitation", operation: "cancel", kind: "create", noun: "Invitation", label: "Cancel Invitation", description: "Cancel a pending invitation.", method: "DELETE", path: "/invites/{token}/", inputFields: [token], sample: { ok: true } },

  { resource: "pipeline", operation: "list", kind: "search", noun: "Pipeline", label: "Find Pipelines", description: "List pipelines.", method: "GET", path: "/pipelines/", paginated: true, inputFields: [cursor, pageSize], sample: { slug: "grad-2025", name: "Grad 2025" } },
  { resource: "pipeline", operation: "get", kind: "search", noun: "Pipeline", label: "Find Pipeline", description: "Get a pipeline by slug.", method: "GET", path: "/pipelines/{slug}/", inputFields: [pipelineSlug], sample: { slug: "grad-2025" } },
  { resource: "pipeline", operation: "enroll", kind: "create", noun: "Enrollment", label: "Enroll Candidate", description: "Enroll a candidate in a pipeline.", method: "POST", path: "/pipelines/{slug}/enroll/", inputFields: [pipelineSlug, email, name, sendEmail], buildBody: (i) => {
    const body = { email: i.email, send_email: asBool(i.send_email, false) };
    if (i.name) body.name = i.name;
    return body;
  }, sample: { id: "enr_abc", email: "ada@example.com" } },
  { resource: "pipeline", operation: "bulkEnroll", kind: "create", noun: "Enrollment", label: "Bulk Enroll Candidates", description: "Enroll many candidates in a pipeline.", method: "POST", path: "/pipelines/{slug}/enroll/bulk/", inputFields: [pipelineSlug, candidates, sendEmail], buildBody: (i) => ({ candidates: parseCandidates(i.candidates), send_email: asBool(i.send_email, false) }), sample: { enrolled: [], skipped: [] } },
  { resource: "pipeline", operation: "listEnrollments", kind: "search", noun: "Enrollment", label: "Find Enrollments", description: "List pipeline enrollments.", method: "GET", path: "/pipelines/{slug}/enrollments/", paginated: true, inputFields: [pipelineSlug, cursor, pageSize], sample: { id: "enr_abc", status: "active" } },
  { resource: "pipeline", operation: "getEnrollment", kind: "search", noun: "Enrollment", label: "Find Enrollment", description: "Get one enrollment.", method: "GET", path: "/pipelines/enrollments/{id}/", inputFields: [pipelinePicker, enrollmentId], sample: { id: "enr_abc" } },
  { resource: "pipeline", operation: "reject", kind: "create", noun: "Enrollment", label: "Reject Enrollment", description: "Reject a pipeline enrollment.", method: "POST", path: "/pipelines/enrollments/{id}/reject/", inputFields: [pipelinePicker, enrollmentId, f("reason", "Reason")], buildBody: (i) => (i.reason ? { reason: i.reason } : {}), sample: { id: "enr_abc", status: "rejected" } },
  { resource: "pipeline", operation: "hold", kind: "create", noun: "Enrollment", label: "Hold Enrollment", description: "Hold a pipeline enrollment.", method: "POST", path: "/pipelines/enrollments/{id}/hold/", inputFields: [pipelinePicker, enrollmentId], sample: { id: "enr_abc", status: "held" } },
  { resource: "pipeline", operation: "unhold", kind: "create", noun: "Enrollment", label: "Unhold Enrollment", description: "Unhold a pipeline enrollment.", method: "POST", path: "/pipelines/enrollments/{id}/unhold/", inputFields: [pipelinePicker, enrollmentId], sample: { id: "enr_abc", status: "active" } },

  { resource: "webhook", operation: "list", kind: "search", noun: "Webhook", label: "Find Webhooks", description: "List webhook destinations.", method: "GET", path: "/webhooks/", paginated: true, inputFields: [cursor, pageSize], sample: { id: "wh_abc", url: "https://example.com/hook" } },
  { resource: "webhook", operation: "create", kind: "create", noun: "Webhook", label: "Create Webhook", description: "Register a webhook destination.", method: "POST", path: "/webhooks/create/", inputFields: [f("url", "URL", { required: true }), f("events", "Events", { list: true, required: true, choices: eventChoices }), f("name", "Name")], buildBody: (i) => webhookBody(i, "create"), sample: { id: "wh_abc", secret_key: "whsec_xxx" } },
  { resource: "webhook", operation: "get", kind: "search", noun: "Webhook", label: "Find Webhook", description: "Get a webhook destination.", method: "GET", path: "/webhooks/{id}/", inputFields: [webhookId], sample: { id: "wh_abc" } },
  { resource: "webhook", operation: "update", kind: "create", noun: "Webhook", label: "Update Webhook", description: "Update a webhook destination.", method: "PATCH", path: "/webhooks/{id}/", inputFields: [webhookId, f("url", "URL"), f("events", "Events", { list: true, choices: eventChoices }), f("is_active", "Is Active", { type: "boolean" }), f("name", "Name")], buildBody: (i) => webhookBody(i, "update"), sample: { id: "wh_abc" } },
  { resource: "webhook", operation: "delete", kind: "create", noun: "Webhook", label: "Delete Webhook", description: "Delete a webhook destination.", method: "DELETE", path: "/webhooks/{id}/", inputFields: [webhookId], sample: { ok: true } },
  { resource: "webhook", operation: "listDeliveries", kind: "search", noun: "Delivery", label: "Find Webhook Deliveries", description: "List recent deliveries for a webhook.", method: "GET", path: "/webhooks/{id}/deliveries/", paginated: true, inputFields: [webhookId, cursor, pageSize], sample: { id: "del_abc", status: "delivered", event_type: "candidate.passed" } },
  { resource: "webhook", operation: "test", kind: "create", noun: "Webhook", label: "Test Webhook", description: "Send a webhook.test ping.", method: "POST", path: "/webhooks/{id}/test/", inputFields: [webhookId], sample: { ok: true } },

  { resource: "organisation", operation: "get", kind: "search", noun: "Organisation", label: "Find Organisation", description: "Get organisation profile and invite quota.", method: "GET", path: "/org/", inputFields: [connectedAccount], sample: { name: "Acme", plan: "starter", invites_remaining: 40 } },
  { resource: "organisation", operation: "stats", kind: "search", noun: "Organisation", label: "Find Organisation Stats", description: "Get organisation stats.", method: "GET", path: "/org/stats/", inputFields: [connectedAccount], sample: { assessments: 3 } },
  { resource: "organisation", operation: "listTeam", kind: "search", noun: "Team Member", label: "Find Team Members", description: "List organisation team members.", method: "GET", path: "/org/team/", paginated: true, inputFields: [cursor, pageSize], sample: { email: "owner@acme.com", role: "owner" } },
  { resource: "organisation", operation: "listSquads", kind: "search", noun: "Squad", label: "Find Squads", description: "List hiring squads.", method: "GET", path: "/org/squads/", paginated: true, inputFields: [cursor, pageSize], sample: { id: "squad-uuid", name: "Growth" } },
  { resource: "organisation", operation: "getSquad", kind: "search", noun: "Squad", label: "Find Squad", description: "Get a hiring squad.", method: "GET", path: "/org/squads/{id}/", inputFields: [squadId], sample: { id: "squad-uuid" } },
  { resource: "organisation", operation: "listSquadMembers", kind: "search", noun: "Squad Member", label: "Find Squad Members", description: "List members of a squad.", method: "GET", path: "/org/squads/{id}/members/", paginated: true, inputFields: [squadId, cursor, pageSize], sample: { email: "recruiter@acme.com" } },
  { resource: "organisation", operation: "auditLog", kind: "search", noun: "Audit Log", label: "Find Audit Log", description: "List organisation audit log rows.", method: "GET", path: "/org/audit-log/", paginated: true, inputFields: [cursor, pageSize], sample: { action: "invitation.created" } },

  { resource: "interview", operation: "list", kind: "search", noun: "Interview", label: "Find Interviews", description: "List interview rooms.", method: "GET", path: "/interviews/", paginated: true, inputFields: [cursor, pageSize], sample: { id: "room-uuid", title: "AI Screen" } },
  { resource: "interview", operation: "create", kind: "create", noun: "Interview", label: "Create Interview", description: "Create an interview room and optionally email the candidate.", method: "POST", path: "/interviews/create/", inputFields: [f("candidate_email", "Candidate Email", { required: true }), f("candidate_name", "Candidate Name"), f("title", "Title", { default: "AI Screening Interview" }), f("interviewer_mode", "Interviewer Mode", { choices: [{ label: "AI Only", value: "ai_only", sample: "ai_only" }, { label: "Human Only", value: "human_only", sample: "human_only" }, { label: "Hybrid", value: "hybrid", sample: "hybrid" }], default: "ai_only" }), f("interview_type", "Interview Type", { default: "mixed" }), f("job_description", "Job Description"), f("resume_text", "Resume Text"), f("send_invite", "Send Invite", { type: "boolean", default: "true" }), f("scheduled_at", "Scheduled At", { type: "datetime" }), f("coding_task_ids", "Coding Tasks", { list: true, dynamic: "hidden_all_task.id.label" }), f("org_task_ids", "Org Cases", { list: true, dynamic: "hidden_org_task.id.label" })], buildBody: (i) => interviewBody(i, "create"), sample: { id: "room-uuid", candidate_email: "ada@example.com" } },
  { resource: "interview", operation: "bulkCreate", kind: "create", noun: "Interview", label: "Bulk Create Interviews", description: "Create interview rooms for many candidates.", method: "POST", path: "/interviews/bulk/", inputFields: [candidates, f("title", "Title"), f("interviewer_mode", "Interviewer Mode", { default: "ai_only" }), f("job_description", "Job Description"), f("resume_text", "Resume Text"), f("send_invite", "Send Invite", { type: "boolean", default: "true" })], buildBody: (i) => interviewBody(i, "bulk"), sample: { created: [] } },
  { resource: "interview", operation: "get", kind: "search", noun: "Interview", label: "Find Interview", description: "Get an interview room.", method: "GET", path: "/interviews/{id}/", inputFields: [interviewId], sample: { id: "room-uuid" } },
  { resource: "interview", operation: "cancel", kind: "create", noun: "Interview", label: "Cancel Interview", description: "Cancel an interview room.", method: "POST", path: "/interviews/{id}/cancel/", inputFields: [interviewId], sample: { id: "room-uuid", status: "cancelled" } },
  { resource: "interview", operation: "reschedule", kind: "create", noun: "Interview", label: "Reschedule Interview", description: "Reschedule an interview.", method: "POST", path: "/interviews/{id}/reschedule/", inputFields: [interviewId, f("scheduled_at", "Scheduled At", { required: true, type: "datetime" })], buildBody: (i) => ({ scheduled_at: i.scheduled_at }), sample: { id: "room-uuid" } },
  { resource: "interview", operation: "analysis", kind: "search", noun: "Interview", label: "Find Interview Analysis", description: "Get interview analysis.", method: "GET", path: "/interviews/{id}/analysis/", inputFields: [interviewId], sample: { score: 4, hire_recommendation: "yes" } },
  { resource: "interview", operation: "replay", kind: "search", noun: "Interview", label: "Find Interview Replay", description: "Get interview replay metadata.", method: "GET", path: "/interviews/{id}/replay/", inputFields: [interviewId], sample: { recording_url: "https://..." } },
  { resource: "interview", operation: "share", kind: "create", noun: "Interview", label: "Share Interview", description: "Create a share link for an interview report.", method: "POST", path: "/interviews/{id}/share/", inputFields: [interviewId, f("expires_days", "Expires (Days)", { type: "integer", default: "14" })], buildBody: (i) => ({ expires_days: asNumber(i.expires_days, 14) }), sample: { share_url: "https://assess.praxicraft.com/interview/share/..." } },
  { resource: "interview", operation: "analytics", kind: "search", noun: "Interview", label: "Find Interview Analytics", description: "Get organisation interview analytics.", method: "GET", path: "/interviews/analytics/", inputFields: [connectedAccount], sample: { completed: 12 } },
  { resource: "interview", operation: "listTemplates", kind: "search", noun: "Template", label: "Find Interview Templates", description: "List interview templates.", method: "GET", path: "/interviews/templates/", paginated: true, inputFields: [cursor, pageSize], sample: { id: "tpl-uuid", name: "Backend screen" } },
  { resource: "interview", operation: "createTemplate", kind: "create", noun: "Template", label: "Create Interview Template", description: "Create an interview template.", method: "POST", path: "/interviews/templates/create/", inputFields: [f("name", "Name", { required: true }), f("config_json", "Config JSON", { helpText: "JSON object" })], buildBody: (i) => templateBody(i, "create"), sample: { id: "tpl-uuid", name: "Backend screen" } },
  { resource: "interview", operation: "updateTemplate", kind: "create", noun: "Template", label: "Update Interview Template", description: "Update an interview template.", method: "PATCH", path: "/interviews/templates/{id}/update/", inputFields: [templateId, f("name", "Name"), f("config_json", "Config JSON")], buildBody: (i) => templateBody(i, "update"), sample: { id: "tpl-uuid" } },
  { resource: "interview", operation: "deleteTemplate", kind: "create", noun: "Template", label: "Delete Interview Template", description: "Delete an interview template.", method: "DELETE", path: "/interviews/templates/{id}/delete/", inputFields: [templateId], sample: { ok: true } },
  { resource: "interview", operation: "listOrgTasks", kind: "search", noun: "Task", label: "Find Interview Org Tasks", description: "List org tasks available for interviews.", method: "GET", path: "/interviews/org-tasks/", paginated: true, inputFields: [cursor, pageSize], sample: { id: "task-uuid" } },

  { resource: "integration", operation: "list", kind: "search", noun: "Integration", label: "Find Integrations", description: "List ATS integration status (no secrets).", method: "GET", path: "/integrations/", inputFields: [connectedAccount], sample: { integrations: [] } },
  { resource: "integration", operation: "connect", kind: "search", noun: "Integration", label: "Find Integration Connect URL", description: "Get the dashboard connect URL for an ATS provider.", method: "GET", path: "/integrations/{provider}/connect/", inputFields: [provider], sample: { connect_url: "https://assess.praxicraft.com/assess/settings/integrations?provider=greenhouse" } },
  { resource: "integration", operation: "test", kind: "create", noun: "Integration", label: "Test Integration", description: "Test an ATS connector.", method: "POST", path: "/integrations/{provider}/test/", inputFields: [provider], sample: { ok: true } },
];

function zapierKey(row) {
  return `${row.resource}_${row.operation}`.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

module.exports = { CATALOG, zapierKey };
