// TextInput.js
import React from 'react';

const TextInput = ({ value, onChange }) => {
  return (
    <div className="text-input">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default TextInput;
