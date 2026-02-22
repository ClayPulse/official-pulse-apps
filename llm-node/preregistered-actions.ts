import type { Action } from "@pulse-editor/shared-utils";

export const preRegisteredActions: Record<string, Action> = {
  "run-llm": {
    name: "Run LLM",
    description: "Runs a simple LLM query and returns the result.",
    parameters: {
      {
        type: "string",
        description: "The input prompt for the LLM.",
      }
    },
    returns: {
      response: {
        type: "string",
        description: "The response from the LLM.",
      },
    },
  },
};
