const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createUserSchema, updateUserSchema } = require("../validators/schemas");
const userController = require("../controllers/user.controller");

router.use(authenticate, authorize("SUPER_ADMIN"));
router.get("/", userController.listUsers);
router.post("/", validate(createUserSchema), userController.createUser);
router.patch("/:id", validate(updateUserSchema), userController.updateUser);

module.exports = router;
