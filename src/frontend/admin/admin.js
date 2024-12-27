const { ipcRenderer } = require('electron');
const { TroopEditor, LeaderEditor } = require('./admin/troopEditor');
const AdminPanel = require('./admin/adminPanel');

var state = "";

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('signal', (_event, payload) => {
        console.log('Received signal:', payload);
        if (payload.type === "troop") {
            state = "troop";
            document.title = "Truppen-Editor";
            document.body.innerHTML = "";
            document.body.appendChild(TroopEditor(payload.data));
        } else if (payload.type === "leader") {
            state = "leader";
            document.title = "Anf&#252;hrer-Editor";
            document.body.innerHTML = "";
            document.body.appendChild(LeaderEditor(payload.data));
        } else if (payload.type === "admin-panel") {
            state = "admin-panel";
            document.title = "Admin-Panel";
            document.body.innerHTML = "";
            document.body.appendChild(AdminPanel());
        }
    })
})
