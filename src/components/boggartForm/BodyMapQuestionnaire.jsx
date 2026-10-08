import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import './BodyMapQuestionnaire.css';
import body from '../../images/body.png';

// Regions that can be tapped directly on the diagram (UX 2.3.1). Small face
// parts (eyes, nose, teeth…), Back (hidden in a front view) and Ribs/Clavicle
// stay list-only, because their drawn areas are too small or overlap.
const TAPPABLE_PARTS = ['Head', 'Neck', 'Shoulders', 'Chest', 'Stomach', 'Pelvis',
    'Hands', 'Elbows', 'Legs', 'Knees', 'Ankles', 'Feet'];
// Touch area is 150% of the drawn region, centred on it.
const HITBOX_SCALE = 1.5;

const toHitboxes = (region) => (region.areas || [region]).map(a => {
    const cx = parseFloat(a.left);
    const top = parseFloat(a.top);
    const w = parseFloat(a.width);
    const h = parseFloat(a.height);
    const cy = top + h / 2;
    return {
        x1: cx - (w * HITBOX_SCALE) / 2, x2: cx + (w * HITBOX_SCALE) / 2,
        y1: cy - (h * HITBOX_SCALE) / 2, y2: cy + (h * HITBOX_SCALE) / 2,
        area: w * h,
    };
});

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
            step1: 'Step 1 of 2',
            step2: 'Step 2 of 2',
            step2Hint: 'Choose from the areas you marked above',
            tapHint: 'Tap an area on the body, or choose from the list',
            selectedPrefix: 'Selected:',
            nothingSelected: 'No area selected yet',
            mostPainfulConfirm: 'Most painful area:',
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
            step1: 'שלב 1 מתוך 2',
            step2: 'שלב 2 מתוך 2',
            step2Hint: 'בחר/י מתוך האזורים שסימנת למעלה',
            tapHint: 'אפשר לגעת באזור בתמונה או לבחור מהרשימה',
            selectedPrefix: 'נבחר:',
            nothingSelected: 'עדיין לא נבחר אזור',
            mostPainfulConfirm: 'האזור הכואב ביותר:',
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

    // Calibrated against body.png (1534×1153): percentages of the image box.
    // left = horizontal centre of the region (translateX(-50%)), top = top edge.
    const bodyPartRegions = {
        'Head': { top: '4.5%', left: '50%', width: '11%', height: '11.5%', borderRadius: '50%' },
        'Neck': { top: '14%', left: '50%', width: '6%', height: '5%' },
        'Shoulders': { areas: [{ top: '18%', left: '42.5%', width: '7%', height: '7%' }, { top: '18%', left: '57.5%', width: '7%', height: '7%' }] },
        'Back': { top: '20%', left: '50%', width: '18%', height: '25%' },
        'Chest': { top: '20.5%', left: '50%', width: '17%', height: '11.5%' },
        'Stomach': { top: '32%', left: '50%', width: '14%', height: '13%' },
        'Pelvis': { top: '45%', left: '50%', width: '17%', height: '8%' },
        'Knees': { top: '64%', left: '50%', width: '15%', height: '8%' },
        'Legs': { top: '50%', left: '50%', width: '17%', height: '35%' },
        'Ankles': { top: '84%', left: '50%', width: '15%', height: '5%' },
        'Feet': { top: '88%', left: '50%', width: '22%', height: '8%' },
        'Hands': { areas: [{ top: '46%', left: '35%', width: '7.5%', height: '10%' }, { top: '46%', left: '65%', width: '7.5%', height: '10%' }] },
        'Elbows': { areas: [{ top: '35%', left: '40%', width: '6%', height: '6%' }, { top: '35%', left: '60%', width: '6%', height: '6%' }] },
        'Eyes': { top: '8.5%', left: '50%', width: '7%', height: '2.5%' },
        'Ears': { areas: [{ top: '9.5%', left: '45.6%', width: '2.5%', height: '4%' }, { top: '9.5%', left: '54.4%', width: '2.5%', height: '4%' }] },
        'Nose': { top: '10.5%', left: '50%', width: '3%', height: '2.5%' },
        'Teeth': { top: '13%', left: '50%', width: '4%', height: '1.8%' },
        'Tongue': { top: '13%', left: '50%', width: '4%', height: '1.8%' },
        'Throat': { top: '15.5%', left: '50%', width: '6%', height: '3%' },
        'Nape': { top: '14%', left: '50%', width: '6%', height: '5%' },
        'Clavicle': { top: '18.5%', left: '50%', width: '14%', height: '3.5%' },
        'Ribs': { top: '25%', left: '50%', width: '16%', height: '9%' }
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

    // Step 2 (UX 2.3.4): with a single area selected there is nothing to
    // choose — select it automatically and show a confirmation instead.
    // If more areas are added later, the automatic pick is cleared so the
    // user actively chooses among them.
    const radioKey = selectedForRadio.join('|');
    const autoPickedRef = useRef(null);
    useEffect(() => {
        if (!showMostPainful || !setMostPainfulPart) return;
        if (selectedForRadio.length === 1 && mostPainfulPart !== selectedForRadio[0]) {
            autoPickedRef.current = selectedForRadio[0];
            setMostPainfulPart(selectedForRadio[0]);
        } else if (selectedForRadio.length > 1 && autoPickedRef.current
            && mostPainfulPart === autoPickedRef.current) {
            autoPickedRef.current = null;
            setMostPainfulPart(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [radioKey, showMostPainful]);

    // Tap on the diagram (UX 2.3.1): pick the smallest region whose enlarged
    // hitbox contains the touch point, so e.g. knees win over legs.
    const wrapperRef = useRef(null);
    const [lastTapped, setLastTapped] = useState(null);
    const handleDiagramTap = (e) => {
        const rect = wrapperRef.current.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        let best = null;
        TAPPABLE_PARTS.forEach(part => {
            toHitboxes(bodyPartRegions[part]).forEach(b => {
                if (px >= b.x1 && px <= b.x2 && py >= b.y1 && py <= b.y2 && (!best || b.area < best.area)) {
                    best = { part, area: b.area };
                }
            });
        });
        if (best) {
            handleCheckboxChange(best.part);
            setLastTapped(best.part);
        }
    };

    const partName = (part) => part === 'Other'
        ? (otherBodyPart || texts.bodyParts['Other'])
        : texts.bodyParts[part];
    const selectedNames = selectedBodyParts.map(partName).join(', ');

    return (
        <div className="body-map-container" dir={language === 'he' ? 'rtl' : 'ltr'}>
            <div className="body-map-section">
                {showMostPainful && <p className="body-map-step">{texts.step1}</p>}
                <h3>{texts.title}</h3>
                <p className="body-map-hint">{texts.tapHint}</p>
                <div className="body-image-container">
                    <div className="body-image-wrapper tappable" ref={wrapperRef} onClick={handleDiagramTap}>
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
                                    <div key={`${part}-${index}`} className={`highlight-overlay ${part === lastTapped ? 'just-selected' : ''}`}
                                        style={{ top: area.top, left: area.left, width: area.width, height: area.height, borderRadius: area.borderRadius || '5px', transform: area.transform || 'translateX(-50%)' }} />
                                ));
                            }
                            return (
                                <div key={part} className={`highlight-overlay ${part === lastTapped ? 'just-selected' : ''}`}
                                    style={{ top: region.top, left: region.left, width: region.width, height: region.height, borderRadius: region.borderRadius || '5px', transform: region.transform || 'translateX(-50%)' }} />
                            );
                        })}
                    </div>
                    {/* text confirmation that doesn't rely on colour alone (UX 2.3.1) */}
                    <p className={`body-map-selected ${selectedBodyParts.length ? 'has-selection' : ''}`} aria-live="polite">
                        {selectedBodyParts.length
                            ? <><strong>{texts.selectedPrefix}</strong> {selectedNames}</>
                            : texts.nothingSelected}
                    </p>
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

            {/* Step 2 — most painful area (UX 2.3.4): clearly separated card with
                its own step heading and hint; auto-confirmed when only one area */}
            {showMostPainful && selectedForRadio.length > 0 && (
                <div className="body-parts-section most-painful-section">
                    <p className="body-map-step">{texts.step2}</p>
                    <h3>{texts.mostPainful}</h3>
                    {selectedForRadio.length === 1 ? (
                        <p className="most-painful-confirm">
                            {texts.mostPainfulConfirm} <strong>{partName(selectedForRadio[0])}</strong> ✓
                        </p>
                    ) : (
                        <>
                            <p className="body-map-hint">{texts.step2Hint}</p>
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
                                        <label htmlFor={`most-${part}`}>{partName(part)}</label>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default BodyMapQuestionnaire;