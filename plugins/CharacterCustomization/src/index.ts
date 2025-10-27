import CosmeticChanger from "./cosmeticChanger";
import UI from "./UI.svelte";

const cosmeticChanger = new CosmeticChanger();

function showUI() {
    const div = document.createElement("div");
    const ui = new UI({
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
