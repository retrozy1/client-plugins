import Settings from './settings/Settings.svelte';
import styles from './styles.scss';
import { Autosplitter } from "./splitters/autosplitter";
import FishtopiaAutosplitter from "./splitters/fishtopia";
import DLDAutosplitter from "./splitters/DLD";
import OneWayOutAutosplitter from "./splitters/OneWayOut";

api.UI.addStyles(styles);

let autosplitter: Autosplitter;

api.net.onLoad((_, gamemode) => { 
    if(gamemode === "dontlookdown") {
        autosplitter = new DLDAutosplitter();
    } else if(gamemode === "fishtopia") {
        autosplitter = new FishtopiaAutosplitter();        
    } else if(gamemode === "onwWayout") {
        autosplitter = new OneWayOutAutosplitter();
    }
});

api.openSettingsMenu(() => {
    let div = document.createElement("div");
    // @ts-ignore
    let settings = new Settings({
        target: div
    });

    api.UI.showModal(div, {
        title: "Manage Autosplitter data",
        buttons: [{ text: "Close", style: "close" }],
        id: "Autosplitter Settings",
        style: "min-width: min(600px, 90%); height: 90%;",
        closeOnBackgroundClick: false,
        onClosed: () => {
            settings.save();
            autosplitter?.loadData();
            autosplitter?.reset();
        }
    });
});