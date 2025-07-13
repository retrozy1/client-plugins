import GL from 'gimloader';
// @ts-ignore
import styles from './styles.scss';
import { createUI } from "./ui";

GL.lib("DLDUtils").setLaserWarningEnabled(false);
GL.UI.addStyles(styles);

let startTasBtn = document.createElement("button");
startTasBtn.id = "startTasBtn";
startTasBtn.innerText = "Start TAS";

startTasBtn.addEventListener("click", () => createUI());
startTasBtn.addEventListener("click", () => startTasBtn.remove());

GL.onStop(() => startTasBtn.remove());

GL.net.onLoad(() => {
    document.body.appendChild(startTasBtn);
});

let moveSpeed = 310;

export function getMoveSpeed() {
    return moveSpeed;
}

export function setMoveSpeed(speed: number) {
    moveSpeed = speed;
}