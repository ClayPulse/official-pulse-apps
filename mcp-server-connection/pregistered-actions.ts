import { Action } from "@pulse-editor/shared-utils";

export const preRegisteredActions: Record<string, Action> = {
  "config-mcp-server": {
    name: "Configure MCP Server Connection",
    description:
      "Configures a connection to an MCP server, and output the config as JSON.",
    parameters: {
      "mcp_server_name": {
        type: "string",
        description: "The name of the MCP server connection.",
        optional: true,
      },
      command: {
        type: "string",
        description: "The command to be executed on the MCP server.",
        optional: true,
      },
      args: {
        type: ["string"],
        description: "The arguments for the command.",
        optional: true,
      },
      type: {
        type: "string",
        description: "The type of connection.",
        optional: true,
      },
    },
    returns: {
      "mcp-config": {
        type: "object",
        description: "The MCP server configuration as a JSON object.",
      },
    },
  },
};
