class StateManager {
    constructor() {
        this.listeners = new Map();
        this.state = {
            settings: {},
            stats: {
                lastUpdate: null,
                uptime: 0
            },
            system: {
                cpuUsage: 0,
                memoryUsage: 0
            }
        };
    }

    updateState(path, value) {
        // Helper to update nested state paths like 'stats.uptime'
        const parts = path.split('.');
        let current = this.state;
        while (parts.length > 1) {
            const part = parts.shift();
            current = current[part] = current[part] || {};
        }
        current[parts[0]] = value;

        // Notify listeners
        this.notifyListeners(path, value);
    }

    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);

        // Return unsubscribe function
        return () => this.listeners.get(path).delete(callback);
    }

    notifyListeners(path, value) {
        if (this.listeners.has(path)) {
            this.listeners.get(path).forEach(callback => callback(value));
        }
    }

    getState(path) {
        const parts = path.split('.');
        let current = this.state;
        for (const part of parts) {
            if (current === undefined) return undefined;
            current = current[part];
        }
        return current;
    }
}

module.exports = StateManager;