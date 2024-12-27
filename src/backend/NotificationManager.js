class NotificationManager {
    constructor() {
        this.listeners = [];
    }

    register(listener) {
        this.listeners.push(listener);
    }

    message(msg) {
        for (const listener of this.listeners) {
            listener(msg);
        }
    }

    error(msg) {
        this.message(msg);
    }
}

module.exports = NotificationManager;