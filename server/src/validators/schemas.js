const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(10).max(128).required(),
  role: Joi.string()
    .valid("RECEPTIONIST", "DOCTOR")
    .optional()
    .default("RECEPTIONIST"),
});

const createAppointmentSchema = Joi.object({
  patientType: Joi.string().valid("EXISTING", "NEW").required(),
  patientId: Joi.string().when("patientType", {
    is: "EXISTING",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  patientDetails: Joi.object({
    name: Joi.string().required(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required(),
    email: Joi.string().email().allow(""),
    age: Joi.number().min(0).max(120).required(),
    gender: Joi.string().valid("Male", "Female", "Other").required(),
  }).when("patientType", {
    is: "NEW",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  doctorId: Joi.string().required(),
  appointmentDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  slotStartTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required(),
  slotEndTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required(),
  purpose: Joi.string().required(),
});

const updateAppointmentSchema = Joi.object({
  purpose: Joi.string().optional(),
  notes: Joi.string().optional(),
  status: Joi.string()
    .valid("Scheduled", "Arrived", "Completed", "Cancelled")
    .optional(),
});

const createPatientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  email: Joi.string().email().allow("").optional(),
  age: Joi.number().integer().min(0).max(120).required(),
  gender: Joi.string().valid("Male", "Female", "Other").required(),
  medicalHistory: Joi.string().max(5000).allow("").optional(),
});

const clinicalNoteSchema = Joi.object({
  appointmentId: Joi.string().hex().length(24).required(),
  diagnosis: Joi.string().max(2000).allow("").optional(),
  treatmentPlan: Joi.string().max(3000).allow("").optional(),
  note: Joi.string().max(5000).allow("").optional(),
});

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(10).max(128).required(),
  role: Joi.string().valid("SUPER_ADMIN", "RECEPTIONIST", "DOCTOR").required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  password: Joi.string().min(10).max(128),
  role: Joi.string().valid("SUPER_ADMIN", "RECEPTIONIST", "DOCTOR"),
  isActive: Joi.boolean(),
}).min(1);

const createDoctorSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  department: Joi.string().trim().min(2).max(100).required(),
  specialization: Joi.string().trim().min(2).max(120).required(),
  schedule: Joi.array()
    .items(
      Joi.object({
        dayOfWeek: Joi.string()
          .valid(
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          )
          .required(),
        slotDurationMinutes: Joi.number().integer().min(5).max(120).default(15),
        sessions: Joi.array()
          .items(
            Joi.object({
              startTime: Joi.string()
                .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
                .required(),
              endTime: Joi.string()
                .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
                .required(),
            }),
          )
          .min(1)
          .required(),
        breaks: Joi.array()
          .items(
            Joi.object({
              startTime: Joi.string()
                .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
                .required(),
              endTime: Joi.string()
                .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
                .required(),
              title: Joi.string().max(100),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});

module.exports = {
  loginSchema,
  signupSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  createPatientSchema,
  clinicalNoteSchema,
  createUserSchema,
  updateUserSchema,
  createDoctorSchema,
};
