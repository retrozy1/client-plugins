// @ts-ignore
import UI from './UI.svelte';
import CosmeticChanger from './cosmeticChanger';

let cosmeticChanger = new CosmeticChanger();

function showUI() {
    let div = document.createElement("div");
    // @ts-ignore
    let ui = new UI({
        target: div,
        props: {
            cosmeticChanger
        }
    });

    api.UI.showModal(div, {
        id: "CharacterCustomization",
        title: "Character Customization",
        closeOnBackgroundClick: false,
        style: "min-width: min(90vw, 500px)",
        onClosed() {
            // @ts-ignore
            ui.$destroy();
        },
        buttons: [
            {
                text: "Cancel",
                style: "close"
            },
            {
                text: "Apply",
                style: "primary",
                onClick() {
                    ui.save();
                }
            }
        ]
    });
}

api.hotkeys.addHotkey({
    key: "KeyC",
    alt: true
}, showUI);
api.openSettingsMenu(() => showUI());