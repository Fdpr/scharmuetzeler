/**
 * Leader class
 */

const {roll, talentCheck} = require("../util/rolling");

class Leader {

    constructor(name, party, ref, ATBonus, PABonus, FKBonus, TPBonus, MOBonus, GSBonus, AUBonus, INIBonus, INIBasis, GS, Kanz, Kommando, IN, CH, KO, properties,
        Ini
    ) {
        this.name = name || "Leader";
        this.party = party || "";
        this.ref = ref || "Leader";
        this.ATBonus = parseInt(ATBonus) || 0 ;
        this.PABonus = parseInt(PABonus) || 0;
        this.FKBonus = parseInt(FKBonus) || 0;
        this.TPBonus = parseInt(TPBonus) || 0;
        this.MOBonus = parseInt(MOBonus) || 0;
        this.GSBonus = parseInt(GSBonus) || 0;
        this.AUBonus = parseInt(AUBonus) || 0;
        this.INIBonus = parseInt(INIBonus) || 0;
        this.INIBasis = parseInt(INIBasis) || 0;
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

        this.Ini = parseInt(Ini) || this.INIBasis + roll(6, 3);
    }

    /**
     * Roll a Kommandoprobe for this leader
     */
    doKommandoProbe(penalty){
        return talentCheck(this.Kommando - penalty, this.IN, this.CH, this.KO);
    }

    /**
     * Get any stat the leader provides (This is just for token labeling)
     */
    get(stat) {
        if (stat === "AT") return this.ATBonus;
        if (stat === "PA") return this.PABonus;
        if (stat === "FK") return this.FKBonus;
        if (stat === "TP") return this.TPBonus;
        if (stat === "MO") return this.MOBonus;
        if (stat === "GS") return this.GSBonus;
        if (stat === "AU") return this.AUBonus;
        if (stat === "INI") return this.INIBonus;
        if (!Object.keys(this).includes(stat)) return 0;
        return this[stat];
    }

    static fromJSON(json) {
        return new Leader(json.name, json.party, json.ref, json.ATBonus, json.PABonus, json.FKBonus, json.TPBonus, json.MOBonus, json.GSBonus, json.AUBonus, json.INIBonus, json.INIBasis, json.GS, json.Kanz, json.Kommando, json.IN, json.CH, json.KO, json.properties, json.Ini);
    }

    static copyFrom(leader) {
        return new Leader(leader.name, leader.party, leader.ref, leader.ATBonus, leader.PABonus, leader.FKBonus, leader.TPBonus, leader.MOBonus, leader.GSBonus, leader.AUBonus, leader.INIBonus, leader.INIBasis, leader.GS, leader.Kanz, leader.Kommando, leader.IN, leader.CH, leader.KO, leader.properties, leader.Ini);
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
            INIBasis: this.INIBasis,
            GS: this.GS,
            Kanz: this.Kanz,
            Kommando: this.Kommando,
            IN: this.IN,
            CH: this.CH,
            KO: this.KO,
            properties: this.properties,
            Ini: this.Ini
        };
    }
}

module.exports = Leader;