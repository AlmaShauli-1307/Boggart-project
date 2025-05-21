import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './MidjourneyViewer.css';

const MidjourneyViewer = ({ answers, prompt, apiKey }) => {
    const [promptText, setPromptText] = useState(prompt || '');
    const [copySuccess, setCopySuccess] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [croppedImages, setCroppedImages] = useState([]);
    const canvasRef = useRef(null);

    // נתיב לתמונה המקורית - כרגע מוגדר כקבוע, בעתיד יתקבל מ-TTAPI
    const imageSource = "C:/Users/user/Desktop/Boggart-Project-master/sample_images/pain_sample_1.png";

    // פונקציה לחיתוך דינמי של התמונה ל-4 חלקים
    const splitImageIntoQuadrants = (img) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // קביעת גודל הקנבס כמו התמונה המקורית
        canvas.width = img.width;
        canvas.height = img.height;

        // ציור התמונה המקורית
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // חישוב גודל כל חלק
        const partWidth = img.width / 2;
        const partHeight = img.height / 2;

        // יצירת 4 תמונות נפרדות
        const quadrants = [];

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                // חישוב המיקום של כל חלק
                const x = col * partWidth;
                const y = row * partHeight;

                // יצירת קנבס זמני לכל חלק
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = partWidth;
                tempCanvas.height = partHeight;
                const tempCtx = tempCanvas.getContext('2d');

                // העתקת החלק הרצוי מהתמונה המקורית
                tempCtx.drawImage(
                    img,
                    x, y, partWidth, partHeight,  // מקור
                    0, 0, partWidth, partHeight   // יעד
                );

                // המרה לתמונה בפורמט URL
                const dataURL = tempCanvas.toDataURL('image/png');
                quadrants.push(dataURL);
            }
        }

        return quadrants;
    };

    // טעינת התמונה המקורית ופיצולה ל-4 חלקים בטעינת הקומפוננטה
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "Anonymous";  // חשוב עבור תמונות מנתיבים חיצוניים

        img.onload = () => {
            const quadrants = splitImageIntoQuadrants(img);
            setCroppedImages(quadrants);
        };

        img.onerror = (err) => {
            console.error("שגיאה בטעינת התמונה:", err);
            console.error("ניסיון לטעון מנתיב:", imageSource);

            // במקרה של שגיאה, ננסה טעינה מנתיב יחסי בתיקיית public
            const fallbackImg = new Image();
            fallbackImg.crossOrigin = "Anonymous";

            fallbackImg.onload = () => {
                console.log("טעינה מוצלחת מנתיב הגיבוי");
                const quadrants = splitImageIntoQuadrants(fallbackImg);
                setCroppedImages(quadrants);
            };

            fallbackImg.onerror = () => {
                console.error("גם טעינת תמונת גיבוי נכשלה");

                // יצירת תמונות ריקות לדוגמה
                const emptyQuadrants = Array(4).fill("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQAQMAAAC6caSPAAAAA1BMVEXu7u6QALoZAAAASElEQVR4nO3BMQEAAADCoPVPbQhfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgYcbQAAW97hl0AAAAASUVORK5CYII=");
                setCroppedImages(emptyQuadrants);
            };

            fallbackImg.src = '/sample_images/pain_sample_1.png';  // נתיב יחסי מתיקיית public
        };

        // מכיוון שהדפדפן לא יכול לגשת ישירות לנתיב מקומי כמו C:/..., 
        // נשתמש בתמונה שהעלית לתיקיית public
        img.src = '/sample_images/pain_sample_1.png';

    }, []);

    // אם אין פרומפט מוכן, יצור אחד מקומי
    useEffect(() => {
        if (!promptText) {
            const generateLocalPrompt = () => {
                const bodyParts = answers[63] || [];
                const bodyPartsText = bodyParts.length > 0 ? bodyParts.join(", ") : "general";
                const color = answers[64] || "red";
                const intensity = answers[65] || 5;

                const intensityWords = [
                    "indifferent", "apathetic", "uninterested", "disinterested",
                    "bored", "uneasy", "worried", "anxious", "agitated", "angry", "furious"
                ];
                const intensityWord = intensityWords[intensity] || "uninterested";

                return `Animated creature in Pixar-art style that is ${intensityWord} and has ${bodyPartsText} pain. It is short and gritty. ${color} colors and has Sandpaper texture.`;
            };

            setPromptText(generateLocalPrompt());
        }
    }, [answers, promptText]);

    // פונקציה להעתקת הפרומפט ללוח
    const copyPromptToClipboard = () => {
        navigator.clipboard.writeText(promptText)
            .then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    };

    // פונקציות לניווט בין התמונות
    const nextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === croppedImages.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? croppedImages.length - 1 : prevIndex - 1
        );
    };

    // פונקציה לבחירת תמונה
    const selectImage = () => {
        setSelectedImageIndex(currentImageIndex);
    };

    // פונקציה לביטול הבחירה
    const clearSelection = () => {
        setSelectedImageIndex(null);
    };

    return (
        <div className="midjourney-viewer">
            {/* קנבס מוסתר לעיבוד התמונה */}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            <h2 className="midjourney-title">Pain Visualization</h2>

            {promptText && (
                <div className="midjourney-prompt">
                    <h3>Your Pain Visualization Prompt:</h3>
                    <p>{promptText}</p>
                    <button
                        className="copy-button"
                        onClick={copyPromptToClipboard}
                    >
                        {copySuccess ? 'Copied!' : 'Copy Prompt'}
                    </button>
                </div>
            )}

            {/* תצוגת תמונות עם חיצים לניווט */}
            {croppedImages.length > 0 && (
                <div className="midjourney-sample-viewer">
                    <h3>Pain Visualizations:</h3>
                    <p>Browse through these visualizations and select the one that best represents your pain:</p>

                    <div className="image-navigation">
                        <button className="nav-button prev-button" onClick={prevImage}>
                            &larr;
                        </button>

                        <div className="sample-image-container">
                            <img
                                src={croppedImages[currentImageIndex]}
                                alt={`Pain visualization ${currentImageIndex + 1}`}
                                className={`sample-image ${selectedImageIndex === currentImageIndex ? 'selected' : ''}`}
                            />
                            <div className="image-counter">
                                Image {currentImageIndex + 1} of {croppedImages.length}
                            </div>
                        </div>

                        <button className="nav-button next-button" onClick={nextImage}>
                            &rarr;
                        </button>
                    </div>

                    <div className="image-actions">
                        {selectedImageIndex === currentImageIndex ? (
                            <button className="action-button deselect-button" onClick={clearSelection}>
                                Deselect This Image
                            </button>
                        ) : (
                            <button className="action-button select-button" onClick={selectImage}>
                                Select This Image
                            </button>
                        )}
                    </div>

                    {selectedImageIndex !== null && (
                        <div className="selection-info">
                            <p>You selected visualization #{selectedImageIndex + 1} as the best representation of your pain.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="midjourney-info">
                <p>These visualizations represent how different aspects of your pain might look.</p>
                <p>By selecting the one that resonates most with your experience, you help us better understand your pain.</p>
            </div>
        </div>
    );
};

MidjourneyViewer.propTypes = {
    answers: PropTypes.object.isRequired,
    prompt: PropTypes.string,
    apiKey: PropTypes.string
};

MidjourneyViewer.defaultProps = {
    answers: {},
    prompt: '',
    apiKey: ''
};

export default MidjourneyViewer;