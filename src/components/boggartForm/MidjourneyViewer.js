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

    // השתמש רק בפרומפט מהשרת - אל תיצור כלום בקליאנט!
    useEffect(() => {
        if (prompt) {
            console.log("✅ Using prompt from server:", prompt);
            setPromptText(prompt);
        }
    }, [prompt]);

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

            if (retryCount === 0 && (imageSrc.includes('ttapi.io') || imageSrc.includes('midjourney') || imageSrc.includes('mjcdn'))) {
                const directProxyUrl = `https://boggart-backend-bcgshza5hwhherar.israelcentral-01.azurewebsites.net/api/proxy-url?url=${encodeURIComponent(imageSrc)}`;
                console.log(`🔄 Trying proxy URL: ${directProxyUrl}`);
                loadImageAndProcess(directProxyUrl, retryCount + 1, maxRetries);
                return;
            }

            if (retryCount === 1 && ttapiRequestId) {
                const proxyUrl = `https://boggart-backend-bcgshza5hwhherar.israelcentral-01.azurewebsites.net/api/proxy-image/${ttapiRequestId}`;
                console.log(`🔄 Trying request-based proxy: ${proxyUrl}`);
                loadImageAndProcess(proxyUrl, retryCount + 1, maxRetries);
                return;
            }

            if (retryCount < maxRetries && imageSrc !== '/sample_images/pain_sample_1.png') {
                console.log(`🔄 Trying backup image`);
                loadImageAndProcess('/sample_images/pain_sample_1.png', retryCount + 1, maxRetries);
                return;
            }

            console.error("❌ All image loading attempts failed");
            setError(`Failed to load image after ${maxRetries + 1} attempts.`);

            // יצירת תמונות ריקות לדוגמה
            const emptyQuadrants = Array(4).fill().map((_, index) => {
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');

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

    // טעינת תמונה מ-TTAPI (או תמונת גיבוי)
    useEffect(() => {
        const requestImageFromTTAPI = async () => {
            if (!promptText) return;

            try {
                setIsLoading(true);
                setLoadingStatus('Creating your pain visualization...');
                setError(null);

                console.log("🚀 Starting TTAPI request with prompt:", promptText);

                const response = await TTAPIService.createImageRequest(answers, promptText);

                if (response && response.requestId) {
                    setTtapiRequestId(response.requestId);
                    setLoadingStatus('Generating image... (up to 2 minutes)');

                    try {
                        const imageUrl = await TTAPIService.waitForImage(response.requestId, 25, 5000);

                        if (imageUrl) {
                            setTtapiImageUrl(imageUrl);
                            console.log("🖼️ Received image URL:", imageUrl);
                            loadImageAndProcess(imageUrl);
                        } else {
                            throw new Error('No image received from API');
                        }
                    } catch (waitError) {
                        console.error('Error waiting for image:', waitError);
                        setError(`TTAPI Error: ${waitError.message}. Using sample image.`);

                        // השתמש בתמונת גיבוי
                        console.log("🔄 Using sample image as fallback");
                        loadImageAndProcess('/sample_images/pain_sample_1.png');
                    }
                } else {
                    throw new Error('No valid request ID received from TTAPI');
                }
            } catch (err) {
                console.error('Error communicating with TTAPI:', err);
                setError(`TTAPI Connection Error: ${err.message}. Using sample image.`);

                // השתמש בתמונת גיבוי
                console.log("🔄 Using sample image due to connection error");
                loadImageAndProcess('/sample_images/pain_sample_1.png');
            } finally {
                setIsLoading(false);
                setLoadingStatus('');
            }
        };

        // התחל רק אם יש פרומפט מהשרת
        if (promptText) {
            console.log("🎯 Starting image generation with server prompt");
            requestImageFromTTAPI();
        } else {
            console.log("⏳ Waiting for prompt from server...");
        }
    }, [promptText]);

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

            <h2 className="midjourney-title">Meet Your Pain</h2>

            {isLoading && (
                <div className="loading-status">
                    <div className="loading-spinner"></div>
                    <p>{loadingStatus || 'Loading...'}</p>
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
                        </details>
                    )}
                </div>
            )}

            {croppedImages.length > 0 && !isLoading && (
                <div className="midjourney-sample-viewer">
                    <div className="image-navigation">
                        <div className="sample-image-container">
                            <img
                                src={croppedImages[currentImageIndex]}
                                alt={`Pain visualization ${currentImageIndex + 1}`}
                                className={`sample-image ${selectedImageIndex === currentImageIndex ? 'selected' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="pain-actions">
                        <button
                            className="pain-action-btn like-btn"
                            onClick={selectImage}
                        >
                            I like it
                        </button>

                        <button
                            className="pain-action-btn regenerate-btn"
                            onClick={() => window.location.reload()}
                        >
                            Regenerate
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

MidjourneyViewer.propTypes = {
    answers: PropTypes.object.isRequired,
    prompt: PropTypes.string,
    apiKey: PropTypes.string
};

export default MidjourneyViewer;