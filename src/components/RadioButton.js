// RadioButton.js
import React from 'react';

const RadioButton = ({ value, options, onChange }) => {
  return (
    <div className="radio-buttons">
      <h3>{options.title}</h3>
      {options.values && options.values.split(',').map((option, index) => (
        <label key={index} className="radio-label">
          <input
            type="radio"
            value={option.trim()}
            checked={value === option.trim()}
            onChange={() => onChange(option.trim())}
            className="radio-input"
          />
          <span className="radio-custom"></span>
          {option.trim()}
        </label>
      ))}
    </div>
  );
};

export default RadioButton;