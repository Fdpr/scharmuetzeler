const stateManager = require('@electron/remote').getGlobal('stateManager');
const Weapon = require('../../components/weapon');

const { generateInput } = require("./troopEditor");

function buildWeaponOptions(weapons, select, selected = 0) {
    select.innerHTML = "";
    weapons.forEach((weapon, index) => {
        const option = document.createElement('option');
        if (index === selected) {
            option.selected = true;
        }
        option.value = index;
        option.innerText = weapon.reach <= 1 ?
            `${weapon.name}, ${weapon.TPString()} TP, AT/PA: ${weapon.ATMod}/${weapon.PAMod}`
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
        console.log(weaponSelect.value);
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
    const weaponReach = generateInput("Reichweite", "weapon-reach", 0, () => { }, container, 'number');
    const weaponNachladen = generateInput("Nachladen", "weapon-nachladen", 0, () => { }, container, 'number');

    weaponSelect.addEventListener('change', (event) => {
        weaponName.value = weapons[event.target.value].name;
        weaponTP.value = weapons[event.target.value].TPString();
        weaponAT.value = weapons[event.target.value].ATMod;
        weaponPA.value = weapons[event.target.value].PAMod;
        weaponFK.value = weapons[event.target.value].FKMod;
        weaponReach.value = weapons[event.target.value].reach;
        weaponNachladen.value = weapons[event.target.value].nachladen;
    });

    const addButton = document.createElement('button');
    addButton.innerText = "Hinzufügen";
    addButton.addEventListener('click', () => {
        stateManager.addWeapon(new Weapon(
            weaponName.value,
            parseInt(weaponAT.value),
            parseInt(weaponPA.value),
            parseInt(weaponFK.value),
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
    });

    const addButton = document.createElement('button');
    addButton.innerText = "Hinzufügen";
    addButton.addEventListener('click', () => {
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
                AU: parseInt(conditionAU.value)
            }
        });
        stateManager.updateState("conditions", conditions);
        buildConditionOptions(conditions, conditionSelect, conditions.length - 1);
    });

    container.appendChild(addButton);

    return container;
}

function AdminPanel() {
    const container = document.createElement('div');
    container.className = "admin-panel";
    container.appendChild(WeaponEditor());
    container.appendChild(ConditionEditor());
    return container;
}

module.exports = AdminPanel;