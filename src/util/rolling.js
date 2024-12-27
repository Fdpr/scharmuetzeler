/**
 * Roll a die with sides `sides` `times` times and return the total.
 */
function roll(sides, times = 1) {
    let total = 0;
    for (let i = 0; i < times; i++) {
        total += Math.floor(Math.random() * sides) + 1; // Roll a die with `sides` sides
    }
    return total;
}

/**
 * Roll an ability check and return if it was successful.
 */
function check(ability) {
    return roll(20) <= ability;
}

/**
 * Perform a DSA 4.1 style talent check.
 */
function talentCheck(talent, a1, a2, a3) {
    const [roll1, roll2, roll3] = [roll(20), roll(20), roll(20)];
    let pointsleft = talent;
    if (pointsleft >= 0) {
        if (roll1 > a1) pointsleft -= roll1 - a1;
        if (roll2 > a2) pointsleft -= roll2 - a2;
        if (roll3 > a3) pointsleft -= roll3 - a3;
        return pointsleft !== 0 ? pointsleft : 1;
    } else {
        if (roll1 - pointsleft > a1) pointsleft -= (roll1 - pointsleft) - a1;
        if (roll2 - pointsleft > a2) pointsleft -= (roll2 - pointsleft) - a2;
        if (roll3 - pointsleft > a3) pointsleft -= (roll3 - pointsleft) - a3;
        return pointsleft < talent ? pointsleft : 1;
    }
}

module.exports = { roll, check, talentCheck };