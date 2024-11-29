import { roll, check } from "../util/rolling";

const state = require("@electron/remote").getGlobal('stateManager');
const message = require("@electron/remote").getGlobal('notificationManager').message;

export default class Troop {
    constructor(name, party, ref, EK, anzahl, RTM, GSBasis, GSRitt, MaxLP, RSBasis, ATBasis, PABasis, FKBasis, MOBasis, MOimmun, AUBasis, INIBasis, actionCount, maneuverCount, weapons,
        // These parameters only need to be passed if the Troop is constructed mid-combat
        LP, MO, ErsP, RegP, Ini, weapon, isMelee, meleeCounter, meleeTarget, parryCounter, isRange, nachladen, rangeTarget, isMove, isPlaenkeln, isSchildwall, isPikenwall, mods, conditions, immunities, leader) {

        // static fields
        // THESE SHOULD NEVER CHANGE I THINK
        this.name = name;
        this.party = party
        this.ref = ref;
        this.EK = EK;
        this.anzahl = anzahl;
        this.RTM = RTM;
        this.GSBasis = GSBasis;
        this.GSRitt = GSRitt;
        this.MaxLP = MaxLP;
        this.RSBasis = RSBasis;
        this.ATBasis = ATBasis;
        this.PABasis = PABasis;
        this.FKBasis = FKBasis;
        this.MOBasis = MOBasis;
        this.AUBasis = AUBasis;
        this.INIBasis = INIBasis;
        this.actionCount = actionCount;
        this.maneuverCount = maneuverCount;
        if (weapons[0] instanceof Weapon) {
            this.weapons = weapons;
        } else {
            this.weapons = weapons.map(Weapon.fromJSON);
        }

        // dynamic fields
        this.LP = LP || MaxLP;
        this.MO = MO || MOBasis;
        this.MOimmun = MO || MOimmun;
        this.ErsP = ErsP || 0;
        this.RegP = RegP || 0;
        this.Ini = Ini || (this.INIBasis + roll(6, 3));
        this.weapon = weapon || 0;

        // flags
        this.isMelee = isMelee || false; // was in melee combat this round (should not rely on this value, always check if meleeTarget is set, too)
        this.meleeCounter = meleeCounter || 0;
        this.meleeTarget = meleeTarget || null; // last target of a melee attack for calculating next attack (removed when disengaged)
        this.parryCounter = parryCounter || 0; // counts the number of parries done this round

        this.isRange = isRange || false; // has made a ranged attack this round
        this.nachladen = nachladen || -1; // rounds until next shot is ready
        this.rangeTarget = rangeTarget || null; // last target of a ranged attack for calculating next attack (removed when disengaged)

        this.isMove = isMove || false; // was moving this round
        this.isPlaenkeln = isPlaenkeln || false;
        this.isSchildwall = isSchildwall || false;
        this.isPikenwall = isPikenwall || false;


        // mods and stuff
        const baseMods = { EK: 0, AT: 0, PA: 0, FK: 0, TP: 0, MO: 0, RS: 0, GS: 0, AU: 0 };
        if (mods) {
            this.mods = { ...baseMods, ...mods };
        } else {
            this.mods = baseMods;
        }
        this.conditions = conditions || {};
        this.immunities = immunities || {};

        // inspiration stuff
        this.leader = leader || null; // String representing the current leader
    }

    /**
     * Returns a deep copy of the troop
    */
    static copyFrom(troop) {
        return new Troop(troop.name, troop.party, troop.ref, troop.EK, troop.anzahl, troop.RTM, troop.GSBasis, troop.GSRitt, troop.MaxLP, troop.RSBasis, troop.ATBasis, troop.PABasis, troop.FKBasis, troop.MOBasis, troop.MOimmun, troop.AUBasis, troop.INIBasis, troop.actionCount, troop.maneuverCount, troop.weapons.map(Weapon.copyFrom), troop.LP, troop.MO, troop.ErsP, troop.RegP, troop.Ini, troop.weapon, troop.isMelee, troop.meleeCounter, troop.meleeTarget, troop.parryCounter, troop.isRange, troop.nachladen, troop.rangeTarget, troop.isMove, troop.isPlaenkeln, troop.isSchildwall, troop.isPikenwall, { ...troop.mods }, [...troop.conditions], troop.immunities, troop.leader);
    }

    static fromJSON(json) {
        return new Troop(json.name, json.party, json.ref, json.EK, json.anzahl, json.RTM, json.GSBasis, json.GSRitt, json.MaxLP, json.RSBasis, json.ATBasis, json.PABasis, json.FKBasis, json.MOBasis, json.MOimmun, json.AUBasis, json.INIBasis, json.actionCount, json.maneuverCount, json.weapons, json.LP, json.MO, json.ErsP, json.RegP, json.Ini, json.weapon, json.isMelee, json.meleeCounter, json.meleeTarget, json.parryCounter, json.isRange, json.nachladen, json.rangeTarget, json.isMove, json.isPlaenkeln, json.isSchildwall, json.isPikenwall, json.mods, json.conditions, json.immunities, json.leader);
    }

    toJSON() {
        return {
            name: this.name,
            party: this.party,
            ref: this.ref,
            EK: this.EK,
            anzahl: this.anzahl,
            RTM: this.RTM,
            GSBasis: this.GSBasis,
            GSRitt: this.GSRitt,
            MaxLP: this.MaxLP,
            RSBasis: this.RSBasis,
            ATBasis: this.ATBasis,
            PABasis: this.PABasis,
            FKBasis: this.FKBasis,
            MOBasis: this.MOBasis,
            MOimmun: this.MOimmun,
            AUBasis: this.AUBasis,
            INIBasis: this.INIBasis,
            actionCount: this.actionCount,
            maneuverCount: this.maneuverCount,
            weapons: this.weapons.map(weapon => weapon.toJSON()),
            LP: this.LP,
            MO: this.MO,
            ErsP: this.ErsP,
            RegP: this.RegP,
            Ini: this.Ini,
            weapon: this.weapon,
            isMelee: this.isMelee,
            meleeCounter: this.meleeCounter,
            meleeTarget: this.meleeTarget,
            parryCounter: this.parryCounter,
            isRange: this.isRange,
            nachladen: this.nachladen,
            rangeTarget: this.rangeTarget,
            isMove: this.isMove,
            isPlaenkeln: this.isPlaenkeln,
            isSchildwall: this.isSchildwall,
            isPikenwall: this.isPikenwall,
            mods: this.mods,
            conditions: this.conditions,
            immunities: this.immunities,
            leader: this.leader
        };
    }

    doDamage() {
        return this.weapons[this.weapon].damage() + this.get("TP");
    }

    healLP(amount) {
        this.LP = Math.min(this.MaxLP, this.LP + amount);
    }

    /**
     * Apply exhaustion by either reducing regeneration points or increasing exhaustion points
     */
    exhaust(amount) {
        if (this.RegP >= amount) this.RegP -= amount;
        else if (this.RegP === 0) this.ErsP += amount;
        else {
            const rest = - (this.RegP - amount);
            this.RegP = 0;
            this.ErsP += rest;
        }
    }

    healExhaustion(amount) {
        if (this.ErsP >= amount) this.ErsP -= amount;
        else if (this.ErsP === 0) this.RegP += amount;
        else {
            const rest = - (this.ErsP - amount);
            this.ErsP = 0;
            this.RegP += rest;
        }
    }

    takeDamage(damage) {
        this.LP -= Math.max(0, damage - this.get("RS"));
        if (this.LP <= 0) {
            // TODO: handle death
        }
    }

    /**
     * Adjusts one of the troops modifiers
     */
    modify(stat, value) {
        this.mods[stat] += value;
    }

    /**
     * handles combat checks
     * @param {string} stat the stat to roll for
     * @param {number} modifier the modifier to apply to the roll (negative for advantage, positive for disadvantage)
     */
    roll(stat, modifier) {
        if (stat === "AT" || stat === "PA") this.isMelee = true;
        else if (stat === "FK") this.isRange = true;

        if (stat === "PA") {
            const res = check(this.get("PA") - (modifier + this.parryCounter * (6 - this.get("EK") / 2)));
            this.parryCounter++;
            return res;
        }
        else return check(this.get(stat) - modifier);
    }

    /**
     * Returns the value of a stat after applying all modifiers
     */
    get(stat) {
        switch (stat) {
            case 'LP':
                return this.LP;
            default:
                return this[stat];
        }

    }

    /**
     * checks if the troop has a certain condition and returns the duration if it does else returns false
     */
    hasCondition(key) {
        // Go through conditions and check if the name of any matches the condition
        const foundCondition = this.conditions.find(c => c.key === key);
        return foundCondition ? foundCondition.counter : false;
    }

    getCondition(key) {
        if (this.hasCondition(key)) {
            return this.conditions.find(c => c.key === key);
        } else {
            return false;
        }
    }

    /**
     * Adds a condition to the troop
     */
    addCondition(key, name, duration, rest) {
        const has = this.conditions.find(c => c.key === key);
        if (!has) {
            this.conditions.push({ key: key, name: name, counter: duration, ...rest });
            message(`${this.name} hat den Zustand ${name} ${duration > 0 ? `${duration} Runde(n)` : 'unbegrenzt'} lang erhalten.`);
        } else {
            if (duration === -1) {
                has.counter = -1;
                message(`${this.name} hat den Zustand ${name} nun unbegrenzt lang.`);
            }
            if (has.counter >= duration || has.counter === -1) return;
            message(`${this.name} hat den Zustand ${name} nun noch weitere ${duration - has.counter} Runden lang.`);
            has.counter = duration;
        }
    }

    /**
     * removes a condition from the troop
     */
    removeCondition(key) {
        const exists = this.hasCondition(key);
        this.conditions = this.conditions.filter(c => c.key !== key);
        if (exists)
            message(`${this.name} hat den Zustand ${key} verloren.`);
    }

    /**
     * Removes a target so the troop stops automatically attacking it next round
     */
    removeTarget(target) {
        if (this.meleeTarget === target) this.meleeTarget = null;
        if (this.rangeTarget === target) this.rangeTarget = null;
    }

    /**
     * Does things that need tobe done at the end of the Maneuver phase before the action phase
     */
    handleEndOfManeuver() {
        // check for Regeneration
        if (this.RegP >= 10)
            this.doRegenerationsProbe();
    }

    /**
     * Does things that need to be done at the end of a round
     */
    handleEndOfRound() {
        this.parryCounter = 0;

        // Advance melee counter
        if (this.isMelee)
            this.meleeCounter++;
        else
            this.meleeCounter = 0;

        // check for End of round checks
        if (this.meleeCounter > 0 && this.meleeCounter % 3 === 0)
            this.doMoralProbe();
        if (this.ErsP >= this.get("AU"))
            this.doAusdauerProbe();
        if (this.RegP >= 10)
            this.doRegenerationsProbe();

        // decrease counter for conditions and remove if necessary
        this.conditions = this.conditions.map(condition => {
            if (condition.counter < 0) return condition;
            return { ...condition, counter: condition.counter - 1 };
        });
        this.conditions.filter(condition => condition.counter === 0).forEach(condition => this.removeCondition(condition.key));

        // move all positive and negative modifiers one step closer to 0
        Object.keys(this.mods).forEach(key => {
            if (this.mods[key] > 0) this.mods[key]--;
            if (this.mods[key] < 0) this.mods[key]++;
        });
        // set TP modifier to 0
        this.mods.TP = 0;

        // reset flags
        this.isMelee = false;
        this.isMove = false;
        this.isRange = false;
    }

    /**
     * Rolls for exhaustion and exhaust troop if necessary.
     */
    doAusdauerProbe() {
        if (!this.roll("AU", (Math.max(0, this.ErsP - this.get("AU"))))) {
            this.ErsP = 0;
            if (this.hasCondition("s")) {
                this.LP = Math.trunc(this.LP / 2);
            } else if (this.hasCondition("e")) {
                this.removeCondition("e");
                this.addCondition("s", "schwer erschöpft", -1);
            } else if (this.hasCondition("a")) {
                this.removeCondition("a");
                this.addCondition("e", "erschöpft", -1);
            } else {
                this.addCondition("a", "außer Atem", -1);
            }
        }
    }

    /**
     * Rolls for Moral and handles failure
     */
    doMoralProbe() {
        const moralRoll = roll(20);
        const aktMO = this.get("MO");
        if (moralRoll > aktMO) {
            if (moralRoll > aktMO * 2) {
                if (this.MOimmun > 0) {
                    this.MOimmun--;
                } else {
                    this.addCondition("f", "fliehend", -1);
                }
            } else {
                this.MO = Math.max(1, Math.trunc(aktMO / 2));
            }

        }
    }

    /**
     * Rolls for Regeneration and regenerates troop if necessary.
     */
    doRegenerationsProbe() {
        if (this.roll("AU", 10 - this.RegP)) {
            this.RegP = 0;
            if (this.hasCondition("s")) {
                this.removeCondition("s");
                this.addCondition("e", "erschöpft", -1);
            } else if (this.hasCondition("e")) {
                this.removeCondition("e");
                this.addCondition("a", "außer Atem", -1);
            } else {
                this.removeCondition("a");
            }
        }

    }

}