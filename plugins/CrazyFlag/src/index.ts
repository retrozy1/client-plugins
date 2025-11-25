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

// Not exhaustive, just the interesting ones
interface FlagConsts {
    BaseScale: number;
    FlagDockedShift: number;
    FlagDropShift: number;
    FlagOriginX: number;
    FlagOriginY: number;
    FlagSwingAmplitude: number;
    FlagSwingInterval: number;
    InteractvityRadius: number;
    PlatformOriginX: number;
    PlatformOriginY: number;
}
let flagConsts: FlagConsts | null = null;

function applySettings() {
    if(!flagConsts) return;
    flagConsts.FlagSwingInterval = 1 / api.settings.swingSpeed;
    flagConsts.FlagSwingAmplitude = api.settings.swingAmount / 10;
}

api.settings.listen("swingSpeed", applySettings);
api.settings.listen("swingAmount", applySettings);

const constsCallback = api.rewriter.createShared("FlagConsts", (consts: any) => {
    const defaults = Object.assign({}, consts);
    flagConsts = consts;
    applySettings();

    api.onStop(() => {
        if(!flagConsts) return;
        Object.assign(flagConsts, defaults);
    });
});

api.rewriter.addParseHook("FlagDevice", (code) => {
    const index = code.indexOf("FlagOriginX:");
    if(index === -1) return code;

    const end = code.lastIndexOf("=", index);
    const start = code.lastIndexOf(",", end);
    const name = code.slice(start + 1, end);
    code += `${constsCallback}?.(${name});`;

    return code;
});
