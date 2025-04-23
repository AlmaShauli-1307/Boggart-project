import React from 'react';
import './PainScaleQuestion.css';


// Import all face images
import face0 from '../../images/pain-faces/0.png';
import face1 from '../../images/pain-faces/1.png';
import face2 from '../../images/pain-faces/2.png';
import face3 from '../../images/pain-faces/3.png';
import face4 from '../../images/pain-faces/4.png';
import face5 from '../../images/pain-faces/5.png';
import face6 from '../../images/pain-faces/6.png';
import face7 from '../../images/pain-faces/7.png';
import face8 from '../../images/pain-faces/8.png';
import face9 from '../../images/pain-faces/9.png';
import face10 from '../../images/pain-faces/10.png';

const PainScaleQuestion = ({
                               id,
                               text,
                               selectedValue,
                               onSelect,
                               min = 0,
                               max = 10
                           }) => {
    // Generate array of options
    const options = Array.from({ length: max - min + 1 }, (_, i) => i + min);

    // Face emoji labels
    const faceLabels = [
        'Pain Free',
        'Very Mild',
        'Discomforting',
        'Tolerable',
        'Distressing',
        'Very Distressing',
        'Intense',
        'Very Intense',
        'Utterly Horrible',
        'Excruciating Unbearable',
        'Unimaginable Unspeakable'
    ];

    // Array of imported face images
    const faceImages = [
        face0, face1, face2, face3, face4, face5,
        face6, face7, face8, face9, face10
    ];

    return (
        <div className="pain-scale-question">
            <p className="question-text-pain">{text}</p>

            <div className="pain-scale-faces">
                {options.map((value) => (
                    <div key={`face-${value}`} className="pain-face-container">
                        <img
                            src={faceImages[value]}
                            alt={`Pain level ${value}`}
                            className="pain-face"
                        />
                        <span className="pain-label">{faceLabels[value]}</span>
                        <span className="pain-value">{value}</span>
                    </div>
                ))}
                <div className="pain-scale-line"></div>
            </div>

            <div className="rating-table-container-pain">
                <table className="rating-table-pain">
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
        </div>
    );
};

export default PainScaleQuestion;