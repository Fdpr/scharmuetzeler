const stateManager = require('@electron/remote').getGlobal('stateManager');

const Troop = require('../../components/troop');
const Leader = require('../../components/leader');
const Token = require('../../components/token');

const { getConditionName, getAllConditionKeys } = require('../../components/conditions');

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
    input.value = value;
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.innerText = label;
    parent.appendChild(labelElement);
    parent.appendChild(input);
    return input;

}

function generateTokenPanel(token) {
    const tokenInfo = document.createElement('div');
    tokenInfo.className = 'two-column';
    const tokenTitle = document.createElement('h2');
    tokenTitle.innerText = 'Token';
    tokenTitle.className = 'span-2';
    tokenInfo.appendChild(tokenTitle);

    generateInput('radius', 'token-radius', token.radius, e => token.radius = parseInt(e.target.value), tokenInfo);
    generateInput('x', 'token-x', token.x, e => token.x = parseInt(e.target.value), tokenInfo);
    generateInput('y', 'token-y', token.y, e => token.y = parseInt(e.target.value), tokenInfo);
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

function TroopEditor(troop) {
    const editMode = troop !== undefined;
    let token;
    if (!troop) {
        troop = new Troop("Truppe", "Partei", "Truppe", 3, 50, false, false, 1, 2, 0, 150, 3, 12, 12, 12, 10, 13, 12, 1, 1, [], [])
        token = new Token("Truppe", "Truppe", "troop", 50, 0, 0, undefined, "<name>");
    } else {
        troop = Troop.copyFrom(troop);
        token = Token.copyFrom(stateManager.getToken(troop.name));
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
    generateInput('Partei', 'troop-party', troop.party, e => troop.party = e.target.value, staticInfo);
    generateInput('Anzahl', 'troop-anzahl', troop.anzahl, e => troop.anzahl = e.target.value, staticInfo, "number");
    generateInput('Großer Gegner', 'troop-big', troop.big, e => troop.big = e.target.checked, staticInfo, "checkbox");
    generateInput('Schild', 'troop-shield', troop.shield, e => troop.shield = e.target.checked, staticInfo, "checkbox");
    generateInput('EK', 'troop-EK', troop.EK, e => troop.EK = e.target.value, staticInfo, "number");
    generateInput('RTM', 'troop-RTM', troop.RTM, e => troop.RTM = e.target.value, staticInfo, "number");
    generateInput('GSBasis', 'troop-GSBasis', troop.GSBasis, e => troop.GSBasis = e.target.value, staticInfo, "number");
    generateInput('GSRitt', 'troop-GSRitt', troop.GSRitt, e => troop.GSRitt = e.target.value, staticInfo, "number");
    generateInput('MaxLP', 'troop-MaxLP', troop.MaxLP, e => troop.MaxLP = e.target.value, staticInfo, "number");
    generateInput('RSBasis', 'troop-RSBasis', troop.RSBasis, e => troop.RSBasis = e.target.value, staticInfo, "number");
    generateInput('ATBasis', 'troop-ATBasis', troop.ATBasis, e => troop.ATBasis = e.target.value, staticInfo, "number");
    generateInput('PABasis', 'troop-PABasis', troop.PABasis, e => troop.PABasis = e.target.value, staticInfo, "number");
    generateInput('FKBasis', 'troop-FKBasis', troop.FKBasis, e => troop.FKBasis = e.target.value, staticInfo, "number");
    generateInput('MOBasis', 'troop-MOBasis', troop.MOBasis, e => troop.MOBasis = e.target.value, staticInfo, "number");
    generateInput('AUBasis', 'troop-AUBasis', troop.AUBasis, e => troop.AUBasis = e.target.value, staticInfo, "number");
    generateInput('INIBasis', 'troop-INIBasis', troop.INIBasis, e => troop.INIBasis = e.target.value, staticInfo, "number");
    generateInput('Anzahl Aktionen', 'troop-actionCount', troop.actionCount, e => troop.actionCount = e.target.value, staticInfo, "number");
    generateInput('Anzahl Manöver', 'troop-maneuverCount', troop.maneuverCount, e => troop.maneuverCount = e.target.value, staticInfo, "number");
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
    generateInput('LP', 'troop-LP', troop.LP, e => troop.LP = e.target.value, dynamicInfo, "number");
    generateInput('MO', 'troop-MO', troop.MO, e => troop.MO = e.target.value, dynamicInfo, "number");
    generateInput('MO Immunitäten', 'troop-MOimmun', troop.MOimmun, e => troop.MOimmun = e.target.value, dynamicInfo, "number");
    generateInput('Erschöpfungspunkte', 'troop-ErsP', troop.ErsP, e => troop.ErsP = e.target.value, dynamicInfo, "number");
    generateInput('Regenerationspunkte', 'troop-RegP', troop.RegP, e => troop.RegP = e.target.value, dynamicInfo, "number");
    generateInput('Initiative', 'troop-Ini', troop.Ini, e => troop.Ini = e.target.value, dynamicInfo, "number");
    generateInput('Im Nahkampf', 'troop-isMelee', troop.isMelee, e => troop.isMelee = e.target.checked, dynamicInfo, "checkbox");
    generateInput('Runden Nahkampf', 'troop-meleeCounter', troop.meleeCounter, e => troop.meleeCounter = e.target.value, dynamicInfo, "number");
    generateInput('Nahkampf Ziel', 'troop-meleeTarget', troop.meleeTarget, e => troop.meleeTarget = e.target.value, dynamicInfo);
    generateInput('Anzahl Paraden', 'troop-parryCounter', troop.parryCounter, e => troop.parryCounter = e.target.value, dynamicInfo, "number");
    generateInput('Im Fernkampf', 'troop-isRange', troop.isRange, e => troop.isRange = e.target.checked, dynamicInfo, "checkbox");
    generateInput('Runden Nachladen', 'troop-nachladen', troop.nachladen, e => troop.nachladen = e.target.value, dynamicInfo, "number");
    generateInput('Fernkampf Ziel', 'troop-rangeTarget', troop.rangeTarget, e => troop.rangeTarget = e.target.value, dynamicInfo);
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
    troop.weapons.forEach((weapon, index) => {
        const option = document.createElement('option');
        if (index === troop.weapon) {
            option.selected = true;
        }
        option.innerText = weapon.reach <= 1 ?
            `${weapon.name}, ${weapon.TPString()} TP, AT/PA: ${weapon.ATMod}/${weapon.PAMod}`
            : `${weapon.name}, ${weapon.TPString()} TP, FK: ${weapon.FKMod}, Reichweite: ${weapon.reach}, Nachladen: ${weapon.nachladen} Runden`;
        weaponSelect.appendChild(option);
    });

    weaponSelect.addEventListener('change', e => {
        troop.weapon = e.target.selectedIndex;
    });

    weaponsInfo.appendChild(weaponSelect);

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
            `${weapon.name}, ${weapon.TPString()} TP, AT/PA: ${weapon.ATMod}/${weapon.PAMod}`
            : `${weapon.name}, ${weapon.TPString()} TP, FK: ${weapon.FKMod}, Reichweite: ${weapon.reach}, Nachladen: ${weapon.nachladen} Runden`;
        newWeaponSelect.appendChild(option);
    });
    weaponsInfo.appendChild(newWeaponSelect);
    const addWeaponButton = document.createElement('button');
    addWeaponButton.innerText = 'Hinzufügen';
    addWeaponButton.addEventListener('click', () => {
        const weapon = globalWeapons[newWeaponSelect.selectedIndex];
        troop.weapons.push(weapon);
        const option = document.createElement('option');
        option.innerText = weapon.reach <= 1 ?
            `${weapon.name}, ${weapon.TPString()} TP, AT/PA: ${weapon.ATMod}/${weapon.PAMod}`
            : `${weapon.name}, ${weapon.TPString()} TP, FK: ${weapon.FKMod}, Reichweite: ${weapon.reach}, Nachladen: ${weapon.nachladen} Runden`;
        weaponSelect.appendChild(option);
        weaponSelect.size++;
    });

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
    generateInput('EK', 'troop-mod-EK', troop.mods.EK, e => troop.mods.EK = e.target.value, modsInfo, "number");
    generateInput('AT', 'troop-mod-AT', troop.mods.AT, e => troop.mods.AT = e.target.value, modsInfo, "number");
    generateInput('PA', 'troop-mod-PA', troop.mods.PA, e => troop.mods.PA = e.target.value, modsInfo, "number");
    generateInput('FK', 'troop-mod-FK', troop.mods.FK, e => troop.mods.FK = e.target.value, modsInfo, "number");
    generateInput('TP', 'troop-mod-TP', troop.mods.TP, e => troop.mods.TP = e.target.value, modsInfo, "number");
    generateInput('MO', 'troop-mod-MO', troop.mods.MO, e => troop.mods.MO = e.target.value, modsInfo, "number");
    generateInput('RS', 'troop-mod-RS', troop.mods.RS, e => troop.mods.RS = e.target.value, modsInfo, "number");
    generateInput('GS', 'troop-mod-GS', troop.mods.GS, e => troop.mods.GS = e.target.value, modsInfo, "number");
    generateInput('AU', 'troop-mod-AU', troop.mods.AU, e => troop.mods.AU = e.target.value, modsInfo, "number");

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
    conditionSelect.size = troop.conditions.length > 1 ? troop.conditions.length : 2;
    troop.conditions.forEach(condition => {
        const option = document.createElement('option');
        option.innerText = condition.duration > -1 ?
            `"${condition.key}": ${condition.name} (${condition.duration} Runden)`
            : `"${condition.key}": ${condition.name} (unbegrenzt)`;
        conditionSelect.appendChild(option);
    });
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
        conditionSelect.removeChild(conditionSelect.children[index]);
        if (conditionSelect.size > 2) conditionSelect.size--;
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
        if (troop.addCondition(key, name, duration)) {
            const option = document.createElement('option');
            option.innerText = duration >= 0 ?
                `"${key}": ${name} (${duration} Runden)`
                : `"${key}": ${name} (unbegrenzt)`;
            conditionSelect.appendChild(option);
            conditionSelect.size++;
        }
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
    immunitySelect.size = troop.immunities.length > 1 ? troop.immunities.length : 2;
    troop.immunities.forEach(immunity => {
        const option = document.createElement('option');
        option.innerText = immunity;
        immunitySelect.appendChild(option);
    });

    immunityInfo.appendChild(immunitySelect);

    const removeImmunityLabel = document.createElement('label');
    removeImmunityLabel.htmlFor = 'troop-immunities';

    const removeImmunityButton = document.createElement('button');
    removeImmunityButton.innerText = 'entfernen';
    removeImmunityButton.addEventListener('click', () => {
        const index = immunitySelect.selectedIndex;
        if (index === -1) return;
        const immunity = troop.immunities[index];
        troop.removeImmunity(immunity);
        immunitySelect.removeChild(immunitySelect.children[index]);
        if (immunitySelect.size > 2) immunitySelect.size--;
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
        if (troop.addImmunity(key, name, duration)) {
            const option = document.createElement('option');
            option.innerText = duration >= 0 ?
                `"${key}": ${name} (${duration} Runden)`
                : `"${key}": ${name} (unbegrenzt)`;
            immunitySelect.appendChild(option);
            immunitySelect.size++;
        }
    });

    immunityInfo.appendChild(addImmunityButton);

    container.appendChild(immunityInfo);

    const tokenInfo = generateTokenPanel(token);
    container.appendChild(tokenInfo);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'two-column';
    const buttonTitle = document.createElement('h2');
    buttonTitle.innerText = 'Aktionen';
    buttonTitle.className = 'span-2';
    buttonContainer.appendChild(buttonTitle);
    const saveButton = document.createElement('button');
    saveButton.innerText = 'Speichern';
    saveButton.addEventListener('click', () => {
        if (editMode) {
            stateManager.addTroop(new Troop(
                troop.name, troop.party, troop.ref, troop.EK, troop.anzahl, troop.big, troop.shield, troop.RTM, troop.GSBasis, troop.GSRitt, troop.MaxLP, troop.RSBasis, troop.ATBasis, troop.PABasis, troop.FKBasis, troop.MOBasis, troop.AUBasis, troop.INIBasis, troop.actionCount, troop.maneuverCount, troop.weapons, troop.properties
            ).toJSON(), token.toJSON());
        } else {
            stateManager.addTroop(troop.toJSON(), token.toJSON());
        }
    });
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Löschen';
    deleteButton.addEventListener('click', () => stateManager.deleteTroop(troop.name));

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(deleteButton);

    container.appendChild(buttonContainer);

    outerBox.appendChild(container);
    return outerBox;
}

function LeaderEditor(leader) {
    const editMode = leader !== undefined;
    let token;
    if (!leader) {
        leader = new Leader("Anführer", "Partei", "Anführer", 0, 0, 0, 0, 0, 0, 0, 0, 13, 4, 1, 5, 13, 13, 13)
        token = new Token("Anführer", "Anführer", "leader", 30, 0, 0, undefined, "<name>");
    } else {
        leader = Leader.copyFrom(leader);
        token = Token.copyFrom(stateManager.getToken(leader.name));
    }

    const container = document.createElement('div');
    container.className = 'troop-editor-container';
    const staticTitle = document.createElement('h2');
    staticTitle.innerText = 'Feste Werte';
    staticTitle.className = 'span-2';
    const staticInfo = document.createElement('div');
    staticInfo.appendChild(staticTitle);
    staticInfo.className = 'two-column';
    container.appendChild(staticInfo);
    generateInput('Name', 'leader-name', leader.name, e => leader.name = leader.ref = leader.name = leader.ref = e.target.value, staticInfo);
    generateInput('Partei', 'leader-party', leader.party, e => leader.party = e.target.value, staticInfo);
    generateInput('ATBonus', 'leader-ATBonus', leader.ATBonus, e => leader.ATBonus = e.target.value, staticInfo, "number");
    generateInput('PABonus', 'leader-PABonus', leader.PABonus, e => leader.PABonus = e.target.value, staticInfo, "number");
    generateInput('FKBonus', 'leader-FKBonus', leader.FKBonus, e => leader.FKBonus = e.target.value, staticInfo, "number");
    generateInput('TPBonus', 'leader-TPBonus', leader.TPBonus, e => leader.TPBonus = e.target.value, staticInfo, "number");
    generateInput('MOBonus', 'leader-MOBonus', leader.MOBonus, e => leader.MOBonus = e.target.value, staticInfo, "number");
    generateInput('GSBonus', 'leader-GSBonus', leader.GSBonus, e => leader.GSBonus = e.target.value, staticInfo, "number");
    generateInput('AUBonus', 'leader-AUBonus', leader.AUBonus, e => leader.AUBonus = e.target.value, staticInfo, "number");
    generateInput('INIBonus', 'leader-INIBonus', leader.INIBonus, e => leader.INIBonus = e.target.value, staticInfo, "number");
    generateInput('INIBasis', 'leader-INIBasis', leader.INIBasis, e => leader.INIBasis = e.target.value, staticInfo, "number");
    generateInput('GS', 'leader-GS', leader.GS, e => leader.GS = e.target.value, staticInfo, "number");
    generateInput('Kommandoanzahl', 'leader-Kanz', leader.Kanz, e => leader.Kanz = e.target.value, staticInfo, "number");
    generateInput('Kommandoführung', 'leader-Kommando', leader.Kommando, e => leader.Kommando = e.target.value, staticInfo, "number");
    generateInput('IN', 'leader-IN', leader.IN, e => leader.IN = e.target.value, staticInfo, "number");
    generateInput('CH', 'leader-CH', leader.CH, e => leader.CH = e.target.value, staticInfo, "number");
    generateInput('KO', 'leader-KO', leader.KO, e => leader.KO = e.target.value, staticInfo, "number");
    generateInput('Properties', 'leader-properties', leader.properties.join("\n"), e => leader.properties = e.target.value.split("\n"), staticInfo, "textarea");

    const dynamicTitle = document.createElement('h2');
    dynamicTitle.innerText = 'Dynamische Werte';
    dynamicTitle.className = 'span-2';
    const dynamicInfo = document.createElement('div');
    dynamicInfo.appendChild(dynamicTitle);
    dynamicInfo.className = 'two-column';
    container.appendChild(dynamicInfo);
    generateInput('Initiative', 'leader-Ini', leader.Ini, e => leader.Ini = e.target.value, dynamicInfo, "number");

    const tokenInfo = generateTokenPanel(token);
    container.appendChild(tokenInfo);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'two-column';
    const buttonTitle = document.createElement('h2');
    buttonTitle.innerText = 'Aktionen';
    buttonTitle.className = 'span-2';
    buttonContainer.appendChild(buttonTitle);
    const saveButton = document.createElement('button');
    saveButton.innerText = 'Speichern';
    saveButton.addEventListener('click', () => stateManager.addLeader(leader.toJSON(), token.toJSON()));
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Löschen';
    deleteButton.addEventListener('click', () => stateManager.deleteLeader(leader.name));

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(deleteButton);

    container.appendChild(buttonContainer);

    return container;
}

module.exports = { TroopEditor, LeaderEditor, generateInput };