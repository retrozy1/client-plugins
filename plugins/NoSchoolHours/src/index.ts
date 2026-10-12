const FakeDate = api.rewriter.createShared("FakeDate", {
    default: () => {
        return {
            day: () => 0,
            hour: () => 0
        }
    }
});

api.rewriter.runInScope("App-", (code, run, initial) => {
    const index = code.indexOf("Discovery Is Closed During School Hours");
    if(index === -1) return;

    const startIndex = code.lastIndexOf("\n`,", index) + 3;
    const endIndex = code.indexOf("=", startIndex);
    const varName = code.slice(startIndex, endIndex);
    run(`${varName}=${FakeDate}`);

    if(!initial) api.UI.forceReactUpdate();
});