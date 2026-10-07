import React from 'react';
import { useLanguage } from '../LanguageContext';
import { questionAnchorId } from './useQuestionnaireNav';
import './QuestionShell.css';

// Wraps any question so it can be scrolled to and highlighted when unanswered.
const QuestionShell = ({ id, missing = false, children }) => {
    const { t } = useLanguage();
    return (
        <div id={questionAnchorId(id)} className={`question-shell ${missing ? 'has-error' : ''}`}>
            {children}
            {missing && (
                <p className="question-error" role="alert">{t('fieldRequired')}</p>
            )}
        </div>
    );
};

export default QuestionShell;
