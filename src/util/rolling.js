/**
 * Roll a die with sides `sides` `times` times and return the total.
 */
export function roll(sides, times=1) {
    let total = 0;
    for (let i = 0; i < times; i++) {
        total += Math.floor(Math.random() * sides) + 1; // Roll a die with `sides` sides
    }
    return total;
}

/**
 * Roll an ability check and return if it was successful.
 */
export function check(ability) {
    return roll(20) <= ability;
}