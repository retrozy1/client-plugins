// @ts-expect-error Types aren't updated yet
api.net.modifyFetchResponse("/api/experience/map/hooks", (data) => {
    for(const hook of data.hooks) {
        const key = hook.key.toLowerCase();

        if(key.includes("duration")) {
            // uncap duration
            hook.options.min = 1;
            hook.options.max = 60;
        } else if(key.includes("question")) {
            // uncap energy/other stuff per question
            hook.options.min = -1e11 + 1;
            hook.options.max = 1e11 - 1; // 100 billion - 1
        }
    }
});
