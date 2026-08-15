const { assessRequest } = require("./lib/request");

module.exports = {
  type: "custom",
  fields: [
    {
      key: "api_key",
      label: "API Key",
      required: true,
      type: "password",
      helpText:
        "Organisation key from Assess → Developer → API Keys (`ct_live_…`). Starter+ required. https://assess.praxicraft.com/assess/api",
    },
    {
      key: "base_url",
      label: "Base URL",
      required: false,
      type: "string",
      default: "https://assess.praxicraft.com",
      helpText: "Override only for staging. Default https://assess.praxicraft.com",
    },
  ],
  test: async (z, bundle) => {
    return assessRequest(z, bundle, { method: "GET", path: "/org/" });
  },
  connectionLabel: "{{name}} ({{plan}})",
};
