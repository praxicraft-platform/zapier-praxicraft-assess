# Praxicraft Assess for Zapier

Official [Zapier](https://zapier.com) integration for the **[Praxicraft Assess](https://assess.praxicraft.com)** Public API.

Use it to invite candidates, check invite quota, enroll hiring pipelines, fetch results, and start Zaps from Assess events — without writing HTTP requests.

**Requires a Zapier account and an Assess API key (Starter+).** Product docs: [docs.praxicraft.com/zapier](https://docs.praxicraft.com/zapier)

If you do not see **Praxicraft Assess** in Zapier’s app search yet, email [support@praxicraft.com](mailto:support@praxicraft.com) and we will invite your Zapier account.

## Table of Contents

- [Authentication](#authentication)
- [Quickstart](#quickstart)
- [What you can do](#what-you-can-do)
  - [Invite a candidate](#invite-a-candidate)
  - [Bulk invites](#bulk-invites)
  - [Check invite quota](#check-invite-quota)
  - [Build and activate an assessment](#build-and-activate-an-assessment)
  - [Enroll into a hiring pipeline](#enroll-into-a-hiring-pipeline)
  - [Notify Slack when someone passes](#notify-slack-when-someone-passes)
  - [Trigger on Assess events](#trigger-on-assess-events)
- [Errors](#errors)
- [Requirements & support](#requirements--support)
- [License](#license)

---

## Authentication

Create an organisation API key in Assess:

**Assess → Developer → API Keys** → create key → copy `ct_live_…` (shown once).

In Zapier, add the **Praxicraft Assess** app and create a connection:

1. Paste the API key.
2. Leave **Base URL** as `https://assess.praxicraft.com` unless you use a custom host.
3. Save. Zapier tests the connection with `GET /api/v1/public/org/` (needs `organisation:read` or a full-access key).

Never commit API keys. Prefer a dedicated key for Zapier and rotate it if it leaks.

### Recommended scopes

| Use case | Scopes |
|----------|--------|
| Invite + notify on results | `assessments:read`, `invitations:write`, `candidates:read`, `webhooks:write` |
| Pipeline enroll | `pipelines:read`, `pipelines:write`, `webhooks:write` |

Scopes and rotation: [Authentication](https://docs.praxicraft.com/authentication)

---

## Quickstart

1. In Zapier, create a Zap and search for **Praxicraft Assess**.
2. Connect with your `ct_live_…` key (see [Authentication](#authentication)).
3. Add an action **Invite Candidate**:
   - Assessment (dropdown — or map a slug from a previous step)
   - Email (for example `candidate@example.com`)
   - Optional name
   - Set **Send Email** if Assess should mail the take link
4. Test the step. The output includes `invite_token` and `invite_url`.
5. Turn the Zap **on**.

Invites are idempotent on email — safe to retry. Optional **External ID** stores your ATS candidate id so retries with the same id return the existing invite.

Responses are **flat JSON** (same shape as the Public API — no `{ "data": … }` wrapper).

---

## What you can do

Creates are writes. Searches are GET / list. All paths target `/api/v1/public/…` on the Assess host.

| Resource | Common actions |
|----------|----------------|
| Assessment | Find Assessments, Find Assessment, Create / Update / Duplicate Assessment, Find Assessment Results, Attach / Replace / Remove Tasks |
| Task | Find Org Tasks, Find Platform Tasks, Create / Find / Update / Delete Task |
| Invitation | Find Invitations, Invite Candidate, Bulk Invite Candidates, Find Invitation, Find Invitation Result, Remind Candidate, Cancel Invitation |
| Pipeline | Find Pipelines, Enroll Candidate, Bulk Enroll Candidates, Find Enrollments, Reject / Hold / Unhold Enrollment |
| Webhook | Find Webhooks, Create / Update / Delete Webhook, Find Webhook Deliveries, Test Webhook |
| Organisation | Find Organisation, Find Organisation Stats, Find Team Members, Find Squads, Find Audit Log |
| Interview | Find Interviews, Create / Bulk Create Interview, Cancel / Reschedule, Find Analysis / Replay, Share Interview, templates |
| Integration | Find Integrations, Find Integration Connect URL, Test Integration |
| Trigger | **New Assess Event** — one event per Zap |

Create, update, and delete steps use dropdowns for assessments, tasks, invitations, pipelines, enrollments, webhooks, interviews, templates, and squads. You can still map an id from a previous step via **Custom value**. Bulk invite and enroll accept a JSON list of candidates.

### Invite a candidate

1. Action **Invite Candidate**
2. Assessment slug, email, optional name
3. Set **Send Email** if Assess should mail the take link
4. Optional **External ID** (ATS candidate id)

The step returns `invite_token` and `invite_url`.

### Bulk invites

1. Action **Bulk Invite Candidates**
2. Assessment slug
3. **Candidates JSON**, for example:

```json
[
  {"email": "a@example.com", "name": "Alex"},
  {"email": "b@example.com", "name": "Blair"}
]
```

4. Set **Send Email** if Assess should mail take links

### Check invite quota

1. Search **Find Organisation**
2. Use `invites_remaining` in a Filter or Paths step before a bulk invite

### Build and activate an assessment

1. Action **Create Assessment** (title, time limit, passing score)
2. Action **Attach Tasks** with comma-separated task UUIDs
3. Action **Update Assessment** → Status `active`

### Enroll into a hiring pipeline

1. Action **Enroll Candidate**
2. Pipeline slug (for example `grad-2025`), email, optional name
3. Set **Send Email** if Assess should mail the pipeline invite

Follow with **Find Enrollment** using the returned enrollment id.

### Notify Slack when someone passes

1. Trigger **New Assess Event** → `candidate.passed`
2. Action: Slack **Send Channel Message** with score and `invite_token`

There is no native Slack app yet. Use Zapier’s Slack app as the destination.

### Trigger on Assess events

**New Assess Event** starts a Zap when Assess delivers a webhook.

1. Choose one event (for example `candidate.passed` or `assessment.completed`).
2. Turn the Zap **on**. Zapier registers its hook URL with Assess and sends a test ping.
3. Turning the Zap **off** deletes that webhook destination.

Assess signs every payload (`X-Praxicraft-Signature`). Zapier owns the hook URL, so you do not need to verify HMAC inside the Zap. `webhook.test` pings do not run the Zap.

High-value events: `assessment.completed`, `candidate.passed` / `failed`, `pipeline.advanced` / `completed` / `rejected`, `interview.completed` / `analysis_ready`.

Event catalog and payload examples: [Webhooks](https://docs.praxicraft.com/webhooks)

---

## Errors

Public API errors look like:

```json
{
  "error": {
    "code": "INSUFFICIENT_SCOPE",
    "message": "This API key does not have the 'candidates:read' scope."
  }
}
```

Zapier fails the step. Branch on the error **code**, not the message text.

| Symptom | Fix |
|---------|-----|
| Connection test fails | Add `organisation:read` or use full-access scopes |
| Trigger never fires | The Zap must be **on**; the webhook must verify |
| `403 INSUFFICIENT_SCOPE` | Widen key scopes — [Scopes](https://docs.praxicraft.com/scopes) |
| `INVITE_QUOTA_EXCEEDED` | Check **Find Organisation** → `invites_remaining` |
| App missing in Zapier search | Email [support@praxicraft.com](mailto:support@praxicraft.com) for access |

Error codes: [Errors](https://docs.praxicraft.com/errors)

---

## Requirements & support

- A [Zapier](https://zapier.com) account
- An Assess API key (Starter+) from [Developer → API Keys](https://assess.praxicraft.com/assess/api)
- Product docs: [docs.praxicraft.com](https://docs.praxicraft.com)
- Zapier setup: [docs.praxicraft.com/zapier](https://docs.praxicraft.com/zapier)
- Email: [support@praxicraft.com](mailto:support@praxicraft.com)
- Issues: [GitHub Issues](https://github.com/praxicraft-platform/zapier-praxicraft-assess/issues)

---

## License

[MIT](LICENSE)
