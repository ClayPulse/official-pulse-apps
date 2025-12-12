import { Action } from "@pulse-editor/shared-utils";

export const preRegisteredActions: Record<string, Action> = {
  "parse-json": {
    name: "Parse JSON string",
    description: "Parse a JSON string into JSON object.",
    parameters: {
      "string-value": {
        type: "string",
        description: "The JSON string to parse.",
      },
    },
    returns: {
      "parsed-object": {
        type: "object",
        description: "The parsed JSON object.",
      },
    },
  },
  "stringify-json": {
    name: "Stringify JSON object",
    description: "Convert a JSON object into a JSON string.",
    parameters: {
      "json-object": {
        type: "object",
        description: "The JSON object to stringify.",
      },
    },
    returns: {
      "string-value": {
        type: "string",
        description: "The resulting JSON string.",
      },
    },
  },
};
