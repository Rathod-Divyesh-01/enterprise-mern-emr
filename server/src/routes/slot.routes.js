// slot.routes.js
const expressSlot = require("express");
const routerSlot = expressSlot.Router();
const slotController = require("../controllers/slot.controller");
const { authenticate } = require("../middleware/auth.middleware");

routerSlot.get("/", authenticate, slotController.getSlots);
module.exports = routerSlot;
