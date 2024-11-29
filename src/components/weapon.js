import { roll } from "../util/rolling";

export default class Weapon {
    constructor(name, ATMod, PAMod, FKMod, TP, reach, nachladen) {
        this.name = name;
        this.ATMod = ATMod;
        this.PAMod = PAMod;
        this.FKMod = FKMod;
        this.reach = reach;
        this.nachladen = nachladen;

        let tempTP = TP;
        if (!tempTP.startsWith('+') && !tempTP.startsWith('-')) {
            tempTP = '+' + tempTP;
        }

        this.TP = tempTP.map(part => {
            const match = part.match(/^([+-]?)(\d*)([A-Z])(\d+)?$/);
            if (match) {
                const sign = match[1] || ""; // "+" or "-"
                const firstNumber = match[2] ? parseInt(match[2], 10) : 1; // Default to 1 if missing
                const secondNumber = match[4] ? parseInt(match[4], 10) : 1; // Default to 1 if missing
                return [sign, firstNumber, secondNumber];
            }
            return null; // In case of an invalid match
        });
    }

    damage() {
        let runningSum = 0;

        for (const component of this.TP) {
            if (!component) continue; // Skip null components
            const [sign, firstNumber, secondNumber] = component;
            const diceRoll = roll(secondNumber, firstNumber);
            if (sign === "-") {
                runningSum -= diceRoll;
            } else {
                runningSum += diceRoll; // Assume sign is "+" or empty for positive
            }
        }

        return runningSum;
    }

    static fromJSON(json) {
        return new Weapon(json.name, json.ATMod, json.PAMod, json.FKMod, json.TP, json.reach, json.nachladen);
    }

    static copyFrom(weapon) {
        return new Weapon(weapon.name, weapon.ATMod, weapon.PAMod, weapon.FKMod, weapon.TP, weapon.reach, weapon.nachladen);
    }

    toJSON() {
        return {
            name: this.name,
            ATMod: this.ATMod,
            PAMod: this.PAMod,
            FKMod: this.FKMod,
            TP: this.TP,
            reach: this.reach,
            nachladen: this.nachladen
        };
    }
}