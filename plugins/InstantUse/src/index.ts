api.hotkeys.addConfigurableHotkey({
    category: "InstantUse",
    title: "Use Device",
    default: {
        key: "Enter"
    },
    preventDefault: false
}, () => {
    let devices = api.stores?.phaser?.scene?.worldManager?.devices;
    let body = api.stores?.phaser?.mainCharacter?.body;
    if(!devices || !body) return

    let device = devices.interactives.findClosestInteractiveDevice(devices.devicesInView, body.x, body.y);

    // trigger it
    if(device) {
        device.interactiveZones?.onInteraction?.()
    }
});