const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getAvailableSlots = async (doctorId, dateStr) => {
  const doctor = await Doctor.findById(doctorId).populate('userId', 'name');
  if (!doctor) throw new Error('Doctor not found');

  const targetDate = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[targetDate.getUTCDay()];

  const daySchedule = doctor.schedule.find((s) => s.dayOfWeek === dayName);
  if (!daySchedule) return [];

  const existingAppointments = await Appointment.find({
    doctorId,
    appointmentDate: dateStr,
    status: { $ne: 'Cancelled' },
  });

  const bookedSlotsSet = new Set(existingAppointments.map((app) => app.slotStartTime));

  const slots = [];
  const duration = daySchedule.slotDurationMinutes;

  for (const session of daySchedule.sessions) {
    let current = timeToMinutes(session.startTime);
    const sessionEnd = timeToMinutes(session.endTime);

    while (current + duration <= sessionEnd) {
      const slotStartStr = minutesToTime(current);
      const slotEndStr = minutesToTime(current + duration);

      // Check if slot falls in any break period
      const isBreak = daySchedule.breaks.some((b) => {
        const breakStart = timeToMinutes(b.startTime);
        const breakEnd = timeToMinutes(b.endTime);
        return current >= breakStart && current < breakEnd;
      });

      if (!isBreak) {
        const isBooked = bookedSlotsSet.has(slotStartStr);
        slots.push({
          startTime: slotStartStr,
          endTime: slotEndStr,
          isAvailable: !isBooked,
        });
      }

      current += duration;
    }
  }

  return slots;
};

module.exports = { getAvailableSlots };