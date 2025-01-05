# Scharmützeler
> _Inauthentische DSA 4.1-Scharmützelschlachten waren noch nie so einfach._

__Scharmützeler__ ist ein Schlachtensimulator zum schnellen Ausspielen von größeren Schlachten in einem gehausregelten System der DSA 4.1-Scharmützelregeln. Scharmützeler beinhaltet eine graphische Oberfläche in Form eines Virtual Tabletop und berechnet die Kampfhandlungen der Schlacht automatisch.
## Installation
Empfohlen: node v.6.14.2 
- Klonen des Repository
- `npm install` zum Installieren der `node_modules`
- `npm start` zum Starten des Programms (es empfiehlt sich, in der `main.js` die Flag `isDev` auf `true` zu setzen)

Alternativ ist die aktuelle Version unter `Releases` als Zip-Bundle mit EXE abgelegt.
## Benutzeranleitung
### Einrichten
Nach dem ersten Starten legt Scharmützeler einen Ordner im `Dokumente`-Verzeichnis des aktuellen Users an. Hier können Workspaces erstellt werden. Ein Workspace ist ein Ordner, der alle relevanten Dateien für eine Schlacht enthält. Diese Dateien sind:
- Bilder, die als Hintergrundbild oder für Tokens verwendet werden
- Stylesheets zum Verändern der Darstellung (wie das Styling der Tokens verändert werden kann, wird in dem Beispiel-Stylesheet `style.css` erklärt)
- Speicherdateien (im `JSON`-Format)

Scharmützeler hat nur Zugriff auf die Dateien im Workspace, es müssen also alle Dateien direkt in diesen Ordner gelegt werden (Unterverzeichnisse werden ignoriert).

Ein Workspace wird über __Workspace öffnen__ in der Menüleiste geöffnet und bleibt dann geladen, bis Scharmützeler geschlossen oder ein anderer Workspace geladen wird. Um den aktuellen Stand der Schlacht zu speichern, existiert der Knopf __Workspace speichern__ in der Menüleiste (alternativ: `Strg+s`, wenn das Hauptfenster fokussiert wird).
### Navigation
Tokens im Tabletop können durch Klicken angewählt werden und per Drag-n-Drop verschoben werden. Es empfiehlt sich, das aktuelle Token per Styling zu highlighten. Ein angewähltes Token bildet um sich ein rotes Quadrat (die Geschwindigkeit der Einheit in Kästchen) und eventuell ein blaues Quadrat (wenn es eine Fernkampfwaffe hat, ist dies die Schussreichweite. Bedenke, dass eine Einheit über die Schussreichweite hinweg Ziele treffen kann, aber nur mit deutlich höherer Erschwernis). Eine Einheit kann mit `Entf` gelöscht werden.
### Die Phasen
Oben links im Viewport werden die aktuelle Phase und Runde der Schlacht angezeigt. Eine Schlacht beginnt immer bei Runde 0. Diese ist nur für Setup-Zwecke da, um also Truppen und Parteien zu erstellen und ihre Positionen zu initialisieren. Um in die nächste Phase zu wechseln, kann entweder der Knopf `Fortsetzen` in der Menüleiste gewählt, oder auf `Enter` oder `c` gedrückt werden. Die Fortsetzen-Aktion hat darüber hinaus noch weitere Verwendungszwecke.

Sobald in Runde 1 gewechselt wird, beginnt die Schlacht.
#### Manöverphase
In der Manöverphase können Truppen Manöver und Anführer Anführer-Aktionen ausführen. Hierfür muss eine Einheit ausgewählt sein. Durch Drücken und Halten von `a` wird ein Hover-Menü aufgerufen. Dieses zeigt die jeweiligen Manöver/Anführer-Aktionen, die die gewählte Einheit ausführen kann. Mit der Maus kann durch Hovern eines ausgewählt werdne und durch Loslassen von `a` wird es bestätigt und sofort ausgeführt.

Manche Manöver benötigen ein oder mehrere Ziele. In diesem Fall wird die Auswahl der Ziele aufgefordert und oben links erscheint ein entsprechender Text. Ein Ziel wird durch Doppelklick auf das Token ausgewählt. Sobald die Maximalzahl der auswählbaren Ziele erreicht wird, wird das Manöver/die Anführer-Aktion sofort ausgeführt. Durch `Fortsetzen` kann dies aber auch früher geschehen (sollen zum Beispiel nur 3 Ziele ausgewählt werden, obwohl mehr möglich wären). `Esc` bricht die Auswahl ab. Mit `r` kann die Ausführung eines Manövers/einer Anführer-Aktion rückgängig gemacht werden.

Erscheint kein Hover-Menü, so kann die gewählte Einheit kein Manöver/keine Heldenaktion diese Runde (mehr) ausführen.

Durch `Fortsetzen` wird die Manöverphase beendet und es wird zur Kampfphase gewechselt.
#### Kampfphase
In der Kampfphase können Truppen Aktionen wählen -- die Handhabe ist identisch zur Manöverphase. Die Aktionen werden jedoch nicht sofort ausgeführt, sondern werden in eine Liste gespeichert.

Sobald alle Aktionen ausgewählt wurden, die diese Runde durchgeführt werden, kann mit `Fortsetzen` fortgefahren werden. Mit `r` ist es möglich, zur Manöverphase zurückzukehren, falls versehentlich zu früh in die Kampfphase gewechselt wurde.
#### Kampfphase [Defaults]
Alle Truppen, die keine Aktion zugewiesen bekommen haben, kriegen in dieser Phase eine Defaultaktion, die abhängig davon ist, ob sie letzte Runde ein Ziel im Nahkampf, Fernkampf oder gar nicht angegriffen haben. Die Reihenfolge der Aktionen wird außerdem so sortiert, dass die Truppen möglichst in der gleichen Reihenfolge agieren wie in der letzten Runde. Hier können noch letzte Veränderungen an der Reihenfolge gemacht werden, mehr dazu im Abschnitt __Timeline-Editor__. 

Durch `Fortsetzen` werden die Aktionen nacheinander ausgeführt. Mit `r` kann in die Kampfphase zurückgewechselt werden, um zum Beispiel Default-Aktionen auszutauschen.
#### Kampfhase [unterbrochen]
Wenn bei der Ausführung der Aktionen ein Fehler auftritt und eine Truppe ihre gewählte Aktion nich ausführen kann, so wird die Ausführung pausiert und es muss eine Ersatzaktion gewählt werden. Diese wird an Ort und Stelle ersetzt und danach fährt die Ausführung der Aktionen automatisch fort.
#### Kampfphase [Ende]
Nach der Ausführung der Aktionen wird mit `Fortsetzen` die nächste Runde begonnen.
### Admin-Panel
Das __Admin-Panel__ wird über den gleichnamigen Button in der Menüleiste (oder das Tastenkürzel `1`) aufgerufen. Hier kann der Workspace konfiguriert werden.
#### Waffen-Editor
Hier können neue Waffen erstellt werden. Die hier erstellten Waffen stehen den Truppen bei der Erstellung als Möglichkeit offen. Nahkampfwaffen sollten -99 als FK-Modifikator bekommen und Fernkampfwaffen -99 als AT-Modifikator.

Für die _Reichweite_ gilt:
- 0 sind normale Nahkampfwaffen
- 1 sind lange Pikenwaffen
- \>2 sind Fernkampfwaffen
#### Zustands-Editor
Hier können neue Zustände erstellt werden (zum Beispiel _brennend_ für brennende Gegner). Diese Zustände verhalten sich identisch zu den vorgefertigten Zuständen.
#### Proben Würfeln / Schaden
Hier können Truppen Proben abverlangt werden. Beachte, dass diese Auswirkungen haben. Eine hier gescheiterte Moralprobe senkt den Moralwert der Truppe, eine PA-Probe erhöht den Paradezähler etc. Eine positive Erschwernis erschwert die Probe, eine negative erleichtert sie.

__Aktuellen Wert anzeigen__ berechnet unter Einbezug aller Modifikatoren (Zustände, Anführerbonus, Mods) den aktuellen Wert einer Truppe.

Unter __Schaden hinzufügen__ kann einer Truppe direkt Schaden erteilt werden. Negativer Schaden heilt die Truppe. Zustände für niedrige Lebensenergie werden hier automatisch verteilt oder abgezogen.
#### Partei-Editor
Hier können die Parteien für die Schlacht festgelegt werden. Dies ist __nur während des Setups möglich!__ Danach ist dieses Feld ausgegraut. Die Reihenfolge der Parteien ist für die Anzeige im Admin-Panel und die Zugreihenfolge während der Kampfphase relevant. Die Truppen agieren dort in der Reihenfolge der Parteien, wie sie hier festgelegt wurden.
#### Hintergrundbild
Im Viewport kann ein einzelnes Hintergrundbild angezeigt werden, das hier festgelegt, positioniert und skaliert werden kann. Die _Breite_ ist die Breite des Bildes in Kästchen.
#### Timeline-Einstellungen
Die _Aktionen pro Block_ sind die Anzahl an Aktionen, die eine Partei während der Kampfphase hintereinander ausführt, bevor die nächste Partei an der Reihe ist. Standardmäßig werden immer drei Aktionen ausgeführt.

Die _Pause zwischen Aktionen_ gilt nur für die Ausführung von Aktionen während der Kampfphase und hat nur ästhetische Zwecke. Sie sollte aber nicht auf weniger als 50ms gesetzt werden.

### Truppen-Editor
Der __Truppen-Editor__ ist entweder über die Menüleiste zu öffnen (zum Erstellen von neuen Truppen) oder per Doppelklick auf eine Truppe im Viewport (alternativ Tastenkürzel `e`). Hier können alle Werte für eine Truppe erstellt werden. Eine Erläuterung jedes Wertes findet sich in den Regeln.

Zu beachten ist das Feld __voller Editor__. Dieses ist standardmäßig deaktiviert beim Erstellen von neuen Truppen und aktiviert beim Bearbeiten. Der Unterschied ist, dass im vollen Editor alle Werte, auch die dynamischen Werte sowie Zustände, Modifikatoren und Immunitäten verändert werden können. Dies hat zur Konsequenz, dass zum Beispiel eine Anpassung der maximalen Lebenspunkte die aktuellen Lebenspunkte nicht verändert. Im nicht-vollen Editor werden nach Abspeichern die dynamischen Werte immer entsprechend der statischen Werte gesetzt (also aktuelle LeP auf maximale LeP, aktuelle MO auf Basis-MO...). Wird eine existierende Truppe angepasst, muss dies manuell gemacht werden. Die dynamischen Werte sollten nur mit Vorsicht selbst angepasst werden, da invalide Eingaben bei _Anführer_ oder _Nahkampf-Ziel_ das Programm zum Absturz bringen können.

Per _Löschen_ kann eine Truppe hier gelöscht werden. _Speichern_ erstellt / updatet sie im Viewport. Wird der Name der Truppe verändert, so wird stattdessen eine Kopie erstellt. So können Truppen leicht dupliziert werden.
### Anführer-Editor
Genau wie der __Truppen-Editor__.
### Timeline-Editor
Der __Timeline-Editor__ kann über die Menüleiste oder das Tastenkürzel `2` geöffnet werden. Hier wird für jede Phase eine Übersicht über die Aktionen / Anführer-Aktionen / Manöver erstellt. Der Timeline-Editor ist das einzige Panel, was sich in Echtzeit updatet!

Während der __Manöverphase__ werden hier tabellarisch die bereits durchgeführten Manöver / Anführer-Aktionen gelistet sowie diejenigen Einheiten, die noch welche ausführen können.

Während der __Kampfphase__ und der __Kampfphase [Defaults]__ werden hier für jede Partei die gelisteten Aktionen angezeigt sowie die Truppen, die noch freie Aktionen haben. Die Zeilen werden dabei entsprechend der Block-Größe eingefärbt. Um die Reihenfolge von Aktionen zu verändern, können sie in der Tabelle angewählt werden (per Mausklick; eine gewählte Aktion wird _hellblau_ hinterlegt) und dann mit den __Pfeiltasten__ nach oben und unten verschoben. Durch Drücken von `Entf` wird sie aus der Liste gelöscht.

Während der __Kampfphase [Ausführung]__ zeigt der Editor die Liste von Aktionen, in der entsprechend der Blockgröße die Aktionen einsortiert wurden. Die aktuelle Position in der Liste wird hell unterlegt.

### Übersicht
Die __Truppenübersicht__ kann über die Menüleiste oder das Tastenkürzel `3` geöffnet werden. Hier wird jede Truppe jeder Partei tabellarisch aufgelistet mit den wichtigsten Werten, um sich einen Überblick über den aktuellen Zustand verschaffen zu können. Bedenke, dass sich die Übersicht nicht automatisch updatet. Sie zeigt immer nur einen Snapshot vom Zeitpunkt des Aufrufens.

### Dev-Tools
Hier kann die Entwicklerkonsole aufgerufen werden, um zum Beispiel Error-Logs anzuzeigen (Warnung: Es werden nur Errors geloggt, die entstehen, nachdem die Konsole geöffnet wurde. Öffnet man sie, nachdem ein Fehler aufgetreten ist, wird dieser nicht angezeigt). Im Admin-Fenster werden die Dev-Tools mit dem Kürzel `Strg+Shift+i` aufgerufen.

### Laden und Öffnen
Nach jeder Runde wird der aktuelle Stand automatisch gespeichert. Alle Speicherstände werden mit einem Timecode versehen.

Einen Speicherstand zu laden, ist im Moment noch etwas umständlich: Der Speicherstand muss in `state.json` umbenannt werden und wird dann automatisch geladen, sobald der Workspace geöffnet wird.




