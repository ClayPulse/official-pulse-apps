import { Action } from "@pulse-editor/shared-utils";

export const preRegisteredActions: Record<string, Action> = {
  "web-browse": {
    name: "Web Browse",
    description:
      "A simple web browser with AI agent capabilities. AI will explore pages on your behalf",
    parameters: {
      url: {
        type: "string",
        description:
          "The URL to browse. Use the embedded link wherever possible. e.g. YouTube embed link instead of normal YouTube link.",
      },
    },
    returns: {},
  },
};
