const { getGlobal } = require("../util/process");

class Token {
    constructor(name, ref, type, radius, x, y, image, label) {
        this.name = name;
        this.ref = ref;
        this.type = type;
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.image = image;
        this.label = label;
        this.classes = "token";
    }

    /**
     * Refreshes the token's classes
     */
    update() {
        const ref = this.type === "troop" ? stateManager.getTroop(this.ref) : stateManager.getLeader(this.ref);
        if (!ref) {
            getGlobal("notificationManager").message("Troop / Leader not found: " + this.ref + "!");
            return;
        }
        this.classes = [
            "token",
            "type-" + this.type,
            "party-" + ref.party,
            ...this.type === "troop" ? ref.conditions.map(condition => "condition-" + condition.key) : [],
            ...ref.isAlive() ? [] : ["dead"]
        ].join(" ");
        return this;
    }

    text() {
        const ref = this.type === "troop" ? stateManager.getTroop(this.ref) : stateManager.getLeader(this.ref);
        // Replace all %<stat> with the corresponding stat from the troop/leader
        return this.label.replace(/<([a-zA-Z]+)>/g, (match, p1) => {
            const res = ref.get(p1);
            if (res || res === 0) return res;
            return match;
        });
    }


    static fromJSON(json) {
        return new Token(json.name, json.ref, json.type, json.radius, json.x, json.y, json.image, json.label);
    }

    static copyFrom(token) {
        return new Token(token.name, token.ref, token.type, token.radius, token.x, token.y, token.image, token.label);
    }

    toJSON() {
        return {
            name: this.name,
            ref: this.ref,
            type: this.type,
            radius: this.radius,
            x: this.x,
            y: this.y,
            image: this.image,
            label: this.label
        };
    }

    copy() {
        return Token.copyFrom(this);
    }
}

module.exports = Token;