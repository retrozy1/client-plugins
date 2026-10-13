api.rewriter.swapVar("App-", {
    check: "Discovery Is Closed During School Hours",
    find: /\n`,(\w{1,3})=\w{1,3}\(\w{1,3}\(\)\)/,
    callback: (_, initial) => {
        if(!initial) api.UI.forceReactUpdate();
        api.onStop(() => api.UI.forceReactUpdate());

        return {
            default: () => {
                return {
                    day: () => 0,
                    hour: () => 0
                };
            }
        };
    }
});
