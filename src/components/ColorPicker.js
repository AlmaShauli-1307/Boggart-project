// ColorPicker.js
import React from 'react';

const ColorPicker = ({ value, onChange }) => {
  return (
    <div className="color-picker">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default ColorPicker;
