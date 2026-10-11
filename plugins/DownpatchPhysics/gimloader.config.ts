import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "./src/index.ts",
    name: "DownpatchPhysics",
    description: "Restore physics to how it functioned in older versions of Gimkit",
    version: "0.1.7",
    hasSettings: true,
    needsPlugins: ["Desynchronize"],
    gamemodes: ["2d"],
    changelog: ["Fixed for new Gimkit update"]
});
