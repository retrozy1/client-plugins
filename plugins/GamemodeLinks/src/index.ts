import makeGame from "./makeGame";

const url = new URL(window.location.href);
const [_, root, id] = url.pathname.split("/");

// Not putting fetch types here until gimloader documents them

if(root === "gamemode") {
    const gameRes = makeGame(id, url.searchParams.entries());

    gameRes.then(gameId => {
        const tab = window.open("")!;
        tab.location.href = `https://www.gimkit.com/host?id=${gameId}`;
        location.href = "/";
    });

    gameRes.catch((error: Error) => alert(error.message));
} else {
    fetch("/api/games/summary/me")
        .then(res => res.json())
        .then(({ games }) => {
            let initialSelectedKitId = api.storage.getValue("selectedKitId");
            if(!initialSelectedKitId) {
                initialSelectedKitId = games[0]._id;
                api.storage.setValue("selectedKitId", initialSelectedKitId);
            }

            const obj: Record<string, any> = {
                type: "dropdown",
                id: "kit",
                title: "Kit",
                options: games.map((g: any) => g.title),
                default: initialSelectedKitId
            };

            const settings = api.lib("QuickSettings")("GamemodeLinks", [obj]);
            settings.listen("kit", (kitTitle: string) => api.storage.setValue("selectedKitId", games.find((g: any) => g.title === kitTitle)._id));
            api.openSettingsMenu(settings.openSettingsMenu);
        }, console.error);

    const setLink = (path: string) => history.pushState({}, "", path);

    type Hooks = Record<string, string | number>;

    function cleanup() {
        setLink("/kits");
        document.title = "Kits | Gimkit";
    }

    const setHooksWrapper = api.rewriter.createShared("SetHooksWrapper", (hooks: Hooks) => {
        hooks = { ...hooks };

        // Gimkit uses "kit", "kitId", and "Kit ID".
        // Todo: once interceptor is added, intercept the hooks endpoint and find the hook name that has type "kit"
        const kitKey = Object.keys(hooks).find(hook => hook.toLowerCase().includes("kit"));
        if(kitKey) delete hooks[kitKey];

        for(const key in hooks) {
            if(typeof hooks[key] === "number") {
                hooks[key] = hooks[key].toString();
            }
        }

        const searchParams = new URLSearchParams(hooks as Record<string, string>);
        const newLink = `?${searchParams.toString()}`;
        if(location.search === newLink) return;
        setLink(`?${searchParams.toString()}`);
    });

    const setMapDataWrapper = api.rewriter.createShared("SetMapDataWrapper", (id: string, name: string) => {
        if(location.pathname.split("/")[2] === id) return;

        document.title = name;
        setLink("/gamemode/" + id + location.search);
    });

    const closePopupWrapper = api.rewriter.createShared("ClosePopupWrapper", cleanup);

    api.rewriter.addParseHook("App", code => {
        // Updates the hooks
        if(code.includes("We're showing this hook for testing purposes")) {
            const stateVarName = code.split("state:")[1].split(",")[0];

            return code.replace(".readOnly]);", `.readOnly]);${setHooksWrapper}?.(${stateVarName});`);
            // Updates the map id/name, and cleans up when clicking off the popup
        } else if(code.includes("The more reliable, the easier it is for crewmates to win")) {
            const gameVarName = code.split(".name,description:")[1].split(".tagline")[0];
            const closePopupVarName = code.split('(["Escape"],()=>{')[1].split("()});const")[0];

            code = code.replace(`(!0),${closePopupVarName}=()=>{`, `(!0),${closePopupVarName}=()=>{${closePopupWrapper}?.();`);

            return code.replace('"EXPERIENCE_HOOKS"})', `"EXPERIENCE_HOOKS"});${setMapDataWrapper}?.(${gameVarName}?._id, ${gameVarName}?.name);`);
        }
        return code;
    });

    api.onStop(() => {
        if(location.pathname.startsWith("/gamemode")) cleanup();
        api.rewriter.removeSharedById("SetHooksWrapper");
        api.rewriter.removeSharedById("SetMapDataWrapper");
        api.rewriter.removeSharedById("ClosePopupWrapper");
    });
}
