/**
 * This script displays some relevant information about the gamestate on the overlay.
 * It listens for updates to the gamestate and updates the overlay accordingly.
 */

const overlay = document.querySelector('.overlay');
const stateContainer = document.createElement('div');
stateContainer.className = 'state-container';
overlay.appendChild(stateContainer);
// Create a div for each piece of information we want to display and add it to the overlay
// Well, actually, scratch that, haha. I'm just going to use a single p element for now.
const overlayDisplay = document.createElement('p');
stateContainer.appendChild(overlayDisplay);

const updateOverlay = (gamestate) => {
    // Baba booey
    let overlayText = `Runde ${gamestate.round} (${gamestate.phase})`;
    /*if (gamestate.state) {
        overlayText += ` - ${gamestate.state}`;
    }
    if (gamestate.activeEntity) {
        overlayText += ` - Aktive Einheit: ${gamestate.activeEntity}`;
    }
    if (gamestate.selectedToken) {
        overlayText += ` - Ausgewählte Einheit: ${gamestate.selectedToken}`;
    }*/
    if (gamestate.display) {
        overlayText += `<br>${gamestate.display}`;
    }
    overlayDisplay.innerHTML = overlayText;
    
}

// Listen for updates to the gamestate
const stateManager = require('@electron/remote').getGlobal('stateManager');
stateManager.subscribe("gamestate", updateOverlay);

updateOverlay(stateManager.getState("gamestate"));