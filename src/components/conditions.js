const { getGlobal } = require('../util/process');
const { stringToComponents, calculateDamage } = require('../util/TPString');

const conditions = [
    {
        key: "d",
        name: "Deckung",
        mods: { EK: 0, AT: 0, PA: 4, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "k",
        name: "Kletternd",
        mods: { EK: 0, AT: -4, PA: -4, FK: -999, TP: -2, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "x",
        name: "Schock",
        mods: { EK: -1, AT: -3, PA: -3, FK: -3, TP: 0, MO: -2, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "u",
        name: "Unter Feuer",
        mods: { EK: 0, AT: -3, PA: -3, FK: -6, TP: 0, MO: -1, RS: 0, GS: -1, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "a",
        name: "Außer Atem",
        mods: { EK: 0, AT: -3, PA: -3, FK: -3, TP: 0, MO: -1, RS: 0, GS: -1, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "e",
        name: "Erschöpft",
        mods: { EK: 0, AT: -6, PA: -6, FK: -6, TP: 0, MO: -2, RS: 0, GS: -1, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "s",
        name: "Schwer Erschöpft",
        mods: { EK: 0, AT: -9, PA: -9, FK: -9, TP: 0, MO: -4, RS: 0, GS: -2, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "l",
        name: "Abgelenkt",
        mods: { EK: 0, AT: 0, PA: -4, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "st",
        name: "Gestört",
        mods: { EK: 0, AT: -3, PA: -3, FK: -3, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "n",
        name: "Niedrige LE",
        mods: { EK: 0, AT: 0, PA: -3, FK: 0, TP: -1, MO: -2, RS: 0, GS: 1, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "g",
        name: "Geringe LE",
        mods: { EK: -1, AT: -4, PA: -4, FK: -4, TP: -1, MO: -4, RS: 0, GS: 1, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "f",
        name: "Fliehend",
        mods: { EK: 0, AT: -999, PA: -999, FK: -999, TP: 0, MO: 0, RS: 0, GS: 3, AU: 0, actionCount: -999, maneuverCount: 0, EKAction: -999, damage: ""}
    },
    {
        key: "sp",
        name: "Sprint",
        mods: { EK: 0, AT: 0, PA: 0, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 1, EKAction: 0, damage: ""}
    },
    {
        key: "au",
        name: "Ausfall",
        mods: { EK: 0, AT: 0, PA: -999, FK: 0, TP: 4, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 1, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "pw",
        name: "Pikenwall",
        mods: { EK: 0, AT: 0, PA: 0, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "sw",
        name: "Schildwall",
        mods: { EK: 0, AT: -4, PA: 4, FK: -2, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "pl",
        name: "Plänkeln",
        mods: { EK: 0, AT: 0, PA: 0, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "o",
        name: "Position: Offensiv",
        mods: { EK: 0, AT: 4, PA: -3, FK: -4, TP: 0, MO: 0, RS: 0, GS: -1, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "ko",
        name: "Position: Konter",
        mods: { EK: 0, AT: 4, PA: -3, FK: -4, TP: 0, MO: 0, RS: 0, GS: -1, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "v",
        name: "Position: Defensiv",
        mods: { EK: 0, AT: -4, PA: 3, FK: -4, TP: 0, MO: 0, RS: 0, GS: -1, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "z",
        name: "Position: Zielen",
        mods: { EK: 0, AT: -4, PA: -5, FK: 4, TP: 0, MO: 0, RS: 0, GS: -1, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "w",
        name: "Position: Bewegung",
        mods: { EK: 0, AT: -2, PA: -2, FK: -2, TP: 0, MO: 4, RS: 0, GS: 2, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: ""}
    },
    {
        key: "t1",
        name: "Schaden I",
        mods: { EK: 0, AT: 0, PA: 0, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: "1W6"}
    },
    {
        key: "t2",
        name: "Schaden II",
        mods: { EK: 0, AT: 0, PA: 0, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0, damage: "3W6"}
    }
]

var customConditions = [];

setTimeout(() => {
    const stateManager = getGlobal('stateManager');
    customConditions = stateManager.getState("conditions") || [];

    stateManager.subscribe("conditions", (conditions) => {
        customConditions = [...conditions];
    });
});

/**
 * Gets the name of a condition by its key
 * @param {string} key 
 * @returns the name of the condition or null if not found
 */
function getConditionName(key) {
    const condition = [...conditions, ...customConditions].find(c => c.key === key);
    return condition ? condition.name : null;
}

function getAllConditionKeys() {
    return [...conditions, ...customConditions].map(c => c.key);
}


/**
 * Gets the total modifier for a list of conditions
 * @param {Array} keys an array of condition keys
 * @param {string} stat the stat to get the modifier for (if left null, returns all modifiers) 
 * @param {Object} context an object containing additional context for the conditions 
 */
function applyAllConditions(keys, stat, context = {}) {
    let newKeys = [...keys];
    if (newKeys.includes("u") && newKeys.includes("d")) {
        newKeys = newKeys.filter(key => key !== "u");
    }
    let mods = { EK: 0, AT: 0, PA: 0, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0, actionCount: 0, maneuverCount: 0, EKAction: 0};
    for (const key of newKeys) {
        const condition = [...conditions, ...customConditions].find(c => c.key === key);
        if (condition) {
            for (const [modKey, value] of Object.entries(condition.mods)) {
                if (modKey === "damage") continue;
                mods[modKey] += value;
            }
            if (key === "d" && context && context.attack && context.attack.isRange) {
                mods.PA += 2;
            }
        }
    }
    if (stat) {
        return mods[stat];
    } else {
        return mods;
    }
}

/**
 * Rolls damage for all conditions in a list and returns the sum.
 * @param {Array} keys an array of condition keys 
 * @returns The total damage from all the selected conditions
 */
function calculateConditionDamage(keys) {
    let newKeys = [...keys];
    let damage = 0;
    for (const key of newKeys) {
        const condition = [...conditions, ...customConditions].find(c => c.key === key);
        if (condition) {
            damage += calculateDamage(stringToComponents(condition.mods.damage));
        }
    }
    return damage;
}

module.exports = { applyAllConditions, calculateConditionDamage, conditions, getConditionName, getAllConditionKeys };