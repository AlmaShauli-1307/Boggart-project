import { useEffect, useState } from 'react';

// On phones, long questionnaire pages are split into screens of at most
// QUESTIONS_PER_SCREEN questions, so a participant sees a short, focused set
// at a time (UX 3.3). Desktop keeps one screen per questionnaire page.
// Pages listed in `keepTogether` (e.g. SAM, whose questions share one image)
// are never split.

export const QUESTIONS_PER_SCREEN = 3;
const MOBILE_QUERY = '(max-width: 600px)';

export const useIsMobile = () => {
    const get = () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;
    const [isMobile, setIsMobile] = useState(get);
    useEffect(() => {
        const mq = window.matchMedia(MOBILE_QUERY);
        const onChange = () => setIsMobile(mq.matches);
        mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
        return () => (mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange));
    }, []);
    return isMobile;
};

const useQuestionScreens = ({ questions, currentPage, totalPages, keepTogether = () => false }) => {
    const isMobile = useIsMobile();
    const [subPage, setSubPage] = useState(0);

    const pageQuestions = (page) => questions.filter(q => Number(q.Page) === page);

    const screensOf = (page) => {
        const all = pageQuestions(page);
        if (!isMobile || all.length <= QUESTIONS_PER_SCREEN || keepTogether(all)) return [all];
        const chunks = [];
        for (let i = 0; i < all.length; i += QUESTIONS_PER_SCREEN) {
            chunks.push(all.slice(i, i + QUESTIONS_PER_SCREEN));
        }
        return chunks;
    };

    const screens = screensOf(currentPage);
    const safeSub = Math.min(subPage, screens.length - 1);

    // keep the index valid if the phone is rotated / window resized
    useEffect(() => {
        if (subPage !== safeSub) setSubPage(safeSub);
    }, [subPage, safeSub]);

    let screenNumber = safeSub + 1;
    let screenTotal = 0;
    for (let p = 1; p <= totalPages; p++) {
        const n = screensOf(p).length;
        if (p < currentPage) screenNumber += n;
        screenTotal += n;
    }

    return {
        subPage: safeSub,
        currentQuestions: screens[safeSub] || [],
        isLastScreenOfPage: safeSub >= screens.length - 1,
        isLastScreen: currentPage >= totalPages && safeSub >= screens.length - 1,
        isFirstScreen: currentPage <= 1 && safeSub === 0,
        screenNumber,
        screenTotal: Math.max(screenTotal, 1),
        nextSubPage: () => setSubPage(s => s + 1),
        prevSubPage: () => setSubPage(s => s - 1),
        // after moving to another questionnaire page
        enterPage: (page, fromEnd = false) => setSubPage(fromEnd ? screensOf(page).length - 1 : 0),
    };
};

export default useQuestionScreens;
