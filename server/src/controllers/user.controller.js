const bcrypt = require("bcryptjs");
const User = require("../models/User");
const logAudit = require("../utils/auditLogger");

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("name email role isActive createdAt")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });
    await logAudit({
      user: req.user,
      action: "USER_CREATED",
      entity: "User",
      entityId: user._id,
    });
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const updates = {};
    for (const key of ["name", "role", "isActive"])
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (req.body.password)
      updates.password = await bcrypt.hash(req.body.password, 12);
    if (req.params.id === req.user.id && updates.isActive === false)
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    if (
      req.params.id === req.user.id &&
      updates.role &&
      updates.role !== "SUPER_ADMIN"
    )
      return res
        .status(400)
        .json({
          success: false,
          message: "You cannot remove your own Super Admin role",
        });
    const target = await User.findById(req.params.id).select("role isActive");
    if (!target)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (
      target.role === "SUPER_ADMIN" &&
      target.isActive &&
      ((updates.role && updates.role !== "SUPER_ADMIN") ||
        updates.isActive === false)
    ) {
      const otherAdmins = await User.countDocuments({
        role: "SUPER_ADMIN",
        isActive: true,
        _id: { $ne: target._id },
      });
      if (otherAdmins === 0)
        return res
          .status(400)
          .json({
            success: false,
            message: "At least one active Super Admin account must remain",
          });
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("name email role isActive");
    await logAudit({
      user: req.user,
      action: "USER_UPDATED",
      entity: "User",
      entityId: user._id,
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsers, createUser, updateUser };
