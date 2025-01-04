/**
 * Governs the admin panel. Receives signals from the main process and displays the appropriate editor/panel.
 */

const { ipcRenderer } = require('electron');
const { TroopEditor, LeaderEditor } = require('./admin/troopEditor');
const AdminPanel = require('./admin/adminPanel');
const TimelineEditor = require('./admin/timelineEditor');
const OverviewPanel = require('./admin/overviewPanel');
const stateManager = require('@electron/remote').getGlobal('stateManager');

var state = "";

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('signal', (_event, payload) => {
        if (payload.type === "troop") {
            state = "troop";
            document.title = "Truppen-Editor";
            document.body.innerHTML = "";
            document.body.appendChild(TroopEditor(payload.data));
        } else if (payload.type === "leader") {
            state = "leader";
            document.title = "Anführer-Editor";
            document.body.innerHTML = "";
            document.body.appendChild(LeaderEditor(payload.data));
        } else if (payload.type === "admin-panel") {
            state = "admin-panel";
            document.title = "Admin-Panel";
            document.body.innerHTML = "";
            document.body.appendChild(AdminPanel());
        } else if (payload.type === "timeline") {
            state = "timeline";
            document.title = "Timeline-Editor";
            document.body.innerHTML = "";
            document.body.appendChild(TimelineEditor());
        } else if (payload.type === "timelineReload") {
            if (state === "timeline") {
                document.body.innerHTML = "";
                document.body.appendChild(TimelineEditor(payload.data));
            }
        } else if (payload.type === "overview") {
            state = "overview";
            document.title = "Truppenübersicht";
            document.body.innerHTML = "";
            document.body.appendChild(OverviewPanel());
        }
    })
});