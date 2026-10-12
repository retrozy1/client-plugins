import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "MobxUtils",
    description: "Some simple utilities for react injection with MobX",
    version: "0.3.4",
    reloadRequired: true,
    changelog: ["Fixed for new Gimkit update"],
    isLibrary: true
});
