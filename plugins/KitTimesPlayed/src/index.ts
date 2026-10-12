const isEnabled = api.rewriter.createShared("Enabled", true);

console.log("Here?");
api.rewriter.addParseHook("Container-", (code) => {
    const index = code.indexOf(".createdAt?`Created");
    if(index === -1) return code;

    const varStart = code.lastIndexOf("=>", index) + 2;
    const varName = code.slice(varStart, index);
    const insertIndex = code.indexOf("}", index) + 1;

    const playCount = `${varName}.playCount`;
    const insert = `${playCount}?${playCount}==1?"played once":"played "+${playCount}+" times":"never played"`;

    return code.slice(0, insertIndex) + ", ${" + insert + "}" + code.slice(insertIndex);
});

api.onStop(() => {
    if(location.pathname !== "/kits" && location.pathname !== "/gamemode") return;
    const kits = document.getElementsByClassName("ant-card ant-card-bordered ant-card-hoverable");

    for(const kit of kits) {
        const div = kit.children[0]?.children[0]?.children[0]?.children[1]?.children[1];
        if(!div?.innerHTML.includes(",")) return;
        div.innerHTML = div.innerHTML.split(",")[0];
    }
});
