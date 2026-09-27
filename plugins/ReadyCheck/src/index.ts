import { getSection, insert, replaceSection } from "$shared/rewritingUtils";

enum Op {
    Ready,
    NotReady,
    Left,
    StartingGame
}

const settings = api.settings.create([
    {
        id: "notReadyOnTabOut",
        title: "Not Ready on Tab Out",
        description: "Automatically switches to not ready when the tab loses focus",
        type: "toggle",
        default: true
    }
]);

const addLabel = api.lib("CharacterLabels");
const Comms = api.lib("Communication");
const comms = new Comms<Op>("ReadyCheck");

const charactersReady = new Map<string, boolean>();
const disableAllReady = () => {
    for(const key of charactersReady.keys()) {
        charactersReady.set(key, false);
    }
};

let startingWhenAllReady = false;
let timeout: ReturnType<typeof setTimeout> | null = null;

let ready = false;
const sendReady = () => {
    comms.send(ready ? Op.Ready : Op.NotReady);
};
const updateReadyTag = () => {
    charactersReady.set(api.stores.network.authId, ready);
};
const updateReady = () => {
    sendReady();
    updateReadyTag();
};
const toggleReady = () => {
    ready = !ready;
    updateReady();
};

api.hotkeys.addConfigurableHotkey({
    title: "Toggle Ready",
    category: "Ready Check",
    default: {
        key: "KeyR",
        alt: true,
        shift: true
    }
}, () => {
    if(!Comms.enabled) return;
    toggleReady();
});

if(api.net.isHost) {
    api.rewriter.runInScope("App", (code, run, initial) => {
        const react = api.rewriter.createShared("React", api.React);
        const identifier = ".customTeams.characterToTeamMap.forEach(";
        if(!code.includes(identifier)) return;
        const functionEndIndex = code.lastIndexOf(
            ",",
            code.lastIndexOf("div", code.indexOf(identifier))
        );
        const nameStartIndex = code.lastIndexOf("}:null,", functionEndIndex) + 7;
        const nameEndIndex = code.indexOf("=", nameStartIndex);
        const functionStartIndex = nameEndIndex + 1;
        const name = code.slice(nameStartIndex, nameEndIndex);
        const originalFunctionCode = code.slice(functionStartIndex, functionEndIndex);
        const firstQuestionMarkIndex = code.indexOf("?", functionStartIndex) + 1;
        const startOfComponent = code.slice(
            firstQuestionMarkIndex,
            code.indexOf(",", firstQuestionMarkIndex)
        );

        const onClick = api.rewriter.createShared("Autostart", (autostart: boolean) => {
            startingWhenAllReady = autostart;
            startIfAllReady();
        });

        const getAutostart = api.rewriter.createShared("GetAutostart", () => startingWhenAllReady);

        let newFunctionCode = originalFunctionCode.replace(
            "]",
            `, ${startOfComponent}, {
        label: autostart ? "Starting when all ready" : "Manually starting game",
        onClick: () => { setAutostart(prev => { ${onClick}?.(!prev); return !prev; }); }
      })]`
        );

        newFunctionCode = newFunctionCode.replace("{", `{const [autostart, setAutostart] = ${react}.useState(${getAutostart}());`);
        run(`${name} = ${newFunctionCode}`);
        if(!initial && api.net.colyseus.state.session.phase === "preGame") api.UI.forceReactUpdate();
        api.onStop(() => {
            run(`${name} = ${originalFunctionCode}`);
            if(api.net.colyseus.state.session.phase === "preGame") api.UI.forceReactUpdate();
        });
        return true;
    });
} else {
    api.net.onLoad(() => {
        comms.onEnabledChanged((enabled) => {
            if(!enabled) return;
            updateReady();
        });

        api.onStop(
            api.net.colyseus.state.session.listen("phase", () => {
                ready = false;
                updateReadyTag();
            }, false)
        );

        const onVisibilityChange = () => {
            if(document.visibilityState === "visible" || !settings.notReadyOnTabOut || !ready) return;
            ready = false;
            updateReady();
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        api.onStop(() => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
        });
    });

    api.rewriter.runInScope("App", (code, run, initial) => {
        if(!code.includes("Game actions")) return;
        const prefix = 'overscrollBehavior:"contain"#useEffect#})})},';
        const valueEnd = "!1})]})})";
        const name = getSection(code, `${prefix}@=`);
        const originalValue = getSection(code, `${prefix}#=@${valueEnd}`) + valueEnd;
        let value = originalValue;

        let rewardsButton = getSection(value, '"Game actions"#?@:null');
        rewardsButton = replaceSection(rewardsButton, "label:@,", '"Ready"');
        const onClick = api.rewriter.createShared("ToggleReady", () => {
            if(!Comms.enabled) return;
            toggleReady();
        });
        rewardsButton = replaceSection(rewardsButton, "onClick:@,", `() => { ${onClick}?.() }`);
        rewardsButton = replaceSection(rewardsButton, "onClick#.jsx(@}", '"i", { className: "far fa-check"');

        value = insert(value, `"Game actions"#[@`, `${rewardsButton},`);

        run(`${name} = ${value}`);

        if(!initial && api.net.colyseus.state.session.phase === "preGame") api.UI.forceReactUpdate();
        api.onStop(() => {
            run(`${name} = ${originalValue}`);
            if(api.net.colyseus.state.session.phase === "preGame") api.UI.forceReactUpdate();
        });
        return true;
    });
}

const startIfAllReady = () => {
    if(!startingWhenAllReady || charactersReady.size === 0 || charactersReady.values().some(r => !r) || scheduledStart) return;

    scheduledStart = true;
    comms.send(Op.StartingGame);
    api.UI.notification.info({
        message: "Game starting in 3 seconds..."
    });

    timeout = setTimeout(() => {
        const customTeams: Record<string, string> = {};
        api.stores.session.customTeams.characterToTeamMap.forEach((team, character) => {
            customTeams[character] = team;
        });

        api.net.colyseus.send("START_GAME", {
            customTeams,
            modeType: api.stores.me.preferences.startGameWithMode,
            ownerAsSpectator: api.stores.session.ownerRole === "spectator"
        });
    }, 3000);
};

const destroyLabel = addLabel((char) => {
    if(api.net.colyseus.state.session.gameOwnerId === char.id) return;

    const text = api.stores.phaser.scene.add.text(0, 0, "", {
        fontSize: "normal 25px",
        fontFamily: "'Fugaz One', sans-serif",
        stroke: "#000000",
        strokeThickness: 5,
        align: "center"
    });
    text.setOrigin(0.5, 0);

    return {
        gameObjects: [text],
        update: () => {
            if(api.net.colyseus.state.session.phase === "game") {
                text.visible = false;
                return;
            }
            const ready = charactersReady.get(char.id);
            if(typeof ready === "undefined") {
                text.visible = false;
                return;
            }
            text.visible = true;
            text.text = ready ? "READY" : "NOT READY";
            text.setColor(ready ? "#00FF00" : "#FF0000");
        }
    };
});

let scheduledStart = false;

comms.onMessage((op, char) => {
    if(op === Op.StartingGame) {
        if(char.id !== api.net.colyseus.state.session.gameOwnerId) return;
        scheduledStart = true;
        api.UI.message.info({
            content: "Game starting in 3 seconds, switch to not ready to cancel."
        });
        return;
    }

    if(op === Op.Left) {
        charactersReady.delete(char.id);
        return;
    }

    if(!charactersReady.has(char.id) && !api.net.isHost) {
        sendReady();
    }
    if(scheduledStart && op === Op.NotReady) {
        scheduledStart = false;
        api.UI.notification.info({
            message: `${char.name} canceled start`
        });
        disableAllReady();
        if(timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        return;
    }
    charactersReady.set(char.id, op === Op.Ready);

    if(api.net.isHost) {
        startIfAllReady();
    }
});

api.net.onLoad(() => {
    api.onStop(
        api.net.colyseus.state.session.listen("phase", (phase) => {
            if(phase === "preGame") return;
            scheduledStart = false;
            disableAllReady();
        }, false)
    );

    api.onStop(() => {
        comms.send(Op.Left);
        destroyLabel();
        comms.destroy();
    });
});
