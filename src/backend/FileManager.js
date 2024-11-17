const fs = require('fs');
const path = require('path');

class FileManager {
    constructor(basePath) {
        this.basePath = basePath;
        this.createBasePathIfNeeded();
    }

    createBasePathIfNeeded() {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }

    readJSON(filename) {
        try {
            const filePath = path.join(this.basePath, filename);
            if (!fs.existsSync(filePath)) return null;
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.error(`Error reading ${filename}:`, error);
            return null;
        }
    }

    writeJSON(filename, data) {
        try {
            const filePath = path.join(this.basePath, filename);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing ${filename}:`, error);
            return false;
        }
    }
}

// Make it globally available
global.fileManager = new FileManager(path.join(__dirname, 'data'));
