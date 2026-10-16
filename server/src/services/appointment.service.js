const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const logAudit = require("../utils/auditLogger");
const slotService = require("./slot.service");

const createAppointment = async (data, user, io) => {
  let patientIdObj;

  if (data.patientType === "NEW") {
    const { randomUUID } = require("crypto");
    const generatedId = `PAT-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const newPatient = await Patient.create({
      patientId: generatedId,
      ...data.patientDetails,
    });
    patientIdObj = newPatient._id;
  } else {
    const existingPatient = await Patient.findById(data.patientId);
    if (!existingPatient) throw new Error("Patient record not found");
    patientIdObj = existingPatient._id;
  }

  const doctor = await Doctor.findById(data.doctorId);
  if (!doctor) throw new Error("Doctor not found");

  const slots = await slotService.getAvailableSlots(
    data.doctorId,
    data.appointmentDate,
  );
  const validSlot = slots.some(
    (slot) =>
      slot.startTime === data.slotStartTime &&
      slot.endTime === data.slotEndTime &&
      slot.isAvailable,
  );
  if (!validSlot) {
    const error = new Error(
      "The selected slot is unavailable or outside the doctor schedule",
    );
    error.statusCode = 409;
    throw error;
  }

  // Create appointment (Unique DB index prevents duplicate concurrency)
  const appointment = await Appointment.create({
    patientId: patientIdObj,
    doctorId: data.doctorId,
    department: doctor.department,
    appointmentDate: data.appointmentDate,
    slotStartTime: data.slotStartTime,
    slotEndTime: data.slotEndTime,
    purpose: data.purpose,
    createdById: user.id,
  });

  await logAudit({
    user,
    action: "APPOINTMENT_CREATED",
    entity: "Appointment",
    entityId: appointment._id,
    details: {
      date: data.appointmentDate,
      slot: data.slotStartTime,
      doctorId: data.doctorId,
    },
  });

  if (io) {
    io.emit("appointmentUpdated", {
      type: "CREATED",
      doctorId: data.doctorId,
      date: data.appointmentDate,
      appointmentId: appointment._id,
    });
  }

  return appointment;
};

const getAppointments = async (query, user) => {
  const {
    page = 1,
    limit = 10,
    doctorId,
    department,
    status,
    date,
    search,
  } = query;
  const filter = {};

  if (user.role === "DOCTOR") {
    const doctorProfile = await Doctor.findOne({ userId: user.id });
    filter.doctorId = doctorProfile ? doctorProfile._id : null;
  } else if (doctorId) {
    filter.doctorId = doctorId;
  }

  if (department) filter.department = department;
  if (status) filter.status = status;
  if (date) filter.appointmentDate = date;

  let queryBuilder = Appointment.find(filter)
    .populate("patientId", "patientId name mobile email age gender")
    .populate({
      path: "doctorId",
      populate: { path: "userId", select: "name" },
    })
    .sort({ appointmentDate: 1, slotStartTime: 1 });

  if (search) {
    const patients = await Patient.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const pIds = patients.map((p) => p._id);
    filter.patientId = { $in: pIds };
    queryBuilder = Appointment.find(filter)
      .populate("patientId", "patientId name mobile email age gender")
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "name" },
      })
      .sort({ appointmentDate: 1, slotStartTime: 1 });
  }

  const skip = (page - 1) * limit;
  const total = await Appointment.countDocuments(filter);
  const appointments = await queryBuilder.skip(skip).limit(Number(limit));

  return {
    appointments,
    meta: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = { createAppointment, getAppointments };
