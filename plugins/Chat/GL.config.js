import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

/** @type {import('@gimloader/build').Config} */
export default {
    input: "./src/index.ts",
    name: "Chat",
    description: "Adds an in-game chat to 2d gamemodes",
    author: "TheLazySquid",
    version: pkg.version,
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/Chat/build/Chat.js",
    webpage: 'https://gimloader.github.io/plugins/chat',
    esbuildOptions: {
        loader: {
            ".css": "text"
        }
    }
}