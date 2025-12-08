import type { Vector } from "@dimforge/rapier2d-compat";

export interface IFrameInfo {
    right: boolean;
    left: boolean;
    up: boolean;
    translation?: Vector;
    state?: string;
}

export interface ISharedValues {
    frames: IFrameInfo[];
    currentFrame: number;
}
