api.hotkeys.addConfigurableHotkey({
    category: "InstantUse",
    title: "Use Device",
    default: {
        key: "Enter"
    },
    preventDefault: false
}, () => {
    const devices = api.stores?.phaser?.scene?.worldManager?.devices;
    const body = api.stores?.phaser?.mainCharacter?.body;
    if(!devices || !body) return;

    const device = devices.interactives.findClosestInteractiveDevice(devices.devicesInView, body.x, body.y);

    // trigger it
    if(device) {
        // @ts-expect-error Improperly documented
        device.interactiveZones?.onInteraction?.();
    }
});
