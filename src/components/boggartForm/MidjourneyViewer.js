import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './MidjourneyViewer.css';
import TTAPIService from '../../services/TTAPIService';

const MidjourneyViewer = ({ answers, prompt, apiKey }) => {
    const [promptText, setPromptText] = useState(prompt || '');
    const [copySuccess, setCopySuccess] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [croppedImages, setCroppedImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [ttapiRequestId, setTtapiRequestId] = useState(null);
    const [ttapiImageUrl, setTtapiImageUrl] = useState(null);
    const [error, setError] = useState(null);
    const canvasRef = useRef(null);

    // פונקציה לחיתוך דינמי של התמונה ל-4 חלקים
    const splitImageIntoQuadrants = (img) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const partWidth = img.width / 2;
        const partHeight = img.height / 2;
        const quadrants = [];

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const x = col * partWidth;
                const y = row * partHeight;

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = partWidth;
                tempCanvas.height = partHeight;
                const tempCtx = tempCanvas.getContext('2d');

                tempCtx.drawImage(
                    img,
                    x, y, partWidth, partHeight,
                    0, 0, partWidth, partHeight
                );

                const dataURL = tempCanvas.toDataURL('image/png');
                quadrants.push(dataURL);
            }
        }

        return quadrants;
    };

    // יצירת פרומפט מקומי אם לא קיים
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

    // פונקציה לטעינת תמונה עם תמיכה ב-proxy
    const loadImageAndProcess = (imageSrc, retryCount = 0, maxRetries = 3) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            console.log(`✅ Image loaded successfully: ${imageSrc}`);
            const quadrants = splitImageIntoQuadrants(img);
            setCroppedImages(quadrants);
            setError(null);
        };

        img.onerror = (err) => {
            console.error(`❌ Error loading image (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
            console.error(`Failed URL: ${imageSrc}`);

            // אם זה ניסיון ראשון עם URL חיצוני, נסה proxy
            if (retryCount === 0 && (imageSrc.includes('ttapi.io') || imageSrc.includes('midjourney') || imageSrc.includes('mjcdn'))) {
                const directProxyUrl = `http://localhost:5000/api/proxy-url?url=${encodeURIComponent(imageSrc)}`;
                console.log(`🔄 Trying proxy URL: ${directProxyUrl}`);
                loadImageAndProcess(directProxyUrl, retryCount + 1, maxRetries);
                return;
            }

            // אם יש requestId, נסה proxy דרך requestId
            if (retryCount === 1 && ttapiRequestId) {
                const proxyUrl = `http://localhost:5000/api/proxy-image/${ttapiRequestId}`;
                console.log(`🔄 Trying request-based proxy: ${proxyUrl}`);
                loadImageAndProcess(proxyUrl, retryCount + 1, maxRetries);
                return;
            }

            // אם עדיין לא עבד, נסה תמונת גיבוי
            if (retryCount < maxRetries && imageSrc !== '/sample_images/pain_sample_1.png') {
                console.log(`🔄 Trying backup image`);
                loadImageAndProcess('/sample_images/pain_sample_1.png', retryCount + 1, maxRetries);
                return;
            }

            // אם הכל נכשל
            console.error("❌ All image loading attempts failed");
            setError(`Failed to load image after ${maxRetries + 1} attempts. Original URL: ${ttapiImageUrl || 'Unknown'}`);

            // יצירת תמונות ריקות לדוגמה
            const emptyQuadrants = Array(4).fill().map((_, index) => {
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');

                // יצירת תמונה אפורה עם טקסט
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, 200, 200);
                ctx.fillStyle = '#888';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Sample ${index + 1}`, 100, 100);
                ctx.fillText('Image Failed to Load', 100, 120);

                return canvas.toDataURL('image/png');
            });
            setCroppedImages(emptyQuadrants);
        };

        img.src = imageSrc;
    };

    // טעינת תמונה מ-TTAPI
    useEffect(() => {
        const requestImageFromTTAPI = async () => {
            if (!promptText) return;

            try {
                setIsLoading(true);
                setLoadingStatus('שולח בקשה ליצירת תמונה...');
                setError(null);

                const response = await TTAPIService.createImageRequest(answers, promptText);

                if (response && response.requestId) {
                    setTtapiRequestId(response.requestId);
                    setLoadingStatus('ממתין ליצירת התמונה... (עד 2 דקות)');

                    try {
                        const imageUrl = await TTAPIService.waitForImage(response.requestId, 25, 5000);

                        if (imageUrl) {
                            setTtapiImageUrl(imageUrl);
                            console.log("🖼️ Received image URL:", imageUrl);

                            // התחל בטעינת התמונה
                            loadImageAndProcess(imageUrl);
                        } else {
                            throw new Error('לא התקבלה תמונה מה-API');
                        }
                    } catch (waitError) {
                        console.error('שגיאה בהמתנה לתמונה:', waitError);
                        setError(`שגיאה בהמתנה לתמונה: ${waitError.message}`);
                        loadImageAndProcess('/sample_images/pain_sample_1.png');
                    }
                } else {
                    throw new Error('לא התקבל מזהה בקשה תקין');
                }
            } catch (err) {
                console.error('שגיאה בתקשורת עם TTAPI:', err);
                setError(`שגיאה בטעינת התמונה: ${err.message}`);
                loadImageAndProcess('/sample_images/pain_sample_1.png');
            } finally {
                setIsLoading(false);
                setLoadingStatus('');
            }
        };

        requestImageFromTTAPI();
    }, [promptText, answers]);

    // פונקציות UI
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

    const selectImage = () => {
        setSelectedImageIndex(currentImageIndex);
    };

    const clearSelection = () => {
        setSelectedImageIndex(null);
    };

    return (
        <div className="midjourney-viewer">
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            <h2 className="midjourney-title">Pain Visualization</h2>

            {isLoading && (
                <div className="loading-status">
                    <div className="loading-spinner"></div>
                    <p>{loadingStatus || 'טוען...'}</p>
                    {ttapiRequestId && (
                        <p style={{ fontSize: '12px', color: '#666' }}>
                            Request ID: {ttapiRequestId}
                        </p>
                    )}
                </div>
            )}

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    {ttapiImageUrl && (
                        <details style={{ marginTop: '10px', fontSize: '12px' }}>
                            <summary>Debug Info</summary>
                            <p><strong>Original URL:</strong> {ttapiImageUrl}</p>
                            <p><strong>Request ID:</strong> {ttapiRequestId}</p>
                            <p><strong>Proxy URL:</strong> {ttapiRequestId ? `http://localhost:5000/api/proxy-image/${ttapiRequestId}` : 'N/A'}</p>
                        </details>
                    )}
                </div>
            )}

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

            {croppedImages.length > 0 && !isLoading && (
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