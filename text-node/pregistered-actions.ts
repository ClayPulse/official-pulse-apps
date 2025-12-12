import { Action } from "@pulse-editor/shared-utils";

export const preRegisteredActions: Record<string, Action> = {
  "input-text": {
    name: "Display Input Text",
    description: "This action displays the input text.",
    parameters: {
      text: { type: "string", description: "The text to display." },
    },
    returns: {},
  },
  "output-text": {
    name: "Output Some Text",
    description: "This action outputs some text.",
    parameters: {},
    returns: {
      text: { type: "string", description: "The output text." },
    },
  },
  "input-output-text": {
    name: "Input and Output Text",
    description: "This action takes text input and returns it as output.",
    parameters: {
      "input-text": { type: "string", description: "The text to input." },
    },
    returns: {
      "output-text": {
        type: "string",
        description: "The input text returned as output.",
      },
    },
  },
};
