const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    mobile: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    medicalHistory: { type: String, default: "", maxlength: 5000 },
    clinicalNotes: [
      {
        doctorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
          required: true,
        },
        appointmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
          required: true,
        },
        diagnosis: { type: String, default: "", maxlength: 2000 },
        treatmentPlan: { type: String, default: "", maxlength: 3000 },
        note: { type: String, default: "", maxlength: 5000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Patient", patientSchema);
