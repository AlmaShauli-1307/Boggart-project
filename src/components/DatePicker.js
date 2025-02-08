// DatePicker.js
import React from 'react';

const DatePicker = ({ value, onChange }) => {
  return (
    <div className="date-picker">
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default DatePicker;
