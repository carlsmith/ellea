const hexRows = 11;
const hexColumns = 22;
const hexOffsetX = 64;
const hexOffsetY = 84;
const hexColumnWidth = 96;
const hexRowHeight = 111;
const columnStaggering = 55.5;

const boardWidth = 1920;
const boardHeight = 1080;

const snapRadius = 16;
const gridRows = 19;
const gridColumns = 59;
const gridOffsetX = 16;
const gridOffsetY = 12;
const pointOffsetX = 32;
const pointOffsetY = 36;
const gridColumnWidth = 32;
const gridRowHeight = 55.5;

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

const put = console.log;

const square = x => x * x;

const {floor, random } = Math;

const squareRoot = Math.sqrt;

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

    if (column % 2 + row % 2 === 1) return undefined;

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
        [null, null, null, null, null, null, null, null],
        [null, null, "northWest", false, "southWest", false],
        [null, null, false, true, true, true, "southWest"],
        [null, "north", true, true, true, true, false],
        [null, false, true, true, true, true, true, "south"],
        [null, "north", true, true, true, true, false],
        [null, null, false, true, true, true, "southEast"],
        [null, null,  "northEast", false,  "southEast", false],
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

const setup = function() {

    // initialize the pixi application and bolt everything together...

    utils.skipHello();

    const app = new App({
        width: boardWidth, height: boardHeight, backgroundColor: backgroundBlue
    });
    
    const board = new Container();
    const graphics = new Graphics();

    app.stage.interactive = true;
    document.body.appendChild(app.view);
    app.stage.addChild(board);
    app.stage.addChild(graphics);

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
            y: pointOffsetY + row * gridRowHeight
        });
    }

    // setup the mouse movement handler...

    app.stage.on("mousemove", function(event) {

        const point = snapToGrid(event.data.global, grid);

        if (point === undefined) return graphics.clear();

        graphics.clear();
        graphics.beginFill(0xFF0000);
        graphics.lineStyle(2, 0xFFFFFF);
        graphics.drawRect(point.x - 4, point.y - 4, 8, 8);
    });
};

const tileData = [
    {name: "fieldTile", url: "/static/sprites/tiles/land/field.png"},
    {name: "forestTile", url: "/static/sprites/tiles/land/forest.png"},
    {name: "desertTile", url: "/static/sprites/tiles/land/desert.png"},
    {name: "hillsTile", url: "/static/sprites/tiles/land/hills.png"},
    {name: "mountainTile", url: "/static/sprites/tiles/land/mountain.png"},
    {name: "pastureTile", url: "/static/sprites/tiles/land/pasture.png"},
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

loader.add(tileData).load(setup);
