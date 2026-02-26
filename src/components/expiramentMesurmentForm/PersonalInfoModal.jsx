// PersonalInfoModal.jsx
import React, { useState, useEffect } from 'react';
import { getNames } from 'country-list';
import languages from 'iso-639-1';
import './PersonalInfoModal.css';
import PrimaryButton from '../generalComponents/PrimaryButton';
import CustomStyledSelect from "../generalComponents/CustomStyledSelect";

const PersonalInfoModal = ({ isOpen, onClose, onSubmit, form1Id, isSubmitting }) => {
    const [responses, setResponses] = useState({});
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const countryNames = Object.values(getNames());
    const languageNames = languages.getAllNames();

    const questions = [
        {
            id: "username",
            text: "Username",
            questionType: "shortText",
        },
        {
            id: "password",
            text: "Password",
            questionType: "password",
        },
        {
            id: 82,
            text: "Name",
            options: [],
            questionType: "shortText",
        },
        {
            id: 83,
            text: "Date",
            options: [],
            questionType: "date",
        },
        {
            id: 84,
            text: "Age",
            options: [],
            questionType: "number",
        },
        {
            id: 85,
            text: "Gender",
            options: ["Male", "Female", "Non-binary / Third gender", "Other", "Prefer not to say"],
            questionType: "dropdown",
        },
        {
            id: 86,
            text: "What is your religion",
            options: ["Judaism", "Islam", "Christianity", "Hinduism", "Buddhism", "Non-religious / Atheist", "Prefer not to say", "Other"],
            questionType: "dropdown",
        },
        {
            id: 87,
            text: "What is your nationality?",
            options: Object.values(countryNames),
            questionType: "dropdown",
        },
        {
            id: 88,
            text: "Your mother tongue",
            options: languageNames,
            questionType: "dropdown",
        },
        {
            id: 89,
            text: "Your socio-economic status",
            options: ["Lower income", "Lower-middle income", "Middle income", "Upper-middle income", "Upper income", "Prefer not to say"],
            questionType: "dropdown",
        },
        {
            id: 90,
            text: "What is your education?",
            options: ["No formal schooling", "Primary education", "High school diploma or equivalent", "Some college / vocational training", "Bachelor's degree", "Master's degree", "Doctoral degree (PhD)", "Prefer not to say"],
            questionType: "dropdown",
        },
        {
            id: 91,
            text: "Is there an existing diagnosis for your pain?",
            options: [],
            questionType: "shortText",
        },
    ];

    useEffect(() => {
        if (questions.length === 0) {
            setAllQuestionsAnswered(true);
            return;
        }

        const allAnswered = questions.every(q =>
            q.id === 91 || // Skip question 91
            (responses[q.id] !== undefined && responses[q.id] !== null && responses[q.id] !== "")
        );

        setAllQuestionsAnswered(allAnswered);
    }, [responses, questions]);

    const handleOptionSelect = (questionId, value) => {
        setErrorMessage(""); // איפוס שגיאה ברגע שהמשתמש מקליד שוב
        setResponses({
            ...responses,
            [questionId]: value
        });
    };

    const handleSubmit = async () => {
        setErrorMessage("");
        await onSubmit(responses);
        // אם השרת החזיר שגיאה שהסיסמה תפוסה
        if (result && result.error === "PASSWORD_TAKEN") {
            setErrorMessage("This password is already taken. Please choose another one.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Personal Information</h2>
                    <p>While your pain visualization is being created, please fill in your personal details:</p>
                </div>

                <div className="modal-body">
                    <div className="question-grid">
                        {questions.map((question) => {
                            if (question.questionType === "shortText") {
                                return (
                                    <input
                                        key={question.id}
                                        id={question.id}
                                        type="text"
                                        className="input-personal-question-field"
                                        value={responses[question.id] || ""}
                                        onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                                        placeholder={question.text}
                                    />
                                );
                            }
                            else if (question.questionType === "number") {
                                return (
                                    <input
                                        key={question.id}
                                        id={question.id}
                                        type="number"
                                        className="input-personal-question-field"
                                        value={responses[question.id] || ""}
                                        onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                                        placeholder={question.text}
                                        min="0"
                                    />
                                );
                            }
                            else if (question.questionType === "date") {
                                return (
                                    <input
                                        key={question.id}
                                        id={question.id}
                                        type="text"
                                        className="input-personal-question-field"
                                        value={responses[question.id] || ""}
                                        onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                                        placeholder={question.text}
                                    />
                                );
                            }
                            else if (question.questionType === "dropdown") {
                                return (
                                    <CustomStyledSelect
                                        key={question.id}
                                        question={question}
                                        value={responses[question.id]}
                                        onChange={handleOptionSelect}
                                    />
                                );
                            }
                            return null;
                        })}
                    </div>
                    {/* הצגת הודעת השגיאה במידה והסיסמה תפוסה */}
                    {errorMessage && <p className="error-message-text" style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</p>}
                </div>

                <div className="modal-footer">
                    <PrimaryButton
                        text={isSubmitting ? "SUBMITTING..." : "CONTINUE TO IMAGE"}
                        onClick={handleSubmit}
                        disabled={!allQuestionsAnswered || isSubmitting}
                    />
                    <button className="secondary-button" onClick={onClose} disabled={isSubmitting}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonalInfoModal;