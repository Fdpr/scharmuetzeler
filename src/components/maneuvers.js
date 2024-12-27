// Desc: Contains all the maneuvers and actions that can be performed by troops in the game

/**
 * Layout of a maneuver:
 * {
 *     name: displayname of the maneuver,
 *     check: Called during maneuver selection phase to see if troop can perform the maneuver,
 *     perform: Called to actually perform the maneuver
 * }
 * 
 * Layout of an action:
 * {
 *      name: displayname of the action,
 *      checkUntargeted: Called during action selection phase to see if troop can actually perform the action,
 *      checkTargeted: Called right before actually performing the action to see if troop can perform the action on the given target,
 *      perform: Called to actually perform the action
 * }
 */

const maneuvers = [
    {
        name: "Laufen",
        check: (troop) => !troop.isMelee || troop.hasCondition("f"),
        perform: (troop) => {

        }
    },
    {
        name: "",
        checkUntargeted: () => true,
        checkTargeted: () => true,
        perform: () => { }
    }
]

const actions = [

]

module.exports = { maneuvers, actions };