import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "GamemodeDetector",
    description: "Detects which official 2d gamemode the player is in",
    author: "TheLazySquid",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/GamemodeDetector.js",
    webpage: "https://gimloader.github.io/libraries/gamemodedetector/",
    version: "0.2.2",
    changelog: ["Added webpage link"],
    isLibrary: true
});
