import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "./src/index.ts",
    name: "Chat",
    description: "Adds an in-game chat to 2d gamemodes",
    author: "TheLazySquid",
    version: "0.2.4",
    changelog: ["Switched to a utility for rewriting source code"],
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Chat.js",
    webpage: "https://gimloader.github.io/plugins/chat",
    gamemodes: ["2d"]
});
