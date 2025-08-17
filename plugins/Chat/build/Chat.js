/**
 * @name Chat
 * @description Adds an in-game chat to 2d gamemodes
 * @author TheLazySquid
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/Chat/build/Chat.js
 * @webpage https://gimloader.github.io/plugins/chat
 */


// ../../node_modules/gimloader/index.js
var api = new GL();
var gimloader_default = api;

// src/consts.ts
var identifier = [163, 58, 3, 206];
var maxLength = 1e3;

// src/encoding.ts
function bytesToFloat(bytes) {
  let buffer = new ArrayBuffer(8);
  let view = new Uint8Array(buffer);
  for (let i = 0; i < 7; i++) {
    view[i] = bytes[i];
  }
  return new Float64Array(buffer)[0];
}
function floatToBytes(float) {
  let buffer = new ArrayBuffer(8);
  let floatView = new Float64Array(buffer);
  floatView[0] = float;
  let byteView = new Uint8Array(buffer);
  return Array.from(byteView);
}
function encodeMessage(message) {
  let codes = message.split("").map((c) => c.charCodeAt(0));
  codes = codes.filter((c) => c < 256);
  if (codes.length === 0) return;
  codes = codes.slice(0, maxLength);
  let charsLow = codes.length & 255;
  let charsHigh = (codes.length & 65280) >> 8;
  let header = [...identifier, 0 /* Transmit */, charsHigh, charsLow];
  let messages = [bytesToFloat(header)];
  while (codes.length % 7 !== 0) codes.push(0);
  for (let i = 0; i < codes.length; i += 7) {
    let msg = [];
    for (let j = 0; j < 7; j++) {
      msg[j] = codes[i + j];
    }
    messages.push(bytesToFloat(msg));
  }
  return messages;
}

// src/styles.css
var styles_default = "#gl-chat {\r\n    position: fixed;\r\n    background-color: rgba(0, 0, 0, 0.3);\r\n    transition: background 0.5s;\r\n    bottom: 15vh;\r\n    left: 15px;\r\n    width: 350px;\r\n    z-index: 50;\r\n    min-height: 300px;\r\n    display: flex;\r\n    flex-direction: column;\r\n}\r\n\r\n#chat-spacer {\r\n    flex-grow: 1;\r\n}\r\n\r\n#chat-messages-wrap {\r\n    max-height: 400px;\r\n    overflow-y: auto;\r\n    scrollbar-color: rgba(255, 255, 255, 0.5) transparent;\r\n}\r\n\r\n#chat-messages {\r\n    display: flex;\r\n    flex-direction: column;\r\n    justify-content: flex-end;\r\n    color: white;\r\n    padding: 5px;\r\n}\r\n\r\n#gl-chat input {\r\n    width: 100%;\r\n    border: none;\r\n}";

// src/ui.ts
gimloader_default.UI.addStyles(styles_default);
gimloader_default.hotkeys.addConfigurableHotkey({
  category: "Chat",
  title: "Open Chat",
  preventDefault: false,
  default: {
    key: "KeyY"
  }
}, (e) => {
  if (document.activeElement !== document.body) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  UI.input?.focus();
});
var format = null;
var formatCallback = gimloader_default.rewriter.createShared("formatActivityFeed", (fmtFn) => {
  format = fmtFn;
});
gimloader_default.rewriter.addParseHook("App", (code) => {
  const index = code.indexOf(">%SPACE_HERE%");
  if (index === -1) return;
  const start = code.lastIndexOf("});const", index);
  const end = code.indexOf("=", start);
  const name = code.substring(start + 9, end);
  code += `${formatCallback}?.(${name});`;
  return code;
});
var UI = class {
  static send;
  static element;
  static messageWrapper;
  static messageContainer;
  static input;
  static maxLength = 100;
  static history = [];
  static enabled = false;
  static init(send2) {
    this.send = send2;
    this.element = document.createElement("div");
    this.element.id = "gl-chat";
    let spacer = document.createElement("div");
    spacer.id = "chat-spacer";
    this.element.appendChild(spacer);
    this.messageWrapper = document.createElement("div");
    this.messageWrapper.id = "chat-messages-wrap";
    this.element.appendChild(this.messageWrapper);
    this.messageContainer = document.createElement("div");
    this.messageContainer.id = "chat-messages";
    this.messageWrapper.appendChild(this.messageContainer);
    this.input = this.createInput();
    this.element.appendChild(this.input);
    document.body.appendChild(this.element);
    gimloader_default.onStop(() => this.element.remove());
    const blurInput = () => this.input?.blur();
    document.addEventListener("click", blurInput);
    gimloader_default.onStop(() => document.removeEventListener("click", blurInput));
  }
  static createInput() {
    let input = document.createElement("input");
    input.maxLength = maxLength;
    input.disabled = true;
    input.placeholder = "...";
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("keydown", async (e) => {
      e.stopPropagation();
      if (e.key.length === 1 && e.key.charCodeAt(0) >= 256) e.preventDefault();
      if (e.key === "Escape") {
        input.blur();
        return;
      }
      if (e.key === "Enter") {
        let message = input.value;
        if (message.length === 0) return;
        input.value = "";
        input.placeholder = "Sending...";
        input.disabled = true;
        await this.send(message);
        if (!this.enabled) return;
        input.disabled = false;
        input.placeholder = "...";
        input.focus();
        return;
      }
    });
    return input;
  }
  static addMessage(message, forceScroll = false) {
    let element = document.createElement("div");
    if (format) {
      element.innerHTML = format({ inputText: message });
    } else {
      element.innerText = message;
    }
    let wrap = this.messageWrapper;
    let shouldScroll = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 1;
    this.history.push(element);
    this.messageContainer.appendChild(element);
    if (this.history.length > this.maxLength) {
      this.history.shift()?.remove();
    }
    if (shouldScroll || forceScroll) wrap.scrollTop = wrap.scrollHeight;
  }
  static setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.input.disabled = false;
      this.input.placeholder = "...";
    } else {
      this.input.disabled = true;
      this.input.placeholder = "Chat not available in lobby";
    }
  }
};

// src/index.ts
gimloader_default.net.onLoad(() => {
  let myId = gimloader_default.stores.network.authId;
  let sending = false;
  let ignoreNextAngle = false;
  let realAngle = 0;
  gimloader_default.net.on("send:AIMING", (message, editFn) => {
    if (!sending) return;
    if (ignoreNextAngle) {
      ignoreNextAngle = false;
      return;
    }
    realAngle = message.angle;
    editFn(null);
  });
  gimloader_default.net.on("ACTIVITY_FEED_MESSAGE", (message, editFn) => {
    UI.addMessage(`> ${message.message}`);
    editFn(null);
  });
  let me = gimloader_default.net.room.state.characters.get(myId);
  let angleChangeRes;
  gimloader_default.onStop(me.projectiles.listen("aimAngle", (angle) => {
    if (angle === 0) return;
    angleChangeRes?.();
  }));
  UI.init(async (text) => {
    let messages = encodeMessage(text);
    if (!messages) return;
    sending = true;
    for (let message of messages) {
      ignoreNextAngle = true;
      send(message);
      await new Promise((res) => angleChangeRes = res);
    }
    sending = false;
    send(realAngle);
    UI.addMessage(`${me.name}: ${text}`, true);
  });
  let messageStates = /* @__PURE__ */ new Map();
  gimloader_default.onStop(gimloader_default.net.room.state.characters.onAdd((char) => {
    if (char.id === myId) return;
    gimloader_default.onStop(char.projectiles.listen("aimAngle", (angle) => {
      if (angle === 0) return;
      let bytes = floatToBytes(angle);
      let newPlayer = !messageStates.has(char);
      if (newPlayer) messageStates.set(char, { message: "", charsRemaining: 0 });
      let state = messageStates.get(char);
      if (bytes[0] === identifier[0] && bytes[1] === identifier[1] && bytes[2] === identifier[2] && bytes[3] === identifier[3]) {
        let op = bytes[4];
        if (op === 0 /* Transmit */) {
          let high = bytes[5];
          let low = bytes[6];
          state.charsRemaining = Math.min(maxLength, (high << 8) + low);
          state.message = "";
        } else if (op === 1 /* Join */ && newPlayer) {
          UI.addMessage(`${char.name} connected to the chat`);
        } else if (op === 2 /* Leave */ && !newPlayer) {
          UI.addMessage(`${char.name} left the chat`);
          messageStates.delete(char);
        } else if (op === 3 /* Greet */ && newPlayer) {
          UI.addMessage(`${char.name} connected to the chat`);
          sendOp(1 /* Join */);
        }
      } else if (state.charsRemaining > 0) {
        for (let i = 0; i < Math.min(7, state.charsRemaining); i++) {
          state.message += String.fromCharCode(bytes[i]);
        }
        state.charsRemaining -= 7;
        if (state.charsRemaining <= 0) {
          UI.addMessage(`${char.name}: ${state.message}`);
        }
      }
    }));
  }));
  if (gimloader_default.net.room.state.session.phase === "game") {
    sendOp(3 /* Greet */);
  }
  gimloader_default.onStop(gimloader_default.net.room.state.session.listen("phase", (phase) => {
    UI.setEnabled(phase === "game");
  }));
  gimloader_default.onStop(gimloader_default.net.room.state.session.listen("phase", (phase) => {
    if (phase === "game") {
      UI.addMessage("The chat is active!");
      messageStates.clear();
      sendOp(1 /* Join */);
    } else {
      UI.addMessage("The chat is no longer active");
    }
  }, false));
  window.addEventListener("beforeunload", () => {
    sendOp(2 /* Leave */);
  });
  gimloader_default.onStop(() => sendOp(2 /* Leave */));
});
function sendOp(op) {
  let message = [...identifier, op, 0, 0];
  send(bytesToFloat(message));
}
function send(message) {
  gimloader_default.net.send("AIMING", { angle: message });
}
