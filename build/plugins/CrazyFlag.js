/**
 * @name CrazyFlag
 * @description Make the flags in capture the flag or creative swing like crazy!
 * @author TheLazySquid
 * @version 1.3.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/CrazyFlag.js
 * @webpage https://gimloader.github.io/plugins/crazyflag
 * @reloadRequired ingame
 * @hasSettings true
 * @changelog Switched to a utility for rewriting source code
 */

// shared/minifiedNavigator.ts
function minifiedNavigator(code, start, end) {
  if (typeof start === "string") start = [start];
  if (typeof end === "string") end = [end];
  let startIndex = 0;
  if (start) {
    for (const snippet of start) {
      startIndex = code.indexOf(snippet, startIndex) + snippet.length;
    }
  }
  let endIndex = startIndex;
  if (end) {
    for (const snippet in end) {
      endIndex = code.indexOf(end[snippet], endIndex);
      if (Number(snippet) < end.length - 1) endIndex += end[snippet].length;
    }
  } else {
    endIndex = code.length - 1;
  }
  const startCode = code.slice(0, startIndex);
  const endCode = code.substring(endIndex);
  return {
    startIndex,
    endIndex,
    inBetween: code.slice(startIndex, endIndex),
    insertAfterStart(string) {
      return startCode + string + this.inBetween + endCode;
    },
    insertBeforeEnd(string) {
      return startCode + this.inBetween + string + endCode;
    },
    replaceEntireBetween(string) {
      return startCode + string + endCode;
    },
    replaceBetween(...args) {
      const changedMiddle = this.inBetween.replace(...args);
      return this.replaceEntireBetween(changedMiddle);
    },
    deleteBetween() {
      return startCode + endCode;
    }
  };
}

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
  const name = minifiedNavigator(code, ")}),", "=").inBetween;
  return code + `${constsCallback}?.(${name});`;
});
