/**
 * @name Desync
 * @description Stop synchronizing the client's position with the server
 * @author TheLazySquid
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/libraries/Desync.js
 * @isLibrary true
 */

let enabled = false;
api.onStop(() => enabled = false);

export function enable() {
    enabled = true;
}

api.net.onLoad((type) => {
    if(type !== "Colyseus") return;

    let allowNext = false;
    let firstPhase = true;

    // allow us to be moved when the game starts/stops
    api.onStop(api.net.room.state.session.listen("phase", () => {
        if(firstPhase) {
            firstPhase = false;
            return;
        }
        allowNext = true;
    }));

    api.net.on("PHYSICS_STATE", (_, editFn) => {
        if (allowNext) {
            allowNext = false;
            return;
        }
        if(enabled) editFn(null);
    });
});