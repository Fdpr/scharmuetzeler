/**
 * Provides utility functions for spatial calculations.
 */

function chebyshevDistance(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

module.exports = {
    chebyshevDistance
};