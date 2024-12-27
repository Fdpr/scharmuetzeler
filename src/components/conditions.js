const { getGlobal } = require('../util/process');

const conditions = [
    {
        key: "d",
        name: "Deckung",
        mods: { EK: 0, AT: 0, PA: 2, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0 }
    },
    {
        key: "x",
        name: "Schock",
        mods: { EK: -1, AT: 0, PA: 0, FK: 0, TP: 0, MO: -2, RS: 0, GS: 0, AU: 0 }
    },
    {
        key: "u",
        name: "Unter Feuer",
        mods: { EK: 0, AT: -2, PA: -2, FK: -4, TP: 0, MO: -1, RS: 0, GS: -1, AU: 0 }
    },
    {
        key: "a",
        name: "Außer Atem",
        mods: { EK: 0, AT: -2, PA: -2, FK: -2, TP: 0, MO: 0, RS: 0, GS: -1, AU: 0 }
    },
    {
        key: "e",
        name: "Erschöpft",
        mods: { EK: 0, AT: -4, PA: -4, FK: -4, TP: 0, MO: -2, RS: 0, GS: -1, AU: 0 }
    },
    {
        key: "s",
        name: "Schwer Erschöpft",
        mods: { EK: 0, AT: -6, PA: -6, FK: -6, TP: 0, MO: -4, RS: 0, GS: -2, AU: 0 }
    },
    {
        key: "l",
        name: "Abgelenkt",
        mods: { EK: 0, AT: 0, PA: -3, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0 }
    },
    {
        key: "n",
        name: "Niedrige LE",
        mods: { EK: 0, AT: 0, PA: -2, FK: 0, TP: -1, MO: -2, RS: 0, GS: 1, AU: 0 }
    },
    {
        key: "g",
        name: "Geringe LE",
        mods: { EK: -1, AT: 0, PA: -2, FK: 0, TP: -1, MO: -4, RS: 0, GS: 1, AU: 0 }
    },
    {
        key: "f",
        name: "Fliehend",
        mods: { EK: 0, AT: -999, PA: -999, FK: -999, TP: 0, MO: 0, RS: 0, GS: 3, AU: 0 }
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
    console.log(newKeys);
    if (newKeys.includes("u") && newKeys.includes("d")) {
        newKeys = newKeys.filter(key => key !== "u");
    }
    let mods = { EK: 0, AT: 0, PA: 0, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0 };
    for (const key of newKeys) {
        const condition = [...conditions, ...customConditions].find(c => c.key === key);
        if (condition) {
            for (const [modKey, value] of Object.entries(condition.mods)) {
                mods[modKey] += value;
            }
            if (key === "d" && context.isRange) {
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

module.exports = { applyAllConditions, conditions, getConditionName, getAllConditionKeys };