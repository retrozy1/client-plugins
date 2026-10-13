api.rewriter.swapVar("App-", {
    check: "useLocalstorageState:",
    find: /0.93\);\n`,(\w{1,3})=/,
    callback: (val, initial) => {
        if(!initial) api.UI.forceReactUpdate();
        api.onStop(() => api.UI.forceReactUpdate());

        return function(this: any, props: any) {
            const result = val.apply(this, arguments);
            const iconProps = result.props.children[0].props;
            const onClick = iconProps.onClick;

            iconProps.onClick = () => {
                if(props.selected || props.type === "sticker") {
                    onClick();
                    return;
                }

                const actions = result.props.children[1].props.callToAction({
                    editStyles: props.editStyles
                });

                actions.onClick();
            };

            return result;
        };
    }
});
