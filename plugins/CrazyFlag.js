/**
 * @name CrazyFlag
 * @description Make the flags in capture the flag or creative swing like crazy!
 * @author TheLazySquid
 * @version 1.2.0
 * @webpage https://gimloader.github.io/plugins/crazyflag
 * @needsLib QuickSettings | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/libraries/QuickSettings/build/QuickSettings.js
 * @hasSettings true
 * @reloadRequired ingame
 */
const api = new GL();

let settings = api.lib("QuickSettings")("CrazyFlag", [
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

let flagConsts;

function applySettings() {
    if(!flagConsts) return;
    flagConsts.FlagSwingInterval = 1 / settings.swingSpeed;
    flagConsts.FlagSwingAmplitude = settings.swingAmount / 10;
}

settings.listen("swingSpeed", applySettings);
settings.listen("swingAmount", applySettings);

const constsCallback = api.rewriter.createShared("FlagConsts", (consts) => {
    let defaults = Object.assign({}, consts);
    flagConsts = consts;
    applySettings();

    api.onStop(() => {
        Object.assign(flagConsts, defaults);
    });
});

api.rewriter.addParseHook("FlagDevice", (code) => {
    let index = code.indexOf("FlagOriginX:");
    if(index === -1) return;

    const end = code.lastIndexOf("=", index);
    const start = code.lastIndexOf(",", end);
    const name = code.slice(start + 1, end);
    code += `${constsCallback}?.(${name});`

    return code;
});