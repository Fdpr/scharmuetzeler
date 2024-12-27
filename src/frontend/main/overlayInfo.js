/**
 * This script displays some relevant information about the gamestate on the overlay.
 * It listens for updates to the gamestate and updates the overlay accordingly.
 */

const overlay = document.querySelector('.overlay');
const stateContainer = document.createElement('div');
stateContainer.className = 'state-container';
overlay.appendChild(stateContainer);
// Create a div for each piece of information we want to display and add it to the overlay
const currentToken = document.createElement('p');
stateContainer.appendChild(currentToken);

const updateOverlay = (gamestate) => {
    // Update the current token div if any token is selected
    if (gamestate.selectedToken) {
        currentToken.textContent = `Runde ${gamestate.round} (${gamestate.phase}) - ${gamestate.activeTroop} - ${gamestate.selectedToken}`;
    } 
}

// Listen for updates to the gamestate
const stateManager = require('@electron/remote').getGlobal('stateManager');
stateManager.subscribe("gamestate", updateOverlay);

currentToken.textContent = `Runde ${stateManager.getState("gamestate.round")} (${stateManager.getState("gamestate.phase")}) - ${stateManager.getState("gamestate.activeTroop")} - ${stateManager.getState("gamestate.selectedToken")}`;