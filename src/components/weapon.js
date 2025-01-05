const { roll } = require("../util/rolling");

class Weapon {
    constructor(name, ATMod, PAMod, FKMod, shield, TP, reach, nachladen) {
        this.name = String(name);
        this.ATMod = parseInt(ATMod);
        this.PAMod = parseInt(PAMod);
        this.FKMod = parseInt(FKMod);
        this.shield = Boolean(shield);
        this.reach = parseInt(reach);
        this.nachladen = parseInt(nachladen);

        let tempTP = String(TP);
        if (!tempTP.startsWith('+') && !tempTP.startsWith('-')) {
            tempTP = '+' + tempTP;
        }
        tempTP = tempTP.split(/(?=[\+-])/); // Split at + or - but keep the sign

        this.TP = tempTP.map(part => {
            const match = part.match(/^([\+-])(\d*)W?(\d+)?$/);
            if (match) {
                const sign = match[1] || ""; // "+" or "-"
                const firstNumber = match[2] ? parseInt(match[2], 10) : 1; // Default to 1 if missing
                const secondNumber = match[3] ? parseInt(match[3], 10) : 1; // Default to 1 if missing
                return [sign, firstNumber, secondNumber];
            }
            return null; // In case of an invalid match
        });
    }

    TPString() {
        return this.TP.map(component => {
            if (!component) return ""; // Skip null components
            const [sign, firstNumber, secondNumber] = component;
            return secondNumber > 1 ? `${sign}${firstNumber}W${secondNumber}` : `${sign}${firstNumber}`;
        }).join("").replace(/^\+/, ""); // Remove leading "+" if present
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