import { bytesToFloat, encodeMessage, floatToBytes } from './encoding';
import { identifier, maxLength, Ops } from './consts';
import UI from './ui';

interface MessageState {
    message: string;
    charsRemaining: number;
}

api.net.onLoad((type) => {
    if(type !== "Colyseus") return;
    
    let myId = api.stores.network.authId;
    
    let sending = false;
    let ignoreNextAngle = false;
    let realAngle = 0;

    api.net.on("send:AIMING", (message, editFn) => {
        if(!sending) return;

        if(ignoreNextAngle) {
            ignoreNextAngle = false;
            return;
        }

        realAngle = message.angle
        editFn(null);
    });

    // redirect the activity feed to the chat
    api.net.on("ACTIVITY_FEED_MESSAGE", (message: any, editFn) => {
        UI.addMessage(`> ${message.message}`);
        editFn(null);
    });

    let me = api.net.room.state.characters.get(myId);
    let angleChangeRes: Function | undefined;
    api.onStop(me.projectiles.listen("aimAngle", (angle: number) => {
        if(angle === 0) return;
        angleChangeRes?.();
    }));
    
    UI.init(async (text: string) => {
        let messages = encodeMessage(text);
        if(!messages) return;
        sending = true;
    
        for(let message of messages) {
            ignoreNextAngle = true;
            send(message);
            await new Promise((res) => angleChangeRes = res);
        }
        
        sending = false;
        send(realAngle);
        UI.addMessage(`${me.name}: ${text}`, true);
    });

    let messageStates = new Map<any, MessageState>();

    api.onStop(api.net.room.state.characters.onAdd((char: any) => {
        if(char.id === myId) return;

        // This doesn't get cleaned up when the person leaves but whatever
        api.onStop(char.projectiles.listen("aimAngle", (angle: number) => {
            if(angle === 0) return;
            let bytes = floatToBytes(angle);

            let newPlayer = !messageStates.has(char);
            if(newPlayer) messageStates.set(char, { message: "", charsRemaining: 0 });
            let state = messageStates.get(char)!;
            
            // check if the angle is a message
            if(bytes[0] === identifier[0] && bytes[1] === identifier[1] && bytes[2] === identifier[2] && bytes[3] === identifier[3]) {
                let op = bytes[4];
                if(op === Ops.Transmit) {
                    let high = bytes[5];
                    let low = bytes[6];
                    state.charsRemaining = Math.min(maxLength, (high << 8) + low);
                    state.message = "";
                } else if(op === Ops.Join && newPlayer) {
                    UI.addMessage(`${char.name} connected to the chat`);
                } else if(op === Ops.Leave && !newPlayer) {
                    UI.addMessage(`${char.name} left the chat`);
                    messageStates.delete(char);
                } else if(op === Ops.Greet && newPlayer) {
                    UI.addMessage(`${char.name} connected to the chat`);
                    // resend that we have joined whenever someone joins the chat mid-game
                    sendOp(Ops.Join);
                }
            } else if(state.charsRemaining > 0) {
                // decode the message
                for(let i = 0; i < Math.min(7, state.charsRemaining); i++) {
                    state.message += String.fromCharCode(bytes[i]);
                }
                state.charsRemaining -= 7;

                if(state.charsRemaining <= 0) {
                    UI.addMessage(`${char.name}: ${state.message}`);
                }
            }
        }));
    }));

    // if we join mid-game request for others to re-send their join message
    if(api.net.room.state.session.phase === "game") {
        sendOp(Ops.Greet);
    }

    api.onStop(api.net.room.state.session.listen("phase", (phase: string) => {
        UI.setEnabled(phase === "game");
    }));

    api.onStop(api.net.room.state.session.listen("phase", (phase: string) => {
        if(phase === "game") {
            UI.addMessage("The chat is active!");
            messageStates.clear();
            sendOp(Ops.Join);
        } else {
            UI.addMessage("The chat is no longer active");
        }
    }, false));

    window.addEventListener("beforeunload", () => {
        sendOp(Ops.Leave);
    });

    api.onStop(() => sendOp(Ops.Leave));
});

function sendOp(op: Ops) {
    let message = [...identifier, op, 0, 0];
    send(bytesToFloat(message));
}

function send(message: number) {
    api.net.send("AIMING", { angle: message });
}