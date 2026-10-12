api.rewriter.addParseHook("ObjectListener", (code) => code.replace("this.useClientIdSaving=!0", "this.useClientIdSaving=false"));
