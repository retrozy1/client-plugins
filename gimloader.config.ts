import { sassPlugin } from "esbuild-sass-plugin";
import svelte from "esbuild-svelte";
import { sveltePreprocess } from "svelte-preprocess";
import { workspaceConfig } from "@gimloader/build";

export default workspaceConfig({
    type: "workspace",
    splitPluginsAndLibraries: true,
    autoAlias: [
        "./plugins",
        "./libraries"
    ],
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
});