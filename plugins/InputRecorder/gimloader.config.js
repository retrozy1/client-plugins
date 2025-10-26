/** @type {import('@gimloader/build').SingleConfig} */
export default {
    input: "./src/index.ts",
    name: "InputRecorder",
    description: "Records your inputs in Don't Look Down",
    author: "TheLazySquid",
    version: "0.3.0",
    reloadRequired: 'ingame',
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/InputRecorder/build/InputRecorder.js",
    webpage: 'https://gimloader.github.io/plugins/inputrecorder',
    libs: [
        "DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/libraries/DLDUtils.js"
    ],
    gamemodes: ["dontLookDown"]
}