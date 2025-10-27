/**
 * @name Desync
 * @description Easily make simple settings menus
 * @author TheLazySquid
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/Desync.js
 * @isLibrary true
 */

// libraries/Desync/src/index.ts
var enabled = false;
api.onStop(() => enabled = false);
function enable() {
  enabled = true;
}
api.net.onLoad(() => {
  let allowNext = false;
  let firstPhase = true;
  api.onStop(api.net.room.state.session.listen("phase", () => {
    if (firstPhase) {
      firstPhase = false;
      return;
    }
    allowNext = true;
  }));
  api.net.on("PHYSICS_STATE", (_, editFn) => {
    if (allowNext) {
      allowNext = false;
      return;
    }
    if (enabled) editFn(null);
  });
});
export {
  enable
};
