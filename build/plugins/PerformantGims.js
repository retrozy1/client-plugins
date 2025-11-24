/**
 * @name PerformantGims
 * @description Replaces configurable gims with images of them. Looks like crap, runs really fast.
 * @author TheLazySquid
 * @version 0.5.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/PerformantGims.js
 * @webpage https://gimloader.github.io/plugins/performantgims
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

// plugins/PerformantGims/src/index.ts
api.settings.create([
  {
    type: "dropdown",
    title: "Apply To",
    description: "Which characters should be converted into still images? You will need to reload to see changes.",
    id: "applyTo",
    options: [
      { value: "everything", label: "Everything" },
      { value: "sentries", label: "Sentries" },
      { value: "others", label: "Others" }
    ],
    default: "others"
  }
]);
function shouldApply(character) {
  if (api.settings.applyTo === "everything") return true;
  else if (api.settings.applyTo === "sentries") return character.type === "sentry";
  return character.id !== api.stores.network.authId;
}
var wrapSkin = api.rewriter.createShared("WrapSkin", (Skin) => {
  class NewSkin {
    character;
    scene;
    skinId = "character_default_cyan";
    latestSkinId = "character_default_cyan";
    constructor(props) {
      this.character = props.character;
      this.scene = props.scene;
      if (!props.character || !shouldApply(props.character)) {
        return new Skin(props);
      }
    }
    updateSkin(A) {
      A.id = A.id.replace("character_", "");
      const load = this.scene.load.image(`gim-${A.id}`, `https://www.gimkit.com/assets/map/characters/spine/preview/${A.id}.png`);
      load.on("complete", () => {
        this.setupSkin({
          id: A.id
        });
      });
      load.start();
    }
    setupSkin(position) {
      const x = position.x ?? this.character.spine.x;
      const y = position.y ?? this.character.spine.y;
      if (this.character.spine) this.character.spine.destroy(true);
      this.character.scale.baseScale = 0.7;
      this.character.spine = this.scene.add.sprite(x, y, `gim-${position.id}`);
      this.character.spine.setOrigin(0.5, 0.75);
      this.character.spine.skeleton = { color: {}, physicsTranslate: () => {
      } };
      const scale = this.character.scale;
      this.character.spine.setScale(scale.scaleX, scale.scaleY);
      this.character.characterTrail.followCharacter();
    }
    applyEditStyles() {
    }
  }
  return NewSkin;
});
api.rewriter.addParseHook("App", (code) => {
  if (!code.includes("JSON.stringify(this.editStyles")) return code;
  const className = minifiedNavigator(code, ".DEFAULT_CYAN};class ", "{").inBetween;
  const classSection = minifiedNavigator(code, ".DEFAULT_CYAN};", ["this.character=", "var"]);
  const classCode = classSection.inBetween;
  return classSection.replaceEntireBetween(`const ${className}=(${wrapSkin} ?? (v => v))(${classCode});`);
});
var wrapAnimations = api.rewriter.createShared("WrapAnimations", (Animation) => {
  class NewAnimation {
    constructor(props) {
      if (!shouldApply(props.character)) {
        return new Animation(props);
      }
    }
    destroy() {
    }
    update() {
    }
    onSkinChanged() {
    }
  }
  return NewAnimation;
});
api.rewriter.addParseHook("FixSpinePlugin", (code) => {
  if (!code.includes("onSkinChanged=")) return code;
  const className = minifiedNavigator(code, "BODY:5};class ", "{").inBetween;
  console.log(className);
  const classSection = minifiedNavigator(code, "BODY:5};", ["this.character=", "if"]);
  const classCode = classSection.inBetween;
  console.log(classCode);
  return classSection.replaceEntireBetween(`const ${className}=(${wrapAnimations} ?? (v => v))(${classCode});`);
});
