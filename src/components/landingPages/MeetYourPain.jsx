import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import './MeetYourPain.css';
import demoBoggart from '../../images/demoBoggart.png';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';
import LoadingPage from './LoadingPage';
import TTAPIService from '../../services/TTAPIService';

const MeetYourPain = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // States for image handling (enhanced like MidjourneyViewer)
    const [promptText, setPromptText] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [croppedImages, setCroppedImages] = useState([]);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [ttapiRequestId, setTtapiRequestId] = useState(null);
    const [ttapiImageUrl, setTtapiImageUrl] = useState(null);
    const [error, setError] = useState(null);
    const canvasRef = useRef(null);

    // Get data from previous page (if coming from questionnaire)
    const answers = location.state?.answers || {};
    const prompt = location.state?.prompt || '';
    const form1Id = location.state?.form1Id || null;

    // פונקציה לחיתוך דינמי של התמונה ל-4 חלקים (זהה ל-MidjourneyViewer)
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

    // השתמש רק בפרומפט מהשרת - אל תיצור כלום בקליאנט! (זהה ל-MidjourneyViewer)
    useEffect(() => {
        if (prompt) {
            console.log("✅ Using prompt from server:", prompt);
            setPromptText(prompt);
        }
    }, [prompt]);

    // פונקציה לטעינת תמונה עם תמיכה ב-proxy (מותאמת מ-MidjourneyViewer)
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
                const directProxyUrl = `http://localhost:5000/api/proxy-url?url=${encodeURIComponent(imageSrc)}`;
                console.log(`🔄 Trying proxy URL: ${directProxyUrl}`);
                loadImageAndProcess(directProxyUrl, retryCount + 1, maxRetries);
                return;
            }

            if (retryCount === 1 && ttapiRequestId) {
                const proxyUrl = `http://localhost:5000/api/proxy-image/${ttapiRequestId}`;
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

    // טעינת תמונה מ-TTAPI (או תמונת גיבוי) - זהה ל-MidjourneyViewer
    useEffect(() => {
        const requestImageFromTTAPI = async () => {
            if (!promptText || !showImageViewer) return;

            try {
                setIsLoadingImage(true);
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
                setIsLoadingImage(false);
                setLoadingStatus('');
            }
        };

        // התחל רק אם יש פרומפט מהשרת וצריך להציג את מציג התמונות
        if (promptText && showImageViewer) {
            console.log("🎯 Starting image generation with server prompt");
            requestImageFromTTAPI();
        } else if (showImageViewer) {
            console.log("⏳ Waiting for prompt from server...");
        }
    }, [promptText, showImageViewer, answers]);

    // Initial loading timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
            // אם יש נתונים מהשאלון, תעבור ישירות לתצוגת התמונות
            if (answers && Object.keys(answers).length > 0) {
                setShowImageViewer(true);
            } else {
                // אם אין נתונים מהשאלון, עבור ישירות לדף הבא
                navigate('/meet-your-pain-rate');
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [answers, navigate]);

    // Navigation functions
    const handleStartClick = () => {
        navigate('/meet-your-pain-rate');
    };

    const handleNextClick = () => {
        setSelectedImageIndex(currentImageIndex);
        // Navigate to next page with selected image data
        navigate('/questionnaire-personal', {
            state: {
                selectedImage: croppedImages[currentImageIndex],
                selectedImageIndex: currentImageIndex,
                answers: answers,
                prompt: promptText,
                form1Id: form1Id
            }
        });
    };

    // שונה לעבוד כמו regenerate ב-MidjourneyViewer
    const handleChangeClick = () => {
        // במקום לטעון תמונה חדשה, טען מחדש את הדף (כמו ב-MidjourneyViewer)
        window.location.reload();
    };

    // פונקציות ניווט בין תמונות (מתווספות כמו ב-MidjourneyViewer)
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

    if (isLoading) {
        return <LoadingPage />;
    }

    // אם צריך להציג את מציג התמונות (אחרי השאלון)
    if (showImageViewer) {
        return (
            <main className="landing-meet-boggart-page">
                <div className="meet-boggart-container">
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

                    <header className="form-meet-boggart-header">
                        <img src={logo} alt="Boggart" className="logo-image" />
                    </header>

                    <section className="welcome-meet-boggart-section">
                        <h2 className="welcome-meet-boggart-title">Meet Your Pain</h2>

                        {/* הוספת אינדיקטור טעינה כמו ב-MidjourneyViewer */}
                        {isLoadingImage && (
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

                        {/* הוספת הודעת שגיאה מפורטת כמו ב-MidjourneyViewer */}
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

                        {croppedImages.length > 0 && !isLoadingImage && (
                            <div className="welcome-meet-boggart-description">
                                <div className="image-container">
                                    <img
                                        src={croppedImages[currentImageIndex]}
                                        alt={`Pain visualization ${currentImageIndex + 1}`}
                                        className={`boggart-img ${selectedImageIndex === currentImageIndex ? 'selected' : ''}`}
                                    />
                                </div>

                            </div>
                        )}
                    </section>

                    <section className="cta-meet-boggart-section">
                        <PrimaryButton
                            text="Regenerate"
                            onClick={nextImage}
                        />
                        <PrimaryButton
                            text="That's my pain!"
                            onClick={handleNextClick}
                        />
                    </section>
                </div>
            </main>
        );
    }

    // אם מגיעים לכאן, זה אומר שאין נתונים מהשאלון
    // במקרה זה המערכת כבר העבירה לדף הבא ב-useEffect
    return null;
};

export default MeetYourPain;