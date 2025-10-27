/** @type {import("@gimloader/build").SingleConfig} */
export default {
    input: "src/index.ts",
    name: "PhysicsSettings",
    description: "Allows you to configure various things about the physics in platformer modes (client-side only)",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/PhysicsSettings.js",
    webpage: "https://gimloader.github.io/plugins/physicssettings",
    hasSettings: true,
    version: "0.1.3",
    libs: [
        "QuickSettings | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/QuickSettings.js"
    ],
    gamemodes: ["2d"]
};
