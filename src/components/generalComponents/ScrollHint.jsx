import React, { useEffect, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import './ScrollHint.css';

// Small floating "scroll down" pill shown when a screen opens and there is
// more content below. Tapping it scrolls down; it disappears as soon as the
// user scrolls (or if everything already fits on the screen).
const ScrollHint = ({ watch }) => {
    const { t } = useLanguage();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Shown only at the start of each screen. As soon as the user starts
        // scrolling it is gone for this screen, so it never sits on top of an
        // answer button they are trying to tap.
        let dismissed = false;
        const check = () => {
            const doc = document.documentElement;
            const remaining = doc.scrollHeight - (window.scrollY + window.innerHeight);
            if (window.scrollY > 30) dismissed = true;
            setVisible(!dismissed && remaining > 120);
        };
        check();
        const timer = setTimeout(check, 400); // after images/fonts settle
        window.addEventListener('scroll', check, { passive: true });
        window.addEventListener('resize', check);
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
        if (ro) ro.observe(document.body);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', check);
            window.removeEventListener('resize', check);
            if (ro) ro.disconnect();
        };
    }, [watch]);

    if (!visible) return null;
    return (
        <button
            type="button"
            className="scroll-hint"
            onClick={() => window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' })}
        >
            <span>{t('scrollHint')}</span>
            <span className="scroll-hint-arrow" aria-hidden="true">↓</span>
        </button>
    );
};

export default ScrollHint;
