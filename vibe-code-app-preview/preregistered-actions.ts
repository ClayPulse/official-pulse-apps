import type { Action } from "@pulse-editor/shared-utils";

export const preRegisteredActions: Record<string, Action> = {
  "pulse-app-dev-preview": {
    name: "Pulse App Dev Preview",
    description: "Provides a live preview of the Pulse App during development.",
    parameters: {},
    returns: {},
  },
};
