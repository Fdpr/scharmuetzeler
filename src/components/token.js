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
     * Refreshes the token's display and classes
     */
    update() {
        const ref = this.type === "troop" ? stateManager.getTroop(this.ref) : stateManager.getLeader(this.ref);
        if (!ref) {
            message("Troop / Leader not found: " + this.ref + "!");
            return;
        }
        this.classes = [
            "token",
            "type-" + this.type,
            "party-" + myTroop.party,
            ...this.type === "troop" ? ref.conditions.map(condition => "condition-" + condition.key) : [],
        ].join(" ");
        return this;
    }

    text() {
        const ref = this.type === "troop" ? stateManager.getTroop(this.ref) : stateManager.getLeader(this.ref);
        // Replace all %<stat> with the corresponding stat from the troop/leader
        return this.label.replace(/<([a-zA-Z]+)>/g, (match, p1) => ref.get(p1) || match);
    }


    static fromJSON(json) {
        return new Token(json.name, json.ref, json.type, json.radius, json.x, json.y, json.image, json.label);
    }

    static copyFrom(token) {
        return new Token(token.name, token.ref, json.type, json.radius, token.x, token.y, token.image, token.label);
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