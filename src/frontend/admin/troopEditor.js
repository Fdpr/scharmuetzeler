/**
 * Displays a form to edit a troop or leader.
 */
const stateManager = require('@electron/remote').getGlobal('stateManager');
const NotificationManager = require('@electron/remote').getGlobal('notificationManager');
const isDev = require('@electron/remote').getGlobal('isDev');

const Troop = require('../../components/troop');
const Leader = require('../../components/leader');
const Token = require('../../components/token');

const { getConditionName, getAllConditionKeys } = require('../../components/conditions');

// Helper function to generate an input field with a label and a change listener
function generateInput(label, id, value, onChange, parent, type = 'text') {

    let input;
    if (type === "textarea") {
        input = document.createElement('textarea');
        input.addEventListener('input', onChange);
    } else {
        input = document.createElement('input');
        input.type = type;
        if (type === "number") {
            input.step = 1;
        }
        input.name = id;
        input.addEventListener('change', onChange);
    }
    input.id = id;
    if (type !== "checkbox") {
        input.value = value;
    } else {
        input.checked = value;
    }
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.innerText = label;
    parent.appendChild(labelElement);
    parent.appendChild(input);
    return input;

}

// Helper function to generate the token panel for both troops and leaders
function generateTokenPanel(token) {
    const tokenInfo = document.createElement('div');
    tokenInfo.className = 'two-column';
    const tokenTitle = document.createElement('h2');
    tokenTitle.innerText = 'Token';
    tokenTitle.className = 'span-2';
    tokenInfo.appendChild(tokenTitle);

    generateInput('radius', 'token-radius', token.radius, e => token.radius = parseInt(e.target.value), tokenInfo, "number");
    generateInput('x', 'token-x', token.x, e => token.x = parseInt(e.target.value), tokenInfo, "number");
    generateInput('y', 'token-y', token.y, e => token.y = parseInt(e.target.value), tokenInfo, "number");
    generateInput('label', 'token-label', token.label, e => token.label = e.target.value, tokenInfo);

    const imageLabel = document.createElement('label');
    imageLabel.htmlFor = 'token-image';
    imageLabel.innerText = 'Bild';
    tokenInfo.appendChild(imageLabel);

    const imageSelect = document.createElement('select');
    imageSelect.id = 'token-image';
    imageSelect.name = 'token-image';

    const noImage = document.createElement('option');
    noImage.innerText = 'Kein Bild';
    imageSelect.appendChild(noImage);

    const globalImages = stateManager.getState("images");
    globalImages.forEach(image => {
        const option = document.createElement('option');
        if (image === token.image) {
            option.selected = true;
        }
        option.innerText = image;
        imageSelect.appendChild(option);
    });

    imageSelect.addEventListener('change', e => {
        if (e.target.value === 'Kein Bild') {
            token.image = undefined;
            return;
        }
        token.image = e.target.value;
    });

    tokenInfo.appendChild(imageSelect);
    return tokenInfo;
}

function generateWeaponOptions(troop, select) {
    select.innerHTML = '';
    select.size = troop.weapons.length > 1 ? troop.weapons.length : 2;
    troop.weapons.forEach((weapon, index) => {
        const option = document.createElement('option');
        option.selected = index === troop.weapon;
        option.value = index;
        option.innerText = weapon.reach <= 1 ?
            `${weapon.name} ${weapon.shield ? "(Schild)" : ""}, ${weapon.TPString()} TP, AT/PA: ${weapon.ATMod}/${weapon.PAMod}`
            : `${weapon.name}, ${weapon.TPString()} TP, FK: ${weapon.FKMod}, Reichweite: ${weapon.reach}, Nachladen: ${weapon.nachladen} Runden`;
        select.appendChild(option);
    });
}

function generateConditionOptions(troop, select) {
    select.innerHTML = '';
    select.size = troop.conditions.length > 1 ? troop.conditions.length : 2;
    troop.conditions.forEach((condition, index) => {
        const option = document.createElement('option');
        option.selected = index === troop.condition;
        option.value = index;
        option.innerText = condition.counter > -1 ?
            `"${condition.key}": ${condition.name} (${condition.counter} Runden)`
            : `"${condition.key}": ${condition.name} (unbegrenzt)`;
        select.appendChild(option);
    });
}

function generateImmunityOptions(troop, select) {
    select.innerHTML = '';
    select.size = troop.immunities.length > 1 ? troop.immunities.length : 2;
    troop.immunities.forEach((immunity, index) => {
        const option = document.createElement('option');
        option.selected = index === troop.immunity;
        option.value = index;
        option.innerText = immunity.counter > -1 ?
            `"${immunity.key}": ${immunity.name} (${immunity.counter} Runden)`
            : `"${immunity.key}": ${immunity.name} (unbegrenzt)`;
        select.appendChild(option);
    });
}

/**
 * Displays a form to edit a troop. If a troop is passed, it will be edited, otherwise a new troop will be created.
 */
function TroopEditor(troop) {
    const editMode = troop !== undefined;
    let token;
    if (!troop) {
        troop = new Troop("Truppe", stateManager.getState("config.parties")[0], "Truppe", 3, 50, false, 1, 2, 0, 150, 3, 12, 12, 12, 10, 13, 12, 1, 1, [], [], [])
        token = new Token("Truppe", "Truppe", "troop", 40, 0, 0, undefined, "<name>");
    } else {
        troop = stateManager.getTroop(troop).copy();
        token = stateManager.getToken(troop.name).copy();
    }

    const outerBox = document.createElement('div');

    const fullBox = document.createElement('div');
    fullBox.className = 'two-column';
    fullBox.style.marginBottom = '10px';
    const fullCheckbox = generateInput("Voller Editor", "full-editor", false, e => {
        if (e.target.checked) {
            document.getElementById('dynamic-info').style.display = '';
            document.getElementById('mods-info').style.display = '';
            document.getElementById('condition-info').style.display = '';
            document.getElementById('immunity-info').style.display = '';
        } else {
            document.getElementById('dynamic-info').style.display = 'none';
            document.getElementById('mods-info').style.display = 'none';
            document.getElementById('condition-info').style.display = 'none';
            document.getElementById('immunity-info').style.display = 'none';
        }
    }, fullBox, "checkbox");
    fullCheckbox.checked = editMode;

    outerBox.appendChild(fullBox);

    const container = document.createElement('div');
    container.className = 'troop-editor-container';

    const staticInfo = document.createElement('div');
    const staticTitle = document.createElement('h2');
    staticTitle.innerText = 'Feste Werte';
    staticTitle.className = 'span-2';
    staticInfo.appendChild(staticTitle);
    staticInfo.className = 'two-column';
    container.appendChild(staticInfo);
    generateInput('Name', 'troop-name', troop.name, e => troop.name = troop.ref = token.name = token.ref = e.target.value, staticInfo);
    const partyLabel = document.createElement('label');
    partyLabel.htmlFor = 'troop-party';
    partyLabel.innerText = 'Partei';
    staticInfo.appendChild(partyLabel);
    const partySelect = document.createElement('select');
    partySelect.id = 'troop-party';
    partySelect.name = 'troop-party';
    partySelect.size = 1;
    const parties = stateManager.getState("config.parties");
    parties.forEach(party => {
        const option = document.createElement('option');
        option.selected = party === troop.party;
        option.innerText = party;
        partySelect.appendChild(option);
    });
    partySelect.addEventListener('change', e => troop.party = e.target.value);
    staticInfo.appendChild(partySelect);
    generateInput('Anzahl', 'troop-anzahl', troop.anzahl, e => troop.anzahl = parseInt(e.target.value), staticInfo, "number");
    generateInput('Großer Gegner', 'troop-big', troop.big, e => troop.big = e.target.checked, staticInfo, "checkbox");
    generateInput('EK', 'troop-EK', troop.EK, e => troop.EK = parseInt(e.target.value), staticInfo, "number");
    generateInput('RTM', 'troop-RTM', troop.RTM, e => troop.RTM = parseInt(e.target.value), staticInfo, "number");
    generateInput('GSBasis', 'troop-GSBasis', troop.GSBasis, e => troop.GSBasis = parseInt(e.target.value), staticInfo, "number");
    generateInput('GSRitt', 'troop-GSRitt', troop.GSRitt, e => troop.GSRitt = parseInt(e.target.value), staticInfo, "number");
    generateInput('MaxLP', 'troop-MaxLP', troop.MaxLP, e => troop.MaxLP = parseInt(e.target.value), staticInfo, "number");
    generateInput('RSBasis', 'troop-RSBasis', troop.RSBasis, e => troop.RSBasis = parseInt(e.target.value), staticInfo, "number");
    generateInput('ATBasis', 'troop-ATBasis', troop.ATBasis, e => troop.ATBasis = parseInt(e.target.value), staticInfo, "number");
    generateInput('PABasis', 'troop-PABasis', troop.PABasis, e => troop.PABasis = parseInt(e.target.value), staticInfo, "number");
    generateInput('FKBasis', 'troop-FKBasis', troop.FKBasis, e => troop.FKBasis = parseInt(e.target.value), staticInfo, "number");
    generateInput('MOBasis', 'troop-MOBasis', troop.MOBasis, e => troop.MOBasis = parseInt(e.target.value), staticInfo, "number");
    generateInput('AUBasis', 'troop-AUBasis', troop.AUBasis, e => troop.AUBasis = parseInt(e.target.value), staticInfo, "number");
    generateInput('INIBasis', 'troop-INIBasis', troop.INIBasis, e => troop.INIBasis = parseInt(e.target.value), staticInfo, "number");
    generateInput('Anzahl Aktionen', 'troop-actionCount', troop.actionCount, e => troop.actionCount = parseInt(e.target.value), staticInfo, "number");
    generateInput('Anzahl Manöver', 'troop-maneuverCount', troop.maneuverCount, e => troop.maneuverCount = parseInt(e.target.value), staticInfo, "number");
    generateInput('Properties', 'troop-properties', troop.properties.join("\n"), e => troop.properties = e.target.value.split("\n"), staticInfo, "textarea");

    const dynamicTitle = document.createElement('h2');
    dynamicTitle.innerText = 'Dynamische Werte';
    dynamicTitle.className = 'span-2';
    const dynamicInfo = document.createElement('div');
    dynamicInfo.id = 'dynamic-info';
    dynamicInfo.style.display = editMode ? '' : 'none';
    dynamicInfo.appendChild(dynamicTitle);
    dynamicInfo.className = 'two-column';
    container.appendChild(dynamicInfo);
    generateInput('LP', 'troop-LP', troop.LP, e => troop.LP = parseInt(parseInt(e.target.value)), dynamicInfo, "number");
    generateInput('MO', 'troop-MO', troop.MO, e => troop.MO = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('MO Immunitäten', 'troop-MOimmun', troop.MOimmun, e => troop.MOimmun = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('Erschöpfungspunkte', 'troop-ErsP', troop.ErsP, e => troop.ErsP = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('Regenerationspunkte', 'troop-RegP', troop.RegP, e => troop.RegP = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('Initiative', 'troop-Ini', troop.Ini, e => troop.Ini = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('Im Nahkampf', 'troop-isMelee', troop.isMelee, e => troop.isMelee = e.target.checked, dynamicInfo, "checkbox");
    generateInput('Runden Nahkampf', 'troop-meleeCounter', troop.meleeCounter, e => troop.meleeCounter = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('Nahkampf Ziel', 'troop-meleeTarget', troop.meleeTarget, e => troop.meleeTarget = parseInt(e.target.value), dynamicInfo);
    generateInput('Anzahl Paraden', 'troop-parryCounter', troop.parryCounter, e => troop.parryCounter = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('Im Fernkampf', 'troop-isRange', troop.isRange, e => troop.isRange = e.target.checked, dynamicInfo, "checkbox");
    generateInput('Runden Nachladen', 'troop-nachladen', troop.nachladen, e => troop.nachladen = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('Fernkampf Ziel', 'troop-rangeTarget', troop.rangeTarget, e => troop.rangeTarget = e.target.value, dynamicInfo);
    generateInput('Macht Schnellschuss', 'troop-isRapidFire', troop.isRapidFire, e => troop.isRapidFire = parseInt(e.target.value), dynamicInfo, "checkbox");
    generateInput('Runden Schnellschuss', 'troop-rapidFireCounter', troop.rapidFireCounter, e => troop.rapidFireCounter = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('In Bewegung', 'troop-isMove', troop.isMove, e => troop.isMove = e.target.checked, dynamicInfo, "checkbox");
    generateInput('Am Plänkeln', 'troop-isPlaenkeln', troop.isPlaenkeln, e => troop.isPlaenkeln = e.target.checked, dynamicInfo, "checkbox");
    generateInput('Im Schildwall', 'troop-isSchildwall', troop.isSchildwall, e => troop.isSchildwall = e.target.checked, dynamicInfo, "checkbox");
    generateInput('Im Pikenwall', 'troop-isPikenwall', troop.isPikenwall, e => troop.isPikenwall = e.target.checked, dynamicInfo, "checkbox");
    generateInput('Anführer', 'troop-leader', troop.leader, e => troop.leader = e.target.value, dynamicInfo);

    const weaponsInfo = document.createElement('div');
    weaponsInfo.className = 'two-column';
    const weaponsTitle = document.createElement('h2');
    weaponsTitle.innerText = 'Waffen';
    weaponsTitle.className = 'span-2';
    weaponsInfo.appendChild(weaponsTitle);
    const currentWeapon = document.createElement("label");
    currentWeapon.htmlFor = 'troop-weapons';
    currentWeapon.innerText = "Aktuelle Waffe"
    weaponsInfo.appendChild(currentWeapon);

    const weaponSelect = document.createElement('select');
    weaponSelect.id = 'troop-weapons';
    weaponSelect.name = 'troop-weapons';
    weaponSelect.size = troop.weapons.length > 1 ? troop.weapons.length : 2;
    generateWeaponOptions(troop, weaponSelect);
    weaponSelect.addEventListener('change', e => {
        troop.weapon = e.target.selectedIndex;
    });

    weaponsInfo.appendChild(weaponSelect);

    weaponsInfo.appendChild(document.createElement('br'));

    const removeWeaponButton = document.createElement('button');
    removeWeaponButton.innerText = 'Diese Waffe entfernen';
    removeWeaponButton.addEventListener('click', () => {
        const index = weaponSelect.selectedIndex;
        if (index === -1 || troop.weapons.length < 2) return;
        troop.removeWeapon(troop.weapons[index].name);
        generateWeaponOptions(troop, weaponSelect);
    });
    weaponsInfo.appendChild(removeWeaponButton);

    const newWeaponText = document.createElement('p');
    newWeaponText.className = 'span-2';
    newWeaponText.innerHTML = "<b>Neue Waffe</b>";
    weaponsInfo.appendChild(newWeaponText);


    const addWeaponText = document.createElement('label');
    addWeaponText.htmlFor = 'troop-new-weapons';
    addWeaponText.innerHTML = "Neue Waffe";
    weaponsInfo.appendChild(addWeaponText);

    const newWeaponSelect = document.createElement('select');
    newWeaponSelect.id = 'troop-new-weapons';
    const globalWeapons = stateManager.getState("weapons");
    globalWeapons.forEach(weapon => {
        const option = document.createElement('option');
        option.innerText = weapon.reach <= 1 ?
            `${weapon.name} ${weapon.shield ? "(Schild)" : ""}, ${weapon.TPString()} TP, AT/PA: ${weapon.ATMod}/${weapon.PAMod}`
            : `${weapon.name}, ${weapon.TPString()} TP, FK: ${weapon.FKMod}, Reichweite: ${weapon.reach}, Nachladen: ${weapon.nachladen} Runden`;
        newWeaponSelect.appendChild(option);
    });
    weaponsInfo.appendChild(newWeaponSelect);
    const weaponATMod = generateInput("AT-Mod", "troop-new-ATMod", 0, () => { }, weaponsInfo, "number");
    const weaponPAMod = generateInput("PA-Mod", "troop-new-PAMod", 0, () => { }, weaponsInfo, "number");
    const weaponFKMod = generateInput("FK-Mod", "troop-new-FKMod", 0, () => { }, weaponsInfo, "number");
    const weaponShield = generateInput("Schild", "troop-new-shield", false, () => { }, weaponsInfo, "checkbox");
    const addWeaponButton = document.createElement('button');
    addWeaponButton.innerText = 'Hinzufügen';
    addWeaponButton.addEventListener('click', () => {
        const weapon = globalWeapons[newWeaponSelect.selectedIndex].copy();
        if (parseInt(weaponATMod.value)) weapon.ATMod += parseInt(weaponATMod.value);
        if (parseInt(weaponPAMod.value)) weapon.PAMod += parseInt(weaponPAMod.value);
        if (parseInt(weaponFKMod.value)) weapon.FKMod += parseInt(weaponFKMod.value);
        weapon.shield = weaponShield.checked;
        troop.addWeapon(weapon);
        generateWeaponOptions(troop, weaponSelect);
    });

    const weaponSelectHandler = (event) => {
        const index = event.target.selectedIndex;
        if (index === -1) return;
        const weapon = globalWeapons[index];
        weaponATMod.value = weapon.ATMod;
        weaponPAMod.value = weapon.PAMod;
        weaponFKMod.value = weapon.FKMod;
        weaponShield.checked = weapon.shield;
    };
    weaponSelectHandler({ target: weaponSelect });

    newWeaponSelect.addEventListener('change', weaponSelectHandler);

    weaponsInfo.appendChild(addWeaponButton);

    container.appendChild(weaponsInfo);

    const modsInfo = document.createElement('div');
    modsInfo.id = 'mods-info';
    modsInfo.style.display = editMode ? '' : 'none';
    modsInfo.className = 'two-column';
    const modsTitle = document.createElement('h2');
    modsTitle.innerText = 'Modifikatoren';
    modsTitle.className = 'span-2';
    modsInfo.appendChild(modsTitle);
    generateInput('EK', 'troop-mod-EK', troop.mods.EK, e => troop.mods.EK = parseInt(e.target.value), modsInfo, "number");
    generateInput('AT', 'troop-mod-AT', troop.mods.AT, e => troop.mods.AT = parseInt(e.target.value), modsInfo, "number");
    generateInput('PA', 'troop-mod-PA', troop.mods.PA, e => troop.mods.PA = parseInt(e.target.value), modsInfo, "number");
    generateInput('FK', 'troop-mod-FK', troop.mods.FK, e => troop.mods.FK = parseInt(e.target.value), modsInfo, "number");
    generateInput('TP', 'troop-mod-TP', troop.mods.TP, e => troop.mods.TP = parseInt(e.target.value), modsInfo, "number");
    generateInput('MO', 'troop-mod-MO', troop.mods.MO, e => troop.mods.MO = parseInt(e.target.value), modsInfo, "number");
    generateInput('RS', 'troop-mod-RS', troop.mods.RS, e => troop.mods.RS = parseInt(e.target.value), modsInfo, "number");
    generateInput('GS', 'troop-mod-GS', troop.mods.GS, e => troop.mods.GS = parseInt(e.target.value), modsInfo, "number");
    generateInput('AU', 'troop-mod-AU', troop.mods.AU, e => troop.mods.AU = parseInt(e.target.value), modsInfo, "number");
    generateInput('Aktionen', 'troop-mod-actions', troop.mods.actionCount, e => troop.mods.actionCount = parseInt(e.target.value), modsInfo, "number");
    generateInput('Manöver', 'troop-mod-maneuvers', troop.mods.maneuverCount, e => troop.mods.maneuverCount = parseInt(e.target.value), modsInfo, "number");
    generateInput('Aktions-EK', 'troop-mod-EKAction', troop.mods.EKAction, e => troop.mods.EKAction = parseInt(e.target.value), modsInfo, "number");

    container.appendChild(modsInfo);

    const conditionInfo = document.createElement('div');
    conditionInfo.id = 'condition-info';
    conditionInfo.style.display = editMode ? '' : 'none';
    conditionInfo.className = 'two-column';
    const conditionTitle = document.createElement('h2');
    conditionTitle.innerText = 'Zustände';
    conditionTitle.className = 'span-2';
    conditionInfo.appendChild(conditionTitle);

    const conditionSelect = document.createElement('select');
    conditionSelect.id = 'troop-conditions';
    conditionSelect.name = 'troop-conditions';

    generateConditionOptions(troop, conditionSelect);

    conditionInfo.appendChild(conditionSelect);

    const removeConditionLabel = document.createElement('label');
    removeConditionLabel.htmlFor = 'troop-conditions';

    const removeConditionButton = document.createElement('button');
    removeConditionButton.innerText = 'entfernen';
    removeConditionButton.addEventListener('click', () => {
        const index = conditionSelect.selectedIndex;
        if (index === -1) return;
        const condition = troop.conditions[index];
        troop.removeCondition(condition.key);
        generateConditionOptions(troop, conditionSelect);
    });
    conditionInfo.appendChild(removeConditionLabel);
    removeConditionLabel.appendChild(removeConditionButton);

    const addConditionText = document.createElement('p');
    addConditionText.innerHTML = "<b>Neuer Zustand</b>";
    addConditionText.className = 'span-2';
    conditionInfo.appendChild(addConditionText);

    const allConditionKeys = getAllConditionKeys();

    const conditionKeyLabel = document.createElement('label');
    conditionKeyLabel.htmlFor = 'troop-new-condition-key';
    conditionKeyLabel.innerText = 'Key';
    conditionInfo.appendChild(conditionKeyLabel);

    const conditionKeySelect = document.createElement('select');
    conditionKeySelect.id = 'troop-new-condition-key';
    allConditionKeys.forEach(key => {
        const option = document.createElement('option');
        option.innerText = `${key} (${getConditionName(key)})`;
        option.value = key;
        conditionKeySelect.appendChild(option);
    });
    conditionInfo.appendChild(conditionKeySelect);
    generateInput('Name', 'troop-new-condition-name', '', () => { }, conditionInfo);
    generateInput('Dauer', 'troop-new-condition-duration', '', () => { }, conditionInfo, "number");

    const addConditionButton = document.createElement('button');
    addConditionButton.innerText = 'Hinzufügen';

    addConditionButton.addEventListener('click', () => {
        const key = document.getElementById('troop-new-condition-key').value;
        const name = document.getElementById('troop-new-condition-name').value || getConditionName(key);
        const duration = parseInt(document.getElementById('troop-new-condition-duration').value) || 1;
        if (!key || !getConditionName(key)) return;
        troop.addCondition(key, name, duration);

        generateConditionOptions(troop, conditionSelect);
    });
    conditionInfo.appendChild(addConditionButton);

    container.appendChild(conditionInfo);

    const immunityInfo = document.createElement('div');
    immunityInfo.id = 'immunity-info';
    immunityInfo.style.display = editMode ? '' : 'none';
    immunityInfo.className = 'two-column';
    const immunityTitle = document.createElement('h2');
    immunityTitle.innerText = 'Immunitäten';
    immunityTitle.className = 'span-2';
    immunityInfo.appendChild(immunityTitle);

    const immunitySelect = document.createElement('select');
    immunitySelect.id = 'troop-immunities';
    immunitySelect.name = 'troop-immunities';

    generateImmunityOptions(troop, immunitySelect);

    immunityInfo.appendChild(immunitySelect);

    const removeImmunityLabel = document.createElement('label');
    removeImmunityLabel.htmlFor = 'troop-immunities';

    const removeImmunityButton = document.createElement('button');
    removeImmunityButton.innerText = 'entfernen';
    removeImmunityButton.addEventListener('click', () => {
        const index = immunitySelect.selectedIndex;
        if (index === -1) return;
        const immunity = troop.immunities[index];
        troop.removeImmunity(immunity.key);

        generateImmunityOptions(troop, immunitySelect);
    });

    immunityInfo.appendChild(removeImmunityLabel);
    removeImmunityLabel.appendChild(removeImmunityButton);

    const addImmunityText = document.createElement('p');
    addImmunityText.innerHTML = "<b>Neue Immunität</b>";
    addImmunityText.className = 'span-2';
    immunityInfo.appendChild(addImmunityText);

    const immunityKeyLabel = document.createElement('label');
    immunityKeyLabel.htmlFor = 'troop-new-immunity-key';
    immunityKeyLabel.innerText = 'Key';
    immunityInfo.appendChild(immunityKeyLabel);

    const immunityKeySelect = document.createElement('select');
    immunityKeySelect.id = 'troop-new-immunity-key';
    allConditionKeys.forEach(key => {
        const option = document.createElement('option');
        option.innerText = `${key} (${getConditionName(key)})`;
        option.value = key;
        immunityKeySelect.appendChild(option);
    });
    immunityInfo.appendChild(immunityKeySelect);
    generateInput('Name', 'troop-new-immunity-name', '', () => { }, immunityInfo);
    generateInput('Dauer', 'troop-new-immunity-duration', '', () => { }, immunityInfo, "number");

    const addImmunityButton = document.createElement('button');
    addImmunityButton.innerText = 'Hinzufügen';

    addImmunityButton.addEventListener('click', () => {
        const key = document.getElementById('troop-new-immunity-key').value;
        const name = document.getElementById('troop-new-immunity-name').value || getConditionName(key);
        const duration = parseInt(document.getElementById('troop-new-immunity-duration').value) || 1;
        if (!key || !getConditionName(key)) return;
        troop.addImmunity(key, name, duration)

        generateImmunityOptions(troop, immunitySelect);
    });


    immunityInfo.appendChild(addImmunityButton);

    container.appendChild(immunityInfo);

    const restContainer = document.createElement('div');
    restContainer.className = 'one-column';

    const tokenInfo = generateTokenPanel(token);
    restContainer.appendChild(tokenInfo);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'two-column';
    const buttonTitle = document.createElement('h2');
    buttonTitle.innerText = 'Aktionen';
    buttonTitle.className = 'span-2';
    buttonContainer.appendChild(buttonTitle);
    const saveButton = document.createElement('button');
    saveButton.innerText = 'Speichern';
    saveButton.addEventListener('click', () => {
        const checkToken = stateManager.getToken(troop.name);
        if (checkToken && stateManager.getLeader(checkToken.ref)) {
            alert("Ein Anführer mit diesem Namen existiert bereits.");
            return;
        }
        stateManager.addTroop(troop.copy(!editMode).toJSON(), token.toJSON());
        if (isDev) window.close();

    });
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Löschen';
    deleteButton.addEventListener('click', () => {
        stateManager.deleteTroop(troop.name)
        if (isDev) window.close();
    });

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(deleteButton);

    restContainer.appendChild(buttonContainer);

    container.appendChild(restContainer);

    outerBox.appendChild(container);
    return outerBox;
}

function LeaderEditor(leader) {
    const editMode = leader !== undefined;
    let token;
    if (!leader) {
        leader = new Leader("Anführer", stateManager.getState("config.parties")[0], "Anführer", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 5, 0, 30, 13, 4, 1, 5, 13, 13, 13, [])
        token = new Token("Anführer", "Anführer", "leader", 20, 0, 0, undefined, "<name>");
    } else {
        leader = stateManager.getLeader(leader).copy();
        token = stateManager.getToken(leader.name).copy();
    }

    const outerBox = document.createElement('div');

    const fullBox = document.createElement('div');
    fullBox.className = 'two-column';
    fullBox.style.marginBottom = '10px';
    const fullCheckbox = generateInput("Voller Editor", "full-editor", false, e => {
        if (e.target.checked) {
            document.getElementById('dynamic-info').style.display = '';
        } else {
            document.getElementById('dynamic-info').style.display = 'none';
        }
    }, fullBox, "checkbox");
    fullCheckbox.checked = editMode;

    outerBox.appendChild(fullBox);

    const container = document.createElement('div');
    container.className = 'troop-editor-container';
    const staticTitle = document.createElement('h2');
    staticTitle.innerText = 'Feste Werte';
    staticTitle.className = 'span-2';
    const staticInfo = document.createElement('div');
    staticInfo.appendChild(staticTitle);
    staticInfo.className = 'two-column';
    container.appendChild(staticInfo);
    generateInput('Name', 'leader-name', leader.name, e => leader.name = leader.ref = token.name = token.ref = e.target.value, staticInfo);
    const partyLabel = document.createElement('label');
    partyLabel.htmlFor = 'leader-party';
    partyLabel.innerText = 'Partei';
    staticInfo.appendChild(partyLabel);
    const partySelect = document.createElement('select');
    partySelect.id = 'leader-party';
    partySelect.name = 'leader-party';
    partySelect.size = 1;
    const parties = stateManager.getState("config.parties");
    parties.forEach(party => {
        const option = document.createElement('option');
        option.selected = party === leader.party;
        option.innerText = party;
        partySelect.appendChild(option);
    });
    partySelect.addEventListener('change', e => leader.party = e.target.value);
    staticInfo.appendChild(partySelect);
    generateInput('AT-Bonus', 'leader-ATBonus', leader.ATBonus, e => leader.ATBonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('PA-Bonus', 'leader-PABonus', leader.PABonus, e => leader.PABonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('FK-Bonus', 'leader-FKBonus', leader.FKBonus, e => leader.FKBonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('TP-Bonus', 'leader-TPBonus', leader.TPBonus, e => leader.TPBonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('MO-Bonus', 'leader-MOBonus', leader.MOBonus, e => leader.MOBonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('GS-Bonus', 'leader-GSBonus', leader.GSBonus, e => leader.GSBonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('AU-Bonus', 'leader-AUBonus', leader.AUBonus, e => leader.AUBonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('INI-Bonus', 'leader-INIBonus', leader.INIBonus, e => leader.INIBonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('Aktions-Bonus', 'leader-actionCountBonus', leader.actionCountBonus, e => leader.actionCountBonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('Manöver-Bonus', 'leader-maneuverCountBonus', leader.maneuverCountBonus, e => leader.maneuverCountBonus = parseInt(e.target.value), staticInfo, "number");
    generateInput('AT', 'leader-AT', leader.AT, e => leader.AT = parseInt(e.target.value), staticInfo, "number");
    generateInput('TP', 'leader-TP', leader.TP, e => leader.TP = parseInt(e.target.value), staticInfo, "number");
    generateInput('RS', 'leader-RS', leader.RS, e => leader.RS = parseInt(e.target.value), staticInfo, "number");
    generateInput('MaxLP', 'leader-MaxLP', leader.MaxLP, e => leader.MaxLP = parseInt(e.target.value), staticInfo, "number");
    generateInput('INIBasis', 'leader-INIBasis', leader.INIBasis, e => leader.INIBasis = parseInt(e.target.value), staticInfo, "number");
    generateInput('GS', 'leader-GS', leader.GS, e => leader.GS = parseInt(e.target.value), staticInfo, "number");
    generateInput('Kommandoanzahl', 'leader-Kanz', leader.Kanz, e => leader.Kanz = parseInt(e.target.value), staticInfo, "number");
    generateInput('Kommandoführung', 'leader-Kommando', leader.Kommando, e => leader.Kommando = parseInt(e.target.value), staticInfo, "number");
    generateInput('IN', 'leader-IN', leader.IN, e => leader.IN = parseInt(e.target.value), staticInfo, "number");
    generateInput('CH', 'leader-CH', leader.CH, e => leader.CH = parseInt(e.target.value), staticInfo, "number");
    generateInput('KO', 'leader-KO', leader.KO, e => leader.KO = parseInt(e.target.value), staticInfo, "number");
    generateInput('Properties', 'leader-properties', leader.properties.join("\n"), e => leader.properties = e.target.value.split("\n"), staticInfo, "textarea");

    const restContainer = document.createElement('div');
    restContainer.className = 'one-column';
    const dynamicTitle = document.createElement('h2');
    dynamicTitle.innerText = 'Dynamische Werte';
    dynamicTitle.className = 'span-2';
    const dynamicInfo = document.createElement('div');
    dynamicInfo.id = 'dynamic-info';
    dynamicInfo.style.display = editMode ? '' : 'none';
    dynamicInfo.appendChild(dynamicTitle);
    dynamicInfo.className = 'two-column';
    restContainer.appendChild(dynamicInfo);
    generateInput('LP', 'leader-LP', leader.LP, e => leader.LP = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('Initiative', 'leader-Ini', leader.Ini, e => leader.Ini = parseInt(e.target.value), dynamicInfo, "number");
    generateInput('Aktion', 'leader-action', leader.action, e => leader.action = e.target.value, dynamicInfo);
    generateInput('Ziele', 'leader-targets', leader.targets.join("\n"), e => leader.targets = e.target.value.split("\n"), dynamicInfo, "textarea");
    const tokenInfo = generateTokenPanel(token);
    restContainer.appendChild(tokenInfo);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'two-column';
    const buttonTitle = document.createElement('h2');
    buttonTitle.innerText = 'Aktionen';
    buttonTitle.className = 'span-2';
    buttonContainer.appendChild(buttonTitle);
    const saveButton = document.createElement('button');
    saveButton.innerText = 'Speichern';
    saveButton.addEventListener('click', () => {
        const checkToken = stateManager.getToken(leader.name);
        if (checkToken && stateManager.getTroop(checkToken.ref)) {
            alert("Eine Truppe mit diesem Namen existiert bereits.");
            return;
        }
        stateManager.addLeader(leader.copy(!editMode).toJSON(), token.toJSON());
        if (isDev) window.close();

    });
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Löschen';
    deleteButton.addEventListener('click', () => {
        stateManager.deleteLeader(leader.name)
        if (isDev) window.close();
    });

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(deleteButton);

    restContainer.appendChild(buttonContainer);

    container.appendChild(restContainer);

    outerBox.appendChild(container);
    return outerBox;
}

module.exports = { TroopEditor, LeaderEditor, generateInput };