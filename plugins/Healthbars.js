/**
 * @name Healthbars
 * @description Adds healthbars underneath players' names
 * @author TheLazySquid
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/Healthbars.js
 * @webpage https://gimloader.github.io/plugins/healthbars
 */

const api = new GL();

api.net.onLoad(() => {
    const options = JSON.parse(api.stores.world.mapOptionsJSON);
	if(!options.showHealthAndShield) return;

    const { scene } = api.stores.phaser;
    const width = 130;
    const blue = 0x6894ec;
    const red = 0xff0000;
    const gray = 0x555555;

    const addHealthbar = (character) => {
        const bg = scene.add.rectangle(0, 0, width, 10, gray);
        const health = scene.add.rectangle(0, 0, width, 10, red);
        const shield = scene.add.rectangle(0, 0, width, 10, blue);
        shield.setStrokeStyle(2, 0xffffff);

        const stateChar = api.net.room.state.characters.get(character.id);
        const hp = stateChar.health;

        let stopUpdate = api.patcher.after(character.nametag, "update", () => {
            let { x, y, depth } = character.nametag.tag;
            y += 22;
            
            bg.visible = health.visible = shield.visible = !stateChar.isRespawning;
            health.width = hp.health / hp.maxHealth * width;
            shield.width = hp.shield / hp.maxShield * width;

            bg.setDepth(depth); bg.x = x; bg.y = y;
            health.setDepth(depth); health.x = x; health.y = y;
            shield.setDepth(depth); shield.x = x; shield.y = y;
        });

        let stopDestroy = api.patcher.after(character, "destroy", destroy);
        api.onStop(destroy);

        function destroy() {
            bg.destroy();
            health.destroy();
            shield.destroy();
            stopUpdate();
            stopDestroy();
        }
    }

    api.patcher.after(scene.characterManager, "addCharacter", (_, __, character) => {
        addHealthbar(character);
    });

    for(let character of scene.characterManager.characters.values()) {
        addHealthbar(character);
    }
});