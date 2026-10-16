const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const User = require("../models/User");

const getStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "SUPER_ADMIN";
    const appointmentFilter = {};
    if (req.user.role === "DOCTOR") {
      const doctor = await Doctor.findOne({ userId: req.user.id }).select(
        "_id",
      );
      appointmentFilter.doctorId = doctor?._id || null;
    }
    const [appointments, patients, doctors, users] = await Promise.all([
      Appointment.countDocuments(appointmentFilter),
      isAdmin ? Patient.countDocuments() : Promise.resolve(null),
      isAdmin ? Doctor.countDocuments() : Promise.resolve(null),
      isAdmin ? User.countDocuments({ isActive: true }) : Promise.resolve(null),
    ]);
    const statusCounts = await Appointment.aggregate([
      { $match: appointmentFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json({
      success: true,
      data: {
        appointments,
        patients,
        doctors,
        activeUsers: users,
        statuses: Object.fromEntries(
          statusCounts.map(({ _id, count }) => [_id, count]),
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
