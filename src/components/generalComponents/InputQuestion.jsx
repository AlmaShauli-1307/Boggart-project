import React from 'react';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import './InputQuestion.css';

const InputQuestion = ({
    id,
    text,
    selectedValue,
    onChange,
    placeholder,
    inputType = "longText",
    hint
}) => {
    const { language } = useLanguage();
    const hintId = hint ? `hint-${id}` : undefined;
    const defaultPlaceholder = language === 'he' ? 'כתב/י כאן...' : 'Write in here...';
    const finalPlaceholder = placeholder || defaultPlaceholder;

    // Handle change based on input type
    const handleChange = (e) => {
        let newValue = e.target.value;

        // For number type, only allow digits
        if (inputType === "number" && newValue) {
            newValue = newValue.replace(/[^\d]/g, '');
        }

        // Call the onChange function with id and value to match DetailedQuestionnairePage's handleOptionSelect
        onChange(id, newValue);
    };

    return (
        <div className="input-question-item">
            {/* all questionnaire fields are required — say so explicitly (UX 2.4) */}
            <p className="input-question-text">
                {text}
                <span className="required-mark" aria-hidden="true"> *</span>
            </p>
            {hint && <p id={hintId} className="input-question-hint">{hint}</p>}

            {inputType === "longText" ? (
                <textarea
                    id={id}
                    className="input-question-field long-text"
                    value={selectedValue || ''}
                    onChange={handleChange}
                    placeholder={finalPlaceholder}
                    aria-required="true"
                    aria-describedby={hintId}
                />
            ) : (
                <input
                    id={id}
                    type="text"
                    className={`input-question-field ${inputType === "number" ? "number-input" : "short-text"}`}
                    value={selectedValue || ''}
                    onChange={handleChange}
                    placeholder={finalPlaceholder}
                    aria-required="true"
                    aria-describedby={hintId}
                />
            )}
        </div>
    );
};

export default InputQuestion;