api.net.onLoad(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
    };

    window.addEventListener("beforeunload", beforeUnload);
    api.onStop(() => window.removeEventListener("beforeunload", beforeUnload));
});
