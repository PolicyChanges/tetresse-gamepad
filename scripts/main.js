import { Game } from './game.js'
import { setCookie, getCookie, error, log, addEvent, addChild, deepClone, sleep } from './utils.js';

export var games;
 
//var soundHd = new Audio('./snd/sound_hd.ogg');
//var soundShift = new Audio('./snd/sound_shift.ogg');

export var Audio = {
    audioContext: null,
    soundHd: null,
    soundShift: null,
    initAudio: async() => {
        Audio.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        Audio.soundHd = await Audio.loadSound('./snd/sound_hd.ogg');
        Audio.soundShift = await Audio.loadSound('./snd/sound_shift.ogg');
    },
    loadSound: async(url) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await Audio.audioContext.decodeAudioData(arrayBuffer);
    },
    playHd: function() {
        if (!this.soundHd) {
            console.error("Audio buffer not loaded yet.");
            return;
        }
        const source = Audio.audioContext.createBufferSource();
        source.buffer = Audio.soundHd;
        source.connect(Audio.audioContext.destination);
        source.start(0);
    },
    playShift: function() {
        if (!Audio.soundShift) {
            console.error("Audio buffer not loaded yet.");
            return;
        }
        const source = Audio.audioContext.createBufferSource();
        source.buffer = Audio.soundShift;
        source.connect(Audio.audioContext.destination);
        source.start(0);
    },

};


export var gamepadAPI = {
    controller: {},
    turbo: false,
    primaryGamepadIndex: -1,
    connect: function(evt) {
        gamepadAPI.controller = evt.gamepad;
        gamepadAPI.turbo = false;
        for(var i = 0; i < 4; i++){
            let gp = window.navigator.getGamepads()[i];
            if(gp != undefined) gamepadAPI.primaryGamepadIndex = i;
        }
        log('Gamepad connected.');
    },
    disconnect: function(evt) {
        gamepadAPI.turbo = false;
		  log(
			"Gamepad connected at index %d: %s. %d buttons, %d axes.",
			e.gamepad.index,
			e.gamepad.id,
			e.gamepad.buttons.length,
			e.gamepad.axes.length,
		  );
        primaryGamepadIndex = -1;
        delete gamepadAPI.controller;
        log('Gamepad disconnected.');
    },
    update: function() {
		//var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
		//if(!isFirefox) {
		//	for(var i = 0; i < 4; i++){
        //        let gp = window.navigator.getGamepads()[i];
		//		if(gp != undefined)				// dumb gamepad update. fix.
		//			gamepadAPI.controller = gp;
         //   }
		//}
		if(gamepadAPI.primaryGamepadIndex != -1) gamepadAPI.controller = window.navigator.getGamepads()[gamepadAPI.primaryGamepadIndex];
        gamepadAPI.buttonsCache = [];
        for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {
            gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
        }
        gamepadAPI.buttonsStatus = [];
        var c = gamepadAPI.controller || {};
        var pressed = [];
        if (c.buttons) {
            for (var b = 0, t = c.buttons.length; b < t; b++) {
                if (c.buttons[b].pressed) {
                    pressed.push(gamepadAPI.buttons[b]);
                }
            }
        }
        var axes = [];
        if (c.axes) {
            for (var a = 0, x = c.axes.length; a < x; a++) {
                axes.push(c.axes[a].toFixed(2));
            }
        }
        gamepadAPI.axesStatus = axes;
        gamepadAPI.buttonsStatus = pressed;
        
        return pressed;
    },	

    isButtonPressed:function (button){
        let currentbuttons = gamepadAPI.update();
        return currentbuttons.length == 0 ? false : currentbuttons.includes(button);
    },
    
    buttons: [ // XBox360 layout 
   		'A', 'B', 'X', 'Y',
        'LB', 'RB', 'Axis-Left', 'DPad-Right',
        'Back', 'Start', 'Power', 'Axis-Right','DPad-Up', 'DPad-Down' ,  'DPad-Left','DPad-Right'
		],
   /*
		'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right',
        'Start', 'Back', 'Axis-Left', 'Axis-Right',
        'LB', 'RB', 'Power', 'A', 'B', 'X', 'Y',
    ],*/
	
    buttonsCache: [],
    buttonsStatus: [],
    axesStatus: []
};
window.addEventListener("gamepadconnected", gamepadAPI.connect);
window.addEventListener("gamepaddisconnected", gamepadAPI.disconnect);



/**
 * TODO
 * create gameover menu
 * create pause menu
 * finish finesse
 * use node js to connect with data stream?
 * use get / post to get moves?
 * add game options: 40 line, etc (in game creation and stats?)
 * remove statslisteners for stats that don't have any elements (reload option)
 * generate header linking to other local sites
 * count tspins that don't clear lines
 * Change ids to be unique (board cover) - class can be different
 * Convert current CSS settings to be contained in this board (option to customize it?)
 * design way to define settings from game html (inner html?)
 * Add option to add event listeners for resizing board / stats updates / piece movements (recording) etc
 * change settings without reloading board
 * add setting for silencing settingsListeners
 * load board from setup - resume
 * add multiple keys to one function
 * add tutorials / tools (finesse)
 * create pages: solo practice, sprint, versus?
 * create "click on game to start" menu
 * add different tetris color settings
 * line clear animation / delay setting
 */

/**
 * setup - goes through page and replaces elements that contain class "game" with a game
 */
 

export function setup() {
    games = [];
    
    Audio.initAudio();
    
    var ele, ele1, ele2;
    var gameArr = document.getElementsByClassName("game");

    for (var i = 0; i < gameArr.length; i++) {
        var element = gameArr[i];

        var settings = getCookie("settings");
        settings = settings.length == 0 ? {} : JSON.parse(settings);

        if (element.innerHTML.length != 0) {
            var str = element.innerHTML;
            element.innerHTML = "";
            if (str.indexOf("play") != -1) {
                var e = addChild(element, "game-" + games.length + "-file-input", "input");
                e.type = "file";
                settings.loadFile = [];
                settings.loadFile.push(e);
            }
            if (str.indexOf("hide options bar") != -1) {
                settings.optionsBarVisible = false;
            }
            if (str.indexOf("show finesse errors") != -1) {
                settings.showFinesseErrors = true;
            }
            if (str.indexOf("redo finesse errors") != -1) {
                settings.redoFinesseErrors = true;
            }
        }

        element.id += "-" + games.length + "-container";
        element.classList.add("game-container");

        ele1 = addChild(element, "game-" + games.length, "div");
        ele1.classList.add("loaded-game");

        settings.playable = true; // jank!

        var a = new Game([ele1, settings]); // idk why but if I remove the variable a this doesn't work :'(
        games.push(a);
    }
}


/**
 * class Stats:
 * Possible listeners:
 *   pause -
 *   resume
 *   startGame
 *   endGame
 *   linesCleared
 *   spin
 *   tspin
 *   piecePlaced - every time a piece is placed
 *   addRecord - everytime a new record is added
 *   tick - every 100ms (.1s)
 *   pieceSpawn
 * HTML Element classes: (adding -pp or -ps changes it to per second or per piece)
 *   time
 *   time-paused
 *   start-time
 *   end-time
 *   pieces-placed
 *   finesse-errors (-[ps, pp])
 *   lines-cleared (-[singles, doubles, triples, tetrisses]) (-[ps, pp])
 *   spins (-[ps, pp])
 *     [i, j, l, s, t, z]-spins (-[ps, pp])
 *     [i, j, l, s, t, z]-spin-[singles, doubles, triples[, tetrisses]] (-[ps, pp]) eg: i-spin-tetrisses, t-spin-triples-ps
 */
export class Stats {
    constructor(board) {
        this.psArr = [];

        this.board = board;
        // TODO add clock interval to game settings
        this.clock = new Clock(this.board, 100, function(b) {
            b.stats.executeStatsListeners("tick");
        });

        
        // object that stores listeners. labels array stores names of all function arrays (every "element" in statsListeners is an array of functions)
        this.statsListeners = {
            labels: []
        };
        this.reset();
    }

    // Check if statListener contains function with specified event.
    // If it does, return array of listeners
    executeStatsListeners(event) {
        var funcs = this.statsListeners[event];
        if (funcs == null) {
            // log("[executeStatsListeners] could not execute event (index was null): " + event + "\n statsListener was:\n" + this.statsListeners);
            return;
        }
        for (var i = 0; i < funcs.length; i++)
            funcs[i](this);
    }

    /**
     * update page: element's innerHTML with value
     * value - string to put into elements
     * elements - array of html elements
     */
    updatePage(value, elements) {
        for (var i = 0; i < elements.length; i++)
            elements[i].innerHTML = value;
    }

    /**
     * addStatsListener: adds a stats listener
     * event - is a string
     * func - is a function
     */
    addStatsListener(event, func) {
        if (this.statsListeners[event] == null)
            this.statsListeners[event] = [];
        this.statsListeners[event].push(func);
        this.statsListeners.labels.push(event);
    }

    // TODO test this
    removeStatsListener(event, func) {
        log("[removeStatsListener] this has not been tested");
        if (this.statsListener[event] == null)
            return null;
        var list = this.statsListener[event];
        for (var i = 0; i < list.length; i++)
            if (list[i] == func)
                return list.splice(i, 1);
    }

    reset() {
        // TODO convert name to a setting in stats
        // value stored in time is in milliseconds
        this.totalTime = new PageStat(["time", this, 0, "t"]);
        this.totalPauseTime = new PageStat(["time-paused", this, 0, "t"]);
        var tempDate = new Date();
        this.startTime = new PageStat(["start-time", this, "" + tempDate.getHours() + ":" + tempDate.getMinutes() + ":" + tempDate.getSeconds()]);
        // TODO set end time when game finishes
        this.endTime = new PageStat(["end-time", this]);

        this.piecesPlaced = "pieces-placed";//new PageStat(["pieces-placed", this, 0]);
        this.finesse = "finesse-errors"; // TODO implements finesse
        this.finessePrintout = new PageStat(["finesse-errors-p", this, "-"]);
        this.linesCleared = {
            total: "lines-cleared",
            count: ["singles","doubles","triples","tetrisses"]
        };
        // total spins is the number of pieces spun not lines cleared
        // count is the number of singles / doubles / triples
        this.spins = {
            total: "spins",
            i: {
                total: "i-spins",
                count: ["i-spin-singles","i-spin-doubles","i-spin-triples","i-spin-tetrisses"]
            },
            j: {
                total: "j-spins",
                count: ["j-spin-singles","j-spin-doubles","j-spin-triples"]
            },
            l: {
                total: "l-spins",
                count: ["l-spin-singles","l-spin-doubles","l-spin-triples"]
            },
            s: {
                total: "s-spins",
                count: ["s-spin-singles","s-spin-doubles","s-spin-triples"]
            },
            t: {
                total: "t-spins",
                count: ["t-spin-singles","t-spin-doubles","t-spin-triples"]
            },
            z: {
                total: "z-spins",
                count: ["z-spin-singles","z-spin-doubles","z-spin-triples"]
            }
        };

        var toLoad = ["piecesPlaced"];
        for (var i = 0; i < toLoad.length; i++) {
            var ps = new PageStat([this[toLoad[i]], this, 0, "ps"]);
            this[toLoad[i]] = new PageStat([this[toLoad[i]], this, 0, null, null, [ps]]);
        }

        toLoad = ["finesse"];
        for (var i = 0; i < toLoad.length; i++) {
            var ps = new PageStat([this[toLoad[i]], this, 0, "ps"]);
            var pp = new PageStat([this[toLoad[i]], this, 0, "pp"]);
            this[toLoad[i]] = new PageStat([this[toLoad[i]], this, 0, null, null, [ps, pp]]);
        }

        // TODO clean this up
        toLoad = ["linesCleared", "spins"];
        for (var i = 0; i < toLoad.length; i++) {
            if (toLoad[i] == "spins") {
                var toLoadLetters = "ijlstz";
                for (var j = 0; j < toLoadLetters.length; j++) {
                    var ps = new PageStat([this.spins[toLoadLetters.charAt(j)].total, this, 0, "ps"]);
                    var pp = new PageStat([this.spins[toLoadLetters.charAt(j)].total, this, 0, "pp"]);
                    this.spins[toLoadLetters.charAt(j)].total = new PageStat([this.spins[toLoadLetters.charAt(j)].total, this, 0, null, null, [ps, pp]]);
                    for (var k = 0; k < (("i").indexOf(toLoadLetters.charAt(j)) != -1 ? 4 : 3); k++) {
                        var ps = new PageStat([this.spins[toLoadLetters.charAt(j)].count[k], this, 0, "ps"]);
                        var pp = new PageStat([this.spins[toLoadLetters.charAt(j)].count[k], this, 0, "pp"]);
                        this.spins[toLoadLetters.charAt(j)].count[k] = new PageStat([this.spins[toLoadLetters.charAt(j)].count[k], this, 0, null, null, [ps, pp]]);
                    }
                }
            } else if (toLoad[i] == "linesCleared") {
                for (var k = 0; k < 4; k++) {
                    var ps = new PageStat([this.linesCleared.count[k], this, 0, "ps"]);
                    var pp = new PageStat([this.linesCleared.count[k], this, 0, "pp"]);
                    this.linesCleared.count[k] = new PageStat([this.linesCleared.count[k], this, 0, null, null, [ps, pp]]);
                }
            }
            var ps = new PageStat([this[toLoad[i]].total, this, 0, "ps"]);
            var pp = new PageStat([this[toLoad[i]].total, this, 0, "pp"]);
            this[toLoad[i]].total = new PageStat([this[toLoad[i]].total, this, 0, null, null, [ps, pp]]);
        }
    }

    /**
     * reload: researches page for divs to update
     */
    reload() {
        for (var i = 0; i < this.psArr.length; i++) {
            this.psArr[i].updateElements();
        }
    }
}

export class PageStat {
    /**
     * args - array of specifications
     *     [0] - name of elements to search for
     *     [1] - stats object
     *     [2] - starting value
     *     [3] - type (null: default, "ps": per second, "pp": per piece, "t": time)
     *     [4] - string to append to end of innerHTML
     *     [5] - array of linked stats (share the same value)
     */
    constructor(args) {
        var name = null, stats = null, startValue = 0, type = null, append = null, linked = null;
        if (args != null) {
            if (args.length > 0) name = args[0];
            if (args.length > 1) stats = args[1];
            if (args.length > 2) startValue = args[2];
            if (args.length > 3) type = args[3];
            if (args.length > 4) append = args[4];
            if (args.length > 5) linked = args[5];
        }

        this.setup(name, stats, startValue, type, append, linked);
    }

    setup(name, stats, startValue, type, append, linked) {
        this.name = name;
        this.stats = stats;
        this.value = (startValue == null ? 0 : startValue);
        this.type = type;
        this.append = (append == null ? "" : append);
        this.linked = linked;
        this.updateElements();
        stats.psArr.push(this);
    }

    addElements(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (this.elements.indexOf(arr[i]) == -1)
                this.elements.push(arr[i]); // why won't concat work?!?!?
        }
        this.updateValue(this.value);
    }

    removeElement(ele) {
        for (var i = 0; i < this.elements.length; i++)
            if (this.elements[i] === ele) {
                this.elements.splice(i, 1);
                return true;
            }
    }

    /**
     * updateElements: resets the list of elements this PageStat will update
     */
    updateElements() {
        this.elements = [];
        if (this.name == null || this.stats == null)
            this.addElements([]);

        var toSearch = this.stats.board.element.id + "-" + this.name;
        toSearch += (this.type == null || this.type == "t"? "" : "-" + this.type);
        var eles = document.getElementsByClassName(toSearch);
        this.addElements(eles);
    }

    updateValue(value) {
        this.value = value
        
        if (this.linked != null)
            for (var i = 0; i < this.linked.length; i++)
                this.linked[i].updateValue(value);

        var v = this.value;
        if (this.type != null) {
            if (this.type == "ps") {
                v = (1.0 * this.value / (this.stats.totalTime.value / 1000)).toFixed(3);
            } else if (this.type == "pp") {
                var p = this.stats.piecesPlaced.value;
                if (p == 0)
                    v = (0).toFixed(3);
                else
                    v = (1.0 * this.value / p).toFixed(3);
            } else if (this.type == "t") {
                var s = ((this.value % 60000) / 1000).toFixed(3);
                var m = Math.floor((this.value / 60000) % 60);
                var h = Math.floor((this.value / 3600000));
                v = (h == 0 ? "" : h + ":") + (m == 0 ? "" : m + ":") + s;
            } else {
                error("Type not recognized: " + this.type);
            }
        }
        
        if (this.elements != null) {
            for (var i = 0; i < this.elements.length; i++) {
                if (this.elements[i].matches("div")) { // TODO redesign
                    this.elements[i].innerHTML = "" + v + (this.append == null ? "" : this.append);
                } else {
                    this.elements.splice(i, 1);
                    i--;
                }
            }
        }
    }

    update(type) {
        if (this.type == type) // TODO bug: if this is "ps" it will go through linked
            this.add(0); // haha saving space
        else if (this.linked != null)
            for (var i = 0; i < this.linked.length; i++)
                if (this.linked[i].type == type)
                    this.linked[i].add(0);
    }

    add(value) {
        if (value == 0)
            this.updateValue(this.value); // prevent problems if value is a string
        else
            this.updateValue(this.value + value);
    }

    clone() { // TODO test
        return new PageStat([this.name, this.stats, this.value, this.type, this.append]);
    }
}

// TODO incorperated into gravity timer?
export class Clock {
    constructor(board, interval, func) {
        this.board = board;
        this.interval = interval;
        this.func = func;

        this.completed = false;
        this.creationTime = new Date().getTime();

        this.storedTime = -1;
        this.pausedTime = -1;
        
        if (!this.board.paused)
            this.resume();
    }

    pause() {
        if (this.completed)
            error("Can not use (pause) a completed clock!");
        this.paused = true;
        this.storedTime += new Date().getTime() - this.startTime;
        this.startTime = new Date().getTime();
    }

    resume() {
        this.paused = false;
        if (this.startTime != null)
            this.pausedTime += new Date().getTime() - this.startTime;
        this.startTime = new Date().getTime();
        this.timer = requestAnimationFrame(()=>this.loop(this.board, this));
        
        
    }

    loop(b, c) {
        c.func(b);
        c.timer = requestAnimationFrame(()=>c.loop(b,c));
    }

    complete() {
        if (this.completed)
            error("Can not use a completed clock");
        this.completed = true;
        if (this.paused)
            this.resume();
        else
            this.pause();
        cancelAnimationFrame(this.timer);
        this.timer = undefined;
    }

    getStartTime() {
        return this.creationTime;
    }

    // return number of intervals that have passed
    getStoredTime() {
        if (this.paused)
            return this.storedTime;
        else
            return this.storedTime + new Date().getTime() - this.startTime;
    }

    getPausedTime() {
        if (this.paused)
            return this.pausedTime + new Date().getTime() - this.startTime;
        else
            return this.pausedTime;
    }

    getFinishedTime() {
        if (this.completed) {
            return this.startTime;
        } else {
            error("Can't get finished time when clock is not completed");
            return -1;
        }
    }
}

export class GravityTimer {
    constructor(board) {
        this.board = board;
        this.timerId, this.start, this.remaining = this.board.settings.gravityDelay;
        this.board.gravNum++;
        this.resume();
    }

    pause() {
        clearTimeout(this.timerId);
        this.remaining -= new Date().getTime() - this.start;
    }

    resume() {
        this.start = new Date().getTime();
        
        var f = function(board) {
            if (board.gravNum == 0)
                return;
            if (board.gravNum >= 1)
                board.gravNum--;
            if (board.gravNum != 0)
                return;
            
            //if(!board.piece.landed)
                board.piece.drop();
            
            if (board.gravTimer != null)
                board.gravTimer = new GravityTimer(board);
        }

        this.timerId = setTimeout(f, this.remaining, this.board);
    }
}

export class Piece {
    // piece must be either i, j, l, o, s, t, z
    constructor(piece, board) {
        if (piece.length != 1 || "ijlostz".indexOf(piece) == -1) {
            error("Error: piece must be either i, j, l, o, s, t, z but was: " + piece);
            return;
        }
        this.board = board;
        this.piece = piece;
        this.rotation = 0;
        this.isDropped = false;
        this.displayed = false;
        this.keysPressed = []; // fill out by key listeners then adds to record
        this.linesCleared = 0;
        this.spin = false;
        this.landed = false;
        this.lockTimer = new Date().getTime();
        
        // adjustments for cw. For ccw multiply by -1.
        // sets are: (column adjust, row adjust)
        var rot1 = [];
        rot1.push([[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]]); // 0>>1
        rot1.push([[0,0], [1,0], [1,-1], [0,2], [1,2]]); // 1>>2
        rot1.push([[0,0], [1,0], [1,1], [0,-2], [1,-2]]); // 2>>3
        rot1.push([[0,0], [-1,0], [-1,-1], [0,2], [-1,2]]); // 3>>0
        var rot2 = [];
        rot2.push([[0,0], [-2,0], [1,0], [-2,-1], [1,2]]); // 0>>1
        rot2.push([[0,0], [-1,0], [2,0], [-1,2], [2,-1]]); // 1>>2
        rot2.push([[0,0], [2,0], [-1,0], [2,1], [-1,-2]]); // 2>>3
        rot2.push([[0,0], [1,0], [-2,0], [1,-2], [-2,1]]); // 3>>0
        var rotationChart = {"i": rot2, "j": rot1, "l": rot1, "o": rot1, "s": rot1, "t": rot1, "z": rot1};
        this.rotationChart = rotationChart[piece];
        
        var i = [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]];
        var j = [[1,0,0],[1,1,1],[0,0,0]];
        var l = [[0,0,1],[1,1,1],[0,0,0]];
        var o = [[1,1],[1,1]];
        var s = [[0,1,1],[1,1,0],[0,0,0]];
        var t = [[0,1,0],[1,1,1],[0,0,0]];
        var z = [[1,1,0],[0,1,1],[0,0,0]];
        var pieceLayout = {"i": i, "j": j, "l": l, "o": o, "s": s, "t": t, "z": z};
        this.pieceLayout = pieceLayout[piece];

        this.loc = this.getDefaultLoc();
    }

    getDefaultLoc() {
        // TODO implement starting row setting (or add with other setting - number of rows)
        var loc = [20,3];
        var spawnLoc = {"i": [19,3], "j": loc, "l": loc, "o": [20,4], "s": loc, "t": loc, "z": loc};
        if (!this.isValidPosition(spawnLoc[this.piece], this.pieceLayout))
            spawnLoc[this.piece][0]--;
        return spawnLoc[this.piece];
    }
    
    getPiece() {
        return this.piece;
    }
    
    getRotation() {
        return this.rotation
    }

    getLocation() {
        return [this.loc[0], this.loc[1]];
    }

    getLayout() {
        // TODO return copy of layout?
        return this.pieceLayout;
    }

    addMove(m) {
        var v = {action: m, time: new Date().getTime()};
        if (m == 0)
            v.piece = this.piece;
        this.board.recordAddMove(v);
    }

    addKeyPressed(m) {
        this.keysPressed.push({key: m, time: new Date().getTime(), repeated: false});
        return this.keysPressed[this.keysPressed.length - 1];
    }

    reset() {
        this.isDropped = false;
        this.clear();
        this.loc = this.getDefaultLoc();
        this.setRotation(0);
        this.loc = this.getDefaultLoc();
        this.addKeyPressed("hold"); // TODO: fix - super jank
        this.addMove(8);
        var movesMade = 0
        /*TODO: IRS on reset
         * if(gamepadAPI.isButtonPressed('B'))
            rotate = 1;
        else if(gamepadAPI.isButtonPressed('A'))
            rotate = -1;
        if(rotate!=0) {
            this.addKeyPressed((rotate == 1)?"cw":"ccw");
            var rotFunc = (rotate == 1)?function(){this.board.piece.rotate(1)}:function(){this.board.piece.rotate(-1)};
            this.board.addMove(rotFunc);
            movesMade = 1;
        }*/    
        this.display();
    }

    greyOut() {
        this.piece = "grey";
    }

    place() {
        var testUpLoc = this.getLocation();
        testUpLoc[0]--;
        if (!(this.canMove(1) || this.canMove(-1) || this.isValidPosition(testUpLoc, this.pieceLayout))) {
            this.spin = true;
        }
        this.isDropped = true;

        this.board.stats.executeStatsListeners("piecePlaced");

        if (this.isDropped) {
            this.display();
            this.board.swapped = false;
            this.board.updateScreen();
            this.board.playPiece();
        }
    }
    
    // erase piece from board
    clear() {
        if (this.isDropped)
            return;
        for (var row = 0; row < this.pieceLayout.length; row++) {
            for (var col = 0; col < this.pieceLayout.length; col++) {
                if (this.pieceLayout[row][col] == 1) {
                    var newRow = this.loc[0] + row;
                    var newCol = this.loc[1] + col;// TODO change bounds to those specified in settings
                    if (!(newRow < 20 || newCol < 0 || newRow >= this.board.board.tiles.length || newCol >= this.board.board.tiles[0].length)) {
                        var ele = this.board.board.tiles[newRow][newCol].element;
                        if (ele !== null)
                            ele.classList.remove(this.piece);
                        else
                            error(row + "," + col);
                        if (this.isDropped)
                            this.board.board.tiles[newRow][newCol].p = "";
                    }
                }
            }
        }
        this.clearShadow();

    }
        
    hold() {
        this.addMove(7);
        this.clear();
        this.loc = this.getDefaultLoc();
        this.setRotation(0);
        this.loc = this.getDefaultLoc();
        this.clear();

    }

    setRotation(r) {
        var count = 0;
        while (this.rotation != r) {
            this.rotate(1);
            if (count >= 100) {
                error("couldn't rotate piece");
                break;
            }
            count++;
        }
    }

    // display piece on board
    display() {
        if (!this.displayed) {
            this.displayed = true;
            this.loc = this.getDefaultLoc();
        }

        if (!this.isValidPosition(this.loc, this.pieceLayout)) {
            error("Piece [" + this.piece + "] collision error. location: \n" + this.loc + "\npieceLayout:\n" + this.pieceLayout);
            return;
        }
        for (var row = 0; row < this.pieceLayout.length; row++) {
            for (var col = 0; col < this.pieceLayout.length; col++) {
                if (this.pieceLayout[row][col] == 1) {
                    var newRow = this.loc[0] + row;
                    var newCol = this.loc[1] + col;
                    if (!(newRow < 0 || newCol < 0 || newRow >= this.board.board.tiles.length || newCol >= this.board.board.tiles[0].length)) {
                        var ele = this.board.board.tiles[newRow][newCol].element;
                        if (ele !== null)
                            ele.classList.add(this.piece);
                        if (this.isDropped) {
                           this.board.board.tiles[newRow][newCol].p = this.piece;
                        }
                    }
                }
            }
        }        
        this.displayShadow();
    }

    displayShadow() {
        if (!this.board.settings.boolShadowPiece)
            return;

        var arr = this.getShadowElements();
        for (var i = 0; i < arr.length; i++) {
            var e = this.board.board.tiles[arr[i][0]][arr[i][1]].element;
            try {
                if (e.classList.length == 0) {
                    e.classList.add("shadow");
                }
            } catch(err) {
                // console.log("Could not display shadow"); // TODO fix this bug when you spam pieces to the top
            }
        }
    }

    clearShadow() {
        var arr = this.getShadowElements();
        for (var i = 0; i < arr.length; i++) {
            var e = this.board.board.tiles[arr[i][0]][arr[i][1]].element;
            if (e != null && e.classList.length != 0) {
                e.classList.remove("shadow");
            }
        }
    }

    getShadowElements() {
        var loc = this.getLocation();
        while (this.isValidPosition(loc, this.pieceLayout)) {
            loc[0]++;
        }
        loc[0]--;
        var arr = [];
        for (var r = 0; r < this.pieceLayout.length; r++) {
            for (var c = 0; c < this.pieceLayout[0].length; c++) {
                if (this.pieceLayout[r][c] != 0 && loc[0] + r < this.board.board.tiles.length && loc[1] + c < this.board.board.tiles[0].length && loc[0] + r >= 0 && loc[1] + c >= 0) {
                    arr.push([loc[0] + r, loc[1] + c]);
                }
            }
        }
        return arr;
    }

    // either 1 (cw) or -1 (ccw)
    rotate(num) {
        if (num != 1 && num != -1) {
            error("Error: rotate value must be either 1 or -1 but was " + num);
            return;
        }
        this.clear();
        this.addMove((num > 0) ? 3 : 4);
        var tempRotation = (this.rotation + 4 + num) % 4;
        var tempLayout = Piece.rotateArr(this.pieceLayout, num);
        for (var i = 0; i < this.rotationChart[0].length; i++) {
            var rotRules = (this.rotation + 4 -(num == -1 ? 1 : 0)) % 4;
            var loc = [];
            // index 1 is y-axis (so row) and positive y is negative row
            loc.push(this.loc[0] + (-1) * num * this.rotationChart[rotRules][i][1]);
            loc.push(this.loc[1] + num * this.rotationChart[rotRules][i][0]);

            if (this.isValidPosition(loc, tempLayout)) {
                this.pieceLayout = tempLayout;
                this.loc = loc;
                this.rotation = tempRotation;
                break;
            }
        }
        this.display();
    }

    setLinesCleared(lines) {
        this.linesCleared = lines;
    }

    // move the piece down one level: if it's at the bottom and can't go down this piece will become "dropped"
    drop() {
        if(this.isDropped == true) {
            this.place();
            Audio.playHd();
        }
        if (this.canDrop()) {
            this.clear();
            this.loc = [this.loc[0] + 1, this.loc[1]];
            this.display();
        } 
        else 
        {
            if(this.landed == false) {
                this.landed = true;
                this.lockTimer = this.startTime = new Date().getTime();
            }else if( new Date().getTime() - this.lockTimer >= 15000) // 15000 is 15 seconds of lock delay
                this.isDropped = true;        }
    }

    canDrop() {
        var newLoc = [this.loc[0] + 1, this.loc[1]];
        return this.isValidPosition(newLoc, this.pieceLayout);
    }

    canMove(num) {
        var newLoc = this.getLocation();
        newLoc[1] = newLoc[1] + num;
        return this.isValidPosition(newLoc, this.pieceLayout);
    }

    // moves the piece this amount, positive is right, negative is left.
    move(amount) {
        if (!this.canMove(amount))
            error("Can not move " + amount + " (positive is right, negative is left).");
        this.addMove((amount > 0) ? 1 : 2);
        var direction = amount / Math.abs(amount);
        var originalLoc = this.loc;
        this.clear();
        var newLoc;
        for (var i = 0; i != amount; i += direction) {
            newLoc = [this.loc[0], this.loc[1] + direction];
            if (!this.isValidPosition(newLoc, this.pieceLayout)) {
                this.clear();
                break;
            }
            Audio.playShift();
            
            this.loc = newLoc;
        }
        this.display();
    }
    
    // tests if there are any conflicts at location (2 element array) and arr (piece layout array)
    isValidPosition(loc, arr) {
        // remove own piece from the virtual board before checking

        for (var row = 0; row < arr.length; row++) {
            for (var col = 0; col < arr[0].length; col++) {
                // if the tile in arr is empty don't need to check
                if (arr[row][col] !== 0) {
                    // + 20 because the game board is 20 squares taller than the other board
                    var curRow = loc[0] + row;
                    var curCol = loc[1] + col;
                    // if the tile is off the edge
                    if (curRow >= this.board.board.tiles.length || curCol >= this.board.board.tiles[0].length || curRow < 0 || curCol < 0)
                        return false;
                    
                    // check if the tile is empty
                    if (this.board.board.tiles[curRow][curCol].p !== "")
                        return false;
                }
            }
        }

        return true;
    }
    
    // rotates the array clockwise, array must be square. Direction is 1 for cw, -1 for ccw
    static rotateArr(arr, direction) {
        if (arr.length != arr[0].length) {
            error("Error: array must be 2d and square but was " + arr);
            return;
        }
        
        var newArr = [];
        for (var row = 0; row < arr.length; row++) {
            var temp = [];
            for (var col = 0; col < arr.length; col++) {
                if (direction == 1)
                    temp.push(arr[arr.length - col - 1][row]);
                else
                    temp.push(arr[col][arr.length - row - 1]);
            }
            newArr.push(temp);
        }
        return newArr;
    }
}
