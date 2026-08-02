import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
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
    const { t } = useLanguage();
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
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    const answers = location.state?.answers || {};
    const detailedAnswers = location.state?.detailedAnswers || {};
    const allAnswers = location.state?.allAnswers || { ...detailedAnswers, ...answers };
    const prompt = location.state?.prompt || '';
    const form1Id = location.state?.form1Id || null;
    const isDemo = location.state?.isDemo || false;

    console.log("🔍 MeetYourPain Debug:");
    console.log("- answers (personal):", answers);
    console.log("- detailedAnswers:", detailedAnswers);
    console.log("- allAnswers:", allAnswers);
    console.log("- prompt:", prompt);
    console.log("- form1Id:", form1Id);
    console.log("- showImageViewer:", showImageViewer);
    console.log("- isLoading:", isLoading);

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

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
            if (Object.keys(allAnswers).length > 0 || prompt) {
                setShowImageViewer(true);
                console.log("✅ Showing image viewer - has data");
            } else {
                console.log("⚠️ No data found, but continuing anyway");
                setShowImageViewer(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [allAnswers, prompt]);

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
                const directProxyUrl = `${API_BASE_URL}/api/proxy-url?url=${encodeURIComponent(imageSrc)}`;
                console.log(`🔄 Trying proxy URL: ${directProxyUrl}`);
                loadImageAndProcess(directProxyUrl, retryCount + 1, maxRetries);
                return;
            }

            if (retryCount === 1 && ttapiRequestId) {
                const proxyUrl = `${API_BASE_URL}/api/proxy-image/${ttapiRequestId}`;
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

    useEffect(() => {
        const waitForExistingImage = async () => {
            if (!form1Id || !showImageViewer) return;

            try {
                setIsLoadingImage(true);
                setLoadingStatus('Finishing your visualization...');
                setError(null);

                console.log("⏳ Waiting for image that started in background for form1Id:", form1Id);

                const imageUrl = await TTAPIService.waitForImageByFormId(form1Id, 25, 5000);

                if (imageUrl) {
                    setTtapiImageUrl(imageUrl);
                    console.log("🖼️ Received background image URL:", imageUrl);
                    loadImageAndProcess(imageUrl);
                } else {
                    throw new Error('Background image generation failed');
                }
            } catch (waitError) {
                console.error('Error waiting for background image:', waitError);
                setError(`Background image not ready. Using sample image.`);
                console.log("🔄 Using sample image as fallback");
                loadImageAndProcess('/sample_images/pain_sample_1.png');
            } finally {
                setIsLoadingImage(false);
                setLoadingStatus('');
            }
        };

        if (form1Id && showImageViewer) {
            console.log("🎯 Waiting for background image generation");
            waitForExistingImage();
        } else if (showImageViewer) {
            console.log("⚠️ No form1Id - cannot wait for background image");
            loadImageAndProcess('/sample_images/pain_sample_1.png');
        }
    }, [form1Id, showImageViewer]);

    // Initial loading timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
            if (answers && Object.keys(answers).length > 0) {
                setShowImageViewer(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [answers, navigate]);

    // Navigation functions
    const handleStartClick = () => {
        navigate('/meet-your-pain-rate');
    };

    const handleNextClick = async () => {
        setSelectedImageIndex(currentImageIndex);
        try {
            await fetch(`${API_BASE_URL}/api/save-selected-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    form1Id: form1Id,
                    selectedImageIndex: currentImageIndex
                })
            });
        } catch (error) {
            console.error('Error saving selected image:', error);
        }
        // Navigate to next page with selected image data
        navigate('/meet-your-pain-rate', {
            state: {
                selectedImage: croppedImages[currentImageIndex],
                selectedImageIndex: currentImageIndex,
                answers: allAnswers,
                prompt: promptText,
                form1Id: form1Id,
                isDemo: isDemo
            }
        });
    };

    const handleChangeClick = () => {
        window.location.reload();
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

    const handleDownloadImage = () => {
        const link = document.createElement('a');
        link.href = croppedImages[currentImageIndex];
        link.download = `my-pain-visualization-${currentImageIndex + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <LoadingPage />;
    }

    if (showImageViewer) {
        return (
            <main className="landing-meet-boggart-page" >
                <LanguageToggle />
                <div className="meet-boggart-container">
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

                    <header className="form-meet-boggart-header">
                        <img src={logo} alt="Boggart" className="logo-image" />
                    </header>

                    <section className="welcome-meet-boggart-section">
                        <h2 className="welcome-meet-boggart-title">{t('meetYourPainTitle')}</h2>
                        <p className='welcome-description'>{t('meetYourPainDescription')}</p>

                        {isLoadingImage && (
                            <div className="loading-status">
                                <div className="loading-spinner"></div>
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                <p>{error}</p>
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
                            text={t('regenerate')}
                            onClick={nextImage}
                        />
                        <PrimaryButton
                            text={t('download')}
                            onClick={handleDownloadImage}
                            className="download-button"
                        />
                        <PrimaryButton
                            text={t('thatMyPain')}
                            onClick={handleNextClick}
                        />
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="landing-meet-boggart-page">
            <div className="meet-boggart-container">
                <header className="form-meet-boggart-header">
                    <img src={logo} alt="Boggart" className="logo-image" />
                </header>
                <section className="welcome-meet-boggart-section">
                    <h2 className="welcome-meet-boggart-title">{t('meetYourPainTitle')}</h2>
                    <p>{t('meetYourPainTitle')}</p>
                    <PrimaryButton
                        text={t('Continue Anyway')}
                        onClick={() => navigate('/meet-your-pain-rate', {
                            state: { form1Id, answers: allAnswers, prompt }
                        })}
                    />
                </section>
            </div>
        </main>
    );
};

export default MeetYourPain;
