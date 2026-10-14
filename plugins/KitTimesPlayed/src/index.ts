api.rewriter.swapVar("Container-", {
    check: "?`Created ${",
    find: /description}}\):null]}\)}\),(\w{1,3})/,
    callback: (val, initial) => {
        if(!initial) api.UI.forceReactUpdate();
        api.onStop(() => api.UI.forceReactUpdate());

        let hasPatched = false;

        // Kind of ugly because there's a mobx wrapper around the thing we actually want to patch
        return function(this: any) {
            if(hasPatched) return val.apply(this, arguments);

            const res = val.apply(this, arguments);
            const kitCards = res.props.children[1].props.children.props.children;
            const type = kitCards[0]?.props.children.type;
            if(!type) return res;

            const typeFn = type.type;
            api.onStop(() => type.type = typeFn);
            hasPatched = true;

            type.type = function(props: any) {
                const result = typeFn.apply(this, arguments);
                const created = result.props.children[0].props.children.props.children.props.children[0].props.children[1].props.children[1].props;

                const playCount = props.game.playCount;
                const message = playCount ? playCount > 1 ? `played ${playCount} times` : "played once" : "never played";

                created.children += ", " + message;

                return result;
            }

            return val.apply(this, arguments);
        }
    }
});
