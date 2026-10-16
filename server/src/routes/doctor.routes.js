// doctor.routes.js
const expressDoctor = require("express");
const routerDoctor = expressDoctor.Router();
const doctorController = require("../controllers/doctor.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createDoctorSchema } = require("../validators/schemas");

routerDoctor.get("/", authenticate, doctorController.getDoctors);
routerDoctor.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(createDoctorSchema),
  doctorController.createDoctor,
);
module.exports = routerDoctor;
