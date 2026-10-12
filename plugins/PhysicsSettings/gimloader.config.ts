import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "PhysicsSettings",
    description: "Allows you to configure various things about the physics in platformer modes (client-side only)",
    hasSettings: true,
    version: "0.3.3",
    gamemodes: ["2d"],
    needsPlugins: ["Desynchronize"],
    changelog: ["Fixed for new Gimkit update"]
});
