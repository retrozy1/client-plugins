/**
 * @name UncappedSettings
 * @description Lets you start games with a much wider range of settings than normal
 * @author TheLazySquid
 * @version 0.2.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/UncappedSettings.js
 * @webpage https://gimloader.github.io/plugins/uncappedsettings
 * @reloadRequired true
 */

// plugins/UncappedSettings/src/index.ts
function changeHooks(res) {
  for (const hook of res.hooks) {
    const key = hook.key.toLowerCase();
    if (key.includes("duration")) {
      hook.options.min = 1;
      hook.options.max = 60;
    } else if (key.includes("question")) {
      hook.options.min = -1e11 + 1;
      hook.options.max = 1e11 - 1;
    }
  }
}
var wrapRequester = api.rewriter.createShared("WrapRequester", (requester) => {
  return function() {
    if (GL.plugins.isEnabled("UncappedSettings") && arguments[0].url === "/api/experience/map/hooks" && arguments[0].success) {
      const success = arguments[0].success;
      arguments[0].success = function(res) {
        changeHooks(res);
        return success.apply(this, arguments);
      };
    }
    return requester.apply(this, arguments);
  };
});
api.rewriter.addParseHook(true, (code) => {
  const index = code.indexOf("JSON.stringify({url");
  if (index === -1) return code;
  const start = code.indexOf("=", code.lastIndexOf(",", index)) + 1;
  const end = code.indexOf("})}})}", index) + 6;
  const func = code.slice(start, end);
  code = code.slice(0, start) + `(${wrapRequester} ?? (v => v))(${func});` + code.slice(end);
  return code;
});
