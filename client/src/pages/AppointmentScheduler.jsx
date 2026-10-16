import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import SlotGrid from '../components/appointments/SlotGrid';

export default function AppointmentScheduler() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Patient Booking Form state
  const [patientType, setPatientType] = useState('NEW');
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patientForm, setPatientForm] = useState({ name: '', mobile: '', age: '', gender: 'Male', email: '' });
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchDoctors();
    socket.connect();
    socket.on('appointmentUpdated', () => {
      if (selectedDoctor && selectedDate) fetchSlots(selectedDoctor, selectedDate);
    });
    return () => {
      socket.off('appointmentUpdated');
      socket.disconnect();
    };
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data.data);
      if (res.data.data.length > 0) setSelectedDoctor(res.data.data[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSlots = async (docId, date) => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`/slots?doctorId=${docId}&date=${date}`);
      setSlots(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchSlots(selectedDoctor, selectedDate);
      setSelectedSlot(null);
    }
  }, [selectedDoctor, selectedDate]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return alert('Please select a time slot.');

    const payload = {
      patientType,
      doctorId: selectedDoctor,
      appointmentDate: selectedDate,
      slotStartTime: selectedSlot.startTime,
      slotEndTime: selectedSlot.endTime,
      purpose,
      ...(patientType === 'EXISTING' ? { patientId: patientIdInput } : { patientDetails: patientForm }),
    };

    try {
      await api.post('/appointments', payload);
      setMessage({ type: 'success', text: 'Appointment booked successfully!' });
      setSelectedSlot(null);
      fetchSlots(selectedDoctor, selectedDate);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to book appointment' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Enterprise Appointment Scheduler</h2>

      {message && (
        <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Doctor</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm"
          >
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                Dr. {doc.userId?.name} ({doc.department})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
        <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} loading={loadingSlots} />
      </div>

      {selectedSlot && (
        <form onSubmit={handleBook} className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Patient Information & Booking</h3>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="patientType"
                value="NEW"
                checked={patientType === 'NEW'}
                onChange={() => setPatientType('NEW')}
                className="mr-2"
              />
              New Patient
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="patientType"
                value="EXISTING"
                checked={patientType === 'EXISTING'}
                onChange={() => setPatientType('EXISTING')}
                className="mr-2"
              />
              Existing Patient
            </label>
          </div>

          {patientType === 'NEW' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={patientForm.name}
                onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Mobile Number (10 digits)"
                required
                pattern="[0-9]{10}"
                value={patientForm.mobile}
                onChange={(e) => setPatientForm({ ...patientForm, mobile: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Age"
                required
                value={patientForm.age}
                onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                className="p-2 border rounded"
              />
              <select
                value={patientForm.gender}
                onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                className="p-2 border rounded"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          ) : (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter Mongo Patient ObjectId"
                required
                value={patientIdInput}
                onChange={(e) => setPatientIdInput(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              placeholder="Purpose of Visit (e.g., General Checkup)"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">
            Confirm Booking for {selectedSlot.startTime}
          </button>
        </form>
      )}
    </div>
  );
}