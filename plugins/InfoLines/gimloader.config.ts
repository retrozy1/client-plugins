import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "InfoLines",
    description: "Displays a configurable list of info on the screen",
    version: "1.4.0",
    changelog: ["Made settings menu more readable"],
    hasSettings: true,
    gamemodes: ["2d"]
});
