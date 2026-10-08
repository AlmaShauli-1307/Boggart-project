import { useCallback, useLayoutEffect, useState } from 'react';

// Shared navigation behaviour for all multi-page questionnaires.
// - Jumps to the top of the page whenever the page changes (forward or back).
// - "Next" is always clickable: if questions are missing it highlights them
//   and scrolls to the first one instead of silently doing nothing.

export const questionAnchorId = (id) => `question-${id}`;

// A response counts as answered unless it is empty (undefined, null, '' or []).
export const isAnswered = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return true;
};

const useQuestionnaireNav = (currentPage) => {
    const [showErrors, setShowErrors] = useState(false);

    // useLayoutEffect runs after the new page is in the DOM but before paint,
    // so the user never sees the previous scroll position. No smooth scrolling
    // here on purpose — a smooth scroll that starts before the new content is
    // rendered gets interrupted and lands mid-page.
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        setShowErrors(false);
    }, [currentPage]);

    const tryAdvance = useCallback((missingIds, advance) => {
        if (missingIds.length === 0) {
            setShowErrors(false);
            advance();
            return;
        }
        setShowErrors(true);
        const el = document.getElementById(questionAnchorId(missingIds[0]));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    return { showErrors, tryAdvance };
};

export default useQuestionnaireNav;
