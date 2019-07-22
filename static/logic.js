let longestWall = 0;

const hexColumns = 22;
const hexRows = 11;
const hexOffsetX = 64;
const hexOffsetY = 84;
const hexColumnWidth = 96;
const hexRowHeight = 111;
const columnStaggering = 55.5;

const boardWidth = 1920;
const boardHeight = 1080;

const snapRadius = 16;
const gridColumns = 17;
const gridRows = 11;
const gridOffsetX = 112;
const gridOffsetY = 234;
const pointOffsetX = 128;
const pointOffsetY = 258;
const gridColumnWidth = 32;
const gridRowHeight = 55.5;

const red = 0xFF5050;
const yellow = 0xFFFF50;
const green = 0x50FF50;
const blue = 0x50AAFF;
const black = 0x000000;
const backgroundBlue = 0x222233;

const utils = PIXI.utils;
const loader = PIXI.loader;
const Sprite = PIXI.Sprite;
const App = PIXI.Application;
const Graphics = PIXI.Graphics;
const Rectangle = PIXI.Rectangle;
const Container = PIXI.Container;
const FastContainer = PIXI.particles.ParticleContainer;
const TextureCache = PIXI.utils.TextureCache;
const resources = PIXI.loader.resources;

const landTiles = [
    "fieldTile", "fieldTile", "fieldTile", "fieldTile",
    "forestTile", "forestTile", "forestTile", "forestTile",
    "pastureTile", "pastureTile", "pastureTile", "pastureTile",
    "mountainTile", "mountainTile", "mountainTile",
    "hillsTile", "hillsTile", "hillsTile", "desertTile"
];

const portTiles = [
    "Bricks", "Iron", "Wool", "Wood", "Grain",
    "Open", "Open", "Open", "Open"
];

const gridColumnBounds = [
    {lower:1, upper: 9}, {lower:0, upper: 10}, {lower:1, upper: 9},
    {lower:2, upper: 8}, {lower:1, upper: 9},  {lower:2, upper: 8},
    {lower:3, upper: 7}, {lower:2, upper: 8},  {lower:3, upper: 7},
];

const square = (x) => x * x;

const [put, int] = [console.log, parseInt];

const {floor, random, max} = Math;

const [squareRoot, absolute] = [Math.sqrt, Math.abs];

const classifyPoint= function(column, row) {

    /* This helper takes two args that specify the `column` and `row` for
    a given point in the grid. The function classifies the point as one of
    `margin`, `center` or `vertex`, and returns the corresponding string.
    Note that `margin` applies to any point outside of the active part of
    the board, `center` to those points that are in the centers of hex-
    tiles, and `vertex` to points that are on vertices. */

    const bounds = gridColumnBounds[absolute(column - 8)];

    if (row < bounds.lower || row > bounds.upper) return "margin";

    if ((row % 2 && column % 6 === 2) || (column % 6 === 5)) return "center";

    return "vertex";
};

const blit = function(name, x, y, layer) {

    /* This helper takes the `name` of a sprite, some pixel coordinates (`x`
    and `y`) and a `layer` (a `PIXI.Container`). It creates a new sprite,
    blits it into the `layer` at the given coordinates, then returns the
    sprite object. */

    const sprite = new Sprite(resources[name].texture);

    sprite.position.set(x, y);
    layer.addChild(sprite);

    return sprite;
};

const join = function(start, end, color, layer) {

    /* This helper takes two `grid` points (the `start` and `end` points of
    a line), a (hexidecimal RGB) `color` and a `layer` (a `PIXI.Container`).
    It draws a 2px line from the `start` point to the `end` point, in the
    given color, to the given `layer`, then returns `undefined`. */

    const graphics = new Graphics();
    const vector = {x: end.x - start.x, y: end.y - start.y};
    const radius = 1;

    layer.addChild(graphics);

    graphics.position.set(start.x, start.y);
    graphics.beginFill(color);
    graphics.lineStyle(5, color);
    graphics.moveTo(0, 0).lineTo(vector.x, vector.y);
    graphics.drawCircle(0, 0, radius).drawCircle(vector.x, vector.y, radius);
    graphics.endFill();
};

const shuffle = function(deck) {

    /* This helper takes an array (`deck`) as its only argument, and then
    shuffles its items (randomly mutating the array in place). The return
    value is always `undefined`. This is used for shuffling the two decks
    of tiles (`landTiles` and `portTiles`) before laying out a new board. 

    Algorithm: `stackoverflow.com/a/12646864/1253428`. */

    for (let index = deck.length - 1; index > 0; index--) {

        const noise = floor(random() * (index + 1));

        [deck[index], deck[noise]] = [deck[noise], deck[index]];
    }
};

const distance = function(mouse, point) {

    /* This helper takes two args, a reference to the mouse and a point on
    the grid. It returns the distance between the mouse and the point (in
    pixels). */

    return squareRoot(square(mouse.x - point.x) + square(mouse.y - point.y));
};

const snapToGrid = function(mouse, grid) {

    /* This helper takes the current mouse coordinates (as its first two args)
    and a reference to the `grid` array. It returns the closest point if that
    point is within 16px of the mouse pointer, else returning `undefined`. */

    let point;

    const column = floor((mouse.x - gridOffsetX) / gridColumnWidth);
    const row = floor((mouse.y - gridOffsetY) / gridRowHeight);

    if (column % 2 + row % 2 !== 1) return undefined;

    try { point = grid[column][row] } catch { return undefined }

    if (point && distance(mouse, point) <= snapRadius) return point;
};

const tileSelector = function() {

    /* This function takes no args and returns a function for selecting
    random hextiles. Every time this function is invoked, it reshuffles
    the `landTiles` and `portTiles` decks, before returning a function
    that can then randomly deal *valid* hextiles. That function takes
    two args, the integer coordinates (`x` and `y`) for the location
    of the hextile being placed. This functionality makes it easy
    to generate valid boards at random. */

    const layout = [
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, "northWest", false, "southWest", false, null],
        [null, null, null, false, true, true, true, "southWest", null],
        [null, null, "north", true, true, true, true, false, null],
        [null, null, false, true, true, true, true, true, "south", null],
        [null, null, "north", true, true, true, true, false, null],
        [null, null, null, false, true, true, true, "southEast", null],
        [null, null, null,  "northEast", false,  "southEast", false, null],
    ];

    let landIndex = 0;
    let portIndex = 0;

    shuffle(landTiles);
    shuffle(portTiles);

    return function(x, y) {

        const column = layout[x];

        if (column === undefined) return "nullTile";

        const data = column[y];

        if (data === undefined || data === null) return "nullTile";

        if (data === false) return "waterTile";

        if (data === true) return landTiles[landIndex++];

        const angle = data;
        const trade = portTiles[portIndex++];
        const ratio = trade === "Open" ? "Harbor" : "Port";

        return angle + ratio + trade + "Tile";
    };
};

const updateLongestWall = function(point) {

    // const visit = function(point, visited) {

    //     let bestLine, bestFork, bestLineA, bestForkA, bestLineB, bestForkB;

    //     const isUnvisited = (point) => ! visited.includes(point);

    //     const unvisited = point.connections.filter(isUnvisited);

    //     visited.push(point);

    //     if (unvisited.length === 0) { put("end", point); return [1, 0] };

    //     if (unvisited.length === 1) {

    //         put("stage", point);
    //         [bestLine, bestFork] = visit(unvisited[0], visited);
    //         return [bestLine + 1, bestFork];
    //     }

    //     put("fork", point);
    //     [bestLineA, bestForkA] = visit(unvisited[0], visited);
    //     [bestLineB, bestForkB] = visit(unvisited[1], visited);

    //     bestLine = max(bestLineA, bestLineB);
    //     bestFork = bestForkA + bestForkB;

    //     if (bestLineA + bestLineB > bestFork) bestFork = bestLineA + bestLineB;

    //     return [bestLine + 1, bestFork];
    // };

    // longestWall = max(longestWall, max(...visit(point, [])));

    const types = ["impossible", "terminal", "stage", "junction"];

    const visit = function(point, visited) {

        visited.push(point);

        if (point.owner !== undefined && point.owner !== player) {

            put(point.column, point.row, "break");

        } else put(point.column, point.row, types[point.connections.length]);

        for (let connection of point.connections) {

            if (!visited.includes(connection)) visit(connection, visited);
        }
    };

    put("traversal...");
    visit(point, []);
};

const setup = function() {

    // initialize the pixi application and bolt everything together...

    utils.skipHello();

    const app = new App({
        width: boardWidth,
        height: boardHeight,
        backgroundColor: backgroundBlue
    });

    const board = new Container();
    const units = new Container();
    const walls = new Container();
    const hover = new Container();

    app.stage.addChild(board);
    app.stage.addChild(walls);
    app.stage.addChild(units);
    app.stage.addChild(hover);

    app.stage.interactive = true;
    document.body.appendChild(app.view);

    // layout the background using the hextile sprites...

    const selector = tileSelector();

    for (let x = 0; x < hexColumns; x++) for (let y = 0; y < hexRows; y++) {

        const tile = new Sprite(resources[selector(x, y)].texture);

        tile.x = x * hexColumnWidth - hexOffsetX;
        tile.y = y * hexRowHeight - hexOffsetY + (x % 2 * columnStaggering);

        board.addChild(tile);
    }

    // generate the `grid` (the 2D array of point objects)...

    const grid = [];

    for (let column = 0; column < gridColumns; column++) {

        grid.push([]);

        for (let row = 0; row < gridRows; row++) grid[column].push({
            x: pointOffsetX + column * gridColumnWidth,
            y: pointOffsetY + row * gridRowHeight,
            type: classifyPoint(column, row),
            state: "empty", connections: [],
            owner: undefined, column, row,
        });
    }

    // setup the mouse event handlers...

    let onHoverSprite;

    app.stage.on("mousemove", function(event) {

        const point = snapToGrid(event.data.global, grid);
        
        hover.removeChild(onHoverSprite);

        if (point === undefined || point.type !== "vertex") return;

        if (player.mode === "settle") {

            if (point.state === "empty") {

                const name = player.color + "Fort";

                onHoverSprite = blit(name, point.x - 32, point.y - 32, hover);

            } else if (point.state === "fort") {

                onHoverSprite = blit("tower", point.x - 5, point.y - 5, hover);
            }
        }
    });

    app.stage.on("mouseup", function(event) {

        let sprite;

        const point = snapToGrid(event.data.global, grid);

        if (point === undefined || point.type !== "vertex") return;

        if (player.mode === "settle") {

            if (point.state === "empty") {

                const name = player.color + "Fort";

                blit(name, point.x - 32, point.y - 32, units);
                point.owner = player;
                point.state = "fort";

            } else if (point.state === "fort") {

                blit("tower", point.x - 5, point.y - 5, units);
                point.state = "tower";

            } else return;

            player.mode = "default";
            hover.removeChild(onHoverSprite);

        } else if (player.mode === "startingWall") {

            player.startingPoint = point;
            player.mode = "endingWall";
        
        } else if (player.mode === "endingWall") {

            if (int(distance(player.startingPoint, point)) !== 64) return;

            player.startingPoint.connections.push(point);
            point.connections.push(player.startingPoint);

            join(player.startingPoint, point, player.rgb, walls);

            player.startingPoint = null;
            player.mode = "startingWall"; // TODO: put back to `initial`
            updateLongestWall(point);
        }
    });
};

const tileData = [

    {name: "tower", url: "/static/sprites/forts/tower.png"},

    {name: "redFort", url: "/static/sprites/forts/red.png"},
    {name: "yellowFort", url: "/static/sprites/forts/yellow.png"},
    {name: "greenFort", url: "/static/sprites/forts/green.png"},
    {name: "blueFort", url: "/static/sprites/forts/blue.png"},

    {name: "fieldTile", url: "/static/sprites/tiles/land/field.png"},
    {name: "forestTile", url: "/static/sprites/tiles/land/forest.png"},
    {name: "desertTile", url: "/static/sprites/tiles/land/desert.png"},
    {name: "mountainTile", url: "/static/sprites/tiles/land/mountain.png"},
    {name: "pastureTile", url: "/static/sprites/tiles/land/pasture.png"},
    {name: "hillsTile", url: "/static/sprites/tiles/land/hills.png"},
    {name: "waterTile", url: "/static/sprites/tiles/land/water.png"},
    {name: "nullTile", url: "/static/sprites/tiles/land/null.png"},

    {name: "northHarborBricksTile", url: "/static/sprites/tiles/harbors/north/bricks.png"},
    {name: "northHarborWoolTile", url: "/static/sprites/tiles/harbors/north/wool.png"},
    {name: "northHarborWoodTile", url: "/static/sprites/tiles/harbors/north/wood.png"},
    {name: "northHarborGrainTile", url: "/static/sprites/tiles/harbors/north/grain.png"},
    {name: "northHarborIronTile", url: "/static/sprites/tiles/harbors/north/iron.png"},
    {name: "northHarborOpenTile", url: "/static/sprites/tiles/harbors/north/open.png"},

    {name: "northEastHarborBricksTile", url: "/static/sprites/tiles/harbors/north_east/bricks.png"},
    {name: "northEastHarborWoolTile", url: "/static/sprites/tiles/harbors/north_east/wool.png"},
    {name: "northEastHarborWoodTile", url: "/static/sprites/tiles/harbors/north_east/wood.png"},
    {name: "northEastHarborGrainTile", url: "/static/sprites/tiles/harbors/north_east/grain.png"},
    {name: "northEastHarborIronTile", url: "/static/sprites/tiles/harbors/north_east/iron.png"},
    {name: "northEastHarborOpenTile", url: "/static/sprites/tiles/harbors/north_east/open.png"},

    {name: "northWestHarborBricksTile", url: "/static/sprites/tiles/harbors/north_west/bricks.png"},
    {name: "northWestHarborWoolTile", url: "/static/sprites/tiles/harbors/north_west/wool.png"},
    {name: "northWestHarborWoodTile", url: "/static/sprites/tiles/harbors/north_west/wood.png"},
    {name: "northWestHarborGrainTile", url: "/static/sprites/tiles/harbors/north_west/grain.png"},
    {name: "northWestHarborIronTile", url: "/static/sprites/tiles/harbors/north_west/iron.png"},
    {name: "northWestHarborOpenTile", url: "/static/sprites/tiles/harbors/north_west/open.png"},    

    {name: "southHarborBricksTile", url: "/static/sprites/tiles/harbors/south/bricks.png"},
    {name: "southHarborWoolTile", url: "/static/sprites/tiles/harbors/south/wool.png"},
    {name: "southHarborWoodTile", url: "/static/sprites/tiles/harbors/south/wood.png"},
    {name: "southHarborGrainTile", url: "/static/sprites/tiles/harbors/south/grain.png"},
    {name: "southHarborIronTile", url: "/static/sprites/tiles/harbors/south/iron.png"},
    {name: "southHarborOpenTile", url: "/static/sprites/tiles/harbors/south/open.png"},

    {name: "southEastHarborBricksTile", url: "/static/sprites/tiles/harbors/south_east/bricks.png"},
    {name: "southEastHarborWoolTile", url: "/static/sprites/tiles/harbors/south_east/wool.png"},
    {name: "southEastHarborWoodTile", url: "/static/sprites/tiles/harbors/south_east/wood.png"},
    {name: "southEastHarborGrainTile", url: "/static/sprites/tiles/harbors/south_east/grain.png"},
    {name: "southEastHarborIronTile", url: "/static/sprites/tiles/harbors/south_east/iron.png"},
    {name: "southEastHarborOpenTile", url: "/static/sprites/tiles/harbors/south_east/open.png"},

    {name: "southWestHarborBricksTile", url: "/static/sprites/tiles/harbors/south_west/bricks.png"},
    {name: "southWestHarborWoolTile", url: "/static/sprites/tiles/harbors/south_west/wool.png"},
    {name: "southWestHarborWoodTile", url: "/static/sprites/tiles/harbors/south_west/wood.png"},
    {name: "southWestHarborGrainTile", url: "/static/sprites/tiles/harbors/south_west/grain.png"},
    {name: "southWestHarborIronTile", url: "/static/sprites/tiles/harbors/south_west/iron.png"},
    {name: "southWestHarborOpenTile", url: "/static/sprites/tiles/harbors/south_west/open.png"},    

    {name: "northPortBricksTile", url: "/static/sprites/tiles/ports/north/bricks.png"},
    {name: "northPortWoolTile", url: "/static/sprites/tiles/ports/north/wool.png"},
    {name: "northPortWoodTile", url: "/static/sprites/tiles/ports/north/wood.png"},
    {name: "northPortGrainTile", url: "/static/sprites/tiles/ports/north/grain.png"},
    {name: "northPortIronTile", url: "/static/sprites/tiles/ports/north/iron.png"},
    {name: "northPortOpenTile", url: "/static/sprites/tiles/ports/north/open.png"},

    {name: "northEastPortBricksTile", url: "/static/sprites/tiles/ports/north_east/bricks.png"},
    {name: "northEastPortWoolTile", url: "/static/sprites/tiles/ports/north_east/wool.png"},
    {name: "northEastPortWoodTile", url: "/static/sprites/tiles/ports/north_east/wood.png"},
    {name: "northEastPortGrainTile", url: "/static/sprites/tiles/ports/north_east/grain.png"},
    {name: "northEastPortIronTile", url: "/static/sprites/tiles/ports/north_east/iron.png"},
    {name: "northEastPortOpenTile", url: "/static/sprites/tiles/ports/north_east/open.png"},

    {name: "northWestPortBricksTile", url: "/static/sprites/tiles/ports/north_west/bricks.png"},
    {name: "northWestPortWoolTile", url: "/static/sprites/tiles/ports/north_west/wool.png"},
    {name: "northWestPortWoodTile", url: "/static/sprites/tiles/ports/north_west/wood.png"},
    {name: "northWestPortGrainTile", url: "/static/sprites/tiles/ports/north_west/grain.png"},
    {name: "northWestPortIronTile", url: "/static/sprites/tiles/ports/north_west/iron.png"},
    {name: "northWestPortOpenTile", url: "/static/sprites/tiles/ports/north_west/open.png"},    

    {name: "southPortBricksTile", url: "/static/sprites/tiles/ports/south/bricks.png"},
    {name: "southPortWoolTile", url: "/static/sprites/tiles/ports/south/wool.png"},
    {name: "southPortWoodTile", url: "/static/sprites/tiles/ports/south/wood.png"},
    {name: "southPortGrainTile", url: "/static/sprites/tiles/ports/south/grain.png"},
    {name: "southPortIronTile", url: "/static/sprites/tiles/ports/south/iron.png"},
    {name: "southPortOpenTile", url: "/static/sprites/tiles/ports/south/open.png"},

    {name: "southEastPortBricksTile", url: "/static/sprites/tiles/ports/south_east/bricks.png"},
    {name: "southEastPortWoolTile", url: "/static/sprites/tiles/ports/south_east/wool.png"},
    {name: "southEastPortWoodTile", url: "/static/sprites/tiles/ports/south_east/wood.png"},
    {name: "southEastPortGrainTile", url: "/static/sprites/tiles/ports/south_east/grain.png"},
    {name: "southEastPortIronTile", url: "/static/sprites/tiles/ports/south_east/iron.png"},
    {name: "southEastPortOpenTile", url: "/static/sprites/tiles/ports/south_east/open.png"},

    {name: "southWestPortBricksTile", url: "/static/sprites/tiles/ports/south_west/bricks.png"},
    {name: "southWestPortWoolTile", url: "/static/sprites/tiles/ports/south_west/wool.png"},
    {name: "southWestPortWoodTile", url: "/static/sprites/tiles/ports/south_west/wood.png"},
    {name: "southWestPortGrainTile", url: "/static/sprites/tiles/ports/south_west/grain.png"},
    {name: "southWestPortIronTile", url: "/static/sprites/tiles/ports/south_west/iron.png"},
    {name: "southWestPortOpenTile", url: "/static/sprites/tiles/ports/south_west/open.png"},    

];

// START TEST CODE

addEventListener("keydown", function(event) {

    if (event.key === "Enter") player.mode = "settle";
    else if (event.key === "Backspace") player.mode = "startingWall";
    else if (["1", "2", "3", "4"].includes(event.key)) {

        player.mode = "initial";
        player = players[int(event.key) - 1];
    }
});

const players = [
    {color: "red", rgb: red, mode: "startingWall", startingPoint: null},
    {color: "yellow", rgb:  yellow, mode: "startingWall", startingPoint: null},
    {color: "green", rgb:  green, mode: "startingWall", startingPoint: null},
    {color: "blue", rgb:  blue, mode: "startingWall", startingPoint: null},
];

let player = players[0];

// END TEST CODE

loader.add(tileData).load(setup);
