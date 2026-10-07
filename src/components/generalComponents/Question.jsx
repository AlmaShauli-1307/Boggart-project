import React from 'react';
import './Question.css';

// Single-choice answer scale used by every questionnaire.
//
// Mobile behaviour (UX findings 1.1, 1.2, 1.5, 1.7):
// - Answers are real buttons with a 44px minimum touch target.
// - Scales with more than 6 options (0–10, 1–9, 0%–100%) wrap onto two rows
//   instead of shrinking into one cramped row, so there is never horizontal scroll.
// - Only the two end labels are shown, above the buttons, each with its number
//   (a number badge next to each label), so they stay readable when the scale wraps.
//
// `options` may be primitives ([1, 2, 3]) or objects ([{ value, label }]).
// `mobileOnlyLabels` shows the end labels on mobile only — used when the page
// already shows a full ScaleLegend table on desktop.
const Question = ({
    id,
    text,
    selectedValue,
    onSelect,
    options = [1, 2, 3, 4, 5],
    leftLabel,
    rightLabel,
    mobileOnlyLabels = false,
}) => {
    const normalized = options.map(opt =>
        opt !== null && typeof opt === 'object'
            ? { value: opt.value, label: opt.label ?? opt.value }
            : { value: opt, label: opt }
    );

    const count = normalized.length;
    // On a 320–390px phone more than 6 buttons can't keep a 44px touch target,
    // so longer scales are split into two balanced rows (0–5 / 6–10).
    const isWide = count > 6;
    const mobileColumns = isWide ? Math.ceil(count / 2) : count;
    // Numeric scales always run low→high left-to-right (like the legend);
    // text options (Yes/No) follow the page direction.
    const isNumeric = normalized.every(o => typeof o.value === 'number' || /^\d+%?$/.test(String(o.value)));

    const hasLabels = Boolean(leftLabel || rightLabel);
    const first = normalized[0];
    const last = normalized[count - 1];

    return (
        <div className="question-item">
            {text && <p className="question-text">{text}</p>}

            <div
                className={`scale ${isWide ? 'scale-wide' : ''}`}
                dir={isNumeric ? 'ltr' : undefined}
                style={{ '--scale-count': count, '--scale-mobile-columns': mobileColumns }}
            >
                {hasLabels && (
                    <div className={`scale-edge-labels ${mobileOnlyLabels ? 'mobile-only' : ''}`}>
                        <span className="scale-edge-label start">
                            {leftLabel && first && <>
                                <span className="scale-edge-num">{first.label}</span>
                                <span className="scale-edge-text" dir="auto">{leftLabel}</span>
                            </>}
                        </span>
                        <span className="scale-edge-label end">
                            {rightLabel && last && <>
                                <span className="scale-edge-text" dir="auto">{rightLabel}</span>
                                <span className="scale-edge-num">{last.label}</span>
                            </>}
                        </span>
                    </div>
                )}

                <div className="scale-row">
                    {hasLabels && !mobileOnlyLabels && (
                        <span className="side-label left-label desktop-only" dir="auto">{leftLabel}</span>
                    )}

                    <div className="scale-options" role="radiogroup" aria-label={typeof text === 'string' ? text : undefined}>
                        {normalized.map(({ value, label }) => {
                            const selected = selectedValue === value;
                            return (
                                <button
                                    type="button"
                                    key={`${id}-${value}`}
                                    role="radio"
                                    aria-checked={selected}
                                    className={`scale-option ${selected ? 'selected' : ''}`}
                                    onClick={() => onSelect(id, value)}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {hasLabels && !mobileOnlyLabels && (
                        <span className="side-label right-label desktop-only" dir="auto">{rightLabel}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Question;
