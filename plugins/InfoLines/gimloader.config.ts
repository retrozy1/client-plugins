import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "InfoLines",
    description: "Displays a configurable list of info on the screen",
    version: "1.4.1",
    changelog: ["Fixed for new Gimkit update"],
    hasSettings: true,
    gamemodes: ["2d"]
});
