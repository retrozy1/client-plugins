/**
 * @name CrazyFlag
 * @description Make the flags in capture the flag or creative swing like crazy!
 * @author TheLazySquid
 * @version 1.3.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/CrazyFlag.js
 * @webpage https://gimloader.github.io/plugins/crazyflag
 * @reloadRequired ingame
 * @hasSettings true
 */

// plugins/CrazyFlag/src/index.ts
api.settings.create([
  {
    type: "number",
    id: "swingSpeed",
    title: "Swing Speed",
    description: "1 = normal speed",
    default: 2,
    min: 0
  },
  {
    type: "number",
    id: "swingAmount",
    title: "Swing Amount",
    description: "1 = normal speed",
    default: 120,
    min: 0
  }
]);
var flagConsts = null;
function applySettings() {
  if (!flagConsts) return;
  flagConsts.FlagSwingInterval = 1 / api.settings.swingSpeed;
  flagConsts.FlagSwingAmplitude = api.settings.swingAmount / 10;
}
api.settings.listen("swingSpeed", applySettings);
api.settings.listen("swingAmount", applySettings);
var constsCallback = api.rewriter.createShared("FlagConsts", (consts) => {
  const defaults = Object.assign({}, consts);
  flagConsts = consts;
  applySettings();
  api.onStop(() => {
    if (!flagConsts) return;
    Object.assign(flagConsts, defaults);
  });
});
api.rewriter.addParseHook("FlagDevice", (code) => {
  const index = code.indexOf("FlagOriginX:");
  if (index === -1) return code;
  const end = code.lastIndexOf("=", index);
  const start = code.lastIndexOf(",", end);
  const name = code.slice(start + 1, end);
  code += `${constsCallback}?.(${name});`;
  return code;
});
