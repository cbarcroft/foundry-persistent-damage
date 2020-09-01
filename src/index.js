import { init, ready, endOfTurn, deleteCombat } from "./hooks.js";

// registering the hooks
Hooks.on("ready", ready);
Hooks.on("init", init);

Hooks.on("preUpdateCombat", endOfTurn);
Hooks.on("deleteCombat", deleteCombat);
