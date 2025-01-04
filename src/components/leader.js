/**
 * Leader class
 */

const { roll, talentCheck } = require("../util/rolling");

class Leader {

    constructor(name, party, ref, ATBonus, PABonus, FKBonus, TPBonus, MOBonus, GSBonus, AUBonus, INIBonus, actionCountBonus, maneuverCountBonus, AT, TP, RS, MaxLP, INIBasis, GS, Kanz, Kommando, IN, CH, KO, properties,
        LP, Ini, action, targets) {
        this.name = name || "Leader";
        this.party = party || "";
        this.ref = ref || "Leader";
        this.ATBonus = parseInt(ATBonus) || 0;
        this.PABonus = parseInt(PABonus) || 0;
        this.FKBonus = parseInt(FKBonus) || 0;
        this.TPBonus = parseInt(TPBonus) || 0;
        this.MOBonus = parseInt(MOBonus) || 0;
        this.GSBonus = parseInt(GSBonus) || 0;
        this.AUBonus = parseInt(AUBonus) || 0;
        this.INIBonus = parseInt(INIBonus) || 0;
        this.INIBasis = parseInt(INIBasis) || 0;
        this.actionCountBonus = parseInt(actionCountBonus) || 0;
        this.maneuverCountBonus = parseInt(maneuverCountBonus) || 0;
        this.AT = parseInt(AT) || 0;
        this.TP = parseInt(TP) || 0;
        this.RS = parseInt(RS) || 0;
        this.MaxLP = parseInt(MaxLP) || 0;
        this.GS = parseInt(GS) || 0;
        this.Kanz = parseInt(Kanz) || 0;
        this.Kommando = parseInt(Kommando) || 0;
        this.IN = parseInt(IN) || 0;
        this.CH = parseInt(CH) || 0;
        this.KO = parseInt(KO) || 0;
        if (Array.isArray(properties) && properties.every(prop => typeof prop === 'string')) {
            this.properties = properties;
        } else {
            this.properties = [];
        }

        this.LP = LP || this.MaxLP;
        this.Ini = parseInt(Ini) || this.INIBasis + roll(6, 1);
        this.action = action || ""; // The action the leader is currently performing (and will perform as standard)
        this.targets = targets || []; // The targets of the action
    }

    /**
     * Removes a target from the leader's target list
     */
    removeTarget(name) {
        this.targets = this.targets.filter(target => target !== name);
    }

    doDamage() {
        return this.roll("TP");
    }

    takeDamage(damage, context = {}) {
        let trueDamage = Math.max(0, damage - Math.ceil(this.RS / 2));
        this.LP -= trueDamage;
        return trueDamage;
    }

    roll(stat, modifier = 0){
        switch(stat){
            case "AT":
            case "IN":
            case "CH":
            case "KO":
                return roll(20, 1) <= this[stat] - modifier;
            case "TP":
                return roll(3, 1) + this.get("TP");
            default:
                return;
        }
    }

    /**
     * Roll a Kommandoprobe for this leader
     */
    doKommandoProbe(penalty) {
        return talentCheck(this.Kommando - penalty, this.IN, this.CH, this.KO);
    }

    /**
     * This method returns the applied bonus for a given stat depending on the current leader action.
     * For getting the base bonus stats, use get(stat + "Bonus") instead.
     */
    getBonus(stat) {
        // no bonus for EK or RS
        if (stat === "EK" || stat === "RS") return 0;
        // Weird edge case where troop hasn't updated leader removal yet
        else if (!this.action) {
            console.log("You should not be here");
            return 0;
        }
        else if (this.action === "Kommando übernehmen")
            return this.get(stat + "Bonus");
        else if (this.action.includes("Inspirieren") && this.action.includes(stat)) {
            return Math.ceil(this.get(stat + "Bonus") / 2);
        } else if (this.action === "Anspornen (Manöver)" && stat === "maneuverCount")
            return 1;
        else if (this.action === "Anspornen (Aktion)" && stat === "actionCount")
            return 1;

        return 0;
    }

    /**
     * Get any stat the leader provides (This is mainly for token labeling)
     */
    get(stat) {
        switch (stat){
            case "TP":
                return this.TP + this.TPBonus;
            case "actionCount":
                return 0;
            case "maneuverCount":
                return 1;
            default:
                return this[stat];
        }
    }

    /**
     * Leaders don't die
     */
    isAlive() {
        return true;
    }

    static fromJSON(json) {
        return new Leader(json.name, json.party, json.ref, json.ATBonus, json.PABonus, json.FKBonus, json.TPBonus, json.MOBonus, json.GSBonus, json.AUBonus, json.INIBonus, json.actionCountBonus, json.maneuverCountBonus, json.AT, json.TP, json.RS, json.MaxLP, json.INIBasis, json.GS, json.Kanz, json.Kommando, json.IN, json.CH, json.KO, json.properties, json.LP, json.Ini, json.action, json.targets);
    } 
    
    static copyFrom(leader, fresh = false) {
        if (fresh) return new Leader(leader.name, leader.party, leader.ref, leader.ATBonus, leader.PABonus, leader.FKBonus, leader.TPBonus, leader.MOBonus, leader.GSBonus, leader.AUBonus, leader.INIBonus, leader.actionCountBonus, leader.maneuverCountBonus, leader.AT, leader.TP, leader.RS, leader.MaxLP, leader.INIBasis, leader.GS, leader.Kanz, leader.Kommando, leader.IN, leader.CH, leader.KO, leader.properties);
        return new Leader(leader.name, leader.party, leader.ref, leader.ATBonus, leader.PABonus, leader.FKBonus, leader.TPBonus, leader.MOBonus, leader.GSBonus, leader.AUBonus, leader.INIBonus, leader.actionCountBonus, leader.maneuverCountBonus, leader.AT, leader.TP, leader.RS, leader.MaxLP, leader.INIBasis, leader.GS, leader.Kanz, leader.Kommando, leader.IN, leader.CH, leader.KO, leader.properties, 
            leader.LP, leader.Ini, leader.action, leader.targets);
    }

    copy(fresh = false) {
        return Leader.copyFrom(this, fresh)
    }

    toJSON() {
        return {
            name: this.name,
            party: this.party,
            ref: this.ref,
            ATBonus: this.ATBonus,
            PABonus: this.PABonus,
            FKBonus: this.FKBonus,
            TPBonus: this.TPBonus,
            MOBonus: this.MOBonus,
            GSBonus: this.GSBonus,
            AUBonus: this.AUBonus,
            INIBonus: this.INIBonus,
            actionCountBonus: this.actionCountBonus,
            maneuverCountBonus: this.maneuverCountBonus,
            AT: this.AT,
            TP: this.TP,
            RS: this.RS,
            MaxLP: this.MaxLP,
            INIBasis: this.INIBasis,
            GS: this.GS,
            Kanz: this.Kanz,
            Kommando: this.Kommando,
            IN: this.IN,
            CH: this.CH,
            KO: this.KO,
            properties: this.properties,
            LP: this.LP,
            Ini: this.Ini,
            action: this.action,
            targets: this.targets
        };
    }
}

module.exports = Leader;