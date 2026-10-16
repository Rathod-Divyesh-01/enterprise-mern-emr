const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    department: { type: String, required: true },
    appointmentDate: { type: String, required: true, index: true }, // YYYY-MM-DD
    slotStartTime: { type: String, required: true }, // HH:mm
    slotEndTime: { type: String, required: true },   // HH:mm
    status: {
      type: String,
      enum: ['Scheduled', 'Arrived', 'Completed', 'Cancelled'],
      default: 'Scheduled',
      index: true,
    },
    purpose: { type: String, required: true },
    notes: { type: String, default: '' },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Composite Unique Index to enforce double-booking prevention at Database level
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, slotStartTime: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'Cancelled' } } }
);

module.exports = mongoose.model('Appointment', appointmentSchema);