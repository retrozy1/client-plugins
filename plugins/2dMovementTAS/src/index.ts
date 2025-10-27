// @ts-expect-error
import UI from "./ui/Start.svelte";

api.net.onLoad(() => {
    // @ts-expect-error vscode's going wacky
    const ui = new UI({
        target: document.body
    });

    api.onStop(() => ui.$destroy());
});
