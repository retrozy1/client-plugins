import BaseLine from "../baseLine";

export default class FPS extends BaseLine {
    name = "FPS";
    enabledDefault = true;

    lastTime: number = 0;
    frames: number = 0;

    onFrame() {
        const now = performance.now();
        const delta = now - this.lastTime;

        this.frames++;
        if(delta > 1000) {
            this.lastTime = now;
            const fps = this.frames / (delta / 1000);
            this.update(`${Math.round(fps)} fps`);
            this.frames = 0;
        }
    }
}
