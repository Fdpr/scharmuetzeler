const os = require('os');

class SystemMonitor {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.startMonitoring();
    }

    startMonitoring() {
        setInterval(() => {
            this.updateSystemStats();
        }, 1000);
    }

    updateSystemStats() {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        this.stateManager.updateState('system.cpuUsage', this.calculateCPUUsage(cpus));
        this.stateManager.updateState('system.memoryUsage', ((totalMem - freeMem) / totalMem) * 100);
    }

    calculateCPUUsage(cpus) {
        const usage = cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total) * 100;
        }, 0);
        return usage / cpus.length;
    }
}

module.exports = SystemMonitor;