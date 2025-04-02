const stateManager = require('@electron/remote').getGlobal('stateManager');
/* 
* This script is responsible for creating and managing popups that appear on the screen.
* It listens for notifications from the main process and displays them as popups.
*/
const container = document.querySelector('.overlay');

const addPopup = (message) => {
    const popup = document.createElement('div');
    popup.classList.add('popup');
    popup.textContent = message;
    container.appendChild(popup);

    setTimeout(() => {
        popup.classList.add('fadeout');
        setTimeout(() => popup.remove(), 250)
    }, stateManager.getState("config.popupDuration"));
}

require('@electron/remote').getGlobal('notificationManager').register(addPopup);