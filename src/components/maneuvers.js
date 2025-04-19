// Desc: Contains all the maneuvers and actions that can be performed by troops in the game

const { roll, check } = require("../util/rolling");

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
    const shortLog = [];
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
        const damage = attacker.doDamage(context);
        const takenDamage = defender.takeDamage(damage, context);
        log.push(`${attacker.name} trifft ${defender.name} und richtet ${damage} TP (${takenDamage} SP) an.`);
        shortLog.push(`Flankierung erfolgreich, ${damage} TP (${takenDamage} SP)`);
    } else {
        log.push(`${attacker.name} verfehlt ${defender.name}.`);
        shortLog.push("Flankierung fehlgeschlagen.");
    }
    return { log, shortLog };
}

function allowCounter(counterAttacker, originalAttacker, log = []) {
    if (!counterAttacker.hasCondition("ko"))
        return false;
    const modifier = (6 - Math.ceil(counterAttacker.get("EK") / 2)) * counterAttacker.parryCounter;
    counterAttacker.parryCounter++;
    const context = {
        attacker: counterAttacker,
        defender: originalAttacker,
        attack: {
            modifier: modifier
        }
    }
    if (counterAttacker.roll("AT", context, modifier)) {
        counterAttacker.exhaust(2);
        const damage = counterAttacker.doDamage(context);
        const takenDamage = originalAttacker.takeDamage(damage, context);
        log.push(`${counterAttacker.name} kontert ${originalAttacker.name} und richtet ${damage} TP (${takenDamage} SP) an.`);
        return true;
    }
    log.push(`${counterAttacker.name} scheitert, ${originalAttacker.name} zu kontern.`);
    return false;
}

const maneuvers = [
    {
        name: "Laufen",
        check: (troop) => (!troop.isInMelee() || troop.hasCondition("f")) && troop.get("GS") > 0,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(3);
            troop.isMove = true;
            troop.removeTarget();
            return {
                pause: false,
                log: [`${troop.name} läuft`],

            };
        }
    },
    {
        name: "Ausruhen",
        check: (troop) => !troop.isMove,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            let heal = 1
            if (!troop.didCombatMoveLastTurn() && !troop.isInMelee()) heal = Math.ceil(troop.get("EK") / 2) + 4;
            const hasHealed = troop.healExhaustion(heal);
            return {
                pause: false,
                log: [hasHealed ? `${troop.name} ruht sich aus und heilt ${heal} Punkte Erschöpfung.` : ""],
                shortLog: [hasHealed ? `${heal} Erschöpfung geheilt.` : ""]
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
            if (troop.roll("AT", context = { attacker: troop }), {
                attacker: troop,
                attack: {
                    isRetreat: true
                }
            }) {
                troop.removeTarget();
                return {
                    pause: true,
                    log: [`${troop.name} zieht sich geordnet zurück.`],
                    shortLog: ["Erfolg"],
                    display: `Wähle Rückzugsort für ${troop.name}.`,
                }
            }
            if (target) {
                const { log: flankLog, shortLog: flankShortLog } = flank(target, troop);
                return {
                    pause: false,
                    log: [`${troop.name} scheitert einen geordneten Rückzug.`, ...flankLog],
                    shortLog: ["Gescheitert", ...flankShortLog]

                }
            }
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
            let mod = 0;
            const alliesNearby = target.getNumAlliesNearby();
            if (alliesNearby === 1) mod = 2
            if (alliesNearby > 1) mod = 5
            if (troop.roll("AT", context) && !target.roll("PA", context) && !target.hasCondition("pl")) {
                target.modify("MO", -1);
                return {
                    pause: true,
                    log: [`${troop.name} manövriert ${target.name}.`],
                    shortLog: ["Erfolg"],
                    display: `Manövriere ${troop.name} und ${target.name} gemeinsam um 1 Feld.`
                }
            }
            return {
                pause: false,
                log: [`${troop.name} scheitert, ${target.name} zu manövrieren.`],
                shortLog: ["Gescheitert"]
            }
        }
    },
    {
        name: "Meisteraktion",
        check: (troop) => true,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            return {
                pause: false,
                log: [`${troop.name} führt eine Meisteraktion aus.`],
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
            troop.removeTarget();
            return {
                pause: false,
                log: [`${troop.name} sprintet.`],
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
            let log = [`${troop.name} führt einen Lanzenangriff auf ${target.name} aus.`];
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
                target.removeCondition("sw")
                if (target.addCondition("x", "Schock", 4)) target.doMoralProbe();
                if (target.hasCondition("pw") && target.roll("PA", context)) {
                    log.push(`${target.name} wehrt den Angriff ab.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: ["Pariert"]
                    }
                }

                const damage = troop.doDamage(context);
                const takenDamage = target.takeDamage(damage, context);
                let shortLog = [`getroffen, ${damage} TP (${takenDamage} SP)`];
                log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${takenDamage} SP) an.`);
                let shortLogExtra = [];
                if (target.hasCondition("pw")) {
                    const { log: flankLog, shortLog: flankShortLog } = flank(target, troop);
                    shortLogExtra = flankShortLog;
                    log = [...log, ...flankLog];
                }
                shortLog = [...shortLog, ...shortLogExtra];
                return {
                    pause: false,
                    log: log,
                    shortLog: shortLog
                }
            }
            return {
                pause: false,
                log: [`${troop.name} scheitert, ${target.name} zu treffen.`],
                shortLog: ["Gescheitert"]
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
            let log = [`${troop.name} führt einen Sturmangriff auf ${target.name} aus.`];
            let shortLog = [];
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
            allowCounter(target, troop, log);
            if (troop.roll("AT", context)) {
                if (!target.roll("PA", context)) {
                    target.exhaust(1);
                    target.removeCondition("sw");
                    if (target.addCondition("x", "Schock", 2)) target.doMoralProbe();
                    const damage = troop.doDamage(context);
                    const takenDamage = target.takeDamage(damage, context);
                    shortLog.push(`getroffen, ${damage} TP (${takenDamage} SP)`);
                    log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${takenDamage} SP) an.`);
                } else {
                    log.push(`${target.name} wehrt den Angriff ab.`);
                    shortLog.push("Pariert");
                }
            } else {
                log.push(`${troop.name} verfehlt ${target.name}.`);
                shortLog.push("Verfehlt");
            }

            if (target.hasCondition("pw")) {
                const { log: flankLog, shortLog: flankShortLog } = flank(target, troop);
                log = [...log, ...flankLog];
                shortLog = [...shortLog, ...flankShortLog];
            }
            return {
                pause: false,
                log: log,
                shortLog: shortLog
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
        name: "Beschleunigtes Laden",
        check: (troop) => troop.get("EKAction") >= 3 && !(troop.hasCondition("e") || troop.hasCondition("s")) && troop.get("reach") > 1 && troop.get("nachladen") > 0,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(3);
            troop.nachladen--;
            troop.addCondition("l", "Abgelenkt", 2);
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
                    target.addCondition("u", "Unter Feuer", 3);
                }
                log.push(`${troop.name} trifft ${targets.length} Einheiten mit Sperrfeuer.`);
                return {
                    pause: false,
                    log: log,
                    shortLog: [`${targets.length} Einheiten getroffen`]
                }
            } else {
                log.push(`${troop.name} verfehlt das Sperrfeuer.`);
                return {
                    pause: false,
                    log: log,
                    shortLog: ["Verfehlt"]
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
            troop.addCondition("d", "Deckung", 3);
            troop.modify("GS", -3);
            troop.removeTarget();
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
            troop.addCondition("pw", "Pikenwall", 3);
            troop.addImmunity("x", "Schock", 3)
            return {
                pause: false,
                log: [`${troop.name} bildet einen Pikenwall.`],
            }
        }
    },
    {
        name: "Schildwall",
        check: (troop) => troop.get("EKAction") >= 3 && troop.get("shield") && troop.get("RTM") === 1,
        select: (troop) => ({ select: false }),
        perform: (troop, targets) => {
            troop.exhaust(2);
            troop.addCondition("sw", "Schildwall", 3);
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
            troop.addCondition("pl", "Plänkeln", 3);
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

function generateVernichtung(modifier, damageBoost) {
    return {
        name: `Vernichtungsschlag +${modifier}`,
        checkUntargeted: (troop) => troop.get("EKAction") >= 3,
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} mit Vernichtungsschlag angreifen soll.`
        }),
        checkTargeted: (troop, targets) => troop.canAttackMelee(targets[0].name),
        perform: (troop, targets) => {
            const target = targets[0];
            const log = [`${troop.name} führt einen Vernichtungsschlag +${modifier} gegen ${target.name} aus.`];
            troop.setMeleeTarget(target.name);
            const context = {
                attacker: troop,
                defender: target,
                attack: {
                    modifier: modifier
                }
            }
            troop.exhaust(3);
            allowCounter(target, troop, log);
            if (troop.roll("AT", context, modifier)) {
                target.exhaust(1);
                if (!target.roll("PA", context)) {
                    const damage = troop.doDamage(context);
                    const takenDamage = target.takeDamage(damage + damageBoost, context);
                    troop.addCondition("l", "Abgelenkt", 1, { focus: target.name });
                    target.modify("MO", -2);
                    log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${takenDamage} SP) an.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: [`${damage} TP (${takenDamage} SP)`]
                    }
                } else {
                    log.push(`${target.name} wehrt den Vernichtungsschlag ab.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: ["Pariert"]
                    }
                }
            } else {
                log.push(`${troop.name} verfehlt ${target.name}.`);
                return {
                    pause: false,
                    log: log,
                    shortLog: ["Verfehlt"]
                }
            }
        }
    }
}

function generateFinte(modifier, defPenalty) {
    return {
        name: `Finte +${modifier}`,
        checkUntargeted: (troop) => troop.get("EKAction") >= 2,
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} mit Finte angreifen soll.`
        }),
        checkTargeted: (troop, targets) => troop.canAttackMelee(targets[0].name),
        perform: (troop, targets) => {
            const target = targets[0];
            const log = [`${troop.name} führt eine Finte +${modifier} gegen ${target.name} aus.`];
            troop.setMeleeTarget(target.name);
            const context = {
                attacker: troop,
                defender: target,
                attack: {
                    modifier: modifier
                }
            }
            troop.exhaust(2);
            allowCounter(target, troop, log);
            if (troop.roll("AT", context, modifier)) {
                target.exhaust(1);
                if (!target.roll("PA", context, defPenalty)) {
                    const damage = troop.doDamage(context);
                    const takenDamage = target.takeDamage(damage, context);
                    log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${takenDamage} SP) an.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: [`${damage} TP (${takenDamage} SP)`]
                    }
                } else {
                    log.push(`${target.name} wehrt die Finte ab.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: ["Pariert"]
                    }
                }
            } else {
                log.push(`${troop.name} verfehlt ${target.name}.`);
                return {
                    pause: false,
                    log: log,
                    shortLog: ["Verfehlt"]
                }
            }
        }
    }
}

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
            allowCounter(target, troop, log);
            if (troop.roll("AT", context)) {
                target.exhaust(1);
                if (!target.roll("PA", context)) {
                    const damage = troop.doDamage(context);
                    const takenDamage = target.takeDamage(damage, context);
                    log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${takenDamage} SP) an.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: [`${damage} TP (${takenDamage} SP)`]
                    }
                } else {
                    log.push(`${target.name} wehrt den Angriff ab.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: ["Pariert"]
                    }
                }
            } else {
                log.push(`${troop.name} verfehlt ${target.name}.`);
                return {
                    pause: false,
                    log: log,
                    shortLog: ["Verfehlt"]
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
        checkTargeted: (troop, targets) => troop.canAttackMelee(targets[0].name),
        perform: (troop, targets) => {
            const { log, shortLog } = flank(troop, targets[0], setTarget = true);
            return {
                pause: false,
                log: log,
                shortLog: shortLog.map(s => s.slice(12))
            }
        }
    },
    {
        name: "Nachladen",
        checkUntargeted: (troop) => troop.get("reach") > 1 && troop.get("nachladen") > 0,
        select: (troop) => ({
            select: true,
            max: 1,
            display: `Wähle die Einheit, die ${troop.name} nach dem Nachladen im Fernkampf angreifen soll.`
        }),
        checkTargeted: (troop, targets) => troop.get("reach") > 1 && troop.get("nachladen") > 0,
        perform: (troop, targets) => {
            if (targets.length > 0) {
                troop.setRangeTarget(targets[0].name);
            }
            troop.nachladen--;
            return {
                pause: false,
                log: [`${troop.name} lädt nach.`]
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

            if (troop.get("nachladen") > 0 && false) {
                troop.nachladen--;
                return {
                    pause: false,
                    log: [`${troop.name} lädt nach.`],
                    shortLog: ["Nachladen"]
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
                        const damage = troop.doDamage(context);
                        const takenDamage = target.takeDamage(damage, context);
                        if (takenDamage > 7 + target.get("EK")) {
                            if (target.addCondition("x", "Schock", 1)) target.doMoralProbe();
                        }
                        log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${takenDamage} SP) an.`);
                        return {
                            pause: false,
                            log: log,
                            shortLog: [`${damage} TP (${takenDamage} SP)`]
                        }
                    } else {
                        log.push(`${target.name} wehrt den Fernkampfangriff ab.`);
                        return {
                            pause: false,
                            log: log,
                            shortLog: ["Pariert"]
                        }
                    }
                } else {
                    log.push(`${troop.name} verfehlt ${target.name}.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: ["Verfehlt"]
                    }
                }
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
        name: "Schnellschuss",
        checkUntargeted: (troop) => troop.get("EKAction") >= 3 && troop.get("reach") > 1 && troop.getCurrentWeapon().nachladen <= 4 && !(troop.hasCondition("e") || troop.hasCondition("s")),
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
            troop.exhaust(3 + 2 * troop.rapidFireCounter);
            troop.nachladen = 0;

            if (troop.roll("FK", context)) {
                target.exhaust(1);
                if (!target.roll("PA", context)) {
                    const damage = troop.doDamage(context);
                    const takenDamage = target.takeDamage(damage, context);
                    if (takenDamage > 7 + target.get("EK")) {
                        if (target.addCondition("x", "Schock", 1)) target.doMoralProbe();
                    }
                    log.push(`${troop.name} trifft ${target.name} und richtet ${damage} TP (${takenDamage} SP) an.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: [`${damage} TP (${takenDamage} SP)`]
                    }
                } else {
                    log.push(`${target.name} wehrt den Schnellschuss ab.`);
                    return {
                        pause: false,
                        log: log,
                        shortLog: ["Pariert"]
                    }
                }
            } else {
                log.push(`${troop.name} verfehlt ${target.name}.`);
                return {
                    pause: false,
                    log: log,
                    shortLog: ["Verfehlt"]
                }
            }

        }
    },
    generateVernichtung(4, 2),
    generateVernichtung(8, 4),
    generateVernichtung(12, 6),
    generateFinte(4, 2),
    generateFinte(8, 4),
    generateFinte(12, 6),
    {
        name: "Unterstützungsangriff",
        checkUntargeted: (troop) => true,
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => troop.getEnemiesInMelee().length > 0,
        perform: (troop, targets) => {
            const log = [`${troop.name} führt einen Unterstützungsangriff aus.`];
            const enemies = troop.getEnemiesInMelee();
            const modifier = Math.max(enemies.map(e => e.get("EK")))
            const context = {
                attacker: troop,
            }
            if (troop.roll("AT", context, modifier)) {
                enemies.forEach(e => e.addCondition("st", "Gestört", 2));
                log.push(`${troop.name} stört ${enemies.map(e => e.name).join(", ")}.`);
                return {
                    pause: false,
                    log: log,
                    shortLog: ["Erfolg"]
                }
            } else {
                log.push(`${troop.name} scheitert, ${enemies.map(e => e.name).join(", ")} zu stören.`);
                return {
                    pause: false,
                    log: log,
                    shortLog: ["Gescheitert"]
                }
            }
        }
    },
    {
        name: "Absetzen",
        checkUntargeted: (troop) => troop.get("EKAction") >= 3 && troop.isInMelee() && !(troop.hasCondition("e") || troop.hasCondition("s")),
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => troop.get("EKAction") >= 3 && troop.isInMelee() && !(troop.hasCondition("e") || troop.hasCondition("s")),
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
                    shortLog: ["Erfolg"],
                    display: `Wähle Absetzort für ${troop.name}.`
                }
            } else {
                return {
                    pause: false,
                    log: [`${troop.name} scheitert, sich abzusetzen.`],
                    shortLog: ["Gescheitert"]
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

const freeActions = [
    {
        name: "Defensivposition",
        checkUntargeted: (troop) => true,
        check: (troop) => true,
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => {
            troop.removeCondition("ko");
            troop.removeCondition("o");
            troop.removeCondition("z");
            troop.removeCondition("w");
            troop.addCondition("v", "Position: Defensiv", 3);
            return {
                pause: false,
                log: [`${troop.name} nimmt eine defensive Position ein.`]
            }
        }
    },
    {
        name: "Offensivposition",
        checkUntargeted: (troop) => true,
        check: (troop) => true,
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => {
            troop.removeCondition("ko");
            troop.removeCondition("v");
            troop.removeCondition("z");
            troop.removeCondition("w");
            troop.addCondition("o", "Position: Offensiv", 3);
            return {
                pause: false,
                log: [`${troop.name} nimmt eine offensive Position ein.`]
            }
        }
    },
    {
        name: "Zielen",
        checkUntargeted: (troop) => troop.get("reach") > 1,
        check: (troop) => troop.get("reach") > 1,
        select: (troop) => ({ select: false }), 
        checkTargeted: (troop, targets) => troop.get("reach") > 1,
        perform: (troop, targets) => {
            troop.removeCondition("ko");
            troop.removeCondition("v");
            troop.removeCondition("o");
            troop.removeCondition("w");
            troop.addCondition("z", "Position: Zielen", 3);
            troop.exhaust(1);
            return {
                pause: false,
                log: [`${troop.name} zielt.`]
            }
        }
    },
    {
        name: "Bewegung",
        checkUntargeted: (troop) => true,
        check: (troop) => true,
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => {
            troop.removeCondition("ko");
            troop.removeCondition("v");
            troop.removeCondition("z");
            troop.removeCondition("o");
            troop.addCondition("w", "Position: Bewegung", 3);
            troop.exhaust(2);
            return {
                pause: false,
                log: [`${troop.name} geht in Bewegung.`],
            }
        }
    },
    {
        name: "Konter",
        checkUntargeted: (troop) => troop.get("EK") >= 3 && troop.get("reach") < 2,
        check: (troop) => troop.get("EK") >= 3 && troop.get("reach") < 2,
        select: (troop) => ({ select: false }),
        checkTargeted: (troop, targets) => true,
        perform: (troop, targets) => {
            troop.removeCondition("o");
            troop.removeCondition("v");
            troop.removeCondition("z");
            troop.removeCondition("w");
            troop.addCondition("ko", "Position: Konter", 2);
            return {
                pause: false,
                log: [`${troop.name} geht in Konterstellung.`]
            }
        }
    },
    {
        name: "Ablenken",
        check: (troop) => troop.get("EKAction") >= 3,
        checkUntargeted: (troop) => troop.get("EKAction") >= 3,
        select: (troop) => ({
            select: true,
            max: 1,
            min: 1,
            display: `Wähle die Einheit, die ${troop.name} ablenken soll.`
        }),
        checkTargeted: (troop, targets) => troop.get("EKAction") >= 3,
        perform: (troop, targets) => {
            const target = targets[0];
            troop.exhaust(2);
            target.addCondition("l", "Abgelenkt", 1, { focus: troop.name });
            return {
                pause: false,
                log: [`${troop.name} lenkt ${target.name} ab.`],
            }
        }
    },
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
                    log: [`${leader.name} scheitert, ${targets.map(t => t.name).join(", ")} zu inspirieren.`],
                    shortLog: ["Gescheitert"]
                }
            }
            leaderTargets(`Inspirieren (${stat})`, leader, targets, true);
            return {
                pause: false,
                log: [`${leader.name} inspiriert ${targets.map(t => t.name).join(", ")}.`],
                shortLog: [`Erfolg (${targets.length} Einheiten)`]
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
                    log: [`${leader.name} scheitert, ${targets[0].name} zu beleidigen.`],
                    shortLog: ["Gescheitert"]
                }
            }
            const penalty = leader.get(stat + "Bonus");
            targets[0].mods[stat] = Math.max(targets[0].mods[stat] - penalty, -penalty);
            return {
                pause: false,
                log: [`${leader.name} beleidigt ${targets[0].name}.`],
                shortLog: ["Erfolg"]
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
                    log: [`${leader.name} scheitert, das Kommando zu übernehmen.`],
                    shortLog: ["Gescheitert"]
                }
            }
            leaderTargets("Kommando übernehmen", leader, targets, true);
            return {
                pause: false,
                log: [`${leader.name} übernimmt das Kommando über ${targets[0].name}.`],
                shortLog: ["Erfolg"]
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
                    log: [`${leader.name} scheitert, ${targets[0].name} zu unterdrücken.`],
                    shortLog: ["Gescheitert"]
                }
            }
            leaderTargets("Unterdrücken", leader, targets, true);
            return {
                pause: true,
                log: [`${leader.name} unterdrückt einen Zustand bei ${targets[0].name}.`],
                shortLog: ["Erfolg"],
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
                    log: [`${leader.name} scheitert, ${targets[0].name} anzuspornen.`],
                    shortLog: ["Gescheitert"]
                }
            }
            leaderTargets("Anspornen (Manöver)", leader, targets, true);
            targets[0].modify("maneuverCount", 1);
            return {
                pause: false,
                log: [`${leader.name} spornt ${targets[0].name} an.`],
                shortLog: ["Erfolg"]
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
                    log: [`${leader.name} scheitert, ${targets[0].name} anzuspornen.`],
                    shortLog: ["Gescheitert"]
                }
            }
            leaderTargets("Anspornen (Aktion)", leader, targets, true);
            targets[0].modify("actionCount", 1);
            return {
                pause: false,
                log: [`${leader.name} spornt ${targets[0].name} an.`],
                shortLog: ["Erfolg"]
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
                    log: [`${leader.name} scheitert, ${targets[0].name} zu sammeln.`],
                    shortLog: ["Gescheitert"]
                }
            }
            leaderTargets("Sammeln", leader, targets, true);
            targets[0].removeCondition("f");
            targets[0].MO = Math.min(targets[0].MO + leader.MOBonus, targets[0].MOBasis);
            return {
                pause: false,
                log: [`${leader.name} sammelt ${targets[0].name}.`],
                shortLog: ["Erfolg"]
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
                    log: [`${leader.name} scheitert, ${targets[0].name} im Scharmützel anzugreifen.`],
                    shortLog: ["Gescheitert"]
                }
            }
            const context = { attack: { isLeader: true } }
            const damage = leader.doDamage();
            const takenDamage = targets[0].takeDamage(damage, context);
            if (takenDamage > targets[0].get("EK")) {
                targets[0].doMoralProbe();
            }
            const log = [`${leader.name} greift ${targets[0].name} im Scharmützel an und richtet ${damage} TP (${takenDamage} SP) Schaden an.`];
            const recoil = roll(6, 1) + targets[0].get("EK");
            const takenRecoil = leader.takeDamage(recoil);
            log.push(`${leader.name} erleidet im Scharmützel ${recoil} TP (${takenRecoil} SP).`);
            return {
                pause: false,
                log: log,
                shortLog: [`${damage} TP (${takenDamage} SP) an ${targets[0].name}`, `${recoil} TP (${takenRecoil} SP) an ${leader.name}`]
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

module.exports = { maneuvers, actions, freeActions, leaderActions };