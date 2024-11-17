const openAdminWindow = require('@electron/remote').getGlobal('openAdminWindow');

document.getElementById("button").addEventListener("click", () => { openAdminWindow() });