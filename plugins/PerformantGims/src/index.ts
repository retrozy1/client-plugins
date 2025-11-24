import minifiedNavigator from '$shared/minifiedNavigator';
import type { Vector } from "@dimforge/rapier2d-compat";

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

function shouldApply(character: Gimloader.Stores.Character) {
    if(api.settings.applyTo === "everything") return true;
    else if(api.settings.applyTo === "sentries") return character.type === "sentry";

    return character.id !== api.stores.network.authId;
}

const wrapSkin = api.rewriter.createShared("WrapSkin", (Skin: any) => {
    class NewSkin {
        character: Gimloader.Stores.Character;
        scene: Gimloader.Stores.Scene;
        skinId = "character_default_cyan";
        latestSkinId = "character_default_cyan";

        constructor(props: any) {
            this.character = props.character;
            this.scene = props.scene;

            if(!props.character || !shouldApply(props.character)) {
                return new Skin(props);
            }
        }
        updateSkin(A: Gimloader.Stores.SkinOptions) {
            A.id = A.id.replace("character_", "");
            const load = this.scene.load.image(`gim-${A.id}`, `https://www.gimkit.com/assets/map/characters/spine/preview/${A.id}.png`);
            load.on("complete", () => {
                this.setupSkin({
                    id: A.id
                });
            });
            load.start();
        }
        setupSkin(position: Gimloader.Stores.SkinOptions & Partial<Vector>) {
            const x = position.x ?? this.character.spine.x;
            const y = position.y ?? this.character.spine.y;

            if(this.character.spine) this.character.spine.destroy(true);
            this.character.scale.baseScale = 0.7;
            this.character.spine = this.scene.add.sprite(x, y, `gim-${position.id}`);
            this.character.spine.setOrigin(0.5, 0.75);
            this.character.spine.skeleton = { color: {}, physicsTranslate: () => {} };
            const scale = this.character.scale;
            this.character.spine.setScale(scale.scaleX, scale.scaleY);

            this.character.characterTrail.followCharacter();
        }
        applyEditStyles() {}
    }

    return NewSkin;
});

api.rewriter.addParseHook("App", (code) => {
    if(!code.includes("JSON.stringify(this.editStyles")) return code;

    const className = minifiedNavigator(code, ".DEFAULT_CYAN};class ", "{").inBetween;
    const classSection = minifiedNavigator(code, ".DEFAULT_CYAN};", ["this.character=", "var"]);
    const classCode = classSection.inBetween;
    return classSection.replaceEntireBetween(`const ${className}=(${wrapSkin} ?? (v => v))(${classCode});`)
});

const wrapAnimations = api.rewriter.createShared("WrapAnimations", (Animation: any) => {
    class NewAnimation {
        constructor(props: any) {
            if(!shouldApply(props.character)) {
                return new Animation(props);
            }
        }
        destroy() {}
        update() {}
        onSkinChanged() {}
    }

    return NewAnimation;
});

api.rewriter.addParseHook("FixSpinePlugin", (code) => {
    if (!code.includes("onSkinChanged=")) return code;

    const className = minifiedNavigator(code, "BODY:5};class ", "{").inBetween;
    console.log(className)
    const classSection = minifiedNavigator(code, "BODY:5};", ["this.character=", "if"]);
    const classCode = classSection.inBetween;
    console.log(classCode)
    return classSection.replaceEntireBetween(`const ${className}=(${wrapAnimations} ?? (v => v))(${classCode});`)
});
