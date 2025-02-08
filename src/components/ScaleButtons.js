import React from 'react';

const ScaleButton = ({ value, onClick, isSelected, label }) => {
  return (
    <button 
      className={isSelected ? 'selected' : ''} 
      onClick={() => onClick(value)}
    >
      {label || value}
    </button>
  );
};

export default ScaleButton;
