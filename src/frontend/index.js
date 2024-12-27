// This file is loaded by the index.html file and will run in the renderer process. 
// It imports all managers and services and initializes them in the global scope.
const stateManager = require('@electron/remote').getGlobal('stateManager');
const notificationManager = require('@electron/remote').getGlobal('notificationManager');
const actionManager = require('@electron/remote').getGlobal('actionManager');



// Update current mouse coordinates for screen-based actions
document.addEventListener('mousemove', (event) => {
    stateManager.updateState('mouse.x', event.clientX);
    stateManager.updateState('mouse.y', event.clientY);
});

// Listen to keypresses on the whole document
document.addEventListener('keydown', (event) => {
    // notify the action manager of the keypress
    actionManager.keyDown(event.key);
});

document.addEventListener('keyup', (event) => {
    // notify the action manager of the key release
    actionManager.keyUp(event.key);
});

function spawnHoverMenu(options) {
    const menu = document.createElement('div');
    menu.className = 'hover-menu';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'hover-item';
        button.innerText = option;
        menu.appendChild(button);
        button.addEventListener('mouseover', () => {
            actionManager.selectAction(option);
        });
        button.addEventListener('mouseout', () => {
            actionManager.removeAction(option);
        });
    });

    document.body.appendChild(menu);
    menu.style.top = `${stateManager.getState('mouse.y') - menu.offsetHeight / 2}px`;
    menu.style.left = `${stateManager.getState('mouse.x') - menu.offsetWidth / 2}px`;

    // Create callback to remove the menu 
    actionManager.registerHoverMenuRemoval(() => {
        document.body.removeChild(menu);
    });
}
actionManager.registerHoverMenuCallback(spawnHoverMenu);

