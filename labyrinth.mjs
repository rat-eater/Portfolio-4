import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";

const startingLevel = CONST.START_LEVEL_ID;
const levels = loadLevelListings();
const levelHistory = [];
const DOOR_MAPPINGS = {
    "start": { "D": { targetRoom: "aSharpPlace", targetDoor: "D" } },
    "aSharpPlace": { 
        "D": { targetRoom: "start", targetDoor: "D" } }
}

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";

const THINGS = [LOOT, EMPTY];
const HP_MAX = 10;

const playerStats = {
    hp: 8,
    cash: 0
};

let isDirty = true;
let playerPos = { row: null, col: null };

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

class Labyrinth {
    constructor() {
        this.npcs = [];
        this.lastDoorSymbol = null;
        this.loadLevel(startingLevel);
    }

    loadLevel(levelID, fromDoor = null) {
        if (levels[levelID] == null) {
            console.error(`Level ${levelID} not found!`);
            return;
        }

        if (this.levelID) {
            const currentDoor = this.level[playerPos.row][playerPos.col];
            levelHistory.push({
                levelID: this.levelID,
                playerPos: { ...playerPos },
                lastDoor: currentDoor
            });
        }

        this.levelID = levelID;
        this.level = readMapFile(levels[levelID]);

        if (levelID === "start") {
            const startingRow = 5;
            const startingCol = 4;
            this.level[startingRow][startingCol] = HERO;
            playerPos.row = startingRow;
            playerPos.col = startingCol;
        } else if (fromDoor) {
            const doorLocation = this.findSymbol(fromDoor);
            if (doorLocation) {
                this.level[doorLocation.row][doorLocation.col] = HERO;
                playerPos.row = doorLocation.row;
                playerPos.col = doorLocation.col;
            }
        }
        isDirty = true;
    }

    update() {
        let dRow = 0;
        let dCol = 0;

        if (KeyBoardManager.isUpPressed()) dRow = -1;
        else if (KeyBoardManager.isDownPressed()) dRow = 1;

        if (KeyBoardManager.isLeftPressed()) dCol = -1;
        else if (KeyBoardManager.isRightPressed()) dCol = 1;

        let tRow = playerPos.row + dRow;
        let tCol = playerPos.col + dCol;

        if (tRow < 0 || tCol < 0 || tRow >= this.level.length || tCol >= this.level[0].length) return;

        const targetCell = this.level[tRow][tCol];

        if (targetCell === EMPTY || THINGS.includes(targetCell)) {
            if (targetCell === LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.cash += loot;
                eventText = `Player gained ${loot}$`;
            }

            if (this.level[playerPos.row][playerPos.col] === HERO && this.lastDoorSymbol) {
                this.level[playerPos.row][playerPos.col] = this.lastDoorSymbol;
                this.lastDoorSymbol = null;
            } else {
                this.level[playerPos.row][playerPos.col] = EMPTY;
            }

            this.level[tRow][tCol] = HERO;
            playerPos.row = tRow;
            playerPos.col = tCol;

            isDirty = true;
        } else if (targetCell === "D" || targetCell === "d") {
            const currentRoom = this.levelID;
            const doorMapping = DOOR_MAPPINGS[currentRoom][targetCell];

            if (doorMapping) {
                this.lastDoorSymbol = targetCell;
                this.loadLevel(doorMapping.targetRoom, doorMapping.targetDoor);
            }
        } else if (targetCell === "♨︎") {
            const otherTeleport = this.findSecondTeleport(tRow, tCol);
            if (otherTeleport) {
                this.level[playerPos.row][playerPos.col] = "♨︎";
                playerPos.row = otherTeleport.row;
                playerPos.col = otherTeleport.col;
                this.level[playerPos.row][playerPos.col] = HERO;
                eventText = "Teleported!";
                isDirty = true;
            }
        }

        // NPC Patrol Logic
        this.npcs.forEach((npc) => {
            let nextCol = npc.col + npc.direction;

            if (
                nextCol < 0 ||
                nextCol >= this.level[0].length ||
                this.level[npc.row][nextCol] !== EMPTY
            ) {
                npc.direction *= -1;
            } else {
                this.level[npc.row][npc.col] = EMPTY;
                npc.col += npc.direction;
                this.level[npc.row][npc.col] = "X";
            }
        });

        isDirty = true;
    }

    draw() {
        if (!isDirty) return;

        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendering = "";

        rendering += this.renderHud();

        for (let row = 0; row < this.level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < this.level[row].length; col++) {
                rowRendering += this.level[row][col];
            }
            rendering += rowRendering + "\n";
        }

        console.log(rendering);
    }

    renderHud() {
        let hpBar = `Life:[${"♥︎".repeat(playerStats.hp)}${" ".repeat(HP_MAX - playerStats.hp)}] `;
        let cash = `$:${playerStats.cash}`;
        return `${hpBar} ${cash}\n`;
    }

    findSymbol(symbol) {
        for (let row = 0; row < this.level.length; row++) {
            for (let col = 0; col < this.level[row].length; col++) {
                if (this.level[row][col] === symbol) {
                    return { row, col };
                }
            }
        }
        return null;
    }
}

export default Labyrinth;