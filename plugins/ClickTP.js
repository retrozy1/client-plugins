/**
 * @name ClickTP
 * @description Ctrl+Click to teleport anywhere client-side
 * @author TheLazySquid
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/ClickTP.js
 * @webpage https://gimloader.github.io/plugins/clicktp
 * @needsLib Desync | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/libraries/Desync.js
 */

api.lib("Desync").enable();

api.net.onLoad(() => {
    const onClick = (e) => {
        if (!e.ctrlKey) return;
        let pos = api.stores.phaser.scene.inputManager.getMouseWorldXY();
        let rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
        rb.setTranslation({ x: pos.x / 100, y: pos.y / 100 }, true);
    };

    window.addEventListener("click", onClick);
    api.onStop(() => window.removeEventListener("click", onClick));
});