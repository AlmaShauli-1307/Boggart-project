import { useEffect, useRef, useState } from 'react';

// Saves a questionnaire in progress on this device (localStorage), so a
// participant who leaves in the middle (closes the tab, phone locks, refresh)
// comes back to the same screen with their answers.
//
// - Nothing is sent anywhere — it stays in the participant's browser.
// - A saved questionnaire expires after PROGRESS_TTL_DAYS.
// - It is deleted as soon as the questionnaire is submitted.
// - Passwords are never saved.

export const PROGRESS_TTL_DAYS = 3;
const TTL_MS = PROGRESS_TTL_DAYS * 24 * 60 * 60 * 1000;
const PREFIX = 'boggart-progress:';
const RESUME_KEY = 'boggart-resume';

const read = (key) => {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const item = JSON.parse(raw);
        if (!item || Date.now() - item.savedAt > TTL_MS) {
            window.localStorage.removeItem(key);
            return null;
        }
        return item.data;
    } catch (e) {
        return null;
    }
};

const write = (key, data) => {
    try {
        window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
    } catch (e) {
        // private mode / storage full — the questionnaire still works, just without saving
    }
};

const remove = (key) => {
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
};

export const loadProgress = (name) => read(PREFIX + name);
export const saveProgress = (name, data) => write(PREFIX + name, data);
export const clearProgress = (name) => remove(PREFIX + name);

// Where the participant stopped in the first-visit flow
// (consent → questionnaire before → boggart questionnaire → personal details),
// so the landing page can offer "continue where you left off".
export const getResumePoint = () => read(RESUME_KEY);
export const setResumePoint = (path, state = null) => write(RESUME_KEY, { path, state });
export const clearResumePoint = () => remove(RESUME_KEY);

// "Start over" on the landing page: removes the saved first-visit
// questionnaires (before / boggart / personal details). A returning
// participant's saved "after" questionnaire is kept.
export const clearFirstVisitProgress = () => {
    try {
        Object.keys(window.localStorage)
            .filter(k => (k.startsWith(PREFIX) && !k.startsWith(PREFIX + 'after:')) || k === RESUME_KEY)
            .forEach(k => window.localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
};

// Restores once when `ready` turns true (questions loaded), then saves every
// time `data` changes. Saving starts only on the render *after* the restore,
// so the restored answers are never overwritten by the empty initial state.
export const useSavedProgress = ({ name, ready, data, onRestore }) => {
    const [restored, setRestored] = useState(false);
    const onRestoreRef = useRef(onRestore);
    onRestoreRef.current = onRestore;

    useEffect(() => {
        if (!name || !ready || restored) return;
        const saved = loadProgress(name);
        if (saved) onRestoreRef.current(saved);
        setRestored(true);
    }, [name, ready, restored]);

    const serialized = JSON.stringify(data);
    useEffect(() => {
        if (!name || !restored) return;
        saveProgress(name, JSON.parse(serialized));
    }, [name, restored, serialized]);
};
