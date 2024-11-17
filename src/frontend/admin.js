class AdminPanel {
    constructor() {
        this.stateManager = require('@electron/remote').getGlobal('stateManager');
        // this.setupEventListeners();
        const AdminDashboard = require("./AdminDashboard");
        new AdminDashboard(this.stateManager);
    }

    setupEventListeners() {
        document.getElementById('saveConfig').addEventListener('click', () => {
            this.saveConfig();
        });
    }

    async saveConfig() {
        try {
            const config = {
                setting1: document.getElementById('setting1').value,
                setting2: document.getElementById('setting2').value
            };

            if (this.fileManager.writeJSON('config.json', config)) {
                this.showSuccess('Config saved successfully!');
            } else {
                this.showError('Failed to save config');
            }
        } catch (error) {
            this.showError(`Error: ${error.message}`);
        }
    }

    showSuccess(message) {
        // Show success notification
    }

    showError(message) {
        // Show error notification
    }
}

// Initialize admin panel
new AdminPanel();

