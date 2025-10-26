declare module "*.scss" {
    const content: string;
    export default content;
}

declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "*.css" {
    const content: string;
    export default content;
}

declare module "*.svelte" {
    const component: import('svelte').SvelteComponent;
    // @ts-ignore svelte makes this same declaration but it doesn't work for some reason
    export default component;
}