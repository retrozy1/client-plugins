/**
 * @name DLDUtils
 * @description Allows plugins to move characters without the server's permission
 * @author TheLazySquid
 * @version 0.3.8
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/DLDUtils.js
 * @needsLib Desync | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Desync.js
 * @gamemode dontLookDown
 * @isLibrary true
 */

// libraries/DLDUtils/src/index.ts
var respawnHeight = 621.093;
var floorHeight = 638.37;
var lastCheckpointReached = 0;
var canRespawn = false;
api.net.onLoad(() => {
  let savestates = api.plugin("Savestates");
  if (savestates) {
    savestates.onStateLoaded((summit) => {
      if (typeof summit !== "number") return;
      lastCheckpointReached = summit;
      if (summit <= 1) canRespawn = false;
    });
  }
  api.net.room.state.session.gameSession.listen("phase", (phase) => {
    if (phase !== "results") return;
    canRespawn = false;
    lastCheckpointReached = 0;
  });
});
function cancelRespawn() {
  canRespawn = false;
}
var checkpointCoords = [
  { x: 38.25554275512695, y: 638.3899536132812 },
  { x: 90.22997283935547, y: 638.377685546875 },
  { x: 285.44000244140625, y: 532.780029296875 },
  { x: 217.5500030517578, y: 500.7799987792969 },
  { x: 400.3399963378906, y: 413.739990234375 },
  { x: 356.5400085449219, y: 351.6600036621094 },
  { x: 401.2699890136719, y: 285.739990234375 }
];
var doLaserRespawn = true;
function setLaserRespawnEnabled(enabled) {
  doLaserRespawn = enabled;
}
function setLaserWarningEnabled(enabled) {
  doLaserRespawn = enabled;
}
var enable = () => {
  const states = api.stores.world.devices.states;
  const body = api.stores.phaser.mainCharacter.physics.getBody();
  const shape = body.collider.shape;
  let hurtFrames = 0;
  let maxHurtFrames = 1;
  let physics = api.stores.phaser.scene.worldManager.physics;
  api.patcher.before(physics, "physicsStep", () => {
    if (api.stores.me.movementSpeed === 0) api.stores.me.movementSpeed = 310;
  });
  let wasOnLastFrame = false;
  let startImmunityActive = false;
  api.patcher.after(physics, "physicsStep", () => {
    if (api.net.room.state.session.gameSession.phase === "results") return;
    if (!doLaserRespawn || startImmunityActive) return;
    const devicesInView = api.stores.phaser.scene.worldManager.devices.devicesInView;
    const lasers = devicesInView.filter((d) => d.laser);
    if (lasers.length === 0) return;
    let lasersOn = states.get(lasers[0].id)?.properties.get("GLOBAL_active");
    if (!wasOnLastFrame && lasersOn) {
      startImmunityActive = true;
      setTimeout(() => startImmunityActive = false, 360);
    }
    wasOnLastFrame = lasersOn;
    if (!lasersOn || startImmunityActive) return;
    let translation = body.rigidBody.translation();
    const topLeft = {
      x: (translation.x - shape.radius) * 100,
      y: (translation.y - shape.halfHeight - shape.radius) * 100
    };
    const bottomRight = {
      x: (translation.x + shape.radius) * 100,
      y: (translation.y + shape.halfHeight + shape.radius) * 100
    };
    let hitLaser = false;
    for (let laser of lasers) {
      if (laser.dots.length <= 1) continue;
      let start = {
        x: laser.dots[0].options.x + laser.x,
        y: laser.dots[0].options.y + laser.y
      };
      let end = {
        x: laser.dots.at(-1).options.x + laser.x,
        y: laser.dots.at(-1).options.y + laser.y
      };
      if (boundingBoxOverlap(start, end, topLeft, bottomRight)) {
        hitLaser = true;
        break;
      }
    }
    if (hitLaser) {
      hurtFrames++;
      if (hurtFrames >= maxHurtFrames) {
        hurtFrames = 0;
        body.rigidBody.setTranslation(checkpointCoords[lastCheckpointReached], true);
        api.stores.me.isRespawning = true;
        setTimeout(() => api.stores.me.isRespawning = false, 1e3);
      }
    } else {
      hurtFrames = 0;
    }
    for (let i = lastCheckpointReached + 1; i < checkpointCoords.length; i++) {
      let checkpoint = checkpointCoords[i];
      const summitStart = {
        x: checkpoint.x * 100,
        y: checkpoint.y * 100 + 100
      };
      const summitEnd = {
        x: checkpoint.x * 100 + 100,
        y: checkpoint.y * 100
      };
      if (boundingBoxOverlap(summitStart, summitEnd, topLeft, bottomRight)) {
        console.log("Reached Checkpoint", i);
        lastCheckpointReached = i;
        break;
      }
    }
    if (translation.y < respawnHeight) {
      canRespawn = true;
    }
    if (canRespawn && translation.y > floorHeight) {
      canRespawn = false;
      setTimeout(() => {
        body.rigidBody.setTranslation(checkpointCoords[lastCheckpointReached], true);
        api.stores.me.isRespawning = true;
        setTimeout(() => api.stores.me.isRespawning = false, 1e3);
      }, 300);
    }
  });
  body.rigidBody.setTranslation({ x: 33.87, y: 638.38 }, true);
  for (let id of physics.bodies.staticBodies) {
    physics.bodies.activeBodies.enableBody(id);
  }
  physics.bodies.activeBodies.disableBody = () => {
  };
};
api.net.onLoad(() => {
  enable();
  GL.lib("Desync").enable();
});
function boundingBoxOverlap(start, end, topLeft, bottomRight) {
  return lineIntersects(start, end, topLeft, { x: bottomRight.x, y: topLeft.y }) || lineIntersects(start, end, topLeft, { x: topLeft.x, y: bottomRight.y }) || lineIntersects(start, end, { x: bottomRight.x, y: topLeft.y }, bottomRight) || lineIntersects(start, end, { x: topLeft.x, y: bottomRight.y }, bottomRight);
}
function lineIntersects(start1, end1, start2, end2) {
  let denominator = (end1.x - start1.x) * (end2.y - start2.y) - (end1.y - start1.y) * (end2.x - start2.x);
  let numerator1 = (start1.y - start2.y) * (end2.x - start2.x) - (start1.x - start2.x) * (end2.y - start2.y);
  let numerator2 = (start1.y - start2.y) * (end1.x - start1.x) - (start1.x - start2.x) * (end1.y - start1.y);
  if (denominator == 0) return numerator1 == 0 && numerator2 == 0;
  let r = numerator1 / denominator;
  let s = numerator2 / denominator;
  return r >= 0 && r <= 1 && (s >= 0 && s <= 1);
}
export {
  cancelRespawn,
  setLaserRespawnEnabled,
  setLaserWarningEnabled
};
