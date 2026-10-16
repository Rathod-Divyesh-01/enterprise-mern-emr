// appointment.routes.js
const expressApp = require("express");
const routerApp = expressApp.Router();
const appointmentController = require("../controllers/appointment.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const validateApp = require("../middleware/validate.middleware");
const {
  createAppointmentSchema,
  updateAppointmentSchema,
} = require("../validators/schemas");

routerApp.use(authenticate);

routerApp.get("/", appointmentController.getAll);
routerApp.post(
  "/",
  authorize("SUPER_ADMIN", "RECEPTIONIST"),
  validateApp(createAppointmentSchema),
  appointmentController.create,
);
routerApp.put(
  "/:id",
  validateApp(updateAppointmentSchema),
  appointmentController.update,
);
routerApp.post(
  "/:id/arrive",
  authorize("SUPER_ADMIN", "RECEPTIONIST"),
  appointmentController.markArrived,
);
routerApp.delete(
  "/:id",
  authorize("SUPER_ADMIN", "RECEPTIONIST"),
  appointmentController.cancel,
);

module.exports = routerApp;
