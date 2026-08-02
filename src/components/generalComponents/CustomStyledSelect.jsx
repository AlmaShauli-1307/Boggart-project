import React from 'react';
import Select from 'react-select';
import './CustomStyledSelect.css';

function CustomStyledSelect({ question, value, onChange }) {
    // Handle both string options and object options {value, label}
    const options = question.options.map(option => {
        // If option is already an object with value and label, use it as-is
        if (typeof option === 'object' && option.value !== undefined) {
            return option;
        }
        // If option is a string, convert it to {value, label} format
        return { value: option, label: option };
    });

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <Select
            options={options}
            value={selectedOption}
            onChange={(selected) => onChange(question.id, selected ? selected.value : null)}
            placeholder={question.text}
            isClearable={false}
            className="custom-react-select"
            classNamePrefix="custom-react-select"
        />
    );
}

export default CustomStyledSelect;
