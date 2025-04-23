import React from 'react';
import Select from 'react-select';
import './CustomStyledSelect.css'; // Import your custom styles

function CustomStyledSelect({ question, value, onChange }) {
    const options = question.options.map(option => ({ value: option, label: option }));
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <Select
            options={options}
            value={selectedOption}
            onChange={(selected) => onChange(question.id, selected ? selected.value : null)}
            placeholder={question.text}
            isClearable={false}
            className="custom-react-select" //  Main class for the component
            classNamePrefix="custom-react-select" // Class prefix for react-select's internal elements
        />
    );
}

export default CustomStyledSelect;