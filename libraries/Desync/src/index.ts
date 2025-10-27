let enabled = false;
api.onStop(() => enabled = false);

export function enable() {
    enabled = true;
}

api.net.onLoad(() => {
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