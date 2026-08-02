import React from 'react';
import './Question.css';

const Question = ({
    id,
    text,
    selectedValue,
    onSelect,
    options = [1, 2, 3, 4, 5],
    leftLabel,
    rightLabel
}) => {
    // Determine if this is a wider scale (more than 5 options)
    const isMidScale = options.length > 5 && options.length <= 7;
    const isWideScale = options.length > 7;

    // Check if we have side labels
    const hasSideLabels = leftLabel || rightLabel;

    return (
        <div className="question-item">
            <p className="question-text">{text}</p>

            {/* Table with side labels if provided */}
            {hasSideLabels ? (
                <div dir="ltr" className={`rating-table-container-with-labels ${isWideScale ? 'wide-scale' : isMidScale ? 'mid-scale' : ''}`}>
                    <div className="side-label left-label" style={{ left: '-20px' }}>{leftLabel}</div>

                    <div className={`rating-table-container ${isWideScale ? 'wide-scale' : ''}`}>
                        <table className={`rating-table ${isWideScale ? 'wide-scale' : ''}`}>
                            <tbody>
                                <tr>
                                    {options.map((value) => (
                                        <td
                                            key={`${id}-${value}`}
                                            className={`rating-cell ${selectedValue === value ? 'selected' : ''}`}
                                            onClick={() => onSelect(id, value)}
                                        >
                                            {value}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="side-label right-label" style={{ right: '-20px' }}>{rightLabel}</div>
                </div>
            ) : (
                <div className={`rating-table-container ${isWideScale ? 'wide-scale' : isMidScale ? 'mid-scale' : ''}`}>
                    <table className={`rating-table ${isWideScale ? 'wide-scale' : isMidScale ? 'mid-scale' : ''}`}>
                        <tbody>
                            <tr>
                                {options.map((value) => (
                                    <td
                                        key={`${id}-${value}`}
                                        className={`rating-cell ${selectedValue === value ? 'selected' : ''}`}
                                        onClick={() => onSelect(id, value)}
                                    >
                                        {value}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Question;