import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "Chat",
    description: "Adds an in-game chat to 2d gamemodes",
    version: "0.6.1",
    changelog: ["Fixed for new Gimkit update"],
    needsLibs: ["Communication"],
    gamemodes: ["2d"]
});
