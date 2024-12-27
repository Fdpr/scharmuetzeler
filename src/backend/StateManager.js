const Troop = require('../components/troop');
const Leader = require('../components/leader');
const Token = require('../components/token');
const Weapon = require('../components/weapon');

class StateManager {
    constructor() {
        this.listeners = new Map();
        this.state = {
            config: {
                workspace: "",
                bgImage: "",
                bgImageGridSquares: 30,
                styleSheet: "style.css",
            },
            gamestate: {
                round: 0,
                phase: "Setup", // Setup, Manöverphase, Kampfphase
                state: "FREE", // FREE, TARGET-SELECT, MULTI-SELECT, PAUSED
                actionQueue: [],
                activeTroop: "",
                selectedToken: "",
            },

            // non-persistent state
            mousePos: { x: 0, y: 0 },
            images: [],

            // state in current timeframe
            troops: [],
            leaders: [],
            tokens: [],

            // things that can be added to troops (configured globally)
            conditions: [],
            weapons: [],

            history: [],
            log: [],
        };
    }

    /**
     * Loads a folder as workspace and sets up any configuration or data files inside
     */
    setWorkspace(space) {
        let workspace;
        if (space) {
            workspace = space;
            global.fileManager.basePath = workspace;
        } else {
            workspace = global.fileManager.openWorkspaceDialog(this.state.config.workspace);
        }
        if (!workspace) return;
        const state = global.fileManager.readJSON('state.json');
        if (state) {
            const config = { ...this.state.config, ...state.config };
            config.workspace = workspace;
            this.updateState('config', config);
            if (state.weapons) this.updateState("weapons", state.weapons.map(Weapon.fromJSON));
            if (state.tokens) this.updateState('tokens', state.tokens.map(Token.fromJSON));
            if (state.troops) this.updateState('troops', state.troops.map(Troop.fromJSON));
            if (state.leaders) this.updateState('leaders', state.leaders.map(Leader.fromJSON));
        }
        this.updateState("images", global.fileManager.getImageFiles());
    }

    /**
     * save the current workspace (either override state.json or create a new one)
     */
    saveWorkspace(overrideState) {
        const state = {
            config: this.state.config,
            gamestate: this.state.gamestate,
            troops: this.state.troops.map(troop => troop.toJSON()),
            leaders: this.state.leaders.map(leader => leader.toJSON()),
            tokens: this.state.tokens.map(token => token.toJSON()),
            conditions: this.state.conditions,
            weapons: this.state.weapons.map(weapon => weapon.toJSON()),
            history: this.state.history,
            log: this.state.log,
        }
        const timeString = new Date().toISOString().replace(/[:.]/g, '-');
        global.fileManager.writeJSON(overrideState ? 'state.json' : `state-${timeString.slice(2, timeString.length - 8)}.json`, state);

    }

    /**
     * Searches troop in the current timeframe and returns it
     */
    getTroop(name) {
        return this.state.troops.find(troop => troop.name === name);
    }

    /**
     * Searches leader in the current timeframe and returns it
     */
    getLeader(name) {
        return this.state.leaders.find(leader => leader.name === name);
    }

    /**
     * Searches token in the current timeframe and returns it
     */
    getToken(name) {
        return this.state.tokens.find(token => token.name === name);
    }

    /**
     * Adds a troop to the current timeframe with its token, replacing any existing troop with the same name
     * @param {Troop} troop Troop object serialized to JSON
     * @param {Token} token Token object serialized to JSON
     */
    addTroop(troop, token) {
        // print prototype of troop
        troop = Troop.fromJSON(troop);
        token = Token.fromJSON(token);
        this.updateState('troops', [...this.state.troops.filter(t => t.name !== troop.name), troop]);
        this.updateState('tokens', [...this.state.tokens.filter(t => t.name !== token.name), token]);
    }

    /**
     * Deletes a troop from the current timeframe
     */
    deleteTroop(name) {
        this.updateState('troops', this.state.troops.filter(troop => troop.name !== name));
        this.updateState('tokens', this.state.tokens.filter(token => token.name !== name));
    }

    /**
     * Adds a leader to the current timeframe with its token, replacing any existing leader with the same name
     * @param {Leader} leader Leader object serialized to JSON
     * @param {Token} token token object serialized to JSON
     */
    addLeader(leader, token) {
        leader = Leader.fromJSON(leader);
        token = Token.fromJSON(token);
        this.updateState('leaders', [...this.state.leaders.filter(l => l.name !== leader.name), leader]);
        this.updateState('tokens', [...this.state.tokens.filter(t => t.name !== token.name), token]);
    }

    /**
     * Deletes a leader from the current timeframe
     */
    deleteLeader(name) {
        this.updateState('leaders', this.state.leaders.filter(leader => leader.name !== name));
        this.updateState('tokens', this.state.tokens.filter(token => token.name !== name));
    }

    /**
     * Adds a weapon
     */
    addWeapon(weapon) {
        weapon = Weapon.fromJSON(weapon);
        this.updateState('weapons', [...this.state.weapons, weapon]);
    }

    /**
     * Deletes a weapon by index since weapons can have the same name
     */
    deleteWeapon(index) {
        this.updateState('weapons', this.state.weapons.filter((_weapon, i) => i !== index));
    }

    /**
     * Sets some state value and notifies all listeners subscribed to the path.
     */
    updateState(path, value) {
        // Helper to update nested state paths 
        const parts = path.split('.');
        let current = this.state;
        let currentPath = [];
        while (parts.length > 1) {
            const part = parts.shift();
            current = current[part] = current[part] || {};
            currentPath.push(part);
            this.notifyListeners(currentPath.join('.'), current);
        }
        current[parts[0]] = value;
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
            console.log(`Notifying listeners for ${path}`);
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