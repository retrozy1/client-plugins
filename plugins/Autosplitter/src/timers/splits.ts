import type { SplitsAutosplitter } from "../splitters/autosplitter";
import type SplitsUI from "../ui/splits";
import BasicTimer from "./basic";

export default class SplitsTimer extends BasicTimer {
    currentSplit = 0;
    splitStart = 0;
    splits: number[] = [];

    constructor(public autosplitter: SplitsAutosplitter, public ui: SplitsUI) {
        super(autosplitter, ui);
    }

    get splitElapsed() {
        return this.now - this.splitStart;
    }

    start() {
        super.start();
        this.splitStart = this.startTime;
        this.ui.setActiveSplit(0);
    }

    stop() {
        this.started = false;

        // save the splits if it's a pb
        const pb = this.autosplitter.pb;
        if(!pb || this.splits[this.splits.length - 1] < pb) {
            this.autosplitter.data.pb[this.autosplitter.getCategoryId()] = this.splits;
            this.autosplitter.save();
        }
    }

    split() {
        this.ui.finishSplit(this.elapsed, this.currentSplit, this.splitElapsed);

        // save the split if it was a pb
        const bestSplit = this.autosplitter.bestSplits[this.currentSplit];
        if(!bestSplit || this.splitElapsed < bestSplit) {
            this.autosplitter.bestSplits[this.currentSplit] = this.splitElapsed;
            this.autosplitter.save();
        }

        this.splits.push(this.elapsed);

        this.currentSplit++;
        this.splitStart = this.now;
        this.ui.setActiveSplit(this.currentSplit);
    }

    update() {
        if(!this.started) return;
        super.update();

        const elapsed = this.now - this.startTime;
        this.ui.updateSplit(elapsed, this.currentSplit, this.splitElapsed);
    }
}
