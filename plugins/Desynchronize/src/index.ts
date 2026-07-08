import { baseDownloadUrl } from "$shared/config";
import type RAPIER from '@dimforge/rapier2d-compat';
import ProjectileManager from './projectiles';
import Sync from "./sync";
import type { FirePacket, ProjectileId } from './types';
import { byteToPi, piToByte } from './encoding';
export * as DLD from "./dld";

export interface GadgetOption {
    clipSize?: number;
    reloadTime?: number;
    damage: number;
    radius: number;
    distance: number;
    speed: number;
}

const settings = api.settings.create([
    {
        id: "dldLaserAction",
        type: "dropdown",
        options: [
            { label: "Respawn Character", value: "respawn" },
            { label: "Show Warning", value: "warn" },
            { label: "Ignore", value: "ignore" }
        ],
        title: "On hitting a laser in DLD",
        description: "What action should be taken when touching a laser in DLD?",
        default: "warn"
    },
    {
        id: "pluginSync",
        type: "toggle",
        title: "Plugin Sync",
        description: "Syncs your position (nothing else) to other players with this plugin and setting on. This requires the optional Communication library to be installed."
    }
]);

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

interface ProjectileHit {
    hits: CharacterHit[];
    id: string;
    x: number;
    y: number;
}

enum ProjectileComms {
    Fire,
    IWasHit,
    IWasKnockedOut
}

api.net.onLoad(async () => {
    let allowNext = false;
    let firstPhase = true;

    // allow us to be moved when the game starts/stops
    api.onStop(api.net.state.session.listen("phase", () => {
        if(firstPhase) {
            firstPhase = false;
            return;
        }
        allowNext = true;
    }));

    api.net.on("PHYSICS_STATE", (_, editFn) => {
        if(allowNext) {
            allowNext = false;
            return;
        }
        editFn(null);
    });

    api.net.on("send:INPUT", (_, editFn) => {
        // Allow movement when in the creative editor
        if(api.stores.session.version === "saved" && api.stores.session.phase === "preGame") return;
        editFn(null);
    });
    
    if (api.net.gamemode === "knockback") {
        const rapier = await new Promise<typeof RAPIER>((res) => {
            api.rewriter.exposeVar("App", {
                check: "this.device.parts.destroySpecificPart",
                find: /var (\S+)=Object.freeze\({__proto__:null/,
                callback: res
            });
        });

        const hit = await new Promise<(hit: ProjectileHit) => void>((res) => {
            api.rewriter.runInScope("App", (code, run) => {
                if (!code.includes('fragility:"255, 235, 59",')) return;
                res(run("f_"));
                return true;
            })
        })

        api.net.on("send:RELOAD", (_, editFn) => {
            // const item = api.stores.me.inventory.interactiveSlots.get("1");
            // if (!item || item.itemId !== "pixel_rare") return;
            // item.currentClip = 34
            editFn(null);
        })

        const projectileManager = new ProjectileManager(rapier, hit);

        const Comms = api.lib("Communication");
        const fireComms = new Comms<
            | [ProjectileComms.IWasKnockedOut, number]
            | [ProjectileComms.IWasHit | ProjectileComms.Fire, number, number]
        >("Desynchronize-Projectiles");

        api.onStop(
            api.net.state.session.listen("phase", phase => {
                if (phase === "game") return;
                projectileManager.resetAllFragilities();
            }, false)
        )

        api.onStop(() => {
            projectileManager.resetAllFragilities();
        })

        projectileManager.onrespawn = () => {
            if (!projectileManager.lastHitById) return;

            fireComms.send([ProjectileComms.IWasKnockedOut, [...api.net.state.characters.values()]
                .findIndex(char => char.id === projectileManager.lastHitById)])
        }

        fireComms.onMessage((message, char) => {
            const op = message[0];
            switch (op) {
                case ProjectileComms.Fire: {
                    const [_, index, angleByte] = message;
                    const id = `${char.id}_${index}` as const;
                    const angle = byteToPi(angleByte);
                    projectileManager.fireFromCharacter(char, id, angle);

                    break;
                }
                case ProjectileComms.IWasHit: {
                    const [_, index, playerIndex] = message;
                    const playerId = [...api.net.state.characters.values()][playerIndex].id;
                    const id = `${playerId}_${index}` as const;
                    projectileManager.hitPlayer(char, id);
                    break;
                }
                case ProjectileComms.IWasKnockedOut: {
                    const playerIndex = message[1];
                    const playerId = [...api.net.state.characters.values()][playerIndex].id;    
                    const knockouter = api.net.state.characters.get(playerId)!;
                    projectileManager.giveKnockoutSubtraction(knockouter)
                    if (playerId === api.stores.network.authId) {
                        api.stores.gui.knockoutAlerts.push({
                            id: char.id,
                            name: char.name
                        });
                    };  
                    projectileManager.resetCharacterFragility(char)
                    break;
                }
            }
        })

        api.net.on("send:FIRE", (data: FirePacket, editFn) => {
            const index = projectileManager.getNextIndex();
            const id = `${api.stores.network.authId}_${index}` as const;
            const byte = piToByte(data.angle);
            fireComms.send([ProjectileComms.Fire, index, byte]);
            projectileManager.fire(data, id);
            editFn(null);
        })

        api.net.on("PROJECTILE_CHANGES", (_, editFn) => {
            editFn(null);
        });

        projectileManager.runOnHit = (id) => {
            const [playerId, index] = id.split("_")
            const playerIndex = [...api.net.state.characters.values()].findIndex(char => char.id === playerId)
            fireComms.send([ProjectileComms.IWasHit, Number(index), playerIndex]);
        }

        api.onStop(() => {
            projectileManager.dispose();
        });
    }
});

let sync: Sync | null = null;

function stopSync() {
    sync?.stop();
    sync = null;
}

settings.listen("pluginSync", (enabled) => {
    if(!enabled) {
        stopSync();
        return;
    }

    api.libs.require("Communication", `${baseDownloadUrl}/libraries/Communication.js`)
        .then(() => {
            api.net.onLoad(() => {
                sync ??= new Sync();
            });
        }).catch(() => {
            settings.pluginSync = false;
            api.UI.message.error({ content: "Cannot enable sync setting without Communication library" });
        });
}, true);

api.onStop(stopSync);
