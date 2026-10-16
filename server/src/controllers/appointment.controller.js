const appointmentService = require("../services/appointment.service");
const Appointment = require("../models/Appointment");
const logAudit = require("../utils/auditLogger");

const create = async (req, res, next) => {
  try {
    const io = req.app.get("socketio");
    const appointment = await appointmentService.createAppointment(
      req.body,
      req.user,
      io,
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Appointment created successfully",
        data: appointment,
      });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await appointmentService.getAppointments(
      req.query,
      req.user,
    );
    res.json({ success: true, data: result.appointments, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { purpose, notes, status } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });

    if (req.user.role === "DOCTOR") {
      const doctor = await require("../models/Doctor")
        .findOne({ userId: req.user.id })
        .select("_id");
      if (!doctor || String(appointment.doctorId) !== String(doctor._id)) {
        return res
          .status(403)
          .json({
            success: false,
            message: "You may only update your assigned appointments",
          });
      }
      if (
        purpose !== undefined ||
        (status !== undefined && status !== "Completed")
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Doctors may update notes or complete assigned appointments only",
          });
      }
    } else if (!["SUPER_ADMIN", "RECEPTIONIST"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    if (purpose !== undefined) appointment.purpose = purpose;
    if (notes !== undefined) appointment.notes = notes;
    if (status !== undefined) appointment.status = status;

    await appointment.save();

    const io = req.app.get("socketio");
    if (io) {
      io.emit("appointmentUpdated", {
        type: "UPDATED",
        doctorId: appointment.doctorId,
        date: appointment.appointmentDate,
        appointmentId: appointment._id,
      });
    }

    await logAudit({
      user: req.user,
      action: "APPOINTMENT_UPDATED",
      entity: "Appointment",
      entityId: appointment._id,
    });
    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const markArrived = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });

    appointment.status = "Arrived";
    await appointment.save();

    const io = req.app.get("socketio");
    if (io)
      io.emit("appointmentUpdated", {
        type: "ARRIVED",
        appointmentId: appointment._id,
      });

    await logAudit({
      user: req.user,
      action: "PATIENT_ARRIVED",
      entity: "Appointment",
      entityId: appointment._id,
    });
    res.json({
      success: true,
      message: "Patient marked as arrived",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });

    appointment.status = "Cancelled";
    await appointment.save();

    const io = req.app.get("socketio");
    if (io) {
      io.emit("appointmentUpdated", {
        type: "CANCELLED",
        doctorId: appointment.doctorId,
        date: appointment.appointmentDate,
        appointmentId: appointment._id,
      });
    }

    await logAudit({
      user: req.user,
      action: "APPOINTMENT_CANCELLED",
      entity: "Appointment",
      entityId: appointment._id,
    });
    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, update, markArrived, cancel };
