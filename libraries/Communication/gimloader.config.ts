import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Communication",
    description: "Communication between different clients in 2D gamemodes",
    version: "0.5.3",
    changelog: ["Bump version to force update"],
    gamemodes: ["2d"],
    isLibrary: true
});
