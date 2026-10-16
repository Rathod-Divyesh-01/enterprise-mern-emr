import React, { useState, useEffect, useContext, useCallback } from "react";
import api from "../services/api";
import socket from "../services/socket";
import { AuthContext } from "../context/AuthContext";
import {
  Calendar,
  Clock,
  UserCheck,
  XCircle,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  // Appointments & Meta State
  const [appointments, setAppointments] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Pagination States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  // Edit / Notes Modal State
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notesInput, setNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Fetch Appointments from Backend
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(departmentFilter && { department: departmentFilter }),
        ...(dateFilter && { date: dateFilter }),
      });

      const response = await api.get(`/appointments?${params.toString()}`);
      setAppointments(response.data.data);
      setMeta(response.data.meta);
      try {
        const statsResponse = await api.get("/dashboard/stats");
        setSystemStats(statsResponse.data.data || {});
      } catch {
        setSystemStats({});
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, departmentFilter, dateFilter]);

  // Initial Load & Real-Time Socket Updates
  useEffect(() => {
    fetchAppointments();

    socket.connect();
    socket.on("appointmentUpdated", () => {
      fetchAppointments();
    });

    return () => {
      socket.off("appointmentUpdated");
      socket.disconnect();
    };
  }, [fetchAppointments]);

  // Status Action Handlers
  const handleMarkArrived = async (id) => {
    try {
      await api.post(`/appointments/${id}/arrive`);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark patient as arrived");
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?"))
      return;
    try {
      await api.delete(`/appointments/${id}`);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;
    setSavingNotes(true);
    try {
      await api.put(`/appointments/${selectedAppointment._id}`, {
        notes: notesInput,
      });
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // Helper Stats Counters
  const stats = {
    total: systemStats.appointments ?? meta.total ?? 0,
    scheduled:
      systemStats.statuses?.Scheduled ??
      appointments.filter((a) => a.status === "Scheduled").length,
    arrived:
      systemStats.statuses?.Arrived ??
      appointments.filter((a) => a.status === "Arrived").length,
    completed:
      systemStats.statuses?.Completed ??
      appointments.filter((a) => a.status === "Completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Role:{" "}
            <span className="font-semibold text-blue-600">{user?.role}</span> |
            Central EMR Appointment Dashboard
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {user?.role === "SUPER_ADMIN" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">
              Registered Patients
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {systemStats.patients ?? "—"}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Doctor Profiles</p>
            <p className="text-2xl font-bold text-gray-900">
              {systemStats.doctors ?? "—"}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">
              Active Staff Accounts
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {systemStats.activeUsers ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Appointments
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Scheduled</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.scheduled}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Arrived</p>
            <p className="text-2xl font-bold text-gray-900">{stats.arrived}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Completed</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.completed}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Patient Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Name, Phone, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2 w-full text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 w-full text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Arrived">Arrived</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <input
              type="text"
              placeholder="Filter Department..."
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 w-full text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>

          {/* Date Picker Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 w-full text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading appointments...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 flex justify-center items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No appointments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Doctor / Dept</th>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Purpose / Notes</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((app) => (
                  <tr
                    key={app._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {app.patientId?.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {app.patientId?.patientId} | {app.patientId?.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">
                        Dr. {app.doctorId?.userId?.name || "Assigned Doctor"}
                      </div>
                      <div className="text-xs text-blue-600">
                        {app.department}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {app.appointmentDate}
                      </div>
                      <div className="text-xs text-gray-500">
                        {app.slotStartTime} - {app.slotEndTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-800">{app.purpose}</div>
                      {app.notes && (
                        <div className="text-xs text-gray-500 italic mt-0.5">
                          "{app.notes}"
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          app.status === "Scheduled"
                            ? "bg-amber-100 text-amber-800"
                            : app.status === "Arrived"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "Completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* Mark Arrived Action */}
                      {["SUPER_ADMIN", "RECEPTIONIST"].includes(user?.role) &&
                        app.status === "Scheduled" && (
                          <button
                            onClick={() => handleMarkArrived(app._id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition"
                          >
                            Mark Arrived
                          </button>
                        )}

                      {/* Doctor Notes Action */}
                      {user?.role === "DOCTOR" && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(app);
                            setNotesInput(app.notes || "");
                          }}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
                        >
                          Update Notes
                        </button>
                      )}

                      {/* Cancel Appointment Action */}
                      {["SUPER_ADMIN", "RECEPTIONIST"].includes(user?.role) &&
                        app.status !== "Cancelled" && (
                          <button
                            onClick={() => handleCancelAppointment(app._id)}
                            className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
                          >
                            Cancel
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Showing Page{" "}
            <span className="font-semibold text-gray-800">{meta.page}</span> of{" "}
            <span className="font-semibold text-gray-800">
              {meta.pages || 1}
            </span>{" "}
            ({meta.total} total)
          </span>
          <div className="flex space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 border rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= meta.pages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 border rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Consultation Notes Modal for Doctor */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Consultation Notes for {selectedAppointment.patientId?.name}
            </h3>
            <textarea
              rows={4}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Type consultation notes or diagnosis details..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
