import React from 'react';
import { useLanguage } from '../LanguageContext';
import './ProgressIndicator.css';

// Progress bar with a numeric label ("Page 3 of 8").
// Uses the existing .progress-bar / .progress-indicator styles.
const ProgressIndicator = ({ current, total }) => {
    const { t } = useLanguage();
    const safeTotal = Math.max(total || 1, 1);
    const percentage = Math.min((current / safeTotal) * 100, 100);
    const label = t('pageOf')
        .replace('{current}', current)
        .replace('{total}', safeTotal);

    return (
        <div className="progress-wrapper">
            <p className="progress-label" aria-live="polite">{label}</p>
            <div
                className="progress-bar"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={safeTotal}
                aria-valuenow={current}
            >
                <div className="progress-indicator" style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

export default ProgressIndicator;
