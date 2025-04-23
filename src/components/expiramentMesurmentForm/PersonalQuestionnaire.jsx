import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNames } from 'country-list';
import languages from 'iso-639-1';

import './PersonalQuestionnaire.css';
import logo from '../../images/logo.png'; // Adjust path as needed
import PrimaryButton from '../generalComponents/PrimaryButton';
import CustomStyledSelect from "../generalComponents/CustomStyledSelect";

const PersonalQuestionnaire = () => {
    const navigate = useNavigate();
    const [responses, setResponses] = useState({});
    const countryNames = Object.values(getNames());
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const languageNames = languages.getAllNames();
    const pageData = { title: 'Personal info', instructions: 'In the meantime, we invite you to answer the following questions while you wait to "meet your pain¬î' }

    const questions = [
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
            options: ["Judaism", "Islam", "Christianity", "Hinduism", "Buddhism", "Non-religious / Atheist", "Prefer not to say", "Other"], // Incomplete options in the original data
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
            options: ["No formal schooling", "Primary education", "High school diploma or equivalent", "Some college / vocational training", "Bachelor's degree", "Master's degree", "Doctoral degree (PhD)", "Prefer not to say"], // Incomplete options in the original data
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

        console.log('All questions answered (excluding 91):', allAnswered);
        console.log('Responses:', responses);
        console.log('Questions:', questions);

        setAllQuestionsAnswered(allAnswered);
    }, [responses, questions]);


    const handleOptionSelect = (questionId, value) => {
        setResponses({
            ...responses,
            [questionId]: value
        });
    };
    const checkDateFormat = (questionId, date) => {
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

        if (dateRegex.test(date)) {
            // Split the date into day, month, and year
            const [day, month, year] = date.split('/').map(Number);

            // Create a new Date object
            const parsedDate = new Date(year, month - 1, day);

            // Check if the date is valid
            if (
                parsedDate.getFullYear() === year &&
                parsedDate.getMonth() === month - 1 &&
                parsedDate.getDate() === day
            ) {
                // Update the state with the valid date
                setResponses({
                    ...responses,
                    [questionId]: date,
                });
                return true;
            }
        }
        return false;
    };

    // Function to submit answers
    const handleSubmit = async () => {
        const isDateValid = checkDateFormat(83, responses[83]);
        if (!isDateValid) {
            alert('Please enter a valid date in the format dd/mm/yyyy');
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:5000/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: responses }),
            });

            const data = await response.json();
            console.log('✅ Response from server:', data);
            alert('Answers submitted successfully!');
            // Redirect to success page or next step
            navigate('/completion');
        } catch (error) {
            console.error('❌ Error submitting answers:', error);
            alert('An error occurred while submitting answers.');
            navigate('/completion');

        }
        setIsSubmitting(false);
    };

    return (
        <div className="form-page">
            <header className="form-header">
                <img src={logo} alt="Boggart" className="logo-image"/>
            </header>
            <div className="form-container">
                <main className="form-content">
                    {/* Show instructions if available */}
                    {pageData.instructions && (
                        <div className="instructions">
                            <p className="instructions-text">
                                {pageData.instructions}
                            </p>
                        </div>
                    )}
                    <div className="questionnaire">
                        <div className="question-item">
                            <div className="question-grid">
                                {questions.map((question) => {
                                    if (question.questionType === "shortText") {
                                    return (
                                    <input
                                        id={question.id}
                                        type="text"
                                        className={`input-personal-question-field`}
                                        value={responses[question.id]} // Ensure we handle undefined/null values
                                        onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                                        placeholder={question.text}
                                    />)}
                                    else if (question.questionType === "number") {
                                        return (
                                            <input
                                                id={question.id}
                                                type="number"
                                                className={`input-personal-question-field`}
                                                value={responses[question.id]} // Ensure we handle undefined/null values
                                                onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                                                placeholder={question.text}
                                                min="0"
                                            />
                                        );
                                    }
                                    else if (question.questionType === "date") {
                                        return (
                                            <input
                                                id={question.id}
                                                type="text"
                                                className={`input-personal-question-field`}
                                                value={responses[question.id]} // Ensure we handle undefined/null values
                                                onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                                                placeholder={question.text}
                                            />
                                        );
                                    }
                                    else if (question.questionType === "dropdown") {
                                        return (
                                            <CustomStyledSelect
                                                question={question}
                                                value={responses[question.id]}
                                                onChange={handleOptionSelect}
                                            />
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="navigation">
                            <PrimaryButton
                                text={isSubmitting ? "SUBMITTING..." : "SUBMIT"}
                                onClick={handleSubmit}
                                disabled={!allQuestionsAnswered || isSubmitting}
                            />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PersonalQuestionnaire;