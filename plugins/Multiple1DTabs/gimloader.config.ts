import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "Multiple1DTabs",
    description: "Allows having multiple different tabs connected to a single 1D game",
    version: "0.2.0",
    changelog: ["Removed need to reload after installing"]
});
