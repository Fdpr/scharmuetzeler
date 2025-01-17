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
                bgImageX: 0,
                bgImageY: 0,
                bgImageGridSquares: 30,
                styleSheet: "style.css",
                parties: ["Partei"],
                actionDelay: 250,
                actionBlockSize: 3,
            },
            gamestate: {
                round: 0,
                /*
                Setup (Only in round 0, parties can be added), 
                Manöverphase, 
                Kampfphase (Select new actions for each troop), 
                Kampfphase [Defaults] (default actions are filled in and the gamemaster can still rearrange them),
                Kampfphase [Ausführung] (actions are being performed),
                Kampfphase [unterbrochen] (some action cannot be performed and the gamemaster needs to replace it),
                Kampfphase [Ende] (all actions have been performed and the round is over),
                */
                phase: "Setup",
                /*
                FREE (Nothing is happening right now and everybody is free to do anything), 
                SELECT (Select targets for current action), 
                PAUSE (action is over and the gamemaster needs to input some stuff manually),
                REPLACE (The game is halted and the gamemaster needs to replace an action during the action phase) 
                */
                state: "FREE",
                maneuverQueue: [], // List of maneuvers that have been performed this round
                actionMap: {}, // One action list for each party where actions are queued up before being performed
                actionQueue: [], // Actions by each party get merged into here for performing during the action phase
                actionIndex: 0, // Index of the current action in the actionQueue
                activeEntity: "", // Entity that is currently active (E.g. performing an action)
                selectedToken: "", // Entity that is currently selected (E.g. for targeting)
                display: "", // An extra message to display during pauses (e.g. "Select a target")
                backInTime: false, // Indicates if we are stepping back in time (means to ignore transition calls between phases)
            },

            // non-persistent state
            mousePos: { x: 0, y: 0 }, // Current mouse position (used for hover menus)
            images: [], // List of all images in the workspace (//TODO: Currently only loaded on workspace change)
            // Remembers the last selected action in the timeline editor. Makes it persist between refreshes
            timelineSelect: {
                party: "",
                index: 0,
            },

            // Undo stack for undoing maneuvers
            undoStack: [],

            // state in current timeframe
            troops: [],
            leaders: [],
            tokens: [],
            log: [],

            // things that can be added to troops (configured globally)
            conditions: [],
            weapons: [],

            // history of all completed past rounds
            history: [
                {
                    troops: [],
                    leaders: [],
                    tokens: [],
                    log: [],
                }
            ],
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
            if (state.gamestate) this.updateState('gamestate', { ...this.state.gamestate, ...state.gamestate });
            if (state.troops) this.updateState('troops', state.troops.map(Troop.fromJSON));
            if (state.leaders) this.updateState('leaders', state.leaders.map(Leader.fromJSON));
            if (state.tokens) this.updateState('tokens', state.tokens.map(Token.fromJSON));
            if (state.log) this.updateState('log', state.log);

            if (state.conditions) this.updateState("conditions", state.conditions);
            if (state.weapons) this.updateState("weapons", state.weapons.map(Weapon.fromJSON));

            if (state.history) this.updateState('history', state.history.map(round => ({
                ...round,
                troops: round.troops.map(Troop.fromJSON),
                leaders: round.leaders.map(Leader.fromJSON),
                tokens: round.tokens.map(Token.fromJSON),
            })));
            if (state.undoStack) this.updateState('undoStack', state.undoStack.map(frame => ({
                troops: frame.troops.map(Troop.fromJSON),
                leaders: frame.leaders.map(Leader.fromJSON),
                tokens: frame.tokens.map(Token.fromJSON),
                log: [...frame.log],
            })));

        }
        this.updateState("images", global.fileManager.getImageFiles());
    }

    /**
     * save the current workspace (either override state.json or create a new one)
     * the override flag is currently ignored and both a copy as well as the original state.json are saved
     */
    saveWorkspace(overrideState, silent) {
        if (this.state.gamestate.state === "SELECT") {
            global.mainWindow.webContents.send('alert', "Während der Auswahlphase kann der Spielstand nicht gespeichert werden!");
            return;
        }
        const state = {
            config: this.state.config,
            gamestate: this.state.gamestate,
            troops: this.state.troops.map(troop => troop.toJSON()),
            leaders: this.state.leaders.map(leader => leader.toJSON()),
            tokens: this.state.tokens.map(token => token.toJSON()),
            log: this.state.log,

            conditions: this.state.conditions,
            weapons: this.state.weapons.map(weapon => weapon.toJSON()),

            history: this.state.history.map(round => ({
                ...round,
                troops: round.troops.map(troop => troop.toJSON()),
                leaders: round.leaders.map(leader => leader.toJSON()),
                tokens: round.tokens.map(token => token.toJSON()),
            })),

            undoStack: this.state.undoStack.map(frame => ({
                troops: frame.troops.map(troop => troop.toJSON()),
                leaders: frame.leaders.map(leader => leader.toJSON()),
                tokens: frame.tokens.map(token => token.toJSON()),
                log: [...frame.log],
            })),
        }
        const timeString = new Date().toISOString().replace(/[:.]/g, '-');
        if (!global.isDev)
            global.fileManager.writeJSON('state.json', state);
        global.fileManager.writeJSON(`state-${timeString.slice(2, timeString.length - 8)}.json`, state);
        if (!silent) global.mainWindow.webContents.send('alert', "Spielstand gespeichert!");
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
     * Adds a token to the current timeframe (should only be used to update existing tokens, otherwise it will have no reference to a troop/leader)
     */
    addToken(token) {
        token = Token.fromJSON(token);
        this.updateState('tokens', [...this.state.tokens.filter(t => t.name !== token.name), token]);
    }

    /**
     * Removes a token from the current timeframe. Makes sure that it gets removed as active Entity if it is the current one
     */
    deleteToken(name) {
        this.updateState('tokens', this.state.tokens.filter(t => t.name !== name));
        if (this.state.gamestate.activeEntity === name) {
            this.updateState('gamestate.activeEntity', "");
        }
        if (this.state.gamestate.selectedToken === name) {
            this.updateState('gamestate.selectedToken', "");
        }
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
        this.deleteToken(name);
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
        this.deleteToken(name);
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
     * Adds a log 
     */
    addLog(log) {
        this.updateState('log', [...this.state.log, log]);
    }

    /**
     * Swaps two actions of a given party in the action map. Used for rearranging actions during the action phase.
     */
    swapActions(party, index1, index2) {
        const actionMap = { ...this.state.gamestate.actionMap };
        const actions = [...actionMap[party]];
        if ((index1 < 0 || index2 < 0) || (index1 >= actions.length || index2 >= actions.length)) return;
        [actions[index1], actions[index2]] = [actions[index2], actions[index1]];
        actionMap[party] = actions;
        this.updateState('gamestate.actionMap', actionMap);
    }

    /**
     * Deletes an action from a given party in the action map. Used for removing actions during the action phase.
     */
    deleteAction(party, index) {
        const actionMap = { ...this.state.gamestate.actionMap };
        actionMap[party] = actionMap[party].filter((_action, i) => i !== index);
        this.updateState('gamestate.actionMap', actionMap);
    }

    /**
     * Copies the current timeframe to the undo stack
     */
    pushUndo() {
        this.state.undoStack.push({
            troops: this.state.troops.map(troop => troop.copy()),
            leaders: this.state.leaders.map(leader => leader.copy()),
            tokens: this.state.tokens.map(token => token.copy()),
            log: [...this.state.log],
        });
    }

    /**
     * Pops the last timeframe from the undo stack and replaces the current timeframe with it
     * Returns true if successful, false if the stack is empty
     */
    popUndo() {
        if (this.state.undoStack.length < 2) return false;
        this.state.undoStack.pop();
        const lastFrame = this.state.undoStack[this.state.undoStack.length - 1];
        this.updateState('troops', lastFrame.troops.map(troop => troop.copy()));
        this.updateState('leaders', lastFrame.leaders.map(leader => leader.copy()));
        this.updateState('tokens', lastFrame.tokens.map(token => token.copy()));
        this.updateState('log', [...lastFrame.log]);
        // Remove last entry from the maneuverQueue
        this.updateState('gamestate.maneuverQueue', this.state.gamestate.maneuverQueue.slice(0, -1));
        return true;
    }


    /**
     * Copies the current timeframe to the history at the given round
     */
    setHistory(round) {
        const history = [...this.state.history];
        history[round - 1] = {
            troops: this.state.troops.map(troop => troop.copy()),
            leaders: this.state.leaders.map(leader => leader.copy()),
            tokens: this.state.tokens.map(token => token.copy()),
            gamestate: { ...this.state.gamestate },
            log: [...this.state.log],
        };
        if (history.length === round) {
            history.push({
                troops: [],
                leaders: [],
                tokens: [],
                gamestate: {},
                log: [],
            });
        }
        this.updateState('history', history) // TODO: Is this a bug?.slice(0, round));
        this.updateState('log', []);
    }

    /**
     * Comfort utility function to get the state of the last round
     * If the current round is 0 or 1, null is returned
    */
    getLastRound() {
        const round = this.state.gamestate.round;
        if (round < 2) return null;
        return this.state.history[round - 2];
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

    /**
     * Sometimes, the listeners need to be called manually (e.g. after a change that doesn't trigger a listener)
     * This is mostly used for the frontend to update the display after a change (i.e. trigger a re-render by refreshing tokens)
     */
    refresh(path) {
        this.notifyListeners(path, this.getState(path));
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
            // console.log(`Notifying listeners for ${path}`);
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