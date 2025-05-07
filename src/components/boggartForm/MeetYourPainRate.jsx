import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../boggartForm/MeetYourPainRate.css';
import demoBoggart from '../../images/demoBoggart.png';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';


const MeetYourPainRate = () => {
    const navigate = useNavigate();
    const [responses, setResponses] = useState({});
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pageData = {instructions: "Take a deep look at the generated image of your pain"};
    const questions = React.useMemo(() => [
        {
            question_ID: 0,
            Question: "On a scale of 1-10, how connected do you feel to the visual character describing your experience of pain?",
            scale_min: 1,
            scale_max: 10
        },
        {
            question_ID: 1,
            Question: "On a scale of 1-10, is the visual character a well representation of your pain?",
            scale_min: 1,
            scale_max: 10
        }
    ], []);
    useEffect(() => {

        if (questions.length === 0) {
            setAllQuestionsAnswered(true);
            return;
        }

        const allAnswered = questions.every(q =>
            responses[q.question_ID] !== undefined && responses[q.question_ID] !== null
        );

        setAllQuestionsAnswered(allAnswered);
    }, [responses, questions]);

    const handleOptionSelect = (questionId, value) => {
    setResponses({
        ...responses,
        [questionId]: value
    });
};


    // Function to submit answers
    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch('http://localhost:5000/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: responses }),
            });

            const data = await response.json();
            console.log('✅ Response from server:', data);
            alert('Answers submitted successfully!');
            navigate('/questionnaire-after');
            setIsSubmitting(false);
        } catch (error) {
            console.error('❌ Error submitting answers:', error);
            alert('An error occurred while submitting answers.');
            navigate('/questionnaire-after');
            setIsSubmitting(false);
        }
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
        <div className="emotion-scale-page">
            <div className="boggart-image-container">
                <img
                    src={demoBoggart}
                    alt="boggart-picture"
                    className="boggart-image"
                />
            </div>

            <div className="emotion-scale-questions">
                {questions.map(question => (
                    <div key={question.question_ID} className="emotion-question-item">
                        <p className="emotion-question-text">{question.Question}</p>
                        <div className="rating-table-container wide-scale">
                            <table className="rating-table wide-scale">
                                <tbody>
                                <tr>
                                    {Array.from({ length: question.scale_max - question.scale_min + 1 },
                                        (_, i) => i + question.scale_min).map(value => (
                                        <td
                                            key={`${question.question_ID}-${value}`}
                                            className={`rating-cell ${responses[question.question_ID] === value ? 'selected' : ''}`}
                                            onClick={() => handleOptionSelect(question.question_ID, value)}
                                        >
                                            {value}
                                        </td>
                                    ))}
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div></div>

                    <div className="navigation">
                            <PrimaryButton
                                text="NEXT"
                                onClick={handleSubmit}
                                disabled={!allQuestionsAnswered || isSubmitting}
                            />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MeetYourPainRate;