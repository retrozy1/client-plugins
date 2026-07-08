export function byteToPi(val: number) {
    return (val / 255) * (2 * Math.PI) - Math.PI;
}

export function piToByte(val: number) {
    return Math.round(((val + Math.PI) / (2 * Math.PI)) * 255)
}