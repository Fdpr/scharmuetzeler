/**
 * Brokers actions between the frontend inputs and the game logic.
 * The ActionManager listens for different events and performs actions depending on the gamestate.
 * 
 * List of events:
 * - Select token (token is clicked in viewport)
 * - Doubleclick token (token is doubleclicked in viewport)
 * - keydown (global keypress in viewport)
 * - keyup (global key release in viewport)
 * - selectAction (hover over action in hover menu)
 * - removeAction (hover out of action in hover menu)
 * - continue (continue button is clicked)
 */

const { actions, maneuvers, freeActions, leaderActions } = require('../components/maneuvers');
const { getGlobal } = require('../util/process');
const { mergeLists, neighborhoodSort } = require("../util/arrays");

class ActionManager {

    constructor(stateManager, notificationManager) {
        this.stateManager = stateManager;
        this.notificationManager = notificationManager;
        this.isKeyPressed = {}; // Track keypresses to prevent multiple fires
        this.gamestate = stateManager.state.gamestate;
        // Subscribe to stateManager to get gamestate
        stateManager.subscribe("gamestate", (gamestate) => {
            this.gamestate = gamestate;
        });
        /** The action that is currently being performed
         *  Has the following layout:
         *  {
         *    name: name of the action,
         *    type: type of the action,
         *    entity: source of the action,
         *    targets: [array of targets],
         *  }
         */
        this.currentAction = {};
        // The action that is currently selected in the hover menu
        this.action = "";
    }

    // Since the hover menu is created in the frontend, we need to register a callback to spawn it.
    registerHoverMenuCallback(callback) {
        this.hoverMenu = callback;
    }

    registerHoverMenuRemoval(callback) {
        this.removeHoverMenu = callback;
    }

    /**
     * Is fired when a token is single clicked in the viewport. 
     * Selects the token and sets it as the active entity if the gamestate is FREE.
     * If name is empty, deselects the token.
     */
    selectToken(name) {
        if (!name) {
            this.stateManager.updateState("gamestate.selectedToken", "");
            if (this.gamestate.state === "FREE")
                this.stateManager.updateState("gamestate.activeEntity", "");
            setTimeout(() => {
                if (!this.gamestate.selectedToken) {
                    this.stateManager.refresh("tokens")
                }
            }, 100);
            return;
        }
        const token = stateManager.getToken(name);
        if (token) {
            this.stateManager.updateState("gamestate.selectedToken", name);
            if (this.gamestate.state === "FREE")
                this.stateManager.updateState("gamestate.activeEntity", name);
        } else {
            this.notificationManager.error("Troop not found: " + name + "!");
        }
    }

    /**
     * Is fired when a token is double-clicked in the viewport. 
     */
    doubleClickToken(name) {
        if (this.gamestate.state === "FREE") {
            const token = stateManager.getToken(name);
            if (token) {
                if (token.type === "leader") {
                    getGlobal("openAdminWindow")({
                        type: "leader",
                        data: token.ref
                    })
                } else if (token.type === "troop") {
                    getGlobal("openAdminWindow")({
                        type: "troop",
                        data: token.ref
                    })
                }
            } else {
                this.notificationManager.error("Troop not found: " + name + "!");
            }
        }
        else if (this.gamestate.state === "SELECT") {
            const token = stateManager.getToken(name);
            if (token.type === "leader") return;
            if (token.type === "troop" && !this.currentAction.targets.includes(name) && this.stateManager.getTroop(token.ref).isAlive()) {
                this.currentAction.targets.push(name);
                if (this.currentAction.max === this.currentAction.targets.length) {
                    this.endSelection();
                    return;
                }
                else
                    this.notificationManager.message(`${name} zu den Zielen hinzugefügt..`);
            }
        }
    }

    /**
     * Is fired when hovered over an action in a hover menu. Remembers it for later use.
     */
    selectAction(name) {
        this.action = name;
    }

    /**
     * Is fired when hover ends over an action in a hover menu. Forgets the action.
     */
    removeAction(name) {
        if (this.action === name) {
            this.action = "";
        }
    }

    /**
     * Is fired when a key is pressed. Processes actions depending on the key.
    */
    keyDown(key) {
        if (this.isKeyPressed[key]) return;
        this.isKeyPressed[key] = true;

        // Open editor
        if (key === "e") {
            if (!this.gamestate.selectedToken) return;
            const token = this.stateManager.getToken(this.gamestate.selectedToken);
            if (!token) return;
            if (token.type === "leader") {
                getGlobal("openAdminWindow")({
                    type: "leader",
                    data: token.ref
                })
            } else if (token.type === "troop") {
                getGlobal("openAdminWindow")({
                    type: "troop",
                    data: token.ref
                })
            }
        }

        // Save
        else if (key === "s" && this.isKeyPressed["Control"]) {
            this.stateManager.saveWorkspace(false);
        }

        // Undo
        else if (key === "r") {
            if (this.gamestate.state !== "FREE" || this.gamestate.phase === "Setup") return;
            if (this.gamestate.phase === "Manöverphase") this.stateManager.popUndo();
            if (this.gamestate.phase === "Kampfphase") {
                this.stateManager.popUndo();
                this.stateManager.updateState("gamestate.phase", "Manöverphase");
                this.stateManager.refresh("gamestate.maneuverQueue");
            } if (this.gamestate.phase === "Kampfphase [Defaults]") {
                this.stateManager.updateState("gamestate.phase", "Kampfphase");
                this.stateManager.updateState("gamestate.display", "");
            }
        }

        // Cancel target selection for chosen action
        else if (key === "Escape") {
            if (this.gamestate.state !== "SELECT") return;
            if (this.gamestate.phase === "Manöverphase") {
                this.currentAction = {};
                this.stateManager.updateState("gamestate.state", "FREE");
                this.stateManager.updateState("gamestate.display", "");
            } else if (this.gamestate.phase === "Kampfphase [unterbrochen]") {
                this.stateManager.updateState("gamestate.state", "REPLACE");
                this.stateManager.updateState("gamestate.display", `Wähle eine neue Aktion für ${this.gamestate.activeEntity} aus.`);
            } else if (this.gamestate.phase === "Kampfphase") {
                this.currentAction = {};
                this.stateManager.updateState("gamestate.state", "FREE");
                this.stateManager.updateState("gamestate.display", "");
            }
        }

        // Delete selected token
        else if (key === "Delete") {
            if (!this.gamestate.selectedToken) return;
            // Allowing deletion in other states could lead to unexpected behavior
            // Maybe we can add this feature later
            if (this.gamestate.state !== "FREE") return;
            const token = this.stateManager.getToken(this.gamestate.selectedToken);
            if (!token) return;
            if (token.type === "leader") {
                this.stateManager.deleteLeader(token.ref);
            } else if (token.type === "troop") {
                this.stateManager.deleteTroop(token.ref);
            }

        }


        // Spawn Hover Menu
        else if (key === "a") {
            this.action = "";
            this.spawnHoverMenu();
        }
        // Fire continue event
        else if (key === "Enter" || key === "c") {
            this.continue()
        }


        // Useful shortcuts
        // Toggle Condition "Deckung" for troop
        if (key === "d") {
            if (!this.gamestate.selectedToken) return;
            const token = this.stateManager.getToken(this.gamestate.selectedToken);
            if (!token || token.type === "leader") return;
            const troop = this.stateManager.getTroop(token.ref);
            if (!troop) return;
            if (troop.hasCondition("d")) {
                troop.removeCondition("d");
            } else {
                troop.addCondition("d", "Deckung", -1);
            }
        }

    }

    /**
     * Is fired when a key is released. Processes actions depending on the key.
     */
    keyUp(key) {
        this.isKeyPressed[key] = false;

        // Remove hover menu
        if (key === "a" && this.removeHoverMenu) {
            this.removeHoverMenu();
            if (!this.action) return;

            const token = this.stateManager.getToken(this.gamestate.activeEntity);
            if (!token) return;

            // Leaders can only perform during the maneuver phase
            if (this.gamestate.phase.includes("Kampfphase") && token.type === "leader") return;

            this.currentAction = {
                name: this.action,
                type: undefined,
                entity: this.gamestate.activeEntity,
                targets: []
            }

            // Reset action so that it doesn't carry over to the next selection
            this.action = "";

            if (this.gamestate.phase === "Manöverphase" && token.type === "troop") {
                const troop = this.stateManager.getTroop(token.ref);
                if (!troop) return;
                const select = [...maneuvers, ...freeActions].find(maneuver => maneuver.name === this.currentAction.name).select(troop);
                if (!select.select) {
                    this.performManeuver();
                    return;
                }
                this.currentAction.type = "maneuver";
                this.currentAction.select = true;
                this.currentAction.min = select.min || 0;
                this.currentAction.max = select.max || 999;
                this.currentAction.display = select.display;
                this.selectTargets();
                return;
            } else if (this.gamestate.phase === "Manöverphase" && token.type === "leader") {
                const leader = this.stateManager.getLeader(token.ref);
                if (!leader) return;
                const action = leaderActions.find(action => action.name === this.currentAction.name);
                const select = action.select(leader);
                if (!select.select) {
                    this.performLeaderAction();
                    return;
                }
                this.currentAction.type = "leaderAction";
                this.currentAction.select = true;
                this.currentAction.min = select.min || 0;
                this.currentAction.max = select.max || 999;
                this.currentAction.display = select.display;
                this.selectTargets();
                return;
            } else if (this.gamestate.phase.includes("Kampfphase") && token.type === "troop") {
                const troop = this.stateManager.getTroop(token.ref);
                if (!troop) return;
                const action = [...actions, ...freeActions].find(action => action.name === this.currentAction.name);
                const select = action.select(troop);
                this.currentAction.type = "action";
                if (!select.select) {
                    this.queueAction();
                    return;
                }
                this.currentAction.select = true;
                this.currentAction.min = select.min || 0;
                this.currentAction.max = select.max || 999;
                this.currentAction.display = select.display;
                this.selectTargets();
                return;

            }
        }

        /**
         * We open the panels on key up instead of key down because the focus is lost and the key becomes sticky otherwise.
         */
        // Open admin window
        else if (key === "1") {
            getGlobal("openAdminWindow")({
                type: "admin-panel"
            })
        }

        // Open timeline editor
        else if (key === "2") {
            getGlobal("openAdminWindow")({
                type: "timeline"
            })
        }

        // Open overview editor
        else if (key === "3") {
            getGlobal("openAdminWindow")({
                type: "overview"
            })
        }

    }

    /**
     * Is fired when the continue button is clicked
     */
    continue() {
        if (this.gamestate.state === "SELECT") {
            if (this.currentAction.targets.length >= this.currentAction.min)
                this.endSelection();
            else
                this.notificationManager.error(`Es müssen/muss mindestens ${this.currentAction.min} Ziel(e) ausgewählt werden.`);
        } else if (this.gamestate.state === "PAUSE") {
            this.endPause();
        } else if (this.gamestate.state === "FREE") {
            if (this.gamestate.phase === "Setup") {
                this.stateManager.updateState("gamestate.phase", "Manöverphase")
                this.stateManager.updateState("gamestate.round", 1)
                this.stateManager.updateState("gamestate.state", "FREE")
                this.stateManager.pushUndo("maneuver");
                // Just to trigger the timeline panel to refresh
                this.stateManager.updateState("gamestate.maneuverQueue", [])
            }
            else if (this.gamestate.phase === "Manöverphase") {
                this.endOfManeuverPhase();
            } else if (this.gamestate.phase === "Kampfphase") {
                this.fillInDefaultActions();
                this.stateManager.updateState("timelineSelect", {
                    party: "",
                    index: 0,
                },)
            } else if (this.gamestate.phase === "Kampfphase [Defaults]") {
                this.beginActionExecution();
            } else if (this.gamestate.phase === "Kampfphase [Ausführung]") {
                return;
            } else if (this.gamestate.phase === "Kampfphase [Ende]") {
                this.endOfRound();
            } else {
                this.notificationManager.error(`Fehler: Ungültiger Zustand: ${this.gamestate.state}, ${this.gamestate.phase}`);
            }
        } else if (this.gamestate.state === "REPLACE") {
            this.notificationManager.message("Das Spiel kann nicht fortgesetzt werden, bis eine neue Aktion für die unterbrochene Einheit ausgewählt wurde.");
        }
        else {
            this.notificationManager.error(`Fehler: Ungültiger Zustand: ${this.gamestate.state}`);
        }
    }

    /**
     * Returns the number of free actions a troop has left by counting its appearances in the actionQueue.
     */
    getNumFreeActions(name) {
        const token = this.stateManager.getToken(name);
        if (!token) return 0;
        const troop = this.stateManager.getTroop(token.ref);
        if (!troop || !troop.isAlive()) return 0;
        return Math.max(0, troop.get("actionCount") - this.gamestate.actionMap[troop.party].filter(action => action.entity === name).length);
    }

    /** 
     * Returns the number of free maneuvers /leader actions a troop / leader has left by counting its appearances in the maneuverQueue.
    */
    getNumFreeManeuvers(name) {
        const token = this.stateManager.getToken(name);
        if (!token) return 0;
        const ref = this.stateManager.getTroop(token.ref) || this.stateManager.getLeader(token.ref);
        if (!ref || !ref.isAlive()) return 0;
        return Math.max(0, ref.get("maneuverCount") - this.gamestate.maneuverQueue.filter(maneuver => maneuver.entity === name).length);
    }

    /**
     * Checks if a troop has already maneuvered this round by looking it up in the maneuverQueue.
     */
    hasManeuvered(name) {
        return this.gamestate.maneuverQueue.map(maneuver => maneuver.entity).includes(name);
    }

    /**
     * This method is called when a maneuver / leader action / action needs target selection.
     * It initializes the state for target selection.
     */
    selectTargets() {
        this.stateManager.updateState("gamestate.display", this.currentAction.display);
        this.stateManager.updateState("gamestate.state", "SELECT");
    }

    /**
     * This method is called when target selection is over.
     * This happens when either the maximum number of targets is reached or the user continues manually.
     * This method handles maneuver / leader action / action execution.
     */
    endSelection() {
        if (this.gamestate.phase === "Manöverphase") {
            if (this.currentAction.type === "maneuver")
                this.performManeuver();
            else if (this.currentAction.type === "leaderAction")
                this.performLeaderAction();
        } else if (this.gamestate.phase.includes("Kampfphase")) {
            this.queueAction();
        }
    }

    /**
     * This method picks up after a maneuver / leader action / action has been performed that initiated a pause.
     */
    endPause() {
        if (this.gamestate.phase === "Manöverphase") {
            this.stateManager.updateState("gamestate.state", "FREE");
            this.stateManager.updateState("gamestate.display", "");
        } else if (this.gamestate.phase === "Kampfphase [Ausführung]") {
            this.beginActionExecution()
        }
    }

    /**
     * This method performs a maneuver by a troop. It handles the aftermath, cleanup and handoff.
     */
    performManeuver(skipUndo) {
        const token = this.stateManager.getToken(this.gamestate.activeEntity);
        const troop = this.stateManager.getTroop(token.ref);
        if (!troop) return;
        if (!this.hasManeuvered(troop.name)) troop.handleFirstManeuver();
        const maneuver = [...maneuvers, ...freeActions].find(maneuver => maneuver.name === this.currentAction.name);
        const result = maneuver.perform(troop, this.currentAction.targets.map(target => this.stateManager.getTroop(target)));
        result.log.forEach(log => { if (log) this.notificationManager.message(log) });
        this.stateManager.updateState("gamestate.maneuverQueue", [...this.gamestate.maneuverQueue, { ...this.currentAction, log: result.log, shortLog: result.shortLog }]);
        if (!skipUndo) this.stateManager.pushUndo("maneuver");
        this.stateManager.refresh("tokens")
        this.currentAction = {};
        if (result.pause)
            this.stateManager.updateState("gamestate.state", "PAUSE");
        else
            this.stateManager.updateState("gamestate.state", "FREE");
        if (result.display)
            this.stateManager.updateState("gamestate.display", result.display);
        else
            this.stateManager.updateState("gamestate.display", "");

        // TODO: Is this enough ???
    }

    performLeaderAction(skipUndo) {
        const token = this.stateManager.getToken(this.gamestate.activeEntity);
        const leader = this.stateManager.getLeader(token.ref);
        if (!leader) return;
        const leaderAction = leaderActions.find(action => action.name === this.currentAction.name);
        const result = leaderAction.perform(leader, this.currentAction.targets.map(target => this.stateManager.getTroop(target)));
        result.log.forEach(log => { if (log) this.notificationManager.message(log) });
        this.stateManager.updateState("gamestate.maneuverQueue", [...this.gamestate.maneuverQueue, { ...this.currentAction, log: result.log, shortLog: result.shortLog }]);
        if (!skipUndo) this.stateManager.pushUndo("maneuver");
        this.stateManager.refresh("tokens")
        this.currentAction = {};
        if (result.pause)
            this.stateManager.updateState("gamestate.state", "PAUSE");
        else
            this.stateManager.updateState("gamestate.state", "FREE");
        if (result.display)
            this.stateManager.updateState("gamestate.display", result.display);
        else
            this.stateManager.updateState("gamestate.display", "");
        // TODO: Is this enough ???
    }

    /**
     * This method queues an action either in the actionMap (during action selection)
     * or replaces it in the actionQueue (during action execution) and then resumes execution.
     */
    queueAction() {
        if (this.gamestate.phase === "Kampfphase [unterbrochen]") {
            this.gamestate.actionQueue[this.gamestate.actionIndex] = this.currentAction;
            this.stateManager.updateState("gamestate.actionQueue", this.gamestate.actionQueue);
            this.stateManager.updateState("gamestate.state", "FREE");
            this.stateManager.updateState("gamestate.display", "");
            this.stateManager.updateState("gamestate.phase", "Kampfphase [Ausführung]");
            this.beginActionExecution();
        } else if (this.gamestate.phase === "Kampfphase" || this.gamestate.phase === "Kampfphase [Defaults]") {
            this.gamestate.actionMap[this.stateManager.getTroop(this.stateManager.getToken(this.gamestate.activeEntity).ref).party].push(this.currentAction);
            this.stateManager.updateState("gamestate.actionMap", this.gamestate.actionMap);
            this.currentAction = {};
            this.stateManager.updateState("gamestate.state", "FREE");
            this.stateManager.updateState("gamestate.display", "");
        }
    }

    performAction() {
        const action = this.gamestate.actionQueue[this.gamestate.actionIndex];
        const token = this.stateManager.getToken(action.entity);
        if (!token) {
            this.stateManager.updateState("gamestate.actionIndex", this.gamestate.actionIndex + 1);
            this.beginActionExecution();
            return;
        };
        const troop = this.stateManager.getTroop(token.ref);
        if (!troop || !troop.isAlive()) {
            this.stateManager.updateState("gamestate.actionIndex", this.gamestate.actionIndex + 1);
            this.beginActionExecution();
            return;
        };
        this.stateManager.updateState("gamestate.activeEntity", troop.name);
        const actionType = [...actions, ...freeActions].find(actionType => actionType.name === action.name);
        const targets = action.targets.map(target => this.stateManager.getTroop(target));

        if (!actionType.checkUntargeted(troop) || !actionType.checkTargeted(troop, targets)) {
            this.stateManager.updateState("gamestate.display", `${troop.name} kann die Aktion ${action.name} nicht ausführen. Wähle eine andere Aktion.`);
            this.stateManager.updateState("gamestate.state", "REPLACE");
            this.stateManager.updateState("gamestate.phase", "Kampfphase [unterbrochen]");
            return;
        }
        const result = actionType.perform(troop, targets);
        result.log.forEach(log => { if (log) this.notificationManager.message(log) });
        action.log = result.log;
        action.shortLog = result.shortLog;
        this.gamestate.actionQueue[this.gamestate.actionIndex] = action;
        this.stateManager.updateState("gamestate.actionQueue", [...this.gamestate.actionQueue]);
        this.stateManager.updateState("gamestate.actionIndex", this.gamestate.actionIndex + 1);
        this.stateManager.refresh("tokens");
        if (result.pause) {
            this.stateManager.updateState("gamestate.state", "PAUSE");
            this.stateManager.updateState("gamestate.display", result.display);
        } else {
            this.stateManager.updateState("gamestate.display", "");
            const delay = this.stateManager.getState("config.actionDelay");
            this.stateManager.updateState("gamestate.state", "FREE");
            setTimeout(() => {
                this.beginActionExecution();
            }, delay);
        }
    }

    /**
     * This method is called when the user continues during the maneuver phase.
     * It looks for troops / leaders with unspent maneuvers and defaults them.
     * Then it advances the phase to the action phase.
     */
    endOfManeuverPhase() {
        this.stateManager.pushUndo("maneuverEnd");
        const leaders = this.stateManager.getState("leaders");
        leaders.forEach(leader => {
            if ((this.getNumFreeManeuvers(leader.name) > 0) && leader.action) {
                this.currentAction = {
                    name: leader.action,
                    type: "leaderAction",
                    entity: leader.name,
                    targets: leader.targets.map(name => this.stateManager.getTroop(name)) || []
                }
                this.gamestate.activeEntity = leader.name;
                this.performLeaderAction(true);
            }
        });
        const troops = this.stateManager.getState("troops");
        troops.forEach(troop => {
            while (this.getNumFreeManeuvers(troop.name) > 0) {
                this.currentAction = {
                    name: "Ausruhen",
                    type: "maneuver",
                    entity: troop.name,
                    targets: []
                }
                this.gamestate.activeEntity = troop.name;
                this.performManeuver(true);
            }
        });
        troops.forEach(troop => troop.handleEndOfManeuver());
        this.stateManager.updateState("log", [...this.stateManager.getState("log"), "\n== Kampfphase ==\n"]);
        this.stateManager.updateState("gamestate.phase", "Kampfphase");
        this.stateManager.updateState("gamestate.state", "FREE");
        this.stateManager.updateState("gamestate.display", "");
        this.stateManager.updateState("timelineSelect", {
            party: "",
            index: 0,
        },)
        const actionMap = {};
        this.stateManager.getState("config.parties").forEach(party => {
            actionMap[party] = [];
        });
        this.stateManager.updateState("gamestate.actionMap", actionMap);
    }

    /**
     * This method is called when the user continues during the action phase.
     * It looks for troops with unspent actions and defaults them.
     * Then it advances the phase to the second part of the action phase.
     */
    fillInDefaultActions() {
        const defaultMap = {};
        const parties = this.stateManager.getState("config.parties")
        parties.forEach(party => {
            defaultMap[party] = [];
        });
        const troops = this.stateManager.getState("troops");
        troops.forEach(troop => {
            for (let i = 0; i < this.getNumFreeActions(troop.name); i++) {
                defaultMap[troop.party].push(troop.getDefaultAction());
            }
        });
        const lastActionMap = this.gamestate.round > 1 ? this.stateManager.getState("history")[this.gamestate.round - 2].gamestate.actionMap : null;
        parties.forEach(party => {
            const mergedList = [...this.gamestate.actionMap[party], ...defaultMap[party]];
            if (lastActionMap) {
                this.gamestate.actionMap[party] = neighborhoodSort(mergedList, lastActionMap[party], "entity");
            } else {
                this.gamestate.actionMap[party] = mergedList;
            }
        });
        this.stateManager.updateState("gamestate.actionMap", this.gamestate.actionMap);
        this.stateManager.updateState("gamestate.phase", "Kampfphase [Defaults]");
        this.stateManager.updateState("gamestate.state", "FREE");
        this.stateManager.updateState("gamestate.display", "Prüfe die Reihenfolge der Aktionen und bestätige.");
    }

    /**
     * This method is called when the user continues during the second part of the action phase.
     * It builds the action queue and starts the execution of actions.
     * This method is also called if execution resumes after a replacement.
     */
    beginActionExecution() {
        if (this.gamestate.phase === "Kampfphase [Defaults]") {
            this.stateManager.updateState("gamestate.actionQueue", mergeLists(this.gamestate.actionMap, this.stateManager.getState("config.parties"), this.stateManager.getState("config.actionBlockSize")));
            this.stateManager.updateState("gamestate.actionIndex", 0);
            this.stateManager.updateState("gamestate.phase", "Kampfphase [Ausführung]");
            this.stateManager.updateState("gamestate.display", "");
        } else if (this.gamestate.phase === "Kampfphase [unterbrochen]") {
            this.stateManager.updateState("gamestate.phase", "Kampfphase [Ausführung]");
        }
        if (this.gamestate.actionIndex < this.gamestate.actionQueue.length) {
            this.performAction();
        } else {
            this.stateManager.updateState("gamestate.phase", "Kampfphase [Ende]");
        }
    }

    /**
     * Some cleanup for finishing  up a round. Gets called at the end of the round.
     * Sets up and prepares for the new round.
     */
    endOfRound() {
        this.stateManager.getState("troops").forEach(troop => troop.handleEndOfRound());
        this.stateManager.setHistory(this.gamestate.round);
        this.stateManager.updateState("gamestate.round", this.gamestate.round + 1);

        this.stateManager.updateState("gamestate.phase", "Manöverphase");
        this.stateManager.updateState("gamestate.state", "FREE");
        this.stateManager.updateState("gamestate.display", "");
        this.stateManager.updateState("gamestate.actionMap", {});
        this.stateManager.updateState("gamestate.maneuverQueue", []);
        this.stateManager.updateState("gamestate.actionQueue", []);
        this.stateManager.updateState("gamestate.actionIndex", 0);
        this.stateManager.updateState("undoStack", [])
        this.stateManager.pushUndo("maneuver");
        this.stateManager.saveWorkspace(false, true);

        // TODO: Is this enough ???
    }

    spawnHoverMenu() {
        // Make sure that there is no stale reference
        if (!this.gamestate.activeEntity) return;
        if (this.gamestate.phase === "Setup") return;
        if (this.gamestate.state === "SELECT" || this.gamestate.state === "PAUSE") return;
        const token = this.stateManager.getToken(this.gamestate.activeEntity);
        if (!token) return;
        // Spawn leader actions menu
        if (token.type === "leader") {
            if (this.gamestate.phase !== "Manöverphase") return;
            if (this.getNumFreeManeuvers(token.name) <= 0) return;
            const leader = this.stateManager.getLeader(token.ref);
            if (!leader) return;
            this.hoverMenu(leaderActions.filter(action => action.check(leader)).map(action => action.name));
            return;
        }
        // Spawn troop actions / maneuvers menu
        const troop = this.stateManager.getTroop(token.ref);
        if (!troop) return;
        if (this.gamestate.phase === "Manöverphase") {
            if (this.getNumFreeManeuvers(token.name) <= 0) return;
            this.hoverMenu([...maneuvers, ...freeActions].filter(maneuver => maneuver.check(troop)).map(maneuver => maneuver.name));
        } else if (this.gamestate.phase === "Kampfphase" || this.gamestate.phase === "Kampfphase [unterbrochen]" || this.gamestate.phase === "Kampfphase [Defaults]") {
            if (this.getNumFreeActions(token.name) <= 0 && this.gamestate.phase !== "Kampfphase [unterbrochen]") return;
            this.hoverMenu([...actions, ...freeActions].filter(action => action.checkUntargeted(troop)).map(action => action.name));
        }
    }

}

module.exports = ActionManager;