import type RAPIER from "@dimforge/rapier2d-compat";

const settings = api.settings.create([
    {
        id: "collidePlayers",
        type: "toggle",
        title: "Collide with other players",
        default: true
    },
    {
        id: "collideSentries",
        type: "toggle",
        title: "Collide with sentries",
        default: true
    }
]);

class Collision {
    private readonly physics: Gimloader.Stores.PhysicsManager;
    private readonly world: RAPIER.World;
    private readonly colliders = new Map<string, RAPIER.Collider>();

    constructor(private readonly rapier: typeof RAPIER, stores: Gimloader.Stores.Stores) {
        this.physics = stores.phaser.scene.worldManager.physics;
        this.world = this.physics.world;

        api.patcher.before(this.physics, "physicsStep", () => {
            for(const [id, collider] of this.colliders) {
                const body = stores.phaser.scene.characterManager.characters.get(id)?.body;
                if(!body) return;

                collider.setTranslation({
                    x: body.x / 100,
                    y: body.y / 100
                });
            }
        });
    }

    createCollider(id: string) {
        if(this.colliders.has(id)) return;
        const collider = this.world.createCollider(this.rapier.ColliderDesc.cuboid(0.32, 0.32));
        this.colliders.set(id, collider);
    }

    removeCollider(id: string) {
        const collider = this.colliders.get(id);
        if(!collider) return;
        this.world.removeCollider(collider, true);
        this.colliders.delete(id);
    }

    removeAllColliders() {
        this.colliders.keys().forEach(this.removeCollider);
    }
}

api.net.onColyseusLoad(async (stores, net) => {
    const rapier = await new Promise<typeof RAPIER>((res) => {
        api.rewriter.exposeVar("App", {
            check: "this.device.parts.destroySpecificPart",
            find: /var (\S+)=Object.freeze\({__proto__:null/,
            callback: res
        });
    });

    const collision = new Collision(rapier, stores);
    const myId = stores.network.auth.myId;
    
    api.onStop(
        net.state.characters.onAdd((char) => {
            if(char.id === myId) return;
            if(char.type === "player" && !settings.collidePlayers) return;
            if(char.type === "sentry" && !settings.collideSentries) return;

            collision.createCollider(char.id);

            api.onStop(
                char.onRemove(() => collision.removeCollider(char.id))
            );
        })
    );

    settings.listen("collidePlayers", (enabled) => {
        for(const [id, char] of stores.phaser.scene.characterManager.characters) {
            if(char.type !== "player" || char.id === myId) continue;
            if(enabled) {
                collision.createCollider(id);
            } else {
                collision.removeCollider(id);
            }
        }
    });

    settings.listen("collideSentries", (enabled) => {
        for(const [id, { type }] of stores.phaser.scene.characterManager.characters) {
            if(type !== "sentry") continue;
            if(enabled) {
                collision.createCollider(id);
            } else {
                collision.removeCollider(id);
            }
        }
    });

    if(!net.isHost) {
        const gameOwnerId = stores.session.gameOwnerId;
        net.state.session.listen("phase", (phase) => {
            if(
                net.state.characters.get(gameOwnerId)?.teamId === "__SPECTATORS_TEAM"
                && phase === "game"
            ) {
                collision.removeCollider(gameOwnerId);
            } else {
                collision.createCollider(gameOwnerId);
            }
        });
    }

    api.onStop(() => {
        collision.removeAllColliders();
    })
})
