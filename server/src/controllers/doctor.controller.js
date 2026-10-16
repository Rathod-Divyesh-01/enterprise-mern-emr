const Doctor = require("../models/Doctor");
const User = require("../models/User");
const logAudit = require("../utils/auditLogger");

const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate("userId", "name email");
    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

const createDoctor = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.body.userId,
      role: "DOCTOR",
      isActive: true,
    });
    if (!user)
      return res
        .status(400)
        .json({
          success: false,
          message: "Select an active user with the DOCTOR role",
        });
    if (await Doctor.exists({ userId: user._id }))
      return res
        .status(409)
        .json({ success: false, message: "This doctor already has a profile" });
    const doctor = await Doctor.create(req.body);
    await logAudit({
      user: req.user,
      action: "DOCTOR_PROFILE_CREATED",
      entity: "Doctor",
      entityId: doctor._id,
    });
    res
      .status(201)
      .json({
        success: true,
        data: await Doctor.findById(doctor._id).populate(
          "userId",
          "name email",
        ),
      });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDoctors, createDoctor };
