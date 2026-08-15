const authentication = require("./authentication");
const newEvent = require("./triggers/new_event");
const { CATALOG, zapierKey } = require("./lib/catalog");
const { registerCatalog } = require("./lib/factory");
const { dropdownTriggers } = require("./lib/dropdowns");

const { creates, searches } = registerCatalog(CATALOG, zapierKey);

module.exports = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,
  authentication,
  triggers: {
    [newEvent.key]: newEvent,
    ...dropdownTriggers,
  },
  creates,
  searches,
};
