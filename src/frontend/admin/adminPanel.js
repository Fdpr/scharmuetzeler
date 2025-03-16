/**
 * Displays an admin panel for editing weapons and conditions.
 */

const stateManager = require('@electron/remote').getGlobal('stateManager');
const Weapon = require('../../components/weapon');

const { generateInput } = require("./troopEditor");
const { conditions: preMadeConditions } = require("../../components/conditions");


function buildWeaponOptions(weapons, select, selected = 0) {
    select.innerHTML = "";
    weapons.forEach((weapon, index) => {
        const option = document.createElement('option');
        if (index === selected) {
            option.selected = true;
        }
        option.value = index;
        option.innerText = weapon.reach <= 1 ?
            `${weapon.name} ${weapon.shield ? "(Schild)" : ""}, ${weapon.TPString()} TP, AT/PA: ${weapon.ATMod}/${weapon.PAMod}`
            : `${weapon.name}, ${weapon.TPString()} TP, FK: ${weapon.FKMod}, Reichweite: ${weapon.reach}, Nachladen: ${weapon.nachladen} Runden`;
        select.appendChild(option);
    });
}

function WeaponEditor() {
    const container = document.createElement('div');
    container.className = "two-column";
    const weaponTitle = document.createElement('h2');
    weaponTitle.className = "span-2";
    weaponTitle.innerText = "Waffen-Editor";
    container.appendChild(weaponTitle);

    let weapons = stateManager.getState("weapons");
    const weaponSelect = document.createElement('select');
    buildWeaponOptions(weapons, weaponSelect);

    container.appendChild(weaponSelect);


    const deleteButton = document.createElement('button');
    deleteButton.innerText = "Löschen";
    deleteButton.addEventListener('click', () => {
        stateManager.deleteWeapon(parseInt(weaponSelect.value));
        weapons = stateManager.getState("weapons");
        buildWeaponOptions(weapons, weaponSelect);
    });

    container.appendChild(deleteButton);

    const newWeapon = document.createElement('p');
    newWeapon.innerHTML = "<b>Neue Waffe</b>";
    newWeapon.className = "span-2";
    container.appendChild(newWeapon);

    const weaponName = generateInput("Name", "weapon-name", "", () => { }, container);
    const weaponTP = generateInput("TP", "weapon-tp", "1W6", () => { }, container);
    const weaponAT = generateInput("AT-Modifikator", "weapon-at", 0, () => { }, container, 'number');
    const weaponPA = generateInput("PA-Modifikator", "weapon-pa", 0, () => { }, container, 'number');
    const weaponFK = generateInput("FK-Modifikator", "weapon-fk", 0, () => { }, container, 'number');
    const weaponShield = generateInput("Schild", "weapon-shield", false, () => { }, container, 'checkbox');
    const weaponReach = generateInput("Reichweite", "weapon-reach", 0, () => { }, container, 'number');
    const weaponNachladen = generateInput("Nachladen", "weapon-nachladen", 0, () => { }, container, 'number');

    weaponSelect.addEventListener('change', (event) => {
        weaponName.value = weapons[event.target.value].name;
        weaponTP.value = weapons[event.target.value].TPString();
        weaponAT.value = parseInt(weapons[event.target.value].ATMod);
        weaponPA.value = parseInt(weapons[event.target.value].PAMod);
        weaponFK.value = parseInt(weapons[event.target.value].FKMod);
        weaponShield.checked = weapons[event.target.value].shield;
        weaponReach.value = parseInt(weapons[event.target.value].reach);
        weaponNachladen.value = parseInt(weapons[event.target.value].nachladen);
    });

    const addButton = document.createElement('button');
    addButton.innerText = "Hinzufügen";
    addButton.addEventListener('click', () => {
        if (!weaponName.value || !weaponTP.value) return;
        stateManager.addWeapon(new Weapon(
            weaponName.value,
            parseInt(weaponAT.value),
            parseInt(weaponPA.value),
            parseInt(weaponFK.value),
            weaponShield.checked,
            weaponTP.value,
            parseInt(weaponReach.value),
            parseInt(weaponNachladen.value)
        ).toJSON());
        weapons = stateManager.getState("weapons");
        buildWeaponOptions(weapons, weaponSelect, weapons.length - 1);
    });

    container.appendChild(addButton);

    return container;
}

function buildConditionOptions(conditions, select, selected = 0) {
    select.innerHTML = "";
    conditions.forEach((condition, index) => {
        const option = document.createElement('option');
        if (index === selected) {
            option.selected = true;
        }
        const mods = Object.keys(condition.mods).map(key => condition.mods[key]).join("/");
        option.value = index;
        option.innerText = `${condition.key} (${condition.name}): ${mods}`;
        select.appendChild(option);
    });
}

function ConditionEditor() {
    const container = document.createElement('div');
    container.className = "two-column";
    const conditionTitle = document.createElement('h2');
    conditionTitle.className = "span-2";
    conditionTitle.innerText = "Zustands-Editor";
    container.appendChild(conditionTitle);

    let conditions = stateManager.getState("conditions");

    const conditionSelect = document.createElement('select');
    buildConditionOptions(conditions, conditionSelect);
    container.appendChild(conditionSelect);

    const deleteButton = document.createElement('button');
    deleteButton.innerText = "Löschen";
    deleteButton.addEventListener('click', () => {
        conditions = conditions.filter((_condition, index) => index !== parseInt(conditionSelect.value));
        stateManager.updateState("conditions", conditions);
        buildConditionOptions(conditions, conditionSelect);
    });
    container.appendChild(deleteButton);

    const newCondition = document.createElement('p');
    newCondition.innerHTML = "<b>Neuer Zustand</b>";
    newCondition.className = "span-2";
    container.appendChild(newCondition);

    const conditionKey = generateInput("Key", "condition-key", "", () => { }, container);
    const conditionName = generateInput("Name", "condition-name", "", () => { }, container);
    const conditionEK = generateInput("EK", "condition-ek", 0, () => { }, container, 'number');
    const conditionAT = generateInput("AT", "condition-at", 0, () => { }, container, 'number');
    const conditionPA = generateInput("PA", "condition-pa", 0, () => { }, container, 'number');
    const conditionFK = generateInput("FK", "condition-fk", 0, () => { }, container, 'number');
    const conditionTP = generateInput("TP", "condition-tp", 0, () => { }, container, 'number');
    const conditionMO = generateInput("MO", "condition-mo", 0, () => { }, container, 'number');
    const conditionRS = generateInput("RS", "condition-rs", 0, () => { }, container, 'number');
    const conditionGS = generateInput("GS", "condition-gs", 0, () => { }, container, 'number');
    const conditionAU = generateInput("AU", "condition-au", 0, () => { }, container, 'number');
    const conditionManeuver = generateInput("Manöver", "condition-maneuver", 0, () => { }, container, 'number');
    const conditionAction = generateInput("Aktionen", "condition-action", 0, () => { }, container, 'number');
    const conditionActionEK = generateInput("EchtEK", "condition-actionEK", 0, () => { }, container, 'number');
    const conditionDamage = generateInput("Schaden", "condition-damage", "", () => { }, container, 'text');

    conditionSelect.addEventListener('change', (event) => {
        const condition = conditions[event.target.value];
        conditionKey.value = condition.key;
        conditionName.value = condition.name;
        conditionEK.value = condition.mods.EK;
        conditionAT.value = condition.mods.AT;
        conditionPA.value = condition.mods.PA;
        conditionFK.value = condition.mods.FK;
        conditionTP.value = condition.mods.TP;
        conditionMO.value = condition.mods.MO;
        conditionRS.value = condition.mods.RS;
        conditionGS.value = condition.mods.GS;
        conditionAU.value = condition.mods.AU;
        conditionManeuver.value = condition.mods.maneuverCount;
        conditionAction.value = condition.mods.actionCount;
        conditionActionEK.value = condition.mods.EKAction;
        conditionDamage.value = condition.mods.damage;
    });

    const addButton = document.createElement('button');
    addButton.innerText = "Hinzufügen";
    addButton.addEventListener('click', () => {
        if (!conditionKey.value || !conditionName.value || preMadeConditions.some(condition => condition.key === conditionKey.value)) return;
        conditions = conditions.filter(condition => condition.key !== conditionKey.value);
        conditions.push({
            key: conditionKey.value,
            name: conditionName.value,
            mods: {
                EK: parseInt(conditionEK.value),
                AT: parseInt(conditionAT.value),
                PA: parseInt(conditionPA.value),
                FK: parseInt(conditionFK.value),
                TP: parseInt(conditionTP.value),
                MO: parseInt(conditionMO.value),
                RS: parseInt(conditionRS.value),
                GS: parseInt(conditionGS.value),
                AU: parseInt(conditionAU.value),
                actionCount: parseInt(conditionAction.value),
                maneuverCount: parseInt(conditionManeuver.value),
                EKAction: parseInt(conditionActionEK.value),
                damage: conditionDamage.value
            }
        });
        stateManager.updateState("conditions", conditions);
        buildConditionOptions(conditions, conditionSelect, conditions.length - 1);
    });

    container.appendChild(addButton);

    return container;
}

function PartyEditor() {
    const container = document.createElement('div');
    container.className = "two-column";
    const partyTitle = document.createElement('h2');
    partyTitle.className = "span-2";
    partyTitle.innerText = "Partei-Editor";
    container.appendChild(partyTitle);

    let parties = stateManager.getState("config.parties");

    const partySelect = document.createElement('select');

    const makeParties = () => {
        partySelect.size = parties.length;
        partySelect.innerHTML = "";
        parties.forEach((party, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.innerText = party;
            partySelect.appendChild(option);
        });
    }

    makeParties();

    container.appendChild(partySelect);

    const canEdit = stateManager.getState("gamestate.phase") === "Setup";

    const deleteButton = document.createElement('button');
    deleteButton.disabled = !canEdit;
    deleteButton.innerText = "Löschen";
    deleteButton.addEventListener('click', () => {
        parties = parties.filter((_party, index) => index !== parseInt(partySelect.value));
        stateManager.updateState("config.parties", parties);
        makeParties();
    });

    container.appendChild(deleteButton);

    const newParty = document.createElement('p');
    newParty.innerHTML = "<b>Neue Partei</b>";
    newParty.className = "span-2";
    container.appendChild(newParty);

    const partyName = generateInput("Name", "party-name", "", () => { }, container);

    const addButton = document.createElement('button');
    addButton.disabled = !canEdit;
    addButton.innerText = "Hinzufügen";
    addButton.addEventListener('click', () => {
        if (parties.includes(partyName.value) || !partyName.value) {
            return;
        }
        parties.push(partyName.value);
        stateManager.updateState("config.parties", parties);
        makeParties();
    });

    container.appendChild(addButton);

    return container;

}

function RollPanel() {
    const container = document.createElement('div');
    container.className = "two-column";
    const rollTitle = document.createElement('h2');
    rollTitle.className = "span-2";
    rollTitle.innerText = "Proben würfeln / Schaden";
    container.appendChild(rollTitle);

    const troops = stateManager.getState("troops");
    const currentTroop = stateManager.getState("gamestate.activeEntity")
    const selectLabel = document.createElement('label');
    selectLabel.htmlFor = "troop-select";
    selectLabel.innerText = "Truppe";
    container.appendChild(selectLabel);

    const troopSelect = document.createElement('select');
    troopSelect.id = "troop-select";
    troopSelect.size = 1;
    troops.forEach((troop, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.innerText = troop.name;
        option.selected = troop.name === currentTroop;
        troopSelect.appendChild(option);
    });
    container.appendChild(troopSelect);

    const rolls = ["Moralprobe", "Ausdauerprobe", "Regenerationsprobe", "AT", "PA", "FK", "TP", "MO", "AU"]
    const rollLabel = document.createElement('label');
    rollLabel.htmlFor = "roll-select";
    rollLabel.innerText = "Probe";
    container.appendChild(rollLabel);
    const rollSelect = document.createElement('select');
    rollSelect.id = "roll-select";
    rollSelect.size = 1;
    rolls.forEach(roll => {
        const option = document.createElement('option');
        option.value = roll;
        option.innerText = roll;
        rollSelect.appendChild(option);
    });
    container.appendChild(rollSelect);
    generateInput("Erschwernis", "roll-modifier", 0, () => { }, container, 'number');
    const rollButton = document.createElement('button');
    rollButton.innerText = "Würfeln";
    container.appendChild(rollButton);

    const resultDisplay = document.createElement('span');
    resultDisplay.innerText = "Ergebnis:";
    container.appendChild(resultDisplay);

    rollButton.addEventListener('click', () => {
        const troop = troops[troopSelect.value];
        const roll = rollSelect.value;
        const modifier = parseInt(document.getElementById("roll-modifier").value);
        const context = {}
        let result;
        if (roll === "Moralprobe") {
            result = troop.doMoralProbe(modifier);
        } else if (roll === "Ausdauerprobe") {
            result = troop.doAusdauerProbe(modifier);
        } else if (roll === "Regenerationsprobe") {
            result = troop.doRegenerationsProbe(modifier);
        } else if (roll === "TP") {
            result = troop.doDamage(context) + " TP";
        } else {
            result = troop.roll(roll, context, modifier);
        }
        if (roll !== "TP") {
            result = result ? "Bestanden" : "Gescheitert";
        }

        resultDisplay.innerText = result;
        stateManager.refresh("tokens")
    });

    const valueHeader = document.createElement('p');
    valueHeader.innerHTML = "<b>Aktuellen Wert anzeigen</b>";
    valueHeader.className = "span-2";
    container.appendChild(valueHeader);
    const values = ["AT", "PA", "FK", "TP", "MO", "AU", "RS", "GS"];
    const valueSelect = document.createElement('select');
    valueSelect.size = 1;
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.innerText = value;
        valueSelect.appendChild(option);
    });
    container.appendChild(valueSelect);
    const valueDisplay = document.createElement('span');
    valueDisplay.innerText = "Wert:";
    container.appendChild(valueDisplay);
    const valueChangeHandler = () => {
        const troop = troops[troopSelect.value];
        valueDisplay.innerText = troop.get(valueSelect.value);
    }
    valueChangeHandler();
    valueSelect.addEventListener('change', valueChangeHandler);

    const damageHeader = document.createElement('p');
    damageHeader.innerHTML = "<b>Schaden anrichten</b>";
    damageHeader.className = "span-2";
    container.appendChild(damageHeader);

    generateInput("Schaden", "damage", 0, () => { }, container, 'number');
    generateInput("Rüstung ignorieren", "ignoreRS", false, () => { }, container, 'checkbox');

    const damageButton = document.createElement('button');
    damageButton.innerText = "anrichten";
    damageButton.addEventListener('click', () => {
        const troop = troops[troopSelect.value];
        const damage = parseInt(document.getElementById("damage").value);
        if (damage < 0) {
            troop.healDamage(-damage);
            return;
        }
        const ignoreRS = document.getElementById("ignoreRS").checked;
        troop.takeDamage(damage, {
            damage: {
                isTrue: ignoreRS
            }
        });

    });
    container.appendChild(damageButton);

    return container;

}

function ImageEditor() {
    const container = document.createElement('div');
    container.className = "two-column";
    const imageTitle = document.createElement('h2');
    imageTitle.className = "span-2";
    imageTitle.innerText = "Hintergrundbild";
    container.appendChild(imageTitle);

    const images = stateManager.getState("images");
    const currentImage = stateManager.getState("config.bgImage");

    const selectLabel = document.createElement('label');
    selectLabel.htmlFor = "image-select";
    selectLabel.innerText = "Bild";
    container.appendChild(selectLabel);

    const imageSelect = document.createElement('select');
    imageSelect.id = "image-select";
    imageSelect.size = 1;
    const noImageOption = document.createElement('option');
    noImageOption.value = "undefined";
    noImageOption.innerText = "Kein Bild";
    noImageOption.selected = !currentImage;
    imageSelect.appendChild(noImageOption);
    images.forEach((image, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.innerText = image;
        option.selected = image === currentImage;
        imageSelect.appendChild(option);
    });
    container.appendChild(imageSelect);

    imageSelect.addEventListener('change', (event) => {
        if (event.target.value === "undefined") {
            stateManager.updateState("config.bgImage", undefined);
        } else {
            stateManager.updateState("config.bgImage", images[event.target.value]);
        }
    });

    generateInput("Breite", "image-width", stateManager.getState("config.bgImageGridSquares"), (e) => { stateManager.updateState("config.bgImageGridSquares", Math.max(1, parseInt(e.target.value))) }, container, 'number');
    generateInput("X-Offset", "image-x", stateManager.getState("config.bgImageX"), (e) => { stateManager.updateState("config.bgImageX", parseInt(e.target.value)) }, container, 'number');
    generateInput("Y-Offset", "image-y", stateManager.getState("config.bgImageY"), (e) => { stateManager.updateState("config.bgImageY", parseInt(e.target.value)) }, container, 'number');

    return container;
}

function TimelineSettingsEditor() {
    const container = document.createElement('div');

    container.className = "two-column";
    const settingsTitle = document.createElement('h2');
    settingsTitle.className = "span-2";
    settingsTitle.innerText = "Timeline-Einstellungen";
    container.appendChild(settingsTitle);
    generateInput("Aktionen pro Block", "actionsPerBlock", stateManager.getState("config.actionBlockSize"), (e) => { stateManager.updateState("config.actionBlockSize", parseInt(e.target.value)) }, container, "number");
    generateInput("Pause zwischen Aktionen (ms)", "actionDelay", stateManager.getState("config.actionDelay"), (e) => { stateManager.updateState("config.actionDelay", parseInt(e.target.value)) }, container, "number");

    return container;
}

function AdminPanel() {
    const container = document.createElement('div');
    container.className = "admin-panel";
    container.appendChild(WeaponEditor());
    container.appendChild(ConditionEditor());
    container.appendChild(RollPanel());
    container.appendChild(PartyEditor());
    container.appendChild(ImageEditor());
    container.appendChild(TimelineSettingsEditor());
    return container;
}

module.exports = AdminPanel;