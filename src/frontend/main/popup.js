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
    }, 1500);
}

const notificationManager = require('@electron/remote').getGlobal('notificationManager');
notificationManager.register(addPopup);