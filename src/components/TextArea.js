// TextArea.js
import React from 'react';

const TextArea = ({ value, onChange }) => {
  return (
    <div className="text-area">
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default TextArea;
