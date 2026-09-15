import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CameraControl",
    description: "Lets you freely move and zoom your camera",
    version: "1.1.1",
    changelog: ["Bumped version to force update"],
    hasSettings: true,
    optionalLibs: [
        "CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js"
    ],
    gamemodes: ["2d"]
});
