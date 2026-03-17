import { AppConfig } from "@pulse-editor/shared-utils";
import pkg from "./package.json" with { type: "json" };

const config: AppConfig = {
  id: pkg.name,
  version: pkg.version,
  libVersion: pkg.dependencies["@pulse-editor/react-api"],
  displayName: pkg.displayName,
  description: pkg.description,
  visibility: "public",
  recommendedHeight: 360,
  recommendedWidth: 640,
  thumbnail: "./src/assets/thumbnail.png",
};

export default config;
