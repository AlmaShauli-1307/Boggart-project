import { useEffect, useState } from 'react';

// Long questionnaire pages are split into screens of at most
// QUESTIONS_PER_SCREEN questions, so a participant sees a short, focused set
// at a time (UX 3.3) — on phones and, by default, on desktop too.
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

// `perScreen` is a number, or a function (questionsOfThePage) => number, so
// some sections can use smaller screens (e.g. 2 questions from question 103).
const useQuestionScreens = ({
    questions, currentPage, totalPages,
    keepTogether = () => false,
    perScreen = QUESTIONS_PER_SCREEN,
    // split into screens on desktop as well (same experience everywhere)
    splitOnDesktop = true,
}) => {
    const isMobile = useIsMobile();
    const [subPage, setSubPage] = useState(0);

    const pageQuestions = (page) => questions.filter(q => Number(q.Page) === page);

    const screensOf = (page) => {
        const all = pageQuestions(page);
        const size = Math.max(1, typeof perScreen === 'function' ? perScreen(all) : perScreen);
        if ((!isMobile && !splitOnDesktop) || all.length <= size || keepTogether(all)) return [all];
        const chunks = [];
        for (let i = 0; i < all.length; i += size) {
            chunks.push(all.slice(i, i + size));
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
