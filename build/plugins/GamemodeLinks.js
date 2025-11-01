/**
 * @name GamemodeLinks
 * @description Creates game rooms from links, particularly useful in bookmarks.
 * @author retrozy
 * @version 0.0.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/GamemodeLinks.js
 * @webpage https://gimloader.github.io/plugins/gamemodelinks
 * @reloadRequired true
 * @needsLib QuickSettings | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/QuickSettings.js
 * @hasSettings true
 */

// plugins/GamemodeLinks/src/makeGame.ts
async function makeGame(id2, entries) {
  if (!id2) throw new Error("Gamemode ID is missing");
  const hooksRes = await fetch("/api/experience/map/hooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ experience: id2 })
  });
  const hooksJson = await hooksRes.json();
  if (hooksJson.message?.text === "No experience found") throw new Error("Gamemode not found");
  if (hooksJson.name === "CastError") throw new Error("Invalid gamemode");
  const { hooks } = hooksJson;
  const defaultHooks = {};
  for (const hook of hooks) {
    if (hook.type === "selectBox") {
      defaultHooks[hook.key] = hook.options.defaultOption;
    } else if (hook.type === "number") {
      defaultHooks[hook.key] = hook.options.defaultValue;
    }
  }
  const savedHooksString = localStorage.getItem("gimkit-hook-saved-options");
  const savedHooks = savedHooksString ? JSON.parse(savedHooksString) : {};
  const matchmakerOptions = {
    group: "",
    joinInLate: true
  };
  const urlHooks = {};
  for (const [key, value] of entries) {
    if (key === "joinInLate" || key === "useRandomNamePicker") {
      matchmakerOptions[key] = value !== "0" && value.toLowerCase() !== "false" && value.toLowerCase() !== "no";
    }
    const hook = hooks.find((hook2) => hook2.key === key);
    if (!hook) continue;
    if (hook.type === "selectBox") {
      if (!hook.options.options.includes(value)) {
        throw new Error(`"${value}" is not an option of ${hook.key}. The available options are: ${hook.options.options.join(", ")}.`);
      }
      urlHooks[key] = value;
    } else if (hook.type === "number") {
      const numberHook = Number(value);
      if (Number.isNaN(numberHook)) throw new Error(`${key} requires a number`);
      urlHooks[key] = numberHook;
    }
  }
  const body = {
    experienceId: id2,
    matchmakerOptions,
    options: {
      allowGoogleTranslate: false,
      cosmosBlocked: false,
      hookOptions: {
        ...defaultHooks,
        ...savedHooks[id2],
        ...urlHooks
      }
    }
  };
  if (hooks.some((hook) => hook.type === "kit")) {
    let selectedKitId = api.storage.getValue("selectedKitId");
    if (!selectedKitId) {
      const meRes = await fetch("/api/games/summary/me");
      const { games } = await meRes.json();
      if (!games.length) throw new Error("You don't have any kits");
      selectedKitId = games[0]._id;
      api.storage.setValue("selectedKitId", selectedKitId);
    }
    body.options.hookOptions.kit = selectedKitId;
  }
  const creationRes = await fetch("/api/matchmaker/intent/map/play/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (creationRes.status === 500) throw new Error("This map doesn't exits, or you had invalid search parameters");
  return await creationRes.text();
}

// plugins/GamemodeLinks/src/index.ts
var url = new URL(window.location.href);
var [_, root, id] = url.pathname.split("/");
if (root === "gamemode") {
  const gameRes = makeGame(id, url.searchParams.entries());
  gameRes.then((gameId) => {
    const tab = window.open("");
    tab.location.href = `https://www.gimkit.com/host?id=${gameId}`;
    location.href = "/";
  });
  gameRes.catch((error) => alert(error.message));
} else {
  let cleanup = function() {
    setLink("/kits");
    document.title = "Kits | Gimkit";
  };
  cleanup2 = cleanup;
  fetch("/api/games/summary/me").then((res) => res.json()).then(({ games }) => {
    let initialSelectedKitId = api.storage.getValue("selectedKitId");
    if (!initialSelectedKitId) {
      initialSelectedKitId = games[0]._id;
      api.storage.setValue("selectedKitId", initialSelectedKitId);
    }
    const obj = {
      type: "dropdown",
      id: "kit",
      title: "Kit",
      options: games.map((g) => g.title),
      default: initialSelectedKitId
    };
    const settings = api.lib("QuickSettings")("GamemodeLinks", [obj]);
    settings.listen(
      "kit",
      (kitTitle) => api.storage.setValue("selectedKitId", games.find((g) => g.title === kitTitle)._id)
    );
    api.openSettingsMenu(settings.openSettingsMenu);
  }, console.error);
  const setLink = (path) => history.pushState({}, "", path);
  const setHooksWrapper = api.rewriter.createShared("SetHooksWrapper", (hooks) => {
    hooks = { ...hooks };
    const kitKey = Object.keys(hooks).find((hook) => hook.toLowerCase().includes("kit"));
    if (kitKey) delete hooks[kitKey];
    for (const key in hooks) {
      if (typeof hooks[key] === "number") {
        hooks[key] = hooks[key].toString();
      }
    }
    const searchParams = new URLSearchParams(hooks);
    const newLink = `?${searchParams.toString()}`;
    if (location.search === newLink) return;
    setLink(`?${searchParams.toString()}`);
  });
  const setMapDataWrapper = api.rewriter.createShared("SetMapDataWrapper", (id2, name) => {
    if (location.pathname.split("/")[2] === id2) return;
    document.title = name;
    setLink("/gamemode/" + id2 + location.search);
  });
  const closePopupWrapper = api.rewriter.createShared("ClosePopupWrapper", cleanup);
  api.rewriter.addParseHook("App", (code) => {
    if (code.includes("We're showing this hook for testing purposes")) {
      const stateVarName = code.split("state:")[1].split(",")[0];
      return code.replace(".readOnly]);", `.readOnly]);${setHooksWrapper}?.(${stateVarName});`);
    } else if (code.includes("The more reliable, the easier it is for crewmates to win")) {
      const gameVarName = code.split(".name,description:")[1].split(".tagline")[0];
      const closePopupVarName = code.split('(["Escape"],()=>{')[1].split("()});const")[0];
      code = code.replace(`(!0),${closePopupVarName}=()=>{`, `(!0),${closePopupVarName}=()=>{${closePopupWrapper}?.();`);
      return code.replace(
        '"EXPERIENCE_HOOKS"})',
        `"EXPERIENCE_HOOKS"});${setMapDataWrapper}?.(${gameVarName}?._id, ${gameVarName}?.name);`
      );
    }
    return code;
  });
  api.onStop(() => {
    if (location.pathname.startsWith("/gamemode")) cleanup();
    api.rewriter.removeSharedById("SetHooksWrapper");
    api.rewriter.removeSharedById("SetMapDataWrapper");
    api.rewriter.removeSharedById("ClosePopupWrapper");
  });
}
var cleanup2;
