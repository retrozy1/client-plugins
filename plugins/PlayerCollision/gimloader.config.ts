import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "PlayerCollision",
    description: "Makes you collide with other players in 2d gamemodes",
    version: "0.2.3",
    changelog: ["Fix for new Gimkit update"],
    gamemodes: ["2d"],
    needsPlugins: ["Desynchronize"]
});
