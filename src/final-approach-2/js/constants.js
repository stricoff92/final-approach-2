
const NOT_IMPLEMENTED = "Not Implemented";

const TWO_PI = Math.PI * 2;

const PHASE_N1_SHOW_HELP = -1;
const PHASE_0_LOBBY = 0;
const PHASE_1_COUNTDOWN = 1;
const PHASE_2_LIVE = 2;
const PHASE_3_SCORESCREEN = 3;


const PLANE_C152 = "c152";
const PLANE_F18 = "f18";

const IS_NOT_FLARING = 0;
const IS_FLARING = 1;

const TERRAIN_FOREST = 0; // Easy
const TERRAIN_DESERT = 1; // Medium
const TERRAIN_OCEAN = 2;  // Hard

const BUTTON_TYPE_GRID = 0;
const BUTTON_TYPE_MAIN = 1;

const MAIN_BUTTON_Y_LENGTH = 38;

const COMMAND_QUIT_LEVEL = 0;
const COMMAND_LEVEL_OUT = 1;
const COMMAND_FLARE = 2;
const COMMAND_START_LEVEL = 3;
const COMMAND_SHOW_HELP = 4;

const COLOR_PURPLE = "#620080";
const COLOR_BLACK = "#000";
const COLOR_SKY_FOREST = "#e3e3ff";
const COLOR_GROUND_FOREST = "#9dff5c";
const COLOR_RW_FOREST = "#808080";

const COLOR_CLOUD_LAYER = a => `rgb(219, 219, 219, ${a.toFixed(2)})`;
const CLOUD_GRADIENT_SIZE_M = 30;

const CLICK_RING_MAX_FRAME_AGE = 20;
const CLICK_RING_WIDTH = 12;
const CLICK_RING_MAX_RADIUS_CANVAS_PX = 65;
const COLOR_CLICK_RING_SINGLE = a => `rgb(0, 138, 57, ${a.toFixed(2)})`;
const COLOR_CLICK_RING_DOUBLE = a => `rgb(138, 0, 138, ${a.toFixed(2)})`;

const COLOR_SCORE_BOARD_BACKGROUND = a => `rgb(80, 0, 105, ${a.toFixed(2)})`;

const CRASH_EFFECT_1_MAX_FRAME = 60;
const CRASH_EFFECT_2_MAX_FRAME = 160;

const WIND_MAX_MAGNITUDE_MS = 15;
