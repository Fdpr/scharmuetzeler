/**
 * This script is responsible for creating and managing the viewport for the game.
 * It uses d3.js to create an SVG element and draw tokens on it.
 * It listens for updates to the gamestate and updates the viewport accordingly.
 * It also sends events to the ActionManager when tokens are clicked or double-clicked.
 */
const path = require('path');
const message = notificationManager.message;

stateManager.subscribe('config', newConfig => setUp(newConfig));

stateManager.subscribe("tokens", (tokens) => drawTokens(d3.select("#content"), tokens));

// Define variables for grid.
const gridSize = 100;
const gridColor = '#a4a4a4';

// Caches the last zoom event so that it remains the same after rerender
let lastZoomEvent = null;
// Same for the stylesheet
let styleSheet = null;
// Also save the config in module scope

/**
 * Basic setup for SVG. Gets called everytime the workspace changes. sets up grid, background and interactivity.
 */
function setUp(newConfig) {
    console.log("Setting up viewport");
    config = newConfig ? newConfig : stateManager.getState("config");

    const svg = d3.select('svg')
    svg.html(''); // Clear the SVG
    // Place all svg content inside of a group, adjacent to the backdrop rect.
    var content = svg.append('g').attr('id', 'content');

    new Promise(async () => {
        // Load the stylesheet
        if (config.workspace && config.styleSheet !== styleSheet) {
            styleSheet = config.styleSheet;
            const styleContent = await fetch(path.join(config.workspace, styleSheet)).then(response => response.text());
            const styleElement = document.createElement('style');
            styleElement.textContent = styleContent;
            document.head.appendChild(styleElement);
        }

        if (config.bgImage) {

            let bgImg;

            try {
                bgImg = await d3.image(path.join(config.workspace, config.bgImage))
            } catch (error) {
                console.log("Error loading background image", error);
                message("Error loading background image");
                bgImg = {
                    width: 100,
                    height: 100
                }
            }

            const scaling = (config.bgImageGridSquares * gridSize) / bgImg.width;
            const bgWidth = bgImg.width * scaling;
            const bgHeight = bgImg.height * scaling;

            const xOff = config.bgImageX || 0;
            const yOff = config.bgImageY || 0;


            // Set background image
            const bg = svg.append('image')
                .attr('xlink:href', config.workspace + '/' + config.bgImage)
                .attr('width', bgWidth)
                .attr('height', bgHeight)
                .attr('x', xOff - bgWidth / 2)
                .attr('y', yOff - bgHeight / 2);


            function updateBg(zoomEvent) {
                bg
                    .attr("transform", zoomEvent.transform)
                //.attr('width', bgWidth * zoomEvent.transform.k)
                //.attr('height', bgHeight * zoomEvent.transform.k)
                //.attr('x', zoomEvent.transform.x)
                //.attr('y', zoomEvent.transform.y);
            }
        } else {
            function updateBg(zoomEvent) { return }
        }

        // Create a pattern element, and give it an id to reference later.
        var pattern = svg.append('pattern')
            .attr('id', 'grid-pattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', gridSize)
            .attr('height', gridSize);
        pattern.append('line')
            .attr('stroke', gridColor)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', gridSize * 30)
            .attr('y2', 0);
        pattern.append('line')
            .attr('stroke', gridColor)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', gridSize * 30);

        // Append a "backdrop" rect to your svg, and fill it with your pattern.
        // You shouldn't need to touch this again after adding it.
        svg.append('rect')
            .attr("id", "grid")
            .attr('fill', 'url(#grid-pattern)')
            .attr('width', '100%')
            .attr('height', '100%');

        // Call this function to modify the pattern when zooming/panning.
        function updateGrid(zoomEvent) {
            svg.select('#grid-pattern')
                .attr('x', zoomEvent.transform.x)
                .attr('y', zoomEvent.transform.y)
                .attr('width', gridSize * zoomEvent.transform.k)
                .attr('height', gridSize * zoomEvent.transform.k)
                .selectAll('line')
                .attr('opacity', Math.min(zoomEvent.transform.k * 1.25, 1)); // Lower opacity as the pattern gets more dense.
        }

        // Call d3.zoom to enable zooming/panning in this svg.
        svg.call(d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                content.attr('transform', event.transform);
                updateGrid(event); // We need to update the grid with every zoom event.
                updateBg(event); // We need to update the background with every zoom event.
                lastZoomEvent = event;
            })
        )
            .on("dblclick.zoom", null);

        // If we have a last zoom event, apply it now.
        if (lastZoomEvent) {
            content.attr('transform', lastZoomEvent.transform);
            updateGrid(lastZoomEvent);
            updateBg(lastZoomEvent);
        }

        // Put content to the front
        content.raise();
        drawTokens(d3.select("#content"), stateManager.getState("tokens"));
    });
}

function drawTokens(selection, tokens) {
    tokens.forEach(t => t.update());
    const tokenGroup = selection.selectAll('g.token')
    tokenGroup
        .data(tokens.map(t => ({ ...t, label: t.text() })), d => d.name) // Bind data by a unique ID or other unique property
        .join(
            enter => {
                const g = enter.append('g')
                    .attr('class', d => d.classes)
                    .attr('transform', d => `translate(${d.x}, ${d.y})`)
                    .attr("token-id", d => d.name);

                // Image clipped inside the circle
                g.append('clipPath')
                    .attr('id', (d, i) => `clip-${i}`)
                    .append('circle')
                    .attr("class", "clip-circle")
                    .attr('r', d => d.radius);

                g.append('image')
                    .attr('class', 'token-image')
                    .attr('xlink:href', d => d.image ? path.join(config.workspace, d.image) : '')
                    .attr('x', d => -d.radius) // Center the image
                    .attr('y', d => -d.radius)
                    .attr('height', d => d.radius * 2)
                    .attr('width', d => d.radius * 2)
                    .attr('clip-path', (d, i) => `url(#clip-${i})`);

                // Token base circle
                g.append('circle')
                    .attr('class', 'token-circle')
                    .attr('r', d => d.radius)
                    .attr('fill-opacity', d => d.image ? '0' : '1') // Default fill

                // Label above the circle
                g.append('text')
                    .attr('class', 'token-label')
                    .attr("filter", "url(#solid)")
                    .attr('y', d => d.radius + 5) // Position below the circle
                    .attr('text-anchor', 'middle') // Centered text
                    .text(d => d.label || '');

                g.on("mousedown", function (event, d) {
                    const name = d.name
                    actionManager.selectToken(d.name);
                    d3.selectAll(".token").classed('selected', d => d.name === name);
                });

                g.call(d3.drag()
                    .on('start', function (event, d) {
                        d3.select(this).raise().classed('active', true);
                        // Square drag line and shoot range
                        const length = d.radius + gridSize * (d.type === "troop" ? stateManager.getTroop(d.name).get("GS") : stateManager.getLeader(d.name).get("GS"));
                        d3.select("#content").append("rect")
                            .attr("id", "drag-line")
                            .attr("x", d.x - length)
                            .attr("y", d.y - length)
                            .attr("width", length * 2)
                            .attr("height", length * 2)
                            .attr("stroke", "red")
                            .attr("stroke-width", 3)
                            .attr("fill", "none");
                        let shootRange = gridSize * (d.type === "troop" ? stateManager.getTroop(d.name).get("reach") : 0);
                        shootRange = shootRange > gridSize ? shootRange : 0;
                        d3.select("#content").append("rect")
                            .attr("id", "shoot-range")
                            .attr("x", d.x - shootRange)
                            .attr("y", d.y - shootRange)
                            .attr("width", shootRange * 2)
                            .attr("height", shootRange * 2)
                            .attr("stroke", "blue")
                            .attr("stroke-width", 3)
                            .attr("fill", "none");
                        /*
                        // Circle drag line and shoot range
                        d3.select("#content").append('circle')
                            .attr("id", "drag-line")
                            .attr("cx", d.x)
                            .attr("cy", d.y)
                            .attr("r", () => {
                                return d.radius + gridSize * (d.type === "troop" ? stateManager.getTroop(d.name).get("GS") : stateManager.getLeader(d.name).get("GS"))
                            })
                            .attr("stroke", "red")
                            .attr("stroke-width", 3)
                            .attr("fill", "none");
                        let shootRange = gridSize * (d.type === "troop" ? stateManager.getTroop(d.name).get("reach") : 0);
                        shootRange = shootRange > 1 ? shootRange : 0;
                        d3.select("#content").append('circle')
                            .attr("id", "shoot-range")
                            .attr("cx", d.x)
                            .attr("cy", d.y)
                            .attr("r", shootRange)
                            .attr("stroke", "blue")
                            .attr("stroke-width", 3)
                            .attr("fill", "none");
                        */
                    })
                    .on('drag', function (event, d) {
                        d.x = Math.round(event.x);
                        d.y = Math.round(event.y);
                        d3.select(this).attr('transform', d => `translate(${d.x}, ${d.y})`);
                    })
                    .on('end', function (event, d) {
                        d3.select(this).classed('active', false);
                        const token = stateManager.getToken(d.name);
                        token.x = d.x;
                        token.y = d.y;
                        stateManager.addToken(token.toJSON());
                        d3.select("#drag-line").remove();
                        d3.select("#shoot-range").remove();
                    }));

                // Forward relevant token events to Action Manager

                g.on("dblclick", function (event, d) {
                    actionManager.doubleClickToken(d.name);
                });

                return g;
            },
            update => {
                update
                    .attr('class', d => d.classes) // Update class
                    .classed('selected', d => actionManager.gamestate.selectedToken === d.name) // Update selection
                update
                    .transition().delay(200).duration(1000)
                    .attr('transform', d => `translate(${d.x}, ${d.y})`)

                update.select(".clip-circle")
                    .attr('r', d => d.radius);

                update.select(".token-circle")
                    .attr('fill-opacity', d => d.image ? "0" : "1") // Default fill
                    .attr('r', d => d.radius)

                update.select("text")
                    .text(d => d.label || '')
                    .attr('y', d => d.radius + 5) // Position below the circle

                update.select("image")
                    .attr('xlink:href', d => d.image ? path.join(config.workspace, d.image) : '')
                    .attr('x', d => -d.radius) // Center the image
                    .attr('y', d => -d.radius)
                    .attr('height', d => d.radius * 2)
                    .attr('width', d => d.radius * 2)


                return update;

            },
            exit => exit.remove()
        );
}

setUp();