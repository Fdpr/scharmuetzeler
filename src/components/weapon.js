const { roll } = require("../util/rolling");
const { stringToComponents, componentsToString, calculateDamage } = require("../util/TPString");


class Weapon {
    constructor(name, ATMod, PAMod, FKMod, shield, TP, reach, nachladen) {
        this.name = String(name);
        this.ATMod = parseInt(ATMod);
        this.PAMod = parseInt(PAMod);
        this.FKMod = parseInt(FKMod);
        this.shield = Boolean(shield);
        this.reach = parseInt(reach);
        this.nachladen = parseInt(nachladen);
        this.TP = stringToComponents(TP);
    }

    TPString() {
        return componentsToString(this.TP);
    }

    damage() {
        return calculateDamage(this.TP);
    }

    static fromJSON(json) {
        return new Weapon(json.name, json.ATMod, json.PAMod, json.FKMod, json.shield, json.TP, json.reach, json.nachladen);
    }

    static copyFrom(weapon) {
        return new Weapon(weapon.name, weapon.ATMod, weapon.PAMod, weapon.FKMod, weapon.shield, weapon.TPString(), weapon.reach, weapon.nachladen);
    }

    copy() {
        return Weapon.copyFrom(this);
    }

    toJSON() {
        return {
            name: this.name,
            ATMod: this.ATMod,
            PAMod: this.PAMod,
            FKMod: this.FKMod,
            shield: this.shield,
            TP: this.TPString(),
            reach: this.reach,
            nachladen: this.nachladen
        };
    }
}

module.exports = Weapon;