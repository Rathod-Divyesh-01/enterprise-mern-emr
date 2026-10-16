const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../src/models/User");
const Doctor = require("../src/models/Doctor");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const seedAccounts = [
  {
    name: "Super Admin User",
    email: "admin@emr.com",
    password: "Super123",
    role: "SUPER_ADMIN",
  },
  {
    name: "Front Desk Receptionist",
    email: "receptionist@emr.com",
    password: "receptionist123",
    role: "RECEPTIONIST",
  },
  {
    name: "Dr. Sarah Connor",
    email: "doctor@emr.com",
    password: "Doctor123",
    role: "DOCTOR",
  },
];

const seedDatabase = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Demo seed is disabled in production.");
    }
    if (!MONGO_URI)
      throw new Error("Set MONGO_URI in server/.env before seeding.");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Idempotently create/update only these named development accounts; never clear collections.
    const createdUsers = [];
    for (const account of seedAccounts) {
      let user = await User.findOne({ email: account.email }).select(
        "+password",
      );
      if (!user) user = new User(account);
      else {
        user.name = account.name;
        user.password = account.password;
        user.role = account.role;
        user.isActive = true;
      }
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    // Create linked Doctor profile
    const doctorUser = createdUsers.find((u) => u.role === "DOCTOR");
    if (doctorUser) {
      await Doctor.findOneAndUpdate(
        { userId: doctorUser._id },
        {
          $setOnInsert: {
            department: "General Medicine",
            specialization: "Internal Medicine",
            schedule: [
              {
                dayOfWeek: "Monday",
                slotDurationMinutes: 15,
                sessions: [{ startTime: "09:00", endTime: "17:00" }],
                breaks: [
                  { startTime: "13:00", endTime: "14:00", title: "Lunch" },
                ],
              },
            ],
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      console.log("Created linked Doctor profile for Dr. Sarah Connor.");
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
