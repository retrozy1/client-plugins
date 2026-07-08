import type { RigidBody } from '@dimforge/rapier2d-compat';
import type RespawnDevicesManager from './devices/respawnDevices';
import type ZoneDevicesManager from './devices/zoneDevices';

export default class DeviceManager {
  private readonly zoneDevicesManager: ZoneDevicesManager;
  private readonly respawnDevicesManager: RespawnDevicesManager;
  private readonly characterSpawnPadDevices: CharacterSpawnPadDevicesManager;

  constructor(devices: Gimloader.Stores.Device[], private readonly rb: RigidBody) {
    const zoneDevices: Gimloader.Stores.Device[] = [];
    const respawnDevices: Gimloader.Stores.Device[] = [];
    const characterSpawnPadDevices: Gimloader.Stores.Device[] = [];

    
  }

  private triggerChannel(channel: string) {
    
  }

  step() {
    const physicsCoordinates = this.rb.translation();
    
    this.zoneDevicesManager.step(physicsCoordinates);
    this.respawnDevicesManager
  }
}