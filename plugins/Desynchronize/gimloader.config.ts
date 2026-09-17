import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Desynchronize",
    description: "Disables the client being snapped back by the server, others cannot see you move. Breaks most gamemodes.",
    version: "0.3.1",
    changelog: ["Bump version to force update"],
    optionalLibs: ["Communication"],
    gamemodes: ["2d"]
});
