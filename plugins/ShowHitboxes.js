/**
 * @name ShowHitboxes
 * @description Enables debug mode which shows hitboxes
 * @author TheLazySquid
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/ShowHitboxes.js
 * @webpage https://gimloader.github.io/plugins/showhitboxes
 * @reloadRequired ingame
 */

const api = new GL();

api.parcel.getLazy((m) => m?.PhysicsConstants, (exports) => {
  exports.PhysicsConstants.debug = true;
});