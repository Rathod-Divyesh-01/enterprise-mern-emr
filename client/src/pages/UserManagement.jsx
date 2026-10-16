import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import api from "../services/api";

const blank = { name: "", email: "", password: "", role: "RECEPTIONIST" };
const blankDoctor = { userId: "", department: "", specialization: "" };
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(blank);
  const [doctorForm, setDoctorForm] = useState(blankDoctor);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/users");
      setUsers(data.data || []);
      const doctorsResponse = await api.get("/doctors");
      setDoctors(doctorsResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);

  async function createUser(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    setError("");
    try {
      await api.post("/users", form);
      setForm(blank);
      setFeedback("User account created.");
      await reload();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create user.");
    } finally {
      setBusy(false);
    }
  }

  async function createDoctorProfile(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    setError("");
    try {
      await api.post("/doctors", {
        ...doctorForm,
        schedule: [
          {
            dayOfWeek: "Monday",
            slotDurationMinutes: 15,
            sessions: [{ startTime: "09:00", endTime: "17:00" }],
            breaks: [{ startTime: "13:00", endTime: "14:00", title: "Lunch" }],
          },
        ],
      });
      setDoctorForm(blankDoctor);
      setFeedback(
        "Doctor profile created with the sample Monday schedule. Update hours before use.",
      );
      await reload();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create doctor profile.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(user, role) {
    try {
      await api.patch(`/users/${user._id}`, { role });
      setFeedback(`Updated ${user.name}'s role.`);
      await reload();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update role.");
    }
  }
  async function toggleActive(user) {
    const nextState = !user.isActive;
    if (
      !window.confirm(`${nextState ? "Activate" : "Deactivate"} ${user.name}?`)
    )
      return;
    try {
      await api.patch(`/users/${user._id}`, { isActive: nextState });
      setFeedback("Account status updated.");
      await reload();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update account.");
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-bold">User management</h1>
        <p className="mt-2 text-slate-500">
          Create staff accounts and manage role access.
        </p>
      </header>
      {feedback && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">
          {feedback}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
      <form
        onSubmit={createUser}
        className="grid gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-4"
      >
        <h2 className="text-lg font-bold md:col-span-4">Create account</h2>
        <label className="text-sm font-medium">
          Name
          <input
            required
            minLength="2"
            className="mt-1 w-full rounded-lg border p-2.5"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="text-sm font-medium">
          Email
          <input
            required
            type="email"
            className="mt-1 w-full rounded-lg border p-2.5"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="text-sm font-medium">
          Temporary password
          <input
            required
            minLength="10"
            type="password"
            className="mt-1 w-full rounded-lg border p-2.5"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <label className="text-sm font-medium">
          Role
          <select
            className="mt-1 w-full rounded-lg border p-2.5"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="DOCTOR">Doctor</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </label>
        <button
          disabled={busy}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50 md:col-span-4"
        >
          <UserPlus size={17} />
          {busy ? "Creating…" : "Create user"}
        </button>
      </form>
      <form
        onSubmit={createDoctorProfile}
        className="grid gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-3"
      >
        <h2 className="text-lg font-bold md:col-span-3">
          Add doctor profile and sample hours
        </h2>
        <label className="text-sm font-medium">
          Doctor account
          <select
            required
            className="mt-1 w-full rounded-lg border p-2.5"
            value={doctorForm.userId}
            onChange={(e) =>
              setDoctorForm({ ...doctorForm, userId: e.target.value })
            }
          >
            <option value="">Select doctor account</option>
            {users
              .filter(
                (user) =>
                  user.role === "DOCTOR" &&
                  !doctors.some((doctor) => doctor.userId?._id === user._id),
              )
              .map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} · {user.email}
                </option>
              ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Department
          <input
            required
            className="mt-1 w-full rounded-lg border p-2.5"
            value={doctorForm.department}
            onChange={(e) =>
              setDoctorForm({ ...doctorForm, department: e.target.value })
            }
          />
        </label>
        <label className="text-sm font-medium">
          Specialization
          <input
            required
            className="mt-1 w-full rounded-lg border p-2.5"
            value={doctorForm.specialization}
            onChange={(e) =>
              setDoctorForm({ ...doctorForm, specialization: e.target.value })
            }
          />
        </label>
        <button
          disabled={busy || !doctorForm.userId}
          className="w-fit rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white disabled:opacity-50 md:col-span-3"
        >
          Create doctor profile
        </button>
      </form>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Loading user accounts…
          </p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="p-4">
                      <strong>{user.name}</strong>
                      <br />
                      <span className="text-slate-500">{user.email}</span>
                    </td>
                    <td className="p-4">
                      <select
                        aria-label={`Role for ${user.name}`}
                        className="rounded border p-2"
                        value={user.role}
                        onChange={(e) => changeRole(user, e.target.value)}
                      >
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="DOCTOR">Doctor</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {user.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(user)}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
