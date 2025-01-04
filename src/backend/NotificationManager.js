/**
 * Brokers messages that are sent to the frontend.
 * Also keeps tab of logs and saves them to the state.
 */

class NotificationManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.listeners = [];
    }

    // Register a listener to be called when a message is sent.
    register(listener) {
        this.listeners.push(listener);
    }

    // Send a message to all listeners. These are typically sent to the frontend.
    message(msg) {
        this.log(msg);
        for (const listener of this.listeners) {
            listener(msg);
        }
    }

    // Log a message. This is typically saved to the state and is more verbose than a message.
    log(msg) {
        this.stateManager.addLog(msg);
    }

    // Log an error. This is just a regular message for now.
    error(msg) {
        this.message(msg);
    }
}

module.exports = NotificationManager;