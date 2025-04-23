import React from 'react';
import './InputQuestion.css';

const InputQuestion = ({
                           id,
                           text,
                           selectedValue,
                           onChange,
                           placeholder = "Write in here...",
                           inputType = "longText" // "number", "shortText", or "longText"
                       }) => {

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
            <p className="input-question-text">{text}</p>

            {inputType === "longText" ? (
                <textarea
                    id={id}
                    className="input-question-field long-text"
                    value={selectedValue || ''} // Ensure we handle undefined/null values
                    onChange={handleChange}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    id={id}
                    type="text"
                    className={`input-question-field ${inputType === "number" ? "number-input" : "short-text"}`}
                    value={selectedValue || ''} // Ensure we handle undefined/null values
                    onChange={handleChange}
                    placeholder={placeholder}
                />
            )}
        </div>
    );
};

export default InputQuestion;