import React, { useState } from "react";
import { useLanguage } from '../LanguageContext';
import './CheckboxQuestion.css';

const CheckboxQuestion = ({
    id,
    text,
    selectedValues = [],
    other = "",
    onSelect,
    onOther,
    options,
    showOther = true,
    singleSelect = false,
}) => {
    const [otherSelected, setOtherSelected] = useState(false)
    const { language } = useLanguage();


    const handleCheckboxChange = (value) => {
        if (singleSelect) {
            onSelect(id, [value]);
            return;
        }
        if (value === 'Other') {
            setOtherSelected(!otherSelected);
        }
        if (selectedValues.includes(value)) {
            onSelect(id, selectedValues.filter((v) => v !== value));
        } else {
            onSelect(id, [...selectedValues, value]);
        }
    };

    const onOtherChange = (event) => {
        const newValue = event.target.value;
        onOther(id, newValue);
        if (newValue.trim() === '') {
            setOtherSelected(false);
        }
        else {
            setOtherSelected(true);
        }
    };

    return (
        <div className="question-item" dir={language === 'he' ? 'rtl' : 'ltr'}>
            <p className="question-text">{text}</p>
            <div className="options-grid">
                {options.map((option) => (
                    <div key={option} className="option-checkbox">
                        <input
                            type="checkbox"
                            id={option}
                            checked={selectedValues.includes(option)}
                            onChange={() => handleCheckboxChange(option)}
                        />
                        <label htmlFor={option}>{option}</label>
                    </div>
                ))}
                {showOther && (
                    <div className="option-checkbox other-option">
                        <input
                            type="checkbox"
                            id="Other"
                            checked={otherSelected}
                            onChange={() => handleCheckboxChange('Other')}
                        />
                        <label htmlFor="Other">
                            <input
                                type="text"
                                value={other}
                                onChange={onOtherChange}
                                placeholder="Other..."
                                className="other-input"
                                aria-label="Other input"
                            /></label>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckboxQuestion;