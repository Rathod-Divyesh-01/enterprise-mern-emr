const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logAudit = require("../utils/auditLogger");

const buildAuthTokens = (user) => {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("Authentication secrets are not configured");
  }

  const accessToken = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m" },
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d" },
  );

  return { accessToken, refreshToken };
};

const signup = async (req, res, next) => {
  try {
    const { name, email, password, role = "RECEPTIONIST" } = req.body;
    const safeRole = ["RECEPTIONIST", "DOCTOR"].includes(role)
      ? role
      : "RECEPTIONIST";

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: safeRole,
    });

    const { accessToken, refreshToken } = buildAuthTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    await logAudit({
      user: { id: user._id, role: user.role },
      action: "USER_SIGNUP",
      entity: "User",
      entityId: user._id,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    if (error.message === "Authentication secrets are not configured")
      return res.status(500).json({
        success: false,
        message: "Authentication secrets are not configured",
      });
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    let accessToken;
    let refreshToken;
    try {
      ({ accessToken, refreshToken } = buildAuthTokens(user));
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Authentication secrets are not configured",
      });
    }

    user.refreshToken = refreshToken;
    await user.save();

    await logAudit({
      user: { id: user._id, role: user.role },
      action: "LOGIN",
      entity: "Auth",
      entityId: user._id,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res
        .status(400)
        .json({ success: false, message: "Refresh token required" });

    if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_ACCESS_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication secrets are not configured",
      });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m" },
    );

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired refresh token" });
  }
};

const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    await logAudit({
      user: req.user,
      action: "LOGOUT",
      entity: "Auth",
      entityId: req.user.id,
    });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, refresh, logout };
