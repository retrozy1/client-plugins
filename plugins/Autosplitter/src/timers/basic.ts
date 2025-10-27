import type { Autosplitter } from "../splitters/autosplitter";
import type BasicUI from "../ui/basic";

export default class BasicTimer {
    started = false;
    startTime = 0;
    now = 0;

    constructor(public autosplitter: Autosplitter, public ui: BasicUI) {}

    get elapsed() {
        return this.now - this.startTime;
    }

    start() {
        this.startTime = performance.now();
        this.started = true;
        this.ui.start();
    }

    stop() {
        this.started = false;

        const pb = this.autosplitter.pb;
        if(!pb || this.elapsed < pb) {
            this.autosplitter.data.pb[this.autosplitter.getCategoryId()] = this.elapsed;
            this.autosplitter.save();
        }
    }

    update() {
        if(!this.started) return;
        this.now = performance.now();

        this.ui.update(this.elapsed);
    }
}
