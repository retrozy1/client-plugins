import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "QuickReset",
    description: "Quickly lets you restart 2d gamemodes",
    version: "0.4.3",
    changelog: ["Bump version to force update"],
    gamemodes: ["2d"]
});
