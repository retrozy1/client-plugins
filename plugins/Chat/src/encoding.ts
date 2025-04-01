import { identifier, maxLength, Ops } from "./consts";

// always requires 7 bytes as input
export function bytesToFloat(bytes: number[]) {
    let buffer = new ArrayBuffer(8);
    let view = new Uint8Array(buffer);
    
    // the last byte is always 0 since angles are capped at 1e9, and this always makes the exponent negative
    for(let i = 0; i < 7; i++) {
        view[i] = bytes[i];
    }

    return new Float64Array(buffer)[0];
}

export function floatToBytes(float: number) {
    let buffer = new ArrayBuffer(8);
    let floatView = new Float64Array(buffer);
    floatView[0] = float;

    let byteView = new Uint8Array(buffer);
    return Array.from(byteView);
}

export function encodeMessage(message: string) {
    let codes = message.split("").map(c => c.charCodeAt(0));
    codes = codes.filter(c => c < 256);
    if(codes.length === 0) return;

    codes = codes.slice(0, maxLength); // max of 1k characters
    let charsLow = codes.length & 0xff;
    let charsHigh = (codes.length & 0xff00) >> 8;

    // 4 random numbers that just show that this encodes a chat message
    // then an opcode (0 = send)
    let header = [...identifier, Ops.Transmit, charsHigh, charsLow];

    let messages: number[] = [bytesToFloat(header)];

    // pad the codes to have a multiple of 7
    while(codes.length % 7 !== 0) codes.push(0);

    for(let i = 0; i < codes.length; i += 7) {
        let msg: number[] = [];
        for(let j = 0; j < 7; j++) {
            msg[j] = codes[i + j];
        }

        messages.push(bytesToFloat(msg));
    }

    return messages;
}