/**
 * @name UncappedSettings
 * @description Lets you start games with a much wider range of settings than normal
 * @author TheLazySquid
 * @version 0.2.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/UncappedSettings.js
 * @webpage https://gimloader.github.io/plugins/uncappedsettings
 * @reloadRequired true
 */

function changeHooks(res) {
    for(let hook of res.hooks) {
        let key = hook.key.toLowerCase();

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
}

const wrapRequester = api.rewriter.createShared("WrapRequester", (requester) => {
    return function() {
        if(
            GL.plugins.isEnabled("UncappedSettings") &&
            arguments[0].url === "/api/experience/map/hooks" &&
            arguments[0].success
        ) {
            let success = arguments[0].success;
            arguments[0].success = function(res) {
                changeHooks(res);
                return success.apply(this, arguments);
            }
        }

        return requester.apply(this, arguments);
    }
});

api.rewriter.addParseHook(true, (code) => {
    const index = code.indexOf("JSON.stringify({url");
    if(index === -1) return;

    const start = code.indexOf("=", code.lastIndexOf(",", index)) + 1;
    const end = code.indexOf("})}})}", index) + 6;
    const func = code.slice(start, end);

    code = code.slice(0, start) + `(${wrapRequester} ?? (v => v))(${func});` + code.slice(end);
    return code;
});