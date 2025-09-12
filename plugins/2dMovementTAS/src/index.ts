// @ts-ignore
import UI from './ui/Start.svelte';

let ui: UI;
api.net.onLoad(() => {
    // @ts-ignore vscode's going wacky
    ui = new UI({
        target: document.body
    });

    api.onStop(() => ui.$destroy());
});