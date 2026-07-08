export default class RespawnDevicesManager {
  constructor(
    private readonly respawnDevices: Gimloader.Stores.Device[],
    private readonly characterSpawnPadDevices: Gimloader.Stores.Device[];
  ) {}

  triggerChannel(channel: string) {
    if (this.respawnDevices.every(device => device.options.respawnOnChannel !== channel)) return;

  }
}