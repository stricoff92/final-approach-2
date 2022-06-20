
const NOT_IMPLEMENTED = "Not Implemented";
const CANVAS_ID = "game-canvas";

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

const TERRAIN_FOREST = 0; // Green
const TERRAIN_DESERT = 1; // Orange
const TERRAIN_OCEAN = 2;  // Blue

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
const COLOR_SKY = "#e3e3ff";
const COLOR_GROUND_FOREST = "#bcd4ab";
const COLOR_GROUD_DESERT = "#dbd6af";
const COLOR_SURFACE_OCEAN = "#362ae8";
const COLOR_HUD_LIGHT_GREEN = "#daf0d3";
const COLOR_HUD_LIGHT_GREEN_A = "rgb(218, 240, 211, 0.5)";

const COLOR_CARRIER_DECK = "#ababab";
const COLOR_CARRIER_RUNWAY = "#c9c6bf";
const COLOR_CARRIER_WATER_LINE = "#4f0000";

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

const RUNWAY_TYPE_CONCRETE = "concrete";
const RUNWAY_TYPE_CONCRETE_COLOR = "#808080";
const RUNWAY_TYPE_DIRT = "dirt";
const RUNWAY_TYPE_DIRT_COLOR = "#bdbcac";
const RUNWAY_TYPE_CARRIER = "carrier";

const LEVEL_NAME_DISPLAY_DURATION_MS = 2000;
const LEVEL_NAME_DISPLAY_FADEOUT_MS = 1000;
const LEVEL_NAME_TOTAL_DURATION = (
    LEVEL_NAME_DISPLAY_DURATION_MS
    + LEVEL_NAME_DISPLAY_FADEOUT_MS
);

const LEVEL_7_MAX_SAFE_X_M = 130;

const DANGER_STATUS_NONE = null;
const DANGER_STATUS_ON_LEVEL = "onlevel";
const DANGER_STATUS_INSTANT = "instant";

const AA_FIRE_TOTAL_DURATION = 200;
const AA_FIRE_EXPLOSION_SIZE_M = 5;
const AA_FIRE_EXPLOSION_FADED_SIZE_M = 8;
const AA_EXPLOSION_COLOR = a => `rgb(66, 47, 1, ${ a.toFixed(2) })`;

const AFLAME_NODES_COUNT = 25;
const MAX_AFLAME_RADIUS_M = 4;
const MIN_AFLAME_RADIUS_M = 1.5;

const CARRIER_DECK_SIZE_AFTER_RW_M = 30;
