/**
 * @name BringBackBoosts
 * @description Restores boosts in Don't Look Down. Will cause you to desync, so others cannot see you move.
 * @author TheLazySquid
 * @version 0.6.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/BringBackBoosts.js
 * @webpage https://gimloader.github.io/plugins/bringbackboosts
 * @reloadRequired ingame
 * @needsLib DLDUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/DLDUtils.js
 * @hasSettings true
 * @gamemode dontLookDown
 * @changelog Switched to a utility for rewriting source code
 */

// shared/minifiedNavigator.ts
function minifiedNavigator(code, start, end) {
  if (typeof start === "string") start = [start];
  if (typeof end === "string") end = [end];
  let startIndex = 0;
  if (start) {
    for (const snippet of start) {
      startIndex = code.indexOf(snippet, startIndex) + snippet.length;
    }
  }
  let endIndex = startIndex;
  if (end) {
    for (const snippet in end) {
      endIndex = code.indexOf(end[snippet], endIndex);
      if (Number(snippet) < end.length - 1) endIndex += end[snippet].length;
    }
  } else {
    endIndex = code.length - 1;
  }
  const startCode = code.slice(0, startIndex);
  const endCode = code.substring(endIndex);
  return {
    startIndex,
    endIndex,
    inBetween: code.slice(startIndex, endIndex),
    insertAfterStart(string) {
      return startCode + string + this.inBetween + endCode;
    },
    insertBeforeEnd(string) {
      return startCode + this.inBetween + string + endCode;
    },
    replaceEntireBetween(string) {
      return startCode + string + endCode;
    },
    replaceBetween(...args) {
      const changedMiddle = this.inBetween.replace(...args);
      return this.replaceEntireBetween(changedMiddle);
    },
    deleteBetween() {
      return startCode + endCode;
    }
  };
}

// plugins/BringBackBoosts/src/index.ts
api.settings.create([
  {
    type: "toggle",
    id: "useOriginalPhysics",
    title: "Use Release Physics",
    description: "Modifies air movement to more closely match the physics from the original launch of platforming",
    default: false
  }
]);
api.settings.listen("useOriginalPhysics", (value) => {
  console.log("Updated to", value);
  if (!GL.platformerPhysics) return;
  if (value) {
    GL.platformerPhysics.movement.air = originalAirMovement;
  } else {
    GL.platformerPhysics.movement.air = defaultAirMovement;
  }
});
var defaultAirMovement = {
  accelerationSpeed: 0.08125,
  decelerationSpeed: 0.08125,
  maxAccelerationSpeed: 0.14130434782608697
};
var originalAirMovement = {
  accelerationSpeed: 0.121875,
  decelerationSpeed: 0.08125,
  maxAccelerationSpeed: 0.155
};
api.net.onLoad(() => {
  if (api.settings.useOriginalPhysics) {
    GL.platformerPhysics.movement.air = originalAirMovement;
  }
});
var calcGravity = null;
var calcGravCb = api.rewriter.createShared("CalculateGravity", (func) => {
  calcGravity = func;
});
api.rewriter.addParseHook("App", (code) => {
  if (!code.includes("physics.state.forces.some")) return code;
  const name = minifiedNavigator(code, [".tickRate);return{airGravity:", ".tickRate)),"], "=").inBetween;
  return code + `${calcGravCb}?.(${name});`;
});
var wrapCalcMovementVelocity = api.rewriter.createShared("WrapCalcMovmentVel", (func) => {
  var n = { default: GL.stores }, a = { default: { normal: 310 } }, I = {
    PhysicsConstants: {
      tickRate: 12,
      debug: false,
      skipTilesDebug: false
    }
  };
  const h = (A, t) => {
    let e = 0, i = 0;
    const s = null == t ? void 0 : t.angle, g = null !== s && (s < 90 || s > 270) ? "right" : null !== s && s > 90 && s < 270 ? "left" : "none", C = n.default.me.movementSpeed / a.default.normal;
    let h2 = GL.platformerPhysics.platformerGroundSpeed * C;
    if (A.physics.state.jump.isJumping) {
      const t2 = Math.min(GL.platformerPhysics.jump.airSpeedMinimum.maxSpeed, h2 * GL.platformerPhysics.jump.airSpeedMinimum.multiplier);
      h2 = Math.max(t2, A.physics.state.jump.xVelocityAtJumpStart);
    }
    let l = 0;
    "left" === g ? l = -h2 : "right" === g && (l = h2);
    const B = 0 !== l;
    if (g !== A.physics.state.movement.direction && (B && 0 !== A.physics.state.movement.xVelocity && (A.physics.state.movement.xVelocity = 0), A.physics.state.movement.accelerationTicks = 0, A.physics.state.movement.direction = g), A.physics.state.movement.xVelocity !== l) {
      A.physics.state.movement.accelerationTicks += 1;
      let t2 = 0, i2 = 0;
      A.physics.state.grounded ? B ? (t2 = GL.platformerPhysics.movement.ground.accelerationSpeed, i2 = GL.platformerPhysics.movement.ground.maxAccelerationSpeed) : t2 = GL.platformerPhysics.movement.ground.decelerationSpeed : B ? (t2 = GL.platformerPhysics.movement.air.accelerationSpeed, i2 = GL.platformerPhysics.movement.air.maxAccelerationSpeed) : t2 = GL.platformerPhysics.movement.air.decelerationSpeed;
      const s2 = 20 / I.PhysicsConstants.tickRate;
      t2 *= A.physics.state.movement.accelerationTicks * s2, i2 && (t2 = Math.min(i2, t2)), e = l > A.physics.state.movement.xVelocity ? Phaser.Math.Clamp(A.physics.state.movement.xVelocity + t2, A.physics.state.movement.xVelocity, l) : Phaser.Math.Clamp(A.physics.state.movement.xVelocity - t2, l, A.physics.state.movement.xVelocity);
    } else e = l;
    return A.physics.state.grounded && A.physics.state.velocity.y > GL.platformerPhysics.platformerGroundSpeed * C && Math.sign(e) === Math.sign(A.physics.state.velocity.x) && (e = A.physics.state.velocity.x), A.physics.state.movement.xVelocity = e, A.physics.state.gravity = calcGravity?.(A.id), i += A.physics.state.gravity, A.physics.state.forces.forEach((A2, _t) => {
      const s2 = A2.ticks[0];
      s2 && (e += s2.x, i += s2.y), A2.ticks.shift();
    }), {
      x: e,
      y: i
    };
  };
  return function() {
    if (GL.platformerPhysics && calcGravity && GL.plugins.isEnabled("BringBackBoosts")) {
      return h(arguments[0], arguments[1]);
    } else {
      return func.apply(this, arguments);
    }
  };
});
api.rewriter.addParseHook("App", (code) => {
  if (!code.includes(".physics.state.jump.xVelocityAtJumpStart),")) return code;
  const functionSegment = minifiedNavigator(code, [".input):{x:0,y:0}},", "="], ["}}", ","]);
  const func = functionSegment.inBetween;
  return functionSegment.replaceEntireBetween(`(${wrapCalcMovementVelocity} ?? (v => v))(${func})`);
});
