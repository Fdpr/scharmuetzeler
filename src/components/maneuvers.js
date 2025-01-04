// Desc: Contains all the maneuvers and actions that can be performed by troops in the game

const { roll } = require("../util/rolling");

/**
 * Layout of a maneuver:
 * {
 *     name: displayname of the maneuver,
 *     check: Called during maneuver selection phase to see if troop can perform the maneuver
 *     select: Tells what type of selection is needed for the maneuver. Returns an object of the form:
 *     {
 *          select: true/false,
 *          min: the minimum number of targets that need to be selected
 *          max: the number of targets that can be selected
 *          display: Display message on screen during selection
 *     }
 *     perform: Called to actually perform the maneuver. Returns an object of the form:
 *     {
 *        pause: true/false, // If true, the maneuver will pause the game after performing
 *        log: Array of log messages to display
 *     }
 * }
 * 
 * Layout of an action:
 * {
 *      name: displayname of the action,
 *      checkUntargeted: Called during action selection phase to see if troop can actually perform the action (and then again right before the action is performed),
 *      select: The same as for maneuvers,
 *      checkTargeted: Called right before actually performing the action to see if troop can perform the action on the given target,
 *      perform: The same as for maneuvers
 * }
 */

function flank(attacker, defender, setTarget = false) {
    const log = [`${attacker.name} flankiert ${defender.name}.`];
    const context = {
        attacker: attacker,
        defender: defender,
        attack: {
            isFlank: true
        }
    }
    if (setTarget) attacker.setMeleeTarget(defender.name);

    attacker.exhaust(2)
    if (attacker.roll("AT", context)) {
        defender.exhaust(1)
        const damage = attacker.doDamage();
        log.push(`${attacker.name} trifft ${defender.name} und richtet ${damage} TP (${defender.takeDamage(damage, context)} SP) an.`);
    } else {
        log.push(`${attacker.name} verfehlt ${defender.name}.`);
    }
    return log;
}

const maneuvers = [
    {
        name: "Laufen",
        check: (troop) => (!troop.isInMelee() || troop.hasCondition("f")) && troop.get("GS") > 0,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(3);
            troop.isMove = true;
            return {
                pause: true,
                log: [`${troop.name} läuft`],
                display: `Bewege ${troop.name} um ${troop.get("GS")} Feld(er).`
            };
        }
    },
    {
        name: "Ausruhen",
        check: (troop) => !troop.isMove,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            let heal = 1
            if (!troop.isInMelee()) heal = Math.ceil(troop.get("EK") / 2) + 4;
            const hasHealed = troop.healExhaustion(heal);
            return {
                pause: false,
                log: [hasHealed ? `${troop.name} ruht sich aus und heilt ${heal} Punkte Erschöpfung.` : ""]
            };
        }
    },
    {
        name: "Geordneter Rückzug",
        check: (troop) => troop.isInMelee(),
        select: (troop) => ({
            select: true,
            max: 1,
            display: `Wähle die Einheit, die bei ${troop.name} beim Scheitern flankiert.`
        }),
        perform: (troop, targets) => {
            troop.isMove = true;
            const target = targets && targets[0] ? targets[0] : null;
            if (troop.roll("AT"), {
                attacker: troop,
                attack: {
                    isRetreat: true
                }
            }) return {
                pause: true,
                log: [`${troop.name} zieht sich geordnet zurück.`],
                display: `Wähle Rückzugsort für ${troop.name}.`,
            }
            if (target) return {
                pause: false,
                log: [`${troop.name} scheitert einen geordneten Rückzug.`, ...flank(target, troop)]
            };
        }
    },
    {
        name: "Manövrieren",
        check: (troop) => troop.get("GS") >= 3 && troop.isInMelee(),
        select: (troop) => ({
            select: true,
            min: 1,
            max: 1,
            display: `Wähle die Einheit, die ${troop.name} manövrieren soll.`
        }),
        perform: (troop, targets) => {
            const target = targets[0];
            troop.exhaust(2);
            troop.isMove = true;
            const context = {
                attacker: troop,
                defender: target,
                attack: {
                    isManeuver: true
                }
            }
            if (troop.roll("AT", context) && !target.roll("PA", context) && !target.isPlaenkeln) return {
                pause: true,
                log: [`${troop.name} manövriert ${target.name}.`],
                display: `Manövriere ${troop.name} und ${target.name} gemeinsam um 1 Feld.`
            }
            return {
                pause: false,
                log: [`${troop.name} scheitert, ${target.name} zu manövrieren.`]
            }
        }
    },
    {
        name: "Meisteraktion",
        check: (troop) => true,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            return {
                pause: true,
                log: [`${troop.name} führt eine Meisteraktion aus.`],
                display: `Wähle eine Meinsteraktion für ${troop.name}.`
            }
        }
    },
    {
        name: "Sprinten",
        check: (troop) => troop.get("EKAction") >= 2 && !troop.isInMelee() && troop.get("GS") > 0 && !(troop.hasCondition("e") || troop.hasCondition("s")),
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(4);
            troop.isMove = true;
            troop.addCondition("sp", "Sprint", 1);
            return {
                pause: true,
                log: [`${troop.name} sprintet.`],
                display: `Bewege ${troop.name} um ${troop.get("GS")} Feld(er).`
            };
        }
    },
    {
        name: "Lanzenangriff",
        check: (troop) => troop.get("EKAction") >= 3 && !troop.isInMelee() && !(troop.hasCondition("e") || troop.hasCondition("s")) && troop.get("reach") === 1,
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} mit Lanzenangriff angreifen soll.`
        }),
        perform: (troop, targets) => {
            const target = targets[0];
            const log = [`${troop.name} führt einen Lanzenangriff auf ${target.name} aus.`];
            troop.setMeleeTarget(target.name);
            const context = {
                attacker: troop,
                defender: target,
                attack: {
                    isLance: true
                }
            }

            troop.exhaust(8);
            troop.isMove = true;
            if (troop.roll("AT", context)) {
                target.exhaust(1);
                target.isSchildwall = false;
                if (target.addCondition("x", "Schock", 2)) target.doMoralProbe();
                if (target.isPikenwall && target.roll("PA", context)) {
                    log.push(`${target.name} wehrt den Angriff ab.`);
                    return {
                        pause: false,
                        log: log
                    }
                }

                const damage = troop.doDamage();
                log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${target.takeDamage(damage, context)} SP) an.`);
                if (target.isPikenwall) log = [...log, ...flank(target, troop)];
                return {
                    pause: false,
                    log: log
                }
            }
            return {
                pause: false,
                log: [`${troop.name} scheitert, ${target.name} zu treffen.`]
            }
        }
    },
    {
        name: "Sturmangriff",
        check: (troop) => troop.get("EKAction") >= 2 && !troop.isInMelee() && !(troop.hasCondition("e") || troop.hasCondition("s")) && troop.get("reach") < 2,
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} mit Sturmangriff angreifen soll.`
        }),
        perform: (troop, targets) => {
            const target = targets[0];
            const log = [`${troop.name} führt einen Sturmangriff auf ${target.name} aus.`];
            troop.setMeleeTarget(target.name);
            const context = {
                attacker: troop,
                defender: target,
                attack: {
                    isCharge: true
                }
            }
            troop.exhaust(6);
            troop.isMove = true;
            if (troop.roll("AT", context)) {
                if (!target.roll("PA", context)) {
                    target.exhaust(1);
                    target.isSchildwall = false;
                    if (target.addCondition("x", "Schock", 1)) target.doMoralProbe();
                    const damage = troop.doDamage();
                    log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${target.takeDamage(damage, context)} SP) an.`);
                } else {
                    log.push(`${target.name} wehrt den Angriff ab.`);
                }
            } else {
                log.push(`${troop.name} verfehlt ${target.name}.`);
            }

            if (target.isPikenwall) log = [...log, ...flank(target, troop)];
            return {
                pause: false,
                log: log
            }
        }
    },
    {
        name: "Ausfall",
        check: (troop) => troop.get("EKAction") >= 3 && troop.get("GS") > 0 && !(troop.hasCondition("e") || troop.hasCondition("s")) && troop.get("reach") < 2,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(3);
            troop.addCondition("au", "Ausfall", 1);
            return {
                pause: false,
                log: [`${troop.name} begibt sich in den Ausfall.`],
            }
        }
    },
    {
        name: "Ablenken",
        check: (troop) => troop.get("EKAction") >= 3,
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} ablenken soll.`
        }),
        perform: (troop, targets) => {
            const target = targets[0];
            troop.exhaust(3);
            target.addCondition("l", "Abgelenkt", 1, { focus: troop.name });
            return {
                pause: false,
                log: [`${troop.name} lenkt ${target.name} ab.`],
            }
        }
    },
    {
        name: "Beschleunigtes Laden",
        check: (troop) => troop.get("EKAction") >= 3 && !(troop.hasCondition("e") || troop.hasCondition("s")) && troop.get("reach") > 1 && troop.get("nachladen") > 0,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(3);
            troop.nachladen--;
            troop.addCondition("l", "Abgelenkt", 1);
            troop.modify("GS", -2);
            return {
                pause: false,
                log: [`${troop.name} lädt beschleunigt nach.`],
            }
        }
    },
    {
        name: "Sperrfeuer",
        check: (troop) => troop.get("EKAction") >= 3 && !(troop.hasCondition("e") || troop.hasCondition("s")) && troop.get("reach") > 1,
        select: (troop) => ({
            select: true,
            max: 99,
            display: `Wähle Einheiten in 3 zusammenhängenden Feldern, die ${troop.name} mit Sperrfeuer angreifen soll.`
        }),
        perform: (troop, targets) => {
            const log = [`${troop.name} führt Sperrfeuer aus.`];
            troop.exhaust(4);
            troop.resetNachladen();
            if (troop.roll("FK", {
                attacker: troop,
                targets: targets,
                attack: {
                    isBarrage: true
                }
            })) {
                for (const target of targets) {
                    target.addCondition("u", "Unter Feuer", 1);
                }
                log.push(`${troop.name} trifft ${targets.length} Einheiten mit Sperrfeuer.`);
                return {
                    pause: false,
                    log: log
                }
            } else {
                log.push(`${troop.name} verfehlt das Sperrfeuer.`);
                return {
                    pause: false,
                    log: log
                }
            }
        }
    },
    {
        name: "Deckung suchen",
        check: (troop) => true,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(2);
            troop.addCondition("d", "Deckung", 1);
            troop.modify("GS", -3);
            return {
                pause: false,
                log: [`${troop.name} sucht Deckung.`],
            }
        }
    },
    {
        name: "Pikenwall",
        check: (troop) => troop.get("EKAction") >= 4 && troop.get("reach") === 1 && troop.get("RTM") === 1 && !troop.isMove,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(2);
            troop.isPikenwall = true;
            return {
                pause: false,
                log: [`${troop.name} bildet einen Pikenwall.`],
            }
        }
    },
    {
        name: "Schildwall",
        check: (troop) => troop.get("EKAction") >= 3 && troop.shield && troop.get("RTM") === 1,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(2);
            troop.isSchildwall = true;
            return {
                pause: false,
                log: [`${troop.name} bildet einen Schildwall.`],
            }
        }
    },
    {
        name: "Plänkeln",
        check: (troop) => troop.get("EKAction") >= 3 && troop.get("GS") > 3,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            const log = [`${troop.name} plänkelt.`];
            troop.exhaust(3);
            troop.isMove = true;
            troop.isPlaenkeln = true;
            if (!troop.isInMelee()) return {
                pause: true,
                log: log,
                display: `Bewege ${troop.name} um ${troop.get("GS")} Feld(er).`
            }
            else return {
                pause: false,
                log: log,
            }
        }
    },
    {
        name: "Kein Manöver",
        check: (troop) => true,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            return {
                pause: false,
                log: [`${troop.name} führt kein Manöver aus.`],
            }
        }
    }

]

const actions = [
    {
        name: "Angriff",
        checkUntargeted: (troop) => troop.get("reach") < 2,
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} angreifen soll.`
        }),
        checkTargeted: (troop, targets) => troop.canAttackMelee(targets[0].name),
        perform: (troop, targets) => {
            const target = targets[0];
            const log = [`${troop.name} greift ${target.name} an.`];
            troop.setMeleeTarget(target.name);
            const context = {
                attacker: troop,
                defender: target
            }

            troop.exhaust(2)
            if (troop.roll("AT", context)) {
                target.exhaust(1);
                if (!target.roll("PA", context)) {
                    const damage = troop.doDamage();
                    log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${target.takeDamage(damage, context)} SP) an.`);
                    return {
                        pause: false,
                        log: log
                    }
                } else {
                    log.push(`${target.name} wehrt den Angriff ab.`);
                    return {
                        pause: false,
                        log: log
                    }
                }
            } else {
                log.push(`${troop.name} verfehlt ${target.name}.`);
                return {
                    pause: false,
                    log: log
                }
            }
        }
    },
    {
        name: "Flankierender Angriff",
        checkUntargeted: (troop) => troop.get("reach") < 2,
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} flankieren soll.`
        }),
        checkTargeted: (troop, targets) => troop.canAttackMelee(targets[0].name) && targets[0].meleeTarget !== troop.name,
        perform: (troop, targets) => {
            return {
                pause: false,
                log: flank(troop, targets[0], setTarget = true)
            }
        }
    },
    {
        name: "Fernkampf",
        checkUntargeted: (troop) => troop.get("reach") > 1,
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} im Fernkampf angreifen soll.`
        }),
        checkTargeted: (troop, targets) => troop.canAttackRange(targets[0].name),
        perform: (troop, targets) => {
            const target = targets[0];
            troop.setRangeTarget(target.name);

            if (troop.get("nachladen") > 0) {
                troop.nachladen--;
                return {
                    pause: false,
                    log: [`${troop.name} lädt nach.`]
                }
            } else {
                const log = [`${troop.name} greift ${target.name} im Fernkampf an.`];
                const context = {
                    attacker: troop,
                    defender: target,
                    attack: {
                        isRange: true
                    }
                }
                troop.exhaust(1);
                troop.resetNachladen();
                if (troop.roll("FK", context)) {
                    target.exhaust(1);
                    if (!target.roll("PA", context)) {
                        const damage = troop.doDamage();
                        log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${target.takeDamage(damage, context)} SP) an.`);
                        return {
                            pause: false,
                            log: log
                        }
                    } else {
                        log.push(`${target.name} wehrt den Fernkampfangriff ab.`);
                        return {
                            pause: false,
                            log: log
                        }
                    }
                } else {
                    log.push(`${troop.name} verfehlt ${target.name}.`);
                    return {
                        pause: false,
                        log: log
                    }
                }
            }
        }
    },
    {
        name: "Defensivposition",
        checkUntargeted: (troop) => troop.mods.PA < 4,
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => {
            troop.healExhaustion(1);
            troop.mods.PA = Math.min(troop.mods.PA + 2, 4);
            return {
                pause: false,
                log: [`${troop.name} nimmt eine defensive Position ein.`]
            }
        }
    },
    {
        name: "Meisteraktion",
        checkUntargeted: (troop) => true,
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => ({
            pause: true,
            log: [`${troop.name} führt eine Meisteraktion aus.`],
            display: `Wähle eine Meinsteraktion für ${troop.name}.`
        })
    },
    {
        name: "Offensivposition",
        checkUntargeted: (troop) => troop.mods.AT < 4,
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => {
            troop.exhaust(1);
            troop.mods.AT = Math.min(troop.mods.AT + 2, 4);
            return {
                pause: false,
                log: [`${troop.name} nimmt eine offensive Position ein.`]
            }
        }
    },
    {
        name: "Schnellschuss",
        checkUntargeted: (troop) => troop.get("EKAction") >= 3 && troop.get("reach") > 1 && troop.getCurrentWeapon().nachladen < 3 && !(troop.hasCondition("e") || troop.hasCondition("s")),
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} mit Schnellschuss angreifen soll.`
        }),
        checkTargeted: (troop, targets) => troop.canAttackRange(targets[0].name),
        perform: (troop, targets) => {
            const target = targets[0];
            troop.setRangeTarget(target.name);
            const log = [`${troop.name} führt einen Schnellschuss auf ${target.name} aus.`];
            const context = {
                attacker: troop,
                defender: target,
                attack: {
                    isRange: true,
                    isRapidFire: true
                }
            }
            troop.exhaust(3 + troop.rapidFireCounter);
            troop.nachladen = 0;

            if (troop.roll("FK", context)) {
                target.exhaust(1);
                if (!target.roll("PA", context)) {
                    const damage = troop.doDamage();
                    log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${target.takeDamage(damage, context)} SP) an.`);
                    return {
                        pause: false,
                        log: log
                    }
                } else {
                    log.push(`${target.name} wehrt den Schnellschuss ab.`);
                    return {
                        pause: false,
                        log: log
                    }
                }
            } else {
                log.push(`${troop.name} verfehlt ${target.name}.`);
                return {
                    pause: false,
                    log: log
                }
            }

        }
    },
    {
        name: "Zielen",
        checkUntargeted: (troop) => troop.get("EKAction") >= 2 && troop.get("reach") > 1 && !(troop.hasCondition("e") || troop.hasCondition("s")),
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => {
            troop.exhaust(1);
            troop.mods.AT = Math.min(troop.mods.AT + 2, 4);
            return {
                pause: false,
                log: [`${troop.name} zielt.`]
            }
        }
    },
    {
        name: "Absetzen",
        checkUntargeted: (troop) => troop.get("EKAction") >= 3 && troop.isInMelee() && !(troop.hasCondition("e") || troop.hasCondition("s")),
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => {
            troop.exhaust(1);
            troop.isMove = true;
            if (troop.roll("AT", {
                attacker: troop,
                attack: {
                    isRetreat: true
                }
            })) {
                troop.isMove = true;
                return {
                    pause: true,
                    log: [`${troop.name} setzt sich ab.`],
                    display: `Wähle Absetzort für ${troop.name}.`
                }
            } else {
                return {
                    pause: false,
                    log: [`${troop.name} scheitert, sich abzusetzen.`]
                }
            }
        }
    },
    {
        name: "Keine Aktion",
        checkUntargeted: (troop) => true,
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => {
            return {
                pause: false,
                log: [`${troop.name} führt keine Aktion aus.`]
            }
        }
    }
]

function leaderTargets(action, leader, targets, success) {
    leader.action = action;
    leader.targets = targets.map(t => t.name);
    if (success) {
        for (const target of targets) {
            target.leader = leader.name;
        }
    }
}

function generateInspirieren(stat) {
    return {
        name: `Inspirieren (${stat})`,
        check: (leader) => leader.get(stat + "Bonus") > 0,
        select: (leader) => ({
            select: true,
            max: leader.get("Kanz"),
            min: 1,
            display: `Wähle ${leader.get("Kanz")} Einheit(en), die ${leader.name} inspirieren soll.`
        }),
        perform: (leader, targets) => {
            if (!leader.doKommandoProbe(8 - Math.min(...targets.map(t => t.get("EK"))))) {
                leaderTargets(`Inspirieren (${stat})`, leader, targets, false);
                return {
                    pause: false,
                    log: [`${leader.name} scheitert, ${targets.map(t => t.name).join(", ")} zu inspirieren.`]
                }
            }
            leaderTargets(`Inspirieren (${stat})`, leader, targets, true);
            return {
                pause: false,
                log: [`${leader.name} inspiriert ${targets.map(t => t.name).join(", ")}.`]
            }
        }
    }
}

function generateBeleidigen(stat) {
    return {
        name: `Beleidigen (${stat})`,
        check: (leader) => leader.get(stat + "Bonus") > 0,
        select: (leader) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${leader.name} beleidigen soll.`
        }),
        perform: (leader, targets) => {
            leader.action = `Beleidigen (${stat})`;
            leader.targets = targets.map(t => t.name);
            if (!leader.doKommandoProbe(targets[0].get("EK"))) {
                return {
                    pause: false,
                    log: [`${leader.name} scheitert, ${targets[0].name} zu beleidigen.`]
                }
            }
            targets[0].mods[stat] = Math.max(targets[0].mods[stat] - leader.getBonus(stat), - leader.getBonus(stat));
            return {
                pause: false,
                log: [`${leader.name} beleidigt ${targets[0].name}.`]
            }
        }
    }
}


const leaderActions = [
    {
        name: "Kommando übernehmen",
        check: (leader) => true,
        select: (leader) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${leader.name} kommandieren soll.`
        }),
        perform: (leader, targets) => {
            if (!leader.doKommandoProbe(8 - targets[0].get("EK"))) {
                leaderTargets("Kommando übernehmen", leader, targets, false);
                return {
                    pause: false,
                    log: [`${leader.name} scheitert, das Kommando zu übernehmen.`]
                }
            }
            leaderTargets("Kommando übernehmen", leader, targets, true);
            return {
                pause: false,
                log: [`${leader.name} übernimmt das Kommando über ${targets[0].name}.`]
            }
        }
    },
    {
        name: "Unterdrücken",
        check: (leader) => true,
        select: (leader) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, für die ${leader.name} einen Zustand unterdrücken soll.`
        }),
        perform: (leader, targets) => {
            if (!leader.doKommandoProbe(8 - targets[0].get("EK"))) {
                leaderTargets("Unterdrücken", leader, targets, false);
                return {
                    pause: false,
                    log: [`${leader.name} scheitert, ${targets[0].name} zu unterdrücken.`]
                }
            }
            leaderTargets("Unterdrücken", leader, targets, true);
            return {
                pause: true,
                log: [`${leader.name} unterdrückt einen Zustand bei ${targets[0].name}.`],
                display: `Wähle den Zustand, den ${leader.name} unterdrücken soll (Öffne den Editor mit 'e').`
            }
        }
    },
    generateInspirieren("AT"),
    generateInspirieren("PA"),
    generateInspirieren("FK"),
    generateInspirieren("TP"),
    generateInspirieren("MO"),
    generateInspirieren("GS"),
    generateInspirieren("AU"),
    {
        name: "Anspornen (Manöver)",
        check: (leader) => true,
        select: (leader) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${leader.name} anspornen soll.`
        }),
        perform: (leader, targets) => {
            if (!leader.doKommandoProbe(8 - targets[0].get("EK"))) {
                leaderTargets("Anspornen (Manöver)", leader, targets, false);
                return {
                    pause: false,
                    log: [`${leader.name} scheitert, ${targets[0].name} anzuspornen.`]
                }
            }
            leaderTargets("Anspornen (Manöver)", leader, targets, true);
            targets[0].modify("maneuverCount", 1);
            return {
                pause: false,
                log: [`${leader.name} spornt ${targets[0].name} an.`]
            }
        }
    },
    {
        name: "Anspornen (Aktion)",
        check: (leader) => true,
        select: (leader) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${leader.name} anspornen soll.`
        }),
        perform: (leader, targets) => {
            if (!leader.doKommandoProbe(8 - targets[0].get("EK"))) {
                leaderTargets("Anspornen (Aktion)", leader, targets, false);
                return {
                    pause: false,
                    log: [`${leader.name} scheitert, ${targets[0].name} anzuspornen.`]
                }
            }
            leaderTargets("Anspornen (Aktion)", leader, targets, true);
            targets[0].modify("actionCount", 1);
            return {
                pause: false,
                log: [`${leader.name} spornt ${targets[0].name} an.`]
            }
        }
    },
    {
        name: "Sammeln",
        check: (leader) => true,
        select: (leader) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${leader.name} sammeln soll.`
        }),
        perform: (leader, targets) => {
            if (!leader.doKommandoProbe(8 - targets[0].get("EK"))) {
                leaderTargets("Sammeln", leader, targets, false);
                return {
                    pause: false,
                    log: [`${leader.name} scheitert, ${targets[0].name} zu sammeln.`]
                }
            }
            leaderTargets("Sammeln", leader, targets, true);
            targets[0].removeCondition("f");
            targets[0].MO = Math.min(targets[0].MO + leader.MOBonus, targets[0].MOBasis);
            return {
                pause: false,
                log: [`${leader.name} sammelt ${targets[0].name}.`]
            }
        }
    },
    {
        name: "Scharmützel",
        check: (leader) => true,
        select: (leader) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${leader.name} im Scharmützel angreifen soll.`
        }),
        perform: (leader, targets) => {
            leader.action = "Scharmützel";
            leader.targets = targets;

            if (!leader.roll("AT", targets[0].get("EK"))) {
                return {
                    pause: false,
                    log: [`${leader.name} scheitert, ${targets[0].name} im Scharmützel anzugreifen.`]
                }
            }
            const damage = leader.doDamage();
            const context = { attack: { isLeader: true } }
            const log = [`${leader.name} greift ${targets[0].name} im Scharmützel an und richtet ${damage} TP (${targets[0].takeDamage(damage, context)} SP) Schaden an.`];
            const recoil = roll(6, 1) + targets[0].get("EK");
            log.push(`${leader.name} erleidet im Scharmützel ${recoil} TP (${leader.takeDamage(recoil)} SP).`);
            return {
                pause: false,
                log: log
            }
        }
    },
    generateBeleidigen("AT"),
    generateBeleidigen("PA"),
    generateBeleidigen("FK"),
    generateBeleidigen("TP"),
    generateBeleidigen("MO"),
    generateBeleidigen("GS"),
    generateBeleidigen("AU")
]

module.exports = { maneuvers, actions, leaderActions };