import React from 'react';
import { useLanguage } from '../LanguageContext';
import './PartBand.css';

// The first visit has three parts: questionnaires → creating the boggart →
// personal details. Each part has its own soft colour and icon, shown in a
// band at the top of the page. The colour is set on the page root with
// partClassName(n), which also tints the selected answers and the progress
// bar (see PartBand.css). The page background stays the same everywhere.
export const STUDY_PARTS = {
    1: { icon: '📋', title: 'part1Title', subtitle: 'part1Subtitle' },
    2: { icon: '🎨', title: 'part2Title', subtitle: 'part2Subtitle' },
    3: { icon: '👤', title: 'part3Title', subtitle: 'part3Subtitle' },
};
export const PART_COUNT = 3;

export const partClassName = (part) => `study-part study-part-${part}`;

export const PartSteps = ({ part }) => (
    <div className="part-steps" aria-hidden="true">
        {[1, 2, 3].map(n => (
            <i key={n} className={n < part ? 'done' : n === part ? 'on' : ''} />
        ))}
    </div>
);

const PartBand = ({ part }) => {
    const { t } = useLanguage();
    const info = STUDY_PARTS[part];
    if (!info) return null;
    const label = t('partOf').replace('{n}', part).replace('{total}', PART_COUNT);

    return (
        <div className="part-band-wrap">
            <div className="part-band">
                <span className="part-band-icon" aria-hidden="true">{info.icon}</span>
                <div>
                    <div className="part-band-title">{label} · {t(info.title)}</div>
                    <div className="part-band-subtitle">{t(info.subtitle)}</div>
                </div>
            </div>
            <PartSteps part={part} />
        </div>
    );
};

export default PartBand;
