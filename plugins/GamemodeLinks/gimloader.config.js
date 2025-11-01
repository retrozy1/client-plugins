/** @type {import('@gimloader/build').Config} */
export default {
    input: "src/index.ts",
    name: "GamemodeLinks",
    description: "Creates game rooms from links, particularly useful in bookmarks.",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/GamemodeLinks.js",
    webpage: "https://gimloader.github.io/plugins/gamemodelinks",
    version: "0.0.1",
    hasSettings: true,
    reloadRequired: true,
    libs: [
        "QuickSettings | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/QuickSettings.js"
    ]
};
