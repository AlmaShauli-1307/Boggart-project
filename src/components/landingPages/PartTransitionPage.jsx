import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';
import { STUDY_PARTS, PART_COUNT, PartSteps, partClassName } from '../generalComponents/PartBand';
import '../generalComponents/PartBand.css';
import './PartTransitionPage.css';

// Short screen between two parts of the first visit:
// "You finished part X ✓ — next: part Y". Nothing is saved here; it only
// passes the participant on to `next` with `nextState`.
const PartTransitionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const { part, next, nextState } = location.state || {};
    const info = STUDY_PARTS[part];

    useEffect(() => {
        if (!info || !next) navigate('/', { replace: true });
    }, [info, next, navigate]);

    if (!info || !next) return null;

    const finished = part - 1;

    return (
        <div className={`part-transition ${partClassName(part)}`} lang={language} dir={language === 'he' ? 'rtl' : 'ltr'}>
            <LanguageToggle />
            <header className="part-transition-header">
                <img src={logo} alt="Boggart" className="logo-image" />
            </header>

            <main className="part-transition-content">
                <PartSteps part={part} />

                <div className="part-transition-done" aria-hidden="true">✓</div>
                <h1 className="part-transition-title">{t(`partDone${finished}Title`)}</h1>
                <p className="part-transition-sub">{t(`partDone${finished}Text`)}</p>

                <section className="part-transition-next">
                    <div className="part-transition-next-icon" aria-hidden="true">{info.icon}</div>
                    <div className="part-transition-next-label">
                        {t('nextPartLabel').replace('{n}', part).replace('{total}', PART_COUNT)}
                    </div>
                    <h2 className="part-transition-next-title">{t(info.title)}</h2>
                    <p className="part-transition-next-text">{t(`part${part}Intro`)}</p>
                </section>

                <PrimaryButton
                    text={t('continueToNextPart')}
                    onClick={() => navigate(next, { state: nextState, replace: true })}
                />
            </main>
        </div>
    );
};

export default PartTransitionPage;
