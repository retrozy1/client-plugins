/**
 * @name CrazyFlag
 * @description Make the flags in capture the flag or creative swing like crazy!
 * @author TheLazySquid
 * @version 1.2.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/CrazyFlag.js
 * @webpage https://gimloader.github.io/plugins/crazyflag
 * @reloadRequired ingame
 * @needsLib QuickSettings | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/QuickSettings.js
 * @hasSettings true
 */

// plugins/CrazyFlag/src/index.ts
var settings = api.lib("QuickSettings")("CrazyFlag", [
  { type: "heading", text: "Crazy Flag Settings" },
  {
    type: "number",
    id: "swingSpeed",
    title: "Swing Speed (1 = default)",
    default: 2,
    min: 0
  },
  {
    type: "number",
    id: "swingAmount",
    title: "Swing Amount (1 = default)",
    default: 120,
    min: 0
  }
]);
api.openSettingsMenu(settings.openSettingsMenu);
var flagConsts = null;
function applySettings() {
  if (!flagConsts) return;
  flagConsts.FlagSwingInterval = 1 / settings.swingSpeed;
  flagConsts.FlagSwingAmplitude = settings.swingAmount / 10;
}
settings.listen("swingSpeed", applySettings);
settings.listen("swingAmount", applySettings);
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
