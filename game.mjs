import Labyrinth from "./labyrinth.mjs"
import SplashScreen from "./splashScreen.mjs";
import ANSI from "./utils/ANSI.mjs";

const REFRESH_RATE = 250;

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

let intervalID = null;
let isBlocked = false;
let state = null;

function init() {
    const splash = new SplashScreen();
    //All levels available to the game. 
    splash.animate(() => {
        state = new Labyrinth();
        intervalID = setInterval(update, REFRESH_RATE);
    });
    state = new Labyrinth();
    intervalID = setInterval(update, REFRESH_RATE);
}

function update() {

    if (isBlocked) { return; }
    isBlocked = true;
    //#region core game loop
    state.update();
    state.draw();
    //#endregion
    isBlocked = false;
}

init();