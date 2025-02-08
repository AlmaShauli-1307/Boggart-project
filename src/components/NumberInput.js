// NumberInput.js
import React from 'react';

const NumberInput = ({ value, onChange }) => {
  return (
    <div className="number-input">
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default NumberInput;
