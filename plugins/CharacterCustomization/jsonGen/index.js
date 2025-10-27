import { compress, decompress } from "compress-json";
import fs from "node:fs";

const res = await fetch("https://www.gimkit.com/assets/map/characters/spine/default_gray.json");
const json = await res.json();

const decompressed = decompress(json);
decompressed.skins[1].name = "customSkin";
fs.writeFileSync("assets/gim_json_raw.txt", JSON.stringify(decompressed));

const compressed = compress(decompressed);
fs.writeFileSync("assets/gim_json.txt", JSON.stringify(compressed));
