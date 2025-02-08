// MultiSelect.js
import React from 'react';

const MultiSelect = ({ value, options, onChange }) => {
  return (
    <div className="multi-select">
      <select multiple value={value || []} onChange={(e) => onChange([...e.target.selectedOptions].map(option => option.value))}>
        {options && options.split(',').map((option, index) => (
          <option key={index} value={option.trim()}>{option.trim()}</option>
        ))}
      </select>
    </div>
  );
};

export default MultiSelect;
