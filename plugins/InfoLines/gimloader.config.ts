import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "InfoLines",
    description: "Displays a configurable list of info on the screen",
    version: "1.3.1",
    changelog: ["Bump version to force update"],
    hasSettings: true,
    gamemodes: ["2d"]
});
