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
 */

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
    }

    registerHoverMenuCallback(callback) {
        this.hoverMenu = callback;
    }

    registerHoverMenuRemoval(callback) {
        this.removeHoverMenu = callback;
    }

    /**
     * Is fired when a token is clicked in the viewport. 
     */
    selectToken(name) {
        const token = stateManager.getToken(name);
        if (token) {
            this.stateManager.updateState("gamestate.selectedToken", name);
        } else {
            this.notificationManager.error("Troop not found: " + name + "!");
        }
    }

    /**
     * Is fired when a token is double-clicked in the viewport. 
     */
    doubleClickToken(name) {
        this.notificationManager.message("Token " + name + " double-clicked.");
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

        if (key === "a") {
            this.action = "";
            this.hoverMenu(["Laufen", "Ausruhen", "Geordneter Rückzug", "Manövrieren", "Waffe wechseln", "Meisteraktion", "Sprinten", "Lanzenangriff", "Sturmangriff", "Ausfall", "Ablenken", "Beschleunigtes Laden", "Sperrfeuer", "Deckung suchen", "Pikenwall", "Schildwall", "Plänkeln"]);
        } else if (key === "x") {
            this.stateManager.getState("troops").forEach(troop => {
                troop.addCondition("x", "Schock", 1);
            });
        }

    }

    /**
     * Is fired when a key is released. Processes actions depending on the key.
     */
    keyUp(key) {
        this.isKeyPressed[key] = false;

        if (key === "a") {
            this.removeHoverMenu();
            if (this.action) {
                this.notificationManager.message("Selected action: " + this.action);
            }
        }
    }
}

module.exports = ActionManager;