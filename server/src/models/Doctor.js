const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // Format "HH:mm" e.g., "09:00"
  endTime: { type: String, required: true },   // Format "HH:mm" e.g., "12:00"
});

const breakSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // Format "HH:mm" e.g., "12:00"
  endTime: { type: String, required: true },   // Format "HH:mm" e.g., "13:00"
  title: { type: String, default: 'Lunch Break' }
});

const scheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  sessions: [sessionSchema],
  breaks: [breakSchema],
  slotDurationMinutes: { type: Number, default: 15, required: true },
});

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department: { type: String, required: true, trim: true },
    specialization: { type: String, required: true },
    schedule: [scheduleSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);