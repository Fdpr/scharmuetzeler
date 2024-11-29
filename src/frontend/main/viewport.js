const svg = d3.select('svg')
const appPath = require('@electron/remote').app.getAppPath();
const message = require('@electron/remote').getGlobal('notificationManager').message;
console.log(appPath);

// Define variables for your grid.
const gridSize = 100;
const gridColor = '#a4a4a4';

async function setUp() {

    const imgSquares = 30;
    const bgImg = await d3.image(appPath + '/test/Orkkrieg.png')

    const scaling = bgImg.width / (imgSquares * gridSize);
    const bgWidth = bgImg.width * scaling;
    const bgHeight = bgImg.height * scaling;


    // Set background image
    const bg = svg.append('image')
        .attr('xlink:href', appPath + '/test/Orkkrieg.png')
        .attr('width', bgWidth)
        .attr('height', bgHeight)
    

    function updateBg(zoomEvent) {
        bg
        .attr('width', bgWidth * zoomEvent.transform.k)
        .attr('height', bgHeight * zoomEvent.transform.k)
        .attr('x', zoomEvent.transform.x)
        .attr('y', zoomEvent.transform.y);
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
            .attr('opacity', Math.min(zoomEvent.transform.k * 2, 1)); // Lower opacity as the pattern gets more dense.
    }

    // Place all svg content inside of a group, adjacent to the backdrop rect.
    var content = svg.append('g').attr('id', 'content');
    

    // Call d3.zoom to enable zooming/panning in this svg.
    svg.call(d3.zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => {
            content.attr('transform', event.transform);
            updateGrid(event); // We need to update the grid with every zoom event.
            updateBg(event); // We need to update the background with every zoom event.
        }));
}

function drawTokens(selection, tokens) {
    const tokenGroup = selection
        .selectAll('g.token')
        .data(tokens, d => d.id) // Bind data by a unique ID or other unique property
        .join(
            enter => {
                const g = enter.append('g')
                    .attr('class', 'token')
                    .attr('transform', d => `translate(${d.x}, ${d.y})`)
                    .attr("token-id", d => d.id);

                // Token base circle
                g.append('circle')
                    .attr('class', 'token-circle')
                    .attr('r', d => d.radius)
                    .attr('fill', d => d.outline ? 'transparent' : '#ccc') // Default fill
                    .attr('stroke', d => d.outline ? d.outline.color || 'red' : 'none') // Outline
                    .attr('stroke-width', d => d.outline ? d.outline.width || 2 : 0);

                // Image clipped inside the circle
                g.append('clipPath')
                    .attr('id', (d, i) => `clip-${i}`)
                    .append('circle')
                    .attr('r', d => d.radius);

                g.append('image')
                    .attr('class', 'token-image')
                    .attr('xlink:href', d => d.image || '')
                    .attr('x', d => -d.radius) // Center the image
                    .attr('y', d => -d.radius)
                    .attr('width', d => d.radius * 2)
                    .attr('height', d => d.radius * 2)
                    .attr('clip-path', (d, i) => `url(#clip-${i})`);

                // Label above the circle
                g.append('text')
                    .attr('class', 'token-label')
                    .attr("filter", "url(#solid)")
                    .attr('y', d => d.radius + 5) // Position below the circle
                    .attr('text-anchor', 'middle') // Centered text
                    .text(d => d.label || '');

                g.call(d3.drag()
                    .on('start', function(event, d) {
                        d3.select(this).raise().classed('active', true);
                    })
                    .on('drag', (event, d) => {
                        d.x = event.x;
                        d.y = event.y;
                        g.attr('transform', d => `translate(${d.x}, ${d.y})`);
                    })
                    .on('end', function(event, d) {
                        d3.select(this).classed('active', false);
                        message(`Token ${d3.select(this).attr("token-id")} updated: ${d3.select(this).attr("transform")}`);
                    }));

                return g;
            },
            update => update
                .attr('transform', d => `translate(${d.x}, ${d.y})`)
                .select('circle')
                .attr('stroke', d => d.outline ? d.outline.color || 'red' : 'none') // Update outline
                .attr('stroke-width', d => d.outline ? d.outline.width || 2 : 0),
            exit => exit.remove()
        );
}


setUp().then(() => {

    const tokens = [
        {
            id: 1,
            x: 100,
            y: 100,
            radius: 30,
            image: appPath + '/test/Allwiss.png',
            outline: { color: 'blue', width: 3 },
            label: 'Token 1'
        },
        {
            id: 2,
            x: 200,
            y: 150,
            radius: 50,
            image: appPath + '/test/alwene.png',
            outline: { color: 'green', width: 5 },
            label: 'Token 2'
        }
    ];
    
    drawTokens(d3.select("#content"), tokens);
    
});