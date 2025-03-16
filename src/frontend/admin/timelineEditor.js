const stateManager = require('@electron/remote').getGlobal('stateManager');
const actionManager = require('@electron/remote').getGlobal('actionManager');

function TimelineSlider() {
    const container = document.createElement('div');
    container.className = 'two-column';
    const title = document.createElement('h2');
    title.className = "span-2"
    title.innerText = 'Timeline';
    container.appendChild(title);

    const history = stateManager.getState('history');
    if (!history.length || history.length < 2) {
        container.style.display = 'none';
        return container;
    }

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.list = 'rounds';
    slider.min = 1;
    slider.max = history.length;
    slider.value = stateManager.getState('gamestate.round');
    slider.className = 'span-2';
    container.appendChild(slider);

    const datalist = document.createElement('datalist');
    datalist.id = 'rounds';
    datalist.className = 'span-2';
    container.appendChild(datalist);

    for (let i = 1; i <= history.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.label = i;
        datalist.appendChild(option);
    }

    return container;
}

function ManeuverTable() {
    const container = document.createElement('div');

    const doneManeuversContainer = document.createElement('div');
    doneManeuversContainer.className = 'two-column';
    doneManeuversContainer.style.marginBottom = '1em';
    const doneManeuversTitle = document.createElement('h2');
    doneManeuversTitle.className = 'span-2';
    doneManeuversTitle.innerText = 'Ausgeführte Manöver';
    doneManeuversContainer.appendChild(doneManeuversTitle);


    const maneuverQueue = stateManager.getState('gamestate.maneuverQueue');

    const maneuverTable = document.createElement('table');
    maneuverTable.className = 'span-2';

    const header = document.createElement('tr');
    const headers = ['Einheit', 'Manöver', 'Ziele', 'Log'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.innerText = headerText;
        header.appendChild(th);
    });
    maneuverTable.appendChild(header);
    maneuverQueue.forEach(maneuver => {
        const row = document.createElement('tr');
        const unit = document.createElement('td');
        unit.innerText = maneuver.entity;
        row.appendChild(unit);
        const move = document.createElement('td');
        move.innerText = maneuver.name;
        row.appendChild(move);
        const targets = document.createElement('td');
        targets.innerText = maneuver.targets.join(', ');
        row.appendChild(targets);
        const log = document.createElement('td');
        log.innerHTML = maneuver.shortLog ? maneuver.shortLog.join('<br>') : '';
        row.appendChild(log);
        maneuverTable.appendChild(row);
    });

    doneManeuversContainer.appendChild(maneuverTable);
    container.appendChild(doneManeuversContainer);

    const troops = stateManager.getState('troops');
    const leaders = stateManager.getState('leaders');


    const freeUnitsContainer = document.createElement('div');
    freeUnitsContainer.className = 'two-column';
    const freeUnitsTitle = document.createElement('h2');
    freeUnitsTitle.className = 'span-2';
    freeUnitsTitle.innerText = 'Manöver übrig';
    freeUnitsContainer.appendChild(freeUnitsTitle);

    const freeUnitsTable = document.createElement('table');
    freeUnitsTable.className = 'span-2';
    const freeUnitsHeader = document.createElement('tr');
    const freeUnitsHeaders = ['Einheit', 'Anzahl'];
    freeUnitsHeaders.forEach(headerText => {
        const th = document.createElement('th');
        th.innerText = headerText;
        freeUnitsHeader.appendChild(th);
    });
    freeUnitsTable.appendChild(freeUnitsHeader);
    [...leaders, ...troops].forEach(entity => {
        if (!entity.isAlive()) return;
        const freeActions = actionManager.getNumFreeManeuvers(entity.name);
        if (freeActions <= 0) return;
        const row = document.createElement('tr');
        const unit = document.createElement('td');
        unit.innerText = entity.name;
        row.appendChild(unit);
        const count = document.createElement('td');
        count.innerText = freeActions;
        row.appendChild(count);
        freeUnitsTable.appendChild(row);
    });
    freeUnitsContainer.appendChild(freeUnitsTable);
    container.appendChild(freeUnitsContainer);
    return container;
}

function ActionMapTable(party, showFreeActions, selectedAction) {
    const container = document.createElement('div');
    container.className = 'two-column';
    const title = document.createElement('h2');
    title.className = 'span-2';
    title.innerText = `Aktionen ${party}`;
    container.appendChild(title);

    const actionMap = stateManager.getState('gamestate.actionMap');
    const actionBlockSize = stateManager.getState('config.actionBlockSize');

    const actionTable = document.createElement('table');
    const header = document.createElement('tr');
    const headers = ["Index", 'Einheit', 'Aktion', 'Ziele'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.innerText = headerText;
        header.appendChild(th);
    });
    actionTable.appendChild(header);
    let actionMapDisplay = actionMap[party].map((action, index) => {
        return { ...action, index };
    });
    if (showFreeActions) {
        const lastRound = stateManager.getLastRound();
        if (lastRound && lastRound.gamestate.actionMap && lastRound.gamestate.actionMap[party]) {
            const lastActionMap = lastRound.gamestate.actionMap[party].map(action => {
                return { ...action, ghost: true };
            });
            let currentActionsByEntity = {};
            actionMapDisplay.forEach(action => {
                if (!currentActionsByEntity[action.entity]) {
                    currentActionsByEntity[action.entity] = [];
                }
                currentActionsByEntity[action.entity].push(action);
            });

            let updatedLastActionMap = [];
            lastActionMap.forEach(lastAction => {
                if (currentActionsByEntity[lastAction.entity] && currentActionsByEntity[lastAction.entity].length > 0) {
                    updatedLastActionMap.push(currentActionsByEntity[lastAction.entity].shift());
                } else {
                    updatedLastActionMap.push(lastAction);
                }
            });

            Object.keys(currentActionsByEntity).forEach(entity => {
                currentActionsByEntity[entity].forEach(action => {
                    updatedLastActionMap.unshift(action);
                });
            });

            actionMapDisplay = updatedLastActionMap;
        }
    }
    actionMapDisplay.forEach((action, index) => {
        const row = document.createElement('tr');
        if (Math.trunc(index / actionBlockSize) % 2 === 1) {
            row.classList.add("lightRow");
        }
        if (action.ghost) {
            row.classList.add("ghostRow");
        }
        if (!showFreeActions && selectedAction === action.index) {
            row.classList.add("selectedRow");
        }
        const idx = document.createElement('td');
        idx.innerText = index + 1;
        row.appendChild(idx);
        const unit = document.createElement('td');
        unit.innerText = action.entity;
        row.appendChild(unit);
        const move = document.createElement('td');
        move.innerText = action.name;
        row.appendChild(move);
        const targets = document.createElement('td');
        targets.innerHTML = action.targets.join('<br>');
        row.appendChild(targets);
        if (!showFreeActions && !action.ghost) {
            row.addEventListener('click', () => {
                stateManager.updateState('timelineSelect', { party, index: action.index });
                stateManager.refresh("gamestate.actionMap");
            });
        }
        actionTable.appendChild(row);
    });
    container.appendChild(actionTable);

    if (showFreeActions) {
        const freeUnitsTitle = document.createElement('h3');
        freeUnitsTitle.className = 'span-2';
        freeUnitsTitle.innerText = 'Aktionen übrig';
        container.appendChild(freeUnitsTitle);
        const freeUnitsTable = document.createElement('table');
        freeUnitsTable.className = 'span-2';
        const freeUnitsHeader = document.createElement('tr');
        const freeUnitsHeaders = ['Einheit', 'Anzahl'];
        freeUnitsHeaders.forEach(headerText => {
            const th = document.createElement('th');
            th.innerText = headerText;
            freeUnitsHeader.appendChild(th);
        });
        freeUnitsTable.appendChild(freeUnitsHeader);
        stateManager.getState("troops").filter(troop => troop.party === party).forEach(entity => {
            if (!entity.isAlive()) return;
            const freeActions = actionManager.getNumFreeActions(entity.name);
            if (freeActions <= 0) return;
            const row = document.createElement('tr');
            const unit = document.createElement('td');
            unit.innerText = entity.name;
            row.appendChild(unit);
            const count = document.createElement('td');
            count.innerText = freeActions;
            row.appendChild(count);
            freeUnitsTable.appendChild(row);
        });
        container.appendChild(freeUnitsTable);
    }
    return container;

}

function ActionQueueDisplay(payload) {
    const container = document.createElement('div');
    container.className = 'two-column';
    const title = document.createElement('h2');
    title.className = 'span-2';
    title.innerText = 'Aktionen';
    container.appendChild(title);

    const actionQueue = payload || stateManager.getState('gamestate.actionQueue');
    const actionIndex = stateManager.getState('gamestate.actionIndex');

    const actionTable = document.createElement('table');
    actionTable.className = 'span-2';

    const header = document.createElement('tr');
    const headers = ['Einheit', 'Aktion', 'Ziele', 'Log'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.innerText = headerText;
        header.appendChild(th);
    });
    actionTable.appendChild(header);
    actionQueue.forEach((action, index) => {
        const row = document.createElement('tr');
        if (index === actionIndex) {
            row.className = 'lightRow';
        }
        const unit = document.createElement('td');
        unit.innerText = action.entity;
        row.appendChild(unit);
        const move = document.createElement('td');
        move.innerText = action.name;
        row.appendChild(move);
        const targets = document.createElement('td');
        targets.innerText = action.targets.join(', ');
        row.appendChild(targets);
        const log = document.createElement('td');
        log.innerHTML = action.shortLog ? action.shortLog.join('<br>') : '';
        row.appendChild(log);
        actionTable.appendChild(row);
    });

    container.appendChild(actionTable);
    return container;
}

// The payload is just there to directly inject the actionQueue into the timeline editor.
// Otherwise there is some weird bug where the actionQueue is not displayed correctly.
function TimelineEditor(payload) {
    const container = document.createElement('div');
    container.className = "admin-panel";

    // Add this back in when the timeline slider actually works and does something. Which it currently doesn't. Sad. :(
    // container.appendChild(TimelineSlider());
    const phase = stateManager.getState('gamestate.phase');
    if (phase === "Manöverphase") {
        container.appendChild(ManeuverTable());
    } else if (phase === "Kampfphase" || phase === "Kampfphase [Defaults]") {
        const selectedAction = stateManager.getState('timelineSelect');
        stateManager.getState('config.parties').forEach(party => {
            container.appendChild(ActionMapTable(party, phase === "Kampfphase [Defaults]" ? false : true, selectedAction.party === party ? selectedAction.index : -1));
        });
        if (phase === "Kampfphase [Defaults]") {
            const listener = (event) => {
                const oldAction = { ...selectedAction }
                if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    stateManager.updateState('timelineSelect', { party: selectedAction.party, index: Math.max(selectedAction.index - 1, 0) });
                    stateManager.swapActions(oldAction.party, oldAction.index, oldAction.index - 1);
                } else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    stateManager.updateState('timelineSelect', { party: selectedAction.party, index: selectedAction.index + 1 });
                    stateManager.swapActions(oldAction.party, oldAction.index, oldAction.index + 1);
                } else if (event.key === 'Delete') {
                    stateManager.updateState('timelineSelect', { party: selectedAction.party, index: Math.max(selectedAction.index - 1, 0) });
                    stateManager.deleteAction(oldAction.party, oldAction.index);
                }
            };
            document.addEventListener('keydown', listener);
            lastKeyEvent = listener;
        }
    } else if (phase === "Kampfphase [Ausführung]" || phase === "Kampfphase [unterbrochen]" || phase === "Kampfphase [Ende]") {
        container.appendChild(ActionQueueDisplay(payload));
    }
    return container;
}

module.exports = TimelineEditor;