/**
 * @name InstantUse
 * @description Instantly use nearby devices without any wait
 * @author TheLazySquid
 * @version 0.2.4
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/InstantUse.js
 * @webpage https://gimloader.github.io/plugins/instantuse
 */

// plugins/InstantUse/src/index.ts
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
  if (!devices || !body) return;
  let device = devices.interactives.findClosestInteractiveDevice(devices.devicesInView, body.x, body.y);
  if (device) {
    device.interactiveZones?.onInteraction?.();
  }
});
