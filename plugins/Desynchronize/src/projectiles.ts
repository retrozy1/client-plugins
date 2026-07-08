import type RAPIER from "@dimforge/rapier2d-compat";
import type { Character, FirePacket, ProjectileId } from './types';
import { gadgetOptions } from './consts';
import type { Vector } from '@dimforge/rapier2d-compat';
import { getSection } from '$shared/rewritingUtils';

interface ProjectileInfo {
    x: number;
    y: number;
    angle: number;
    maxDistance: number;
    startDistance: number;
    speed: number;
    radius: number;
    appearance: string;
    ownerId: string;
    ownerTeamId: string;
    damage: number;
    projectileId: string;
}

interface Projectile {
    id: string;
    x: number;
    y: number;
    velocity: RAPIER.Vector2;
    distance: number;
    duration: number;
    endTime: number;
    shape: RAPIER.Shape;
    damage: number;
    ownerTeamId: string;
    ownerId: string;
}

interface ProjectileAdded {
    id: string;
    startTime: number;
    endTime: number;
    start: RAPIER.Vector;
    end: RAPIER.Vector;
    radius: number;
    appearance: string;
    ownerId: string;
    ownerTeamId: string;
    damage: number;
    hitPos?: Vector;
    hitTime?: number;
}

export enum DamageType {
    brokenShield = "b",
    shield = "s",
    health = "h",
    fragility = "f"
}

export interface CharacterHit {
    characterId: string;
    damage: number;
    type: DamageType;
}

export interface ProjectileHit {
    hits: CharacterHit[];
    id: string;
    x: number;
    y: number;
}

type OnHitCallback = (info: {
    damage: number;
    ownerTeamId: string;
}) => CharacterHit | void;

const physicsScale = 100;

export function angleToVector(angle: number) {
    return {
        x: Math.cos(angle),
        y: Math.sin(angle)
    }
}

function createCollisionGroup(options: { belongs: number[], collidesWith?: number[], notCollidesWith?: number[] }) {
    let high = 0;
    let low = options.collidesWith ? 0 : 65535;
    options.belongs.forEach((n) => {
        high |= 1 << n
    });
    options.collidesWith?.forEach((n) => {
        low |= 1 << n;
    });
    options.notCollidesWith?.forEach((n) => {
        low &= ~(1 << n);
    });
    return high << 16 | low;
}

export enum CollisionGroups {
    everything,
    characterMainBody,
    characterAround,
    characterFeet,
    staticWorldSensor,
    staticWorldCollider,
    dynamicWorldSensor,
    dynamicWorldCollider,
    inactiveStaticWorldCollider,
    ball,
    ballZone
}

function staggered(callback: () => void, delay = 0) {
    let triggered = false;

    return () => {
        if(triggered) return;
        triggered = true;

        setTimeout(() => {
            callback();
            triggered = false;
        }, delay);
    }
}

interface HitForcesInfo {
    projectile: ProjectileAdded;
    character: Gimloader.Stores.Character;
}

export default class ProjectileManager {
    added: ProjectileAdded[] = [];
    hits: ProjectileHit[] = [];
    projectiles: Projectile[] = [];
    stepInterval = setInterval(this.step.bind(this), 1000 / 30);
    lastUpdate = Date.now();
    onHitCallbacks = new Map<number, OnHitCallback>();
    nextIndex = 0;
    lastHitById: string | null = null;

    getNextIndex() {
        if (this.nextIndex === 255) {
            return this.nextIndex = 0;
        }
        return ++this.nextIndex;
    }

    setCharacterFragility(char: Character, fragility: number) {
        if (char.id === api.stores.network.authId) {
            api.stores.me.health.fragility = fragility;
        }

        api.stores.phaser.scene.characterManager.characters.get(char.id)!.nametag.updateFragility(fragility);
    }

    resetCharacterFragility(char: Character) {
        this.setCharacterFragility(char, char.health.fragility)
    }

    resetAllFragilities() {
        api.net.state.characters.forEach((char) => this.resetCharacterFragility(char));
    }

    constructor(
        private readonly rapier: typeof RAPIER,
        private readonly hit: (hit: ProjectileHit) => void,
    ) {
        api.rewriter.runInScope("App", (code, run) => {
            if (!code.includes("forceTickMultiplier:.89")) return;
            const name = getSection(code, `forceTickMultiplier:.89#Math.PI,@=`);
            const originalApplyForce = run(name) as (hitForcesInfo: HitForcesInfo) => Vector[];

            const applyForce = (hitForcesInfo: HitForcesInfo) => {
                const { projectile } = hitForcesInfo;
                this.runOnHit?.(projectile.id as ProjectileId);
                const forces = originalApplyForce(hitForcesInfo);
                this.lastHitById = hitForcesInfo.projectile.ownerId;

                api.stores.phaser.mainCharacter.nametag.updateFragility(
                    api.stores.me.health.fragility += projectile.damage
                );

                return forces;
            }

            run(`${name} = ${api.rewriter.createShared("ApplyForce", applyForce)}`);
            api.onStop(() => {
                run(`${name} = ${api.rewriter.createShared("OriginalApplyForce", originalApplyForce)}`);
            });
        })
    }

    dispose() {
        clearInterval(this.stepInterval);
    }

    fire(firePacket: FirePacket, id: ProjectileId) {
        const inventory = api.stores.me.inventory;
        const slot = inventory.interactiveSlots.get(inventory.activeInteractiveSlot.toFixed());
        if (!slot) return;
        slot.count--;

        this.addProjectile(firePacket, api.net.state.characters.get(api.stores.network.authId)!, id);
    }

    fireFromCharacter(character: Character, id: ProjectileId, angle: number) {
        const sceneChar = api.stores.phaser.scene.characterManager.characters.get(character.id)!;
        const firePacket: FirePacket = {
            ...sceneChar.body,
            angle
        };
        this.addProjectile(firePacket, character, id);
    }

    private addProjectile(firePacket: FirePacket, character: Character, id: ProjectileId) {
        const activeItem = character.inventory.interactiveSlots.get(character.inventory.activeInteractiveSlot.toFixed());
        if (!activeItem) return;
        const gadget = gadgetOptions[activeItem.itemId];
        const item = api.stores.worldOptions.itemOptions.find((i) => i.id === activeItem.itemId);
        if(!gadget || !item || !item.weapon || item.type !== "weapon") return;
        const startDistance = item.weapon.shared.startingProjectileDistanceFromCharacter;

        let start = {
            x: firePacket.x / physicsScale + Math.cos(firePacket.angle) * startDistance,
            y: firePacket.y / physicsScale + Math.sin(firePacket.angle) * startDistance
        };


        // calculate if we hit any static objects
        let shape = new this.rapier.Ball(gadget.radius);
        let velocity = angleToVector(firePacket.angle);
        let hit = api.stores.phaser.scene.worldManager.physics.world.castShape(
            start, 0, velocity, shape, gadget.distance,
            // @ts-expect-error
            true, null,
            createCollisionGroup({
                belongs: [CollisionGroups.everything],
                collidesWith: [CollisionGroups.staticWorldCollider]
            })
        );

        // @ts-expect-error
        let distance = hit ? hit.toi : gadget.distance;

        let end = {
            x: start.x + velocity.x * distance,
            y: start.y + velocity.y * distance
        };
        let time = distance / gadget.speed;
        let startTime = api.stores.session.gameTime;
        let endTime = startTime + time;

        this.projectiles.push({
            id,
            ...start,
            velocity,
            distance,
            duration: time,
            endTime,
            shape,
            damage: gadget.damage,
            ownerTeamId: character.teamId,
            ownerId: character.id
        });
        
        api.stores.phaser.scene.worldManager.projectiles.addProjectile({
            id,
            startTime,
            endTime,
            start,
            end,
            radius: gadget.radius,
            appearance: item.weapon.appearance,
            ownerId: character.id,
            ownerTeamId: character.teamId,
            damage: gadget.damage * character.projectiles.damageMultiplier,
            hitTime: undefined,
            hitPos: undefined
        })

        // this.added.push({
        //     id,
        //     startTime,
        //     endTime,
        //     start,
        //     end,
        //     radius: gadget.radius,
        //     appearance: item.weapon.appearance,
        //     ownerId: character.id,
        //     ownerTeamId: character.teamId,
        //     damage: gadget.damage * character.projectiles.damageMultiplier,
        //     hitTime: undefined,
        //     hitPos: undefined
        // });

        // this.broadcastChanges();
    }

    onHit(collider: RAPIER.Collider, callback: OnHitCallback) {
        this.onHitCallbacks.set(collider.handle, callback);
    }

    offHit(collider: RAPIER.Collider) {
        this.onHitCallbacks.delete(collider.handle);
    }

    runOnHit: ((id: ProjectileId) => void) | null = null

    hitPlayer(hitCharacter: Character, projectileId: ProjectileId) {
        const sceneChar = api.stores.phaser.scene.characterManager.characters.get(hitCharacter.id)!;
        const projectile = this.projectiles.find(proj => {
            if (proj.id === projectileId) {
                return true
            }
        });
        
        if (!projectile) return;
        this.hit({
            hits: [{
                characterId: hitCharacter.id,
                damage: projectile.damage,
                type: DamageType.health
            }],
            id: projectileId,
            ...sceneChar.body
        });

        const nametag = sceneChar.nametag;
        if (!nametag.fragilityTag) return;
        nametag.updateFragility(Number(nametag.fragilityTag.text.slice(0, -1)) + projectile.damage);
    }

    giveKnockoutSubtraction(character: Character) {
        const sceneChar = api.stores.phaser.scene.characterManager.characters.get(character.id);
        if (!sceneChar) return;
        const nametag = sceneChar.nametag;
        this.setCharacterFragility(character, Math.max(+nametag.fragilityTag!.text.slice(0, -1) - 50, 0))
    }

    triggerChannel(channel: string) {
        for (const device of api.stores.phaser.scene.worldManager.devices.allDevices.filter(d => d.deviceOption.id === "respawn")) {
            if (device.options.respawnOnChannel !== channel) continue;

            this.respawn();
        }
    }

    respawn() {
        const char = api.net.state.characters.get(api.stores.network.authId)!;

        const characterSpawnPads = api.stores.phaser.scene.worldManager.devices.allDevices
            .filter(d => d.deviceOption.id === "characterSpawnPad" && d.options.phase === "Game");
        const randomIndex = Math.floor(Math.random() * characterSpawnPads.length);
        const spawnPad = characterSpawnPads[randomIndex];
        api.stores.phaser.mainCharacter.physics.getBody().rigidBody.setTranslation({ x: spawnPad.x / 100, y: spawnPad.y / 100 }, true);
        this.resetCharacterFragility(char);
        this.onrespawn?.();
        this.lastHitById = null;
    }

    onrespawn: (() => void) | null = null;

    step() {
        for (const zone of api.stores.phaser.scene.worldManager.devices.allDevices.filter(d => d.deviceOption.id === "zone")) {
            const top = zone.y - zone.options.height / 2;
            const translation = api.stores.phaser.mainCharacter.physics.getBody().rigidBody.translation();
            if (top < translation.y * 100) {
                this.triggerChannel(zone.options.playerEntersChannel)
            }
        }

        return;
    }

    startBroadcast = staggered(this.broadcastChanges.bind(this));

    broadcastChanges() {
        for (const added of this.added) {
            api.stores.phaser.scene.worldManager.projectiles.addProjectile(added);
        }

        this.hits = [];
        this.added = [];
    }
}