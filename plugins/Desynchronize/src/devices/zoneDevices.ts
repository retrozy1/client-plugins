import type { Vector } from '@dimforge/rapier2d-compat';

export default class ZoneDevicesManager {
  private readonly enteredZones: Gimloader.Stores.Device[] = [];

  private static isInZone(zone: Gimloader.Stores.Device, coordinates: Vector) {

  }

  constructor(private readonly zones: Gimloader.Stores.Device) {}

  step(physicsCoordinates: Vector) {

  }
}