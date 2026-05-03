import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(8);
Config.setEntryPoint("video/index.ts");
Config.setPublicDir("video/assets");
