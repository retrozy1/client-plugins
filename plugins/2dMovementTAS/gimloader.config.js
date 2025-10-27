/** @type {import("@gimloader/build").SingleConfig} */
export default {
    input: "src/index.ts",
    name: "2dMovementTAS",
    description: "Allows for making TASes of CTF and tag",
    author: "TheLazySquid",
    version: "0.3.3",
    reloadRequired: "ingame",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/2dMovementTAS.js",
    webpage: "https://gimloader.github.io/plugins/movementtas",
    gamemodes: ["ctf", "tag"]
};
