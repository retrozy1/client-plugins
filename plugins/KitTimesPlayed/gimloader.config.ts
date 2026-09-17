import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "KitTimesPlayed",
    description: "Shows the number of times that kits have been played on the kits screen",
    version: "0.1.3",
    reloadRequired: "notingame",
    changelog: ["Bumped version to force update"]
});
