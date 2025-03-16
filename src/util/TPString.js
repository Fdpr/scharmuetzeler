const { roll } = require("./rolling.js");

function stringToComponents(TPString) {
    let TP = String(TPString);
    if (TP === "") return []; // Skip empty components
    if (!TP.startsWith('+') && !TP.startsWith('-')) {
        TP = '+' + TP;
    }
    TP = TP.split(/(?=[\+-])/); // Split at + or - but keep the sign

    return TP.map(part => {
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

function componentsToString(TP) {
    return TP.map(component => {
        if (!component) return ""; // Skip null components
        const [sign, firstNumber, secondNumber] = component;
        return secondNumber > 1 ? `${sign}${firstNumber}W${secondNumber}` : `${sign}${firstNumber}`;
    }).join("").replace(/^\+/, ""); // Remove leading "+" if present
}

function calculateDamage(TP) {
    let runningSum = 0;

    for (const component of TP) {
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

module.exports = { stringToComponents, componentsToString, calculateDamage };