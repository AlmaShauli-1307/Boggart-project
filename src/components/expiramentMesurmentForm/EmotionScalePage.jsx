import React from 'react';
import { useLanguage } from '../LanguageContext';
import './EmotionScalePage.css';
import emotionScaleImage from '../../images/emotion-scale.png';
import Question from '../generalComponents/Question';

const NINE_POINT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const EmotionScalePage = ({
    questions,
    responses,
    onSelect
}) => {
    const { language, t } = useLanguage();

    // Define translations for the title
    const titleText = language === 'he'
        ? 'כעת תראה/י שני סולמות המתארים חוויה רגשית'
        : 'You will now see two scales describing an emotional experience';

    return (
        <div className="emotion-scale-page" dir={language === 'he' ? 'rtl' : 'ltr'}>
            <h2 className="emotion-scale-title">
                {titleText}
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
                        <Question
                            id={question.id}
                            text={question.text}
                            selectedValue={responses[question.id]}
                            onSelect={onSelect}
                            options={NINE_POINT_OPTIONS}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmotionScalePage;
