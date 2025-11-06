// Not putting fetch types here until gimloader documents them

import makeGame from "./makeGame";

const [root, id] = location.pathname.split("/").slice(1);

const isGamemodePathnameString = "location.pathname.startsWith('/gamemode/')";
api.rewriter.addParseHook("NotFound", code =>
    code.replace(
        `title:"Hmmm, we couldn't find that...",subTitle:"Sorry, the page you visited doesn't exist."`,
        `title:${isGamemodePathnameString} ? "Press any key to open the game." : "Hmmm, we couldn't find that...",
        subTitle:${isGamemodePathnameString} ? "Or, allow popups for gimkit.com." : "Sorry, the page you visited doesn't exist."`
    ));

if(root === "gamemode") {
    makeGame(id, new URLSearchParams(location.search).entries())
        .then(gameId => {
            const tabHref = `https://www.gimkit.com/host?id=${gameId}`;
            const tab = window.open("");
            if(tab) {
                tab.location.href = tabHref;
                location.href = "/";
            } else {
                addEventListener("keydown", () => {
                    const tab = window.open("");
                    if(!tab) {
                        throw new Error("Could not open game. Try again.");
                    }
                    tab.location.href = tabHref;
                    location.href = "/";
                });
            }
        })
        .catch((err: Error) => alert(err.message));
} else {
    fetch("/api/games/summary/me")
        .then(res => res.json())
        .then(({ games }) => {
            let initialSelectedKitId = api.storage.getValue("selectedKitId");
            if(!initialSelectedKitId) {
                initialSelectedKitId = games[0]._id;
                api.storage.setValue("selectedKitId", initialSelectedKitId);
            }

            api.settings.create([
                {
                    type: "dropdown",
                    id: "kit",
                    title: "Kit",
                    options: games.map((g: any) => g.title),
                    default: initialSelectedKitId
                }
            ]);

            api.settings.listen("kit", (kitTitle: string) => {
                api.storage.setValue("selectedKitId", games.find((g: any) => g.title === kitTitle)._id);
            });
        }, console.error);

    const setLink = (path: string) => history.pushState({}, "", path);

    type Hooks = Record<string, string | number>;

    let { pathname } = location, { title } = document;

    function cleanup() {
        setLink(pathname);
        document.title = title;
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
        setLink(newLink);
    });

    const setMapDataWrapper = api.rewriter.createShared("SetMapDataWrapper", (id: string, name: string) => {
        const path = location.pathname.split("/");
        if(path[1] !== "gamemode") {
            pathname = location.pathname;
            title = document.title;
        }
        if(path[2] === id) return;

        document.title = name;
        setLink("/gamemode/" + id + location.search);
    });

    const closePopupWrapper = api.rewriter.createShared("ClosePopupWrapper", cleanup);

    api.rewriter.addParseHook("App", code => {
        // Updates the hooks
        if(code.includes("We're showing this hook for testing purposes")) {
            const stateStart = code.indexOf("state:") + 6;
            const stateEnd = code.indexOf(",", stateStart);
            const stateVarName = code.slice(stateStart, stateEnd).trim();

            return code.replace(".readOnly]);", `.readOnly]);${setHooksWrapper}?.(${stateVarName});`);
            // Updates the map id/name, and cleans up when clicking off the popup
        } else if(code.includes("The more reliable, the easier it is for crewmates to win")) {
            const nameStart = code.indexOf(".name,description:") + 18;
            const nameEnd = code.indexOf(".tagline", nameStart);
            const gameVarName = code.slice(nameStart, nameEnd).trim();

            const closeStart = code.indexOf('(["Escape"],()=>{') + 17;
            const closeEnd = code.indexOf("()});const", closeStart);
            const closePopupVarName = code.slice(closeStart, closeEnd).trim();

            // For manual popup closes
            code = code.replace(`(!0),${closePopupVarName}=()=>{`, `(!0),${closePopupVarName}=()=>{${closePopupWrapper}?.();`);

            // For automatic popup closes (making a new game)
            code = code.replace(
                /`\$\{([a-zA-Z_$][\w$]*)\(\)\}\/host\?id=\$\{([a-zA-Z_$][\w$]*)\}`;/,
                "`${$1()" + "}/host?id=${$2" + "}`;" + `${closePopupWrapper}?.();`
            );

            // For when the selected map is changed
            return code.replace(
                '"EXPERIENCE_HOOKS"})',
                `"EXPERIENCE_HOOKS"});${setMapDataWrapper}?.(${gameVarName}?._id, ${gameVarName}?.name);`
            );
        }
        return code;
    });

    api.onStop(() => {
        if(location.pathname.startsWith("/gamemode")) cleanup();
    });
}
