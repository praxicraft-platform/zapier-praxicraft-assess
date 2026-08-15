const { assessRequest } = require("../lib/request");
const { ASSESS_WEBHOOK_EVENTS } = require("../lib/events");

const SAMPLE = {
  id: "evt_sample",
  event: "candidate.passed",
  created_at: "2026-01-15T12:00:00Z",
  data: {
    invite_token: "inv_abc",
    email: "ada@example.com",
    passed: true,
    overall_score: 82,
  },
};

async function subscribeHook(z, bundle) {
  const event = bundle.inputData.event;
  const created = await assessRequest(z, bundle, {
    method: "POST",
    path: "/webhooks/create/",
    body: {
      url: bundle.targetUrl,
      events: [event],
      name: `Zapier: ${event}`,
    },
  });
  const id = created && created.id;
  if (!id) {
    throw new z.errors.Error("Assess did not return a webhook id", "WEBHOOK_CREATE_FAILED", 500);
  }
  try {
    await assessRequest(z, bundle, {
      method: "POST",
      path: `/webhooks/${encodeURIComponent(id)}/test/`,
    });
  } catch (err) {
    z.console.warn(`Webhook test ping failed: ${err.message}`);
  }
  return created;
}

async function unsubscribeHook(z, bundle) {
  const id = bundle.subscribeData && bundle.subscribeData.id;
  if (!id) return;
  try {
    await assessRequest(z, bundle, {
      method: "DELETE",
      path: `/webhooks/${encodeURIComponent(id)}/`,
    });
  } catch (err) {
    if (!/404|not found/i.test(String(err.message))) {
      throw err;
    }
  }
}

function perform(z, bundle) {
  const payload = bundle.cleanedRequest || {};
  if (payload.event === "webhook.test") {
    return [];
  }
  const selected = bundle.inputData && bundle.inputData.event;
  if (selected && payload.event && payload.event !== selected && payload.event !== "webhook.test") {
    return [];
  }
  return [payload];
}

async function performList(z, bundle) {
  return [SAMPLE];
}

module.exports = {
  key: "new_event",
  noun: "Event",
  display: {
    label: "New Assess Event",
    description: "Triggers when Assess sends a signed webhook (candidate passed, assessment completed, interview finished, and more).",
  },
  operation: {
    type: "hook",
    inputFields: [
      {
        key: "event",
        label: "Event",
        required: true,
        choices: ASSESS_WEBHOOK_EVENTS.map((e) => ({ label: e.label, value: e.value, sample: e.value })),
        helpText: "One event per Zap. Assess registers a REST Hook and sends a test ping when the Zap is turned on.",
      },
    ],
    perform,
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    performList,
    sample: SAMPLE,
  },
};
