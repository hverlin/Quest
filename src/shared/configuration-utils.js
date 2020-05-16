import configurationSchema from "../configuration-schema.json";
import _ from "lodash";

export const availableModules = configurationSchema.properties.modules.items.oneOf.map((item) => ({
  type: item.properties.moduleType.const,
  name: item.properties.name.default,
}));

export const moduleSchemaByType = _.keyBy(
  configurationSchema.properties.modules.items.oneOf,
  "properties.moduleType.const"
);

export function getDefaultForProperty(module, propertyName) {
  return moduleSchemaByType[module].properties[propertyName].default;
}
