class AdminService {
    constructor(stateManager, fileManager) {
        this.stateManager = stateManager;
        this.fileManager = fileManager;
        this.loadSettings();
    }

    loadSettings() {
        // const settings = this.fileManager.readJSON('settings.json') || {};
        // this.stateManager.updateState('settings', settings);
    }

    saveSettings(settings) {
        this.fileManager.writeJSON('settings.json', settings);
        this.stateManager.updateState('settings', settings);
    }

    getSystemStatus() {
        return {
            cpuUsage: this.stateManager.getState('system.cpuUsage'),
            memoryUsage: this.stateManager.getState('system.memoryUsage'),
            uptime: process.uptime(),
            platform: process.platform,
            nodeVersion: process.version
        };
    }
}

module.exports = AdminService;