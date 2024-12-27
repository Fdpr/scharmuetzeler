const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { dialog } = require('electron');

class FileManager {
    constructor() {
        this.basePath = app.getPath('documents');
        if (!fs.existsSync(path.join(this.basePath, "scharmuetzeler"))) {
            fs.mkdirSync(path.join(this.basePath, "scharmuetzeler"));
        }
        this.basePath = path.join(this.basePath, "scharmuetzeler");
    }

    getImageFiles() {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
        try {
            const files = fs.readdirSync(this.basePath);
            return files.filter(file => imageExtensions.includes(path.extname(file).toLowerCase()));
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }

    openWorkspaceDialog(basePath) {
        basePath = basePath || this.basePath;
        const selection = dialog.showOpenDialogSync({
            title: 'Workspace auswählen',
            properties: ['openDirectory'],
            defaultPath: basePath,
            buttonLabel: 'Ordner wählen',
        });
        if (selection) {
            this.basePath = selection[0];
            return this.basePath;
        } else {
            return null;
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

module.exports = FileManager;
