import UI from "./ui/Start.svelte";

api.net.onLoad(() => {
    const ui = new UI({
        target: document.body
    });

    api.onStop(() => ui.$destroy());
});
