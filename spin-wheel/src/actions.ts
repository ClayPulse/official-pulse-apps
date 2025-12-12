import { Action } from "@pulse-editor/shared-utils";

export const preRegisteredActions: Record<string, Action> = {
  "spin-wheel": {
    name: "Spin a wheel!",
    description: "Spin a wheel with different options and get a random result.",
    parameters: {},
    returns: {
      result: {
        type: "string",
        description: "The result of the spin.",
      },
    },
  },
};
