import React from 'react';
import './EmotionScalePage.css';
import emotionScaleImage from '../../images/emotion-scale.png'; // Add your emotion scale image

const EmotionScalePage = ({
                              questions,
                              responses,
                              onSelect
                          }) => {
    return (
        <div className="emotion-scale-page">
            <h2 className="emotion-scale-title">
                You will now see two scales describing an emotional experience
            </h2>

            <div className="emotion-scale-image-container">
                <img
                    src={emotionScaleImage}
                    alt="Emotional experience scale grid showing arousal and valence dimensions"
                    className="emotion-scale-image"
                />
            </div>

            <div className="emotion-scale-questions">
                {questions.map(question => (
                    <div key={question.id} className="emotion-question-item">
                        <p className="emotion-question-text">{question.text}</p>
                        <div className="rating-table-container wide-scale">
                            <table className="rating-table wide-scale">
                                <tbody>
                                <tr>
                                    {Array.from({ length: 11 }, (_, i) => i).map(value => (
                                        <td
                                            key={`${question.id}-${value}`}
                                            className={`rating-cell ${responses[question.id] === value ? 'selected' : ''}`}
                                            onClick={() => onSelect(question.id, value)}
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
        </div>
    );
};

export default EmotionScalePage;