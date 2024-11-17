class AdminDashboard {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.setupDashboard();
    }

    setupDashboard() {
        this.createSystemMonitor();
        this.createSettingsPanel();
        this.setupEventListeners();
        this.startUpdates();
    }

    createSystemMonitor() {
        const monitorEl = document.createElement('div');
        monitorEl.innerHTML = `
            <div class="system-monitor">
                <h2>System Status</h2>
                <div class="metric">
                    <label>CPU Usage:</label>
                    <span id="cpuUsage">0%</span>
                </div>
                <div class="metric">
                    <label>Memory Usage:</label>
                    <span id="memoryUsage">0%</span>
                </div>
                <div class="metric">
                    <label>Uptime:</label>
                    <span id="uptime">0s</span>
                </div>
            </div>
        `;
        document.getElementById('dashboard').appendChild(monitorEl);
    }

    createSettingsPanel() {
        const settings = this.stateManager.getState('settings');
        const settingsEl = document.createElement('div');
        settingsEl.innerHTML = `
            <div class="settings-panel">
                <h2>Settings</h2>
                <form id="settingsForm">
                    <div class="setting-group">
                        <label>Theme:</label>
                        <select name="theme">
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label>Auto Update:</label>
                        <input type="checkbox" name="autoUpdate" 
                               ${settings.autoUpdate ? 'checked' : ''}>
                    </div>
                    <button type="submit">Save Settings</button>
                </form>
            </div>
        `;
        document.getElementById('dashboard').appendChild(settingsEl);
    }

    setupEventListeners() {
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const settings = {
                theme: formData.get('theme'),
                autoUpdate: formData.get('autoUpdate') === 'on'
            };
            this.stateManager.updateState('settings', settings);
        });

        // Subscribe to state changes
        this.stateManager.subscribe('system.cpuUsage', (value) => {
            document.getElementById('cpuUsage').textContent = `${value.toFixed(1)}%`;
        });

        this.stateManager.subscribe('system.memoryUsage', (value) => {
            document.getElementById('memoryUsage').textContent = `${value.toFixed(1)}%`;
        });
    }

    startUpdates() {
        setInterval(() => {
            document.getElementById('uptime').textContent = 
                this.formatUptime(this.stateManager.getState('stats.uptime'));
        }, 1000);
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}h ${minutes}m ${secs}s`;
    }
}

module.exports = AdminDashboard;