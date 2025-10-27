import BaseLine, { type Settings } from "../baseLine";

export default class PhysicsCoordinates extends BaseLine {
    name = "Physics Coordinates";
    enabledDefault = false;
    settings: Settings = {
        "physicsCoordsDecimalPlaces": {
            label: "Physics coordinates decimal places",
            min: 0,
            max: 10,
            default: 2
        }
    };

    rb: any;

    init() {
        const physics = api.stores.phaser.mainCharacter.physics;
        this.rb = physics.getBody().rigidBody;
    }

    onPhysicsTick() {
        const translation = this.rb?.translation();
        if(!translation) return;

        const decimals = this.settings.physicsCoordsDecimalPlaces.value;

        this.update(`physics x: ${translation.x.toFixed(decimals)}, y: ${translation.y.toFixed(decimals)}`);
    }
}
