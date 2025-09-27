// @ts-ignore
import UI from './ui/Start.svelte';

api.net.onLoad(() => {
    // @ts-ignore vscode's going wacky
    let ui = new UI({
        target: document.body
    });

    api.onStop(() => ui.$destroy());
});