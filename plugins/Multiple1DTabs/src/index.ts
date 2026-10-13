api.patcher.before(localStorage, "getItem", (_, args) => {
    if(args[0]?.startsWith?.("blueboat-id-")) return true;
});
