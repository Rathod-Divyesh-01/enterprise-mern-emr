import { useCallback, useEffect, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  mobile: "",
  email: "",
  age: "",
  gender: "Female",
  medicalHistory: "",
};

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState({
    appointmentId: "",
    diagnosis: "",
    treatmentPlan: "",
    note: "",
  });

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/patients", {
        params: { search, limit: 50 },
      });
      setPatients(data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load patients. Check the API connection.",
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  async function submitPatient(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/patients", { ...form, age: Number(form.age) });
      setMessage("Patient registered.");
      setForm(initialForm);
      setShowForm(false);
      await loadPatients();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not register patient.");
    } finally {
      setSaving(false);
    }
  }

  async function showDetails(id) {
    try {
      const { data } = await api.get(`/patients/${id}`);
      setSelected(data.data);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Could not load patient record.",
      );
    }
  }

  async function saveNote(event) {
    event.preventDefault();
    try {
      await api.post(`/patients/${selected.patient._id}/clinical-notes`, note);
      setMessage("Clinical note saved.");
      setNote({
        appointmentId: "",
        diagnosis: "",
        treatmentPlan: "",
        note: "",
      });
      await showDetails(selected.patient._id);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Could not save clinical note.",
      );
    }
  }

  const canRegister = ["SUPER_ADMIN", "RECEPTIONIST"].includes(user?.role);
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Records
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Patients</h1>
          <p className="mt-2 text-slate-500">
            Search patient records and view authorized clinical history.
          </p>
        </div>
        {canRegister && (
          <button
            onClick={() => setShowForm((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800"
          >
            <UserPlus size={18} /> Register patient
          </button>
        )}
      </header>
      {message && (
        <p role="status" className="rounded-lg bg-blue-50 p-3 text-blue-800">
          {message}
        </p>
      )}
      {showForm && (
        <form
          onSubmit={submitPatient}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">
            New patient registration
          </h2>
          <label className="text-sm font-medium">
            Full name
            <input
              required
              minLength="2"
              maxLength="120"
              className="mt-1 w-full rounded-lg border p-2.5"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="text-sm font-medium">
            Mobile number
            <input
              required
              pattern="[0-9]{10}"
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border p-2.5"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </label>
          <label className="text-sm font-medium">
            Email (optional)
            <input
              type="email"
              className="mt-1 w-full rounded-lg border p-2.5"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              Age
              <input
                type="number"
                min="0"
                max="120"
                required
                className="mt-1 w-full rounded-lg border p-2.5"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </label>
            <label className="text-sm font-medium">
              Gender
              <select
                className="mt-1 w-full rounded-lg border p-2.5"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>
          </div>
          <label className="text-sm font-medium sm:col-span-2">
            Relevant medical history (synthetic/demo data only)
            <textarea
              maxLength="5000"
              rows="3"
              className="mt-1 w-full rounded-lg border p-2.5"
              value={form.medicalHistory}
              onChange={(e) =>
                setForm({ ...form, medicalHistory: e.target.value })
              }
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              disabled={saving}
              className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save patient"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <Search className="text-slate-400" size={19} />
        <label className="sr-only" htmlFor="patient-search">
          Search patients
        </label>
        <input
          id="patient-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, patient ID, or mobile"
          className="w-full outline-none"
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Loading patient records…
          </p>
        ) : error ? (
          <p role="alert" className="p-8 text-center text-red-700">
            {error}
          </p>
        ) : patients.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No patient records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Patient</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Age / Gender</th>
                  <th className="p-4">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {patients.map((patient) => (
                  <tr key={patient._id}>
                    <td className="p-4 font-semibold text-slate-900">
                      {patient.name}
                    </td>
                    <td className="p-4">{patient.patientId}</td>
                    <td className="p-4">
                      {patient.mobile}
                      <br />
                      {patient.email}
                    </td>
                    <td className="p-4">
                      {patient.age} / {patient.gender}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => showDetails(patient._id)}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        View record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
        >
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  Patient record
                </p>
                <h2 className="text-2xl font-bold">{selected.patient.name}</h2>
                <p className="text-sm text-slate-500">
                  {selected.patient.patientId} · {selected.patient.age} ·{" "}
                  {selected.patient.gender}
                </p>
              </div>
              <button
                aria-label="Close record"
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
            </div>
            <div className="mt-5">
              <h3 className="font-bold">Medical history</h3>
              <p className="mt-1 whitespace-pre-wrap text-slate-600">
                {selected.patient.medicalHistory || "No history recorded."}
              </p>
            </div>
            <div className="mt-5">
              <h3 className="font-bold">Appointments</h3>
              {selected.appointments.length ? (
                selected.appointments.map((item) => (
                  <p
                    key={item._id}
                    className="mt-2 rounded-lg bg-slate-50 p-3 text-sm"
                  >
                    {item.appointmentDate} · {item.slotStartTime} ·{" "}
                    {item.purpose} · {item.status}
                  </p>
                ))
              ) : (
                <p className="mt-2 text-slate-500">No appointments found.</p>
              )}
            </div>
            <div className="mt-5">
              <h3 className="font-bold">Clinical notes</h3>
              {(selected.patient.clinicalNotes || []).map((item, index) => (
                <p
                  key={`${item._id || index}`}
                  className="mt-2 rounded-lg bg-slate-50 p-3 text-sm"
                >
                  <strong>{item.diagnosis || "Clinical note"}</strong>
                  <br />
                  {item.treatmentPlan}
                  <br />
                  {item.note}
                </p>
              ))}
            </div>
            {user?.role === "DOCTOR" &&
              selected.appointments.some(
                (item) => item.status !== "Cancelled",
              ) && (
                <form
                  onSubmit={saveNote}
                  className="mt-6 space-y-3 border-t pt-5"
                >
                  <h3 className="font-bold">Add clinical note</h3>
                  <label className="block text-sm">
                    Assigned appointment
                    <select
                      required
                      className="mt-1 w-full rounded-lg border p-2"
                      value={note.appointmentId}
                      onChange={(e) =>
                        setNote({ ...note, appointmentId: e.target.value })
                      }
                    >
                      <option value="">Select appointment</option>
                      {selected.appointments
                        .filter((item) => item.status !== "Cancelled")
                        .map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.appointmentDate} · {item.slotStartTime}
                          </option>
                        ))}
                    </select>
                  </label>
                  <input
                    aria-label="Diagnosis"
                    placeholder="Diagnosis"
                    className="w-full rounded-lg border p-2"
                    value={note.diagnosis}
                    onChange={(e) =>
                      setNote({ ...note, diagnosis: e.target.value })
                    }
                  />
                  <textarea
                    aria-label="Treatment plan"
                    placeholder="Treatment plan"
                    rows="2"
                    className="w-full rounded-lg border p-2"
                    value={note.treatmentPlan}
                    onChange={(e) =>
                      setNote({ ...note, treatmentPlan: e.target.value })
                    }
                  />
                  <textarea
                    aria-label="Clinical note"
                    placeholder="Clinical note"
                    rows="3"
                    className="w-full rounded-lg border p-2"
                    value={note.note}
                    onChange={(e) => setNote({ ...note, note: e.target.value })}
                  />
                  <button className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">
                    Save note
                  </button>
                </form>
              )}
          </section>
        </div>
      )}
    </section>
  );
}
