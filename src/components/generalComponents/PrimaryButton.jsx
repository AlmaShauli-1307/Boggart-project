import React from 'react';
import './PrimaryButton.css';

const PrimaryButton = ({ text, onClick, className, disabled = false }) => {
    return (
        <button
            className={`primary-button ${disabled ? 'disabled' : ''} ${className || ''}`}
            onClick={onClick}
            disabled={disabled}
        >
            {text}
        </button>
    );
};

export default PrimaryButton;