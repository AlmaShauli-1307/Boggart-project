import React from 'react';

const LikertScale = ({ value, min, max, leftLabel, rightLabel, scaleLabels, onChange }) => {
  const handleButtonClick = (val) => {
    if (onChange) {
      onChange(val);
    }
  };

  // Creating a range of numbers between min and max
  const scaleRange = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return (
    <div className="likert-scale">
      <div className="scale-container">
        {leftLabel && <div className="scale-label min">{leftLabel}</div>}

        <div className="scale-buttons">
          {scaleRange.map((num) => (
            <button
              key={num}
              className={`likert-button ${value === num ? 'selected' : ''}`}
              onClick={() => handleButtonClick(num)}
            >
              {num}
            </button>
          ))}
        </div>

        {rightLabel && <div className="scale-label max">{rightLabel}</div>}
      </div>

      {/* Display scale labels if available */}
      {scaleLabels && scaleLabels.length > 0 && (
        <div className="scale-labels">
          {scaleLabels.map((label, index) => (
            <div key={index} className="scale-label">
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikertScale;
