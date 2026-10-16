import React from 'react';

export default function SlotGrid({ slots, selectedSlot, onSelectSlot, loading }) {
  if (loading) return <div className="p-4 text-center text-gray-500">Loading dynamic slots...</div>;
  if (!slots || slots.length === 0) {
    return <div className="p-4 text-center text-gray-500 border border-dashed rounded-lg">No slots available or scheduled doctor off.</div>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-2">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.startTime === slot.startTime;
        const isDisabled = !slot.isAvailable;

        let btnClass = 'p-2 text-sm font-medium rounded-md text-center transition border ';
        if (isDisabled) {
          btnClass += 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through';
        } else if (isSelected) {
          btnClass += 'bg-blue-600 text-white border-blue-600 shadow-sm';
        } else {
          btnClass += 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50';
        }

        return (
          <button
            key={slot.startTime}
            disabled={isDisabled}
            onClick={() => onSelectSlot(slot)}
            className={btnClass}
            type="button"
          >
            {slot.startTime}
          </button>
        );
      })}
    </div>
  );
}