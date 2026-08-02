import React, { useState, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import './BodyMapQuestionnaire.css';
import body from '../../images/body.png';

const BodyMapQuestionnaire = ({ selectedBodyParts, setSelectedBodyParts, mostPainfulPart, setMostPainfulPart, showMostPainful = false }) => {
    const { language } = useLanguage();
    const imageRef = useRef(null);

    const bodyParts = [
        'Head', 'Neck', 'Shoulders', 'Back', 'Stomach', 'Pelvis', 'Knees',
        'Legs', 'Ankles', 'Feet', 'Hands', 'Elbows', 'Chest',
        'Eyes', 'Ears', 'Nose', 'Teeth', 'Tongue', 'Throat',
        'Nape', 'Clavicle', 'Ribs', 'Entire body'
    ];

    const translations = {
        en: {
            title: 'Where do you feel the pain?',
            selectAreas: 'Select the areas where you feel pain',
            mostPainful: 'Select the area that hurts the most',
            other: 'Other...',
            clearAll: 'Clear All Selections',
            bodyParts: {
                'Head': 'Head', 'Neck': 'Neck', 'Shoulders': 'Shoulders',
                'Back': 'Back', 'Stomach': 'Stomach', 'Pelvis': 'Pelvis', 'Knees': 'Knees',
                'Legs': 'Legs', 'Ankles': 'Ankles', 'Feet': 'Feet',
                'Hands': 'Hands', 'Elbows': 'Elbows', 'Chest': 'Chest',
                'Eyes': 'Eyes', 'Ears': 'Ears', 'Nose': 'Nose',
                'Teeth': 'Teeth', 'Tongue': 'Tongue', 'Throat': 'Throat',
                'Nape': 'Nape', 'Clavicle': 'Clavicle', 'Ribs': 'Ribs',
                'Entire body': 'Entire body', 'Other': 'Other'
            }
        },
        he: {
            title: 'איפה את/ה מרגיש/ה את הכאב?',
            selectAreas: 'בחר/י את האזורים שבהם את/ה מרגיש/ה כאב',
            mostPainful: 'בחר/י את האזור הכואב ביותר',
            other: 'אחר...',
            clearAll: 'נקה את כל הבחירות',
            bodyParts: {
                'Head': 'ראש', 'Neck': 'צוואר', 'Shoulders': 'כתפיים',
                'Back': 'גב', 'Stomach': 'בטן', 'Pelvis': 'אגן', 'Knees': 'ברכיים',
                'Legs': 'רגליים', 'Ankles': 'קרסוליים', 'Feet': 'כפות רגליים',
                'Hands': 'ידיים', 'Elbows': 'מרפקים', 'Chest': 'חזה',
                'Eyes': 'עיניים', 'Ears': 'אוזניים', 'Nose': 'אף',
                'Teeth': 'שיניים', 'Tongue': 'לשון', 'Throat': 'גרון',
                'Nape': 'עורף', 'Clavicle': 'עצם הבריח', 'Ribs': 'צלעות',
                'Entire body': 'כל הגוף', 'Other': 'אחר'
            }
        }
    };

    const texts = translations[language];

    const bodyPartRegions = {
        'Head': { top: '3%', left: '50%', width: '15%', height: '15%', borderRadius: '50%' },
        'Neck': { top: '13%', left: '50%', width: '7%', height: '5%' },
        'Shoulders': { top: '19%', left: '50%', width: '25%', height: '5%' },
        'Back': { top: '20%', left: '50%', width: '20%', height: '25%' },
        'Chest': { top: '20%', left: '50%', width: '20%', height: '13%' },
        'Stomach': { top: '32%', left: '50%', width: '16%', height: '13%' },
        'Pelvis': { top: '45%', left: '50%', width: '16%', height: '8%' },
        'Knees': { top: '63%', left: '50%', width: '16%', height: '8%' },
        'Legs': { top: '49%', left: '50%', width: '16%', height: '40%' },
        'Ankles': { top: '85%', left: '50%', width: '17%', height: '5%' },
        'Feet': { top: '87%', left: '50%', width: '22%', height: '9%' },
        'Hands': { areas: [{ top: '25%', left: '37%', width: '15%', height: '30%' }, { top: '25%', left: '63%', width: '15%', height: '30%' }] },
        'Elbows': { areas: [{ top: '35%', left: '40%', width: '7%', height: '5%' }, { top: '35%', left: '60%', width: '7%', height: '5%' }] },
        'Eyes': { top: '8%', left: '50%', width: '10%', height: '3%' },
        'Ears': { areas: [{ top: '10%', left: '47%', width: '3%', height: '4%' }, { top: '10%', left: '53%', width: '3%', height: '4%' }] },
        'Nose': { top: '11%', left: '50%', width: '3%', height: '3%' },
        'Teeth': { top: '13%', left: '50%', width: '5%', height: '3%' },
        'Tongue': { top: '13%', left: '50%', width: '5%', height: '3%' },
        'Throat': { top: '15%', left: '50%', width: '8%', height: '3%' },
        'Nape': { top: '13%', left: '50%', width: '7%', height: '5%' },
        'Clavicle': { top: '18%', left: '50%', width: '20%', height: '4%' },
        'Ribs': { top: '23%', left: '50%', width: '15%', height: '13%' }
    };

    const handleCheckboxChange = (bodyPart) => {
        if (selectedBodyParts.includes(bodyPart)) {
            setSelectedBodyParts(selectedBodyParts.filter(part => part !== bodyPart));
            // אם האזור שנוסר היה הכי כואב — נאפס
            if (showMostPainful && mostPainfulPart === bodyPart && setMostPainfulPart) {
                setMostPainfulPart(null);
            }
        } else {
            setSelectedBodyParts([...selectedBodyParts, bodyPart]);
        }
    };

    const [otherBodyPart, setOtherBodyPart] = useState('');

    const handleOtherChange = (e) => {
        setOtherBodyPart(e.target.value);
        if (e.target.value.trim() !== '' && !selectedBodyParts.includes('Other')) {
            setSelectedBodyParts([...selectedBodyParts, 'Other']);
        } else if (e.target.value.trim() === '' && selectedBodyParts.includes('Other')) {
            setSelectedBodyParts(selectedBodyParts.filter(part => part !== 'Other'));
        }
    };

    const handleClearSelections = () => {
        setSelectedBodyParts([]);
        setOtherBodyPart('');
        if (showMostPainful && setMostPainfulPart) setMostPainfulPart(null);
    };

    // האזורים שנבחרו — לתצוגת radio
    const selectedForRadio = selectedBodyParts.filter(p => p !== 'Other');
    if (selectedBodyParts.includes('Other') && otherBodyPart.trim() !== '') {
        selectedForRadio.push('Other');
    }

    return (
        <div className="body-map-container" dir={language === 'he' ? 'rtl' : 'ltr'}>
            <div className="body-map-section">
                <h3>{texts.title}</h3>
                <div className="body-image-container">
                    <div className="body-image-wrapper">
                        <img ref={imageRef} src={body} alt="Body outline" className="body-outline-image" />
                        {selectedBodyParts.map(part => {
                            if (part === 'Entire body') {
                                return (
                                    <div key={part} className="highlight-overlay entire-body"
                                        style={{ top: '0%', left: '0%', width: '100%', height: '100%', borderRadius: '10px' }} />
                                );
                            }
                            const region = bodyPartRegions[part];
                            if (!region) return null;
                            if (region.areas) {
                                return region.areas.map((area, index) => (
                                    <div key={`${part}-${index}`} className="highlight-overlay"
                                        style={{ top: area.top, left: area.left, width: area.width, height: area.height, borderRadius: area.borderRadius || '5px', transform: area.transform || 'translateX(-50%)' }} />
                                ));
                            }
                            return (
                                <div key={part} className="highlight-overlay"
                                    style={{ top: region.top, left: region.left, width: region.width, height: region.height, borderRadius: region.borderRadius || '5px', transform: region.transform || 'translateX(-50%)' }} />
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="body-parts-section">
                <h3>{texts.selectAreas}</h3>
                <div className="body-parts-grid">
                    {bodyParts.map((part) => (
                        <div key={part} className="body-part-checkbox">
                            <input type="checkbox" id={part} checked={selectedBodyParts.includes(part)} onChange={() => handleCheckboxChange(part)} />
                            <label htmlFor={part}>{texts.bodyParts[part]}</label>
                        </div>
                    ))}
                    <div className="body-part-checkbox other-option">
                        <input type="checkbox" id="Other" checked={selectedBodyParts.includes('Other')} onChange={() => handleCheckboxChange('Other')} />
                        <label htmlFor="Other">
                            <input type="text" value={otherBodyPart} onChange={handleOtherChange} placeholder={texts.other} className="other-input" />
                        </label>
                    </div>
                    {selectedBodyParts.length > 0 && (
                        <div className="clear-button-container">
                            <button className="clear-selections-button" onClick={handleClearSelections}>{texts.clearAll}</button>
                        </div>
                    )}
                </div>
            </div>

            {/* סקשן האזור הכי כואב — רק אם showMostPainful=true ויש אזורים נבחרים */}
            {showMostPainful && selectedForRadio.length > 0 && (
                <div className="body-parts-section most-painful-section">
                    <h3>{texts.mostPainful}</h3>
                    <div className="body-parts-grid">
                        {selectedForRadio.map((part) => (
                            <div key={part} className="body-part-checkbox">
                                <input
                                    type="radio"
                                    id={`most-${part}`}
                                    name="mostPainful"
                                    checked={mostPainfulPart === part}
                                    onChange={() => setMostPainfulPart(part)}
                                />
                                <label htmlFor={`most-${part}`}>
                                    {part === 'Other' ? (otherBodyPart || texts.bodyParts['Other']) : texts.bodyParts[part]}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BodyMapQuestionnaire;