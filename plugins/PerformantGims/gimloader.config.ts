import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "PerformantGims",
    description: "Replaces configurable gims with images of them. Looks like crap, runs really fast.",
    hasSettings: true,
    reloadRequired: "ingame",
    version: "0.5.3",
    changelog: ["Deprecated in favor of the Simple Gim Mode in base Gimkit"],
    deprecated: "Superceded by Simple Gim Mode in base Gimkit"
});
