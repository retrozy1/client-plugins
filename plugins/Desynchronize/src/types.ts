export interface FirePacket {
    x: number;
    y: number;
    angle: number;
}

export type Character = Gimloader.Schema.ObjectSchema<Gimloader.Schema.CharacterState>;

export type ProjectileId = `${string}_${number}`;