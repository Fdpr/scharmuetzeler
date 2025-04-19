function PartyOverview(party, troops) {
    const container = document.createElement('div');
    container.className = "two-column";
    const partyName = document.createElement('h2');
    partyName.className = "span-2"
    partyName.innerText = party;
    container.appendChild(partyName);

    const troopTable = document.createElement('table');
    troopTable.className = "span-2";
    const header = document.createElement('tr');
    const headers = ["Name", "EK", "LP", "MO/immun", "Ers/Reg", "conds", "AT/PA", "Waffe", "GS", "RS"];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.innerText = headerText;
        header.appendChild(th);
    });
    troopTable.appendChild(header);

    troops.filter(troop => troop.party === party).forEach(troop => {
        const row = document.createElement('tr');
        const values = [
            troop.name,
            troop.get("EK"),
            `${troop.get("LP")}/${troop.get("MaxLP")}`,
            `${troop.get("MO")}/${troop.get("MOimmun")}`,
            `${troop.get("ErsP")}/${troop.get("RegP")}`,
            troop.conditions.map(c => c.key).join(", "),
            troop.get("reach") <= 1 ? `${troop.get("AT")}/${troop.get("PA")}` : troop.get("FK"),
            `${troop.getCurrentWeapon().name} ${troop.get("shield") ? "(Schild)" : ""}`,
            troop.get("GS"),
            troop.get("RS")
        ];
        values.forEach(value => {
            const td = document.createElement('td');
            td.innerText = value;
            row.appendChild(td);
        });
        troopTable.appendChild(row);
    });
    container.appendChild(troopTable);
    return container;
}

function LogDisplay() {
    const container = document.createElement('div');
    container.className = "two-column";
    const logTitle = document.createElement('h2');
    logTitle.innerText = "Log";
    logTitle.className = "span-2";
    container.appendChild(logTitle);
    const log = document.createElement('pre');
    log.className = "span-2";
    log.innerText = stateManager.getState("log").join("\n");
    container.appendChild(log);
    return container;
}

function OverviewPanel() {
    const container = document.createElement('div');
    container.classList.add("overview-panel");
    const parties = stateManager.getState("config.parties");
    const troops = stateManager.getState("troops");
    parties.forEach(party => {
        container.appendChild(PartyOverview(party, troops));
    });
    container.appendChild(LogDisplay());
    return container;
}

module.exports = OverviewPanel;