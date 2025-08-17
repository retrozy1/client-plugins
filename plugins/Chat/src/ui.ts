import api from 'gimloader';
// @ts-ignore
import styles from './styles.css';
import { maxLength } from './consts';

api.UI.addStyles(styles);

api.hotkeys.addConfigurableHotkey({
    category: "Chat",
    title: "Open Chat",
    preventDefault: false,
    default: {
        key: "KeyY"
    }
}, (e) => {
    if(document.activeElement !== document.body) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    UI.input?.focus();
});

// Get the formatter that is used for formatting the activity feed
type Formatter = (message: { inputText: string }) => string;
let format: Formatter | null = null;
const formatCallback = api.rewriter.createShared("formatActivityFeed", (fmtFn: Formatter) => {
    format = fmtFn;
});

api.rewriter.addParseHook("App", (code) => {
    const index = code.indexOf(">%SPACE_HERE%");
    if(index === -1) return;

    const start = code.lastIndexOf("});const", index);
    const end = code.indexOf("=", start);
    const name = code.substring(start + 9, end);
    code += `${formatCallback}?.(${name});`

    return code;
});

export default class UI {
    static send: (message: string) => Promise<void>;
    static element: HTMLElement;
    static messageWrapper: HTMLElement;
    static messageContainer: HTMLElement;
    static input: HTMLInputElement;
    static maxLength = 100;
    static history: HTMLElement[] = [];
    static enabled = false;

    static init(send: (message: string) => Promise<void>) {
        this.send = send;

        this.element = document.createElement("div");
        this.element.id = "gl-chat";

        let spacer = document.createElement("div");
        spacer.id = "chat-spacer";
        this.element.appendChild(spacer);

        this.messageWrapper = document.createElement("div");
        this.messageWrapper.id = "chat-messages-wrap";
        this.element.appendChild(this.messageWrapper);

        this.messageContainer = document.createElement("div");
        this.messageContainer.id = "chat-messages";
        this.messageWrapper.appendChild(this.messageContainer);
        
        this.input = this.createInput();
        this.element.appendChild(this.input);
        document.body.appendChild(this.element);
        api.onStop(() => this.element.remove());

        const blurInput = () => this.input?.blur();
        document.addEventListener("click", blurInput);
        api.onStop(() => document.removeEventListener("click", blurInput));
    }

    static createInput() {
        let input = document.createElement("input");
        input.maxLength = maxLength;
        input.disabled = true;
        input.placeholder = "...";

        input.addEventListener("click", (e) => e.stopPropagation());

        input.addEventListener("keydown", async (e) => {
            e.stopPropagation();
            if(e.key.length === 1 && e.key.charCodeAt(0) >= 256) e.preventDefault();

            if(e.key === "Escape") {
                input.blur();
                return;
            }

            if(e.key === "Enter") {
                let message = input.value;
                if(message.length === 0) return;

                input.value = "";
                input.placeholder = "Sending...";
                input.disabled = true;

                await this.send(message);
                if(!this.enabled) return;

                input.disabled = false;
                input.placeholder = "...";
                input.focus();

                return;
            }
        });

        return input;
    }

    static addMessage(message: string, forceScroll = false) {
        let element = document.createElement("div");
        if(format) {
            // The formatter includes a full html sanitizer so there is no need to sanitize the messages
            element.innerHTML = format({ inputText: message });
        } else {
            element.innerText = message;
        }

        let wrap = this.messageWrapper;
        let shouldScroll = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 1;

        this.history.push(element);
        this.messageContainer.appendChild(element);
        if(this.history.length > this.maxLength) {
            this.history.shift()?.remove();
        }

        if(shouldScroll || forceScroll) wrap.scrollTop = wrap.scrollHeight;
    }

    static setEnabled(enabled: boolean) {
        this.enabled = enabled;

        if(enabled) {
            this.input.disabled = false;
            this.input.placeholder = "...";
        } else {
            this.input.disabled = true;
            this.input.placeholder = "Chat not available in lobby";
        }
    }
}