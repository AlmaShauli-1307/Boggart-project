// Dropdown.js
import React from 'react';

const Dropdown = ({ value, options, onChange }) => {
  return (
    <div className="dropdown">
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {options && options.split(',').map((option, index) => (
          <option key={index} value={option.trim()}>{option.trim()}</option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
