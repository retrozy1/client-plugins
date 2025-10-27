import Settings from "./Settings.svelte";
import type { QSElement, QuickSettingsReturn } from "./types";

export default function QuickSettings(name: string, els: QSElement[]): QuickSettingsReturn {
    if(!Array.isArray(els)) throw new Error("Elements isn't an array");

    const settings: Record<string, any> = GL.storage.getValue(name, "QS-Settings", {});

    // apply defaults
    for(const el of els) {
        if(el.type === "heading") continue;
        if(!Object.hasOwn(settings, el.id)) {
            if(el.default) settings[el.id] = el.default;
            else {
                if(el.type === "number") settings[el.id] = el.min ?? 0;
                else if(el.type === "boolean") settings[el.id] = false;
                else if(el.type === "dropdown") settings[el.id] = el.options[0];
                else settings[el.id] = "";
            }
        }
    }

    settings.openSettingsMenu = () => {
        const div = document.createElement("div");

        // @ts-expect-error
        const component = new Settings({
            target: div,
            props: {
                name,
                els,
                settings
            }
        });

        api.UI.showModal(div, {
            buttons: [{ text: "Close", style: "primary" }],
            // @ts-expect-error
            onClosed: () => component.$destroy()
        });
    };

    const listeners: Record<string, ((value: any) => void)[]> = {};
    settings.listen = (key: string, callback: (value: any) => void) => {
        if(!listeners[key]) listeners[key] = [];
        listeners[key].push(callback);

        return () => listeners[key].splice(listeners[key].indexOf(callback), 1);
    };

    settings.onChange = (key: string) => {
        const value = settings[key];
        if(listeners[key]) listeners[key].forEach(cb => cb(value));
    };

    return settings as QuickSettingsReturn;
}
