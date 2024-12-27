function getGlobal(name) {
    if (process.type === "renderer") {
        return require('@electron/remote').getGlobal(name);
    } else {
        return global[name];
    }
}

module.exports = {
    getGlobal
};