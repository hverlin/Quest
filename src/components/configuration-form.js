import React from "react";
import { FormGroup, HTMLSelect, InputGroup, NumericInput, Switch } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import _ from "lodash";
import configurationSchema from "../configuration-schema.json";
import PasswordInput from "./password-input";

const moduleSchemaByType = _.keyBy(
  configurationSchema.properties.modules.items.oneOf,
  "properties.moduleType.const"
);

export default function ConfigurationForm({ configuration, fields = [], isForm = true }) {
  const state = useStateLink(configuration);
  const moduleType = state.nested.moduleType.get();
  const { properties, required } = moduleSchemaByType[moduleType];

  function getInputForType(fieldId, inputId, fieldSchema) {
    const placeholder =
      fieldSchema.title + (fieldSchema.examples ? ` (e.g. ${fieldSchema.examples[0]})` : "");

    if (fieldSchema["x-component"] === "password") {
      return (
        <PasswordInput
          id={inputId}
          placeholder={placeholder}
          value={state.nested[fieldId].get() || ""}
          onChange={(e) => state.nested[fieldId].set(e.target.value)}
        />
      );
    } else if (fieldSchema.type === "string") {
      if (fieldSchema.enum) {
        return (
          <HTMLSelect
            id="theme-selector"
            value={state.nested[fieldId].get() || fieldSchema.default}
            options={fieldSchema["x-enum-mapping"]}
            onChange={(e) => state.nested[fieldId].set(e.target.value)}
          />
        );
      } else {
        return (
          <InputGroup
            id={inputId}
            placeholder={placeholder}
            value={state.nested[fieldId].get() || ""}
            onChange={(e) => state.nested[fieldId].set(e.target.value)}
          />
        );
      }
    } else if (fieldSchema.type === "integer") {
      return (
        <NumericInput
          fill
          id={inputId}
          placeholder={placeholder}
          value={state.nested[fieldId].get() || 5}
          min={1}
          max={50}
          step={1}
          clampValueOnBlur
          minorStepSize={null}
          onValueChange={(num) => state.nested[fieldId].set(num ? Math.round(num) : 5)}
        />
      );
    } else if (fieldSchema.type === "boolean") {
      const checked = state.nested[fieldId].get();
      return (
        <Switch
          checked={checked}
          label={checked ? "Enabled" : "Disabled"}
          onChange={() => state.nested[fieldId].set(!checked)}
        />
      );
    }
    return null;
  }

  const Component = isForm ? "form" : React.Fragment;
  return (
    <Component>
      {fields.map((fieldId) => {
        const fieldSchema = properties[fieldId];
        const inputId = `${moduleType}-${fieldId}`;

        return (
          <FormGroup
            key={fieldId}
            label={fieldSchema.title}
            labelFor={inputId}
            labelInfo={
              _.includes(required, fieldId) && !fieldSchema.enum ? "(required)" : undefined
            }
          >
            {getInputForType(fieldId, inputId, fieldSchema)}
          </FormGroup>
        );
      })}
    </Component>
  );
}
