import { AppConfig, AppTypeEnum } from "@pulse-editor/shared-utils";
import packageJson from "./package.json" with { type: "json" };
import { preRegisteredActions } from "./src/actions";

/**
 * Pulse Editor Extension Config
 *
 */
const config: AppConfig = {
  // Do not use hyphen character '-' in the id. 
  // The id should be the same as the package name in package.json.
  id: packageJson.name,
  version: packageJson.version,
  libVersion: packageJson.dependencies["@pulse-editor/shared-utils"],
  displayName: packageJson.displayName,
  description: packageJson.description,
  appType: AppTypeEnum.FileView,
  fileTypes: [],
  visibility: "public",
  preRegisteredActions: Object.values(preRegisteredActions),
  recommendedHeight: 640,
  recommendedWidth: 480,
  thumbnail: "assets/thumbnail.png",
};

export default config;
