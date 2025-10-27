/** @type {import("@gimloader/build").SingleConfig} */
export default {
    input: "src/index.ts",
    name: "Autosplitter",
    description: "Automatically times speedruns for various gamemodes",
    author: "TheLazySquid",
    version: "0.5.4",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Autosplitter.js",
    webpage: "https://gimloader.github.io/plugins/autosplitter",
    hasSettings: true,
    gamemodes: ["dontLookDown", "fishtopia", "oneWayOut"]
};
