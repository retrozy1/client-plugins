import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "Chat",
    description: "Adds an in-game chat to 2d gamemodes",
    version: "0.5.1",
    changelog: ["Bump version to force update"],
    needsLibs: ["Communication"],
    gamemodes: ["2d"]
});
