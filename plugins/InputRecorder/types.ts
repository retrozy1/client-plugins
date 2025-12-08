import type { Vector } from "@dimforge/rapier2d-compat";

export interface IFrameInfo {
    angle: number | null;
    jump: boolean;
    _jumpKeyPressed: boolean;
}

export interface IRecording {
    startPos: Vector;
    startState: string;
    platformerPhysics: string;
    frames: IFrameInfo[];
}
