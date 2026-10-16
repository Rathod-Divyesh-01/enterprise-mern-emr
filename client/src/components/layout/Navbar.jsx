import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  Activity,
  Calendar,
  LayoutDashboard,
  LogOut,
  User,
  Users,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Enterprise <span className="text-blue-600">EMR</span>
            </span>
          </Link>

          {/* Navigation Links (Visible when logged in) */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/patients"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/patients")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Patients</span>
              </Link>

              {/* Scheduler link accessible to Super Admin and Receptionist */}
              {["SUPER_ADMIN", "RECEPTIONIST"].includes(user.role) && (
                <Link
                  to="/scheduler"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/scheduler")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Scheduler</span>
                </Link>
              )}

              {user.role === "SUPER_ADMIN" && (
                <Link
                  to="/users"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/users") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  Manage users
                </Link>
              )}
            </div>
          )}

          {/* User Profile & Logout Action */}
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                  <User className="h-5 w-5" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-gray-800 leading-tight">
                    {user.name}
                  </div>
                  <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 tracking-wide">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">
                  Logout
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
