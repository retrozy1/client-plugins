import { sassPlugin } from "esbuild-sass-plugin";
import svelte from "esbuild-svelte";
import { sveltePreprocess } from "svelte-preprocess";

/** @type {import('@gimloader/build').Config} */
export default {
    type: "workspace",
    splitPluginsAndLibraries: true,
    alias: {
        "2dMovementTAS": "./plugins/2dMovementTAS",
        "AutoKicker": "./plugins/AutoKicker",
        "Autosplitter": "./plugins/Autosplitter",
        "CharacterCustomization": "./plugins/CharacterCustomization",
        "Chat": "./plugins/Chat",
        "CustomUI": "./plugins/CustomUI",
        "DLDTAS": "./plugins/DLDTAS",
        "InfoLines": "./plugins/InfoLines",
        "InputRecorder": "./plugins/InputRecorder",
        "QuickSettings": "./libraries/QuickSettings"
    },
    plugins: [
        sassPlugin({ type: "css-text" }),
        svelte({
            preprocess: sveltePreprocess(),
            compilerOptions: {
                css: "injected"
            }
        })
    ],
    esbuildOptions: {
        loader: {
            ".css": "text",
            ".svg": "text"
        }
    }
}