import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import NavBar from '../NavBar';
import { useLanguage } from '../LanguageContext';

const MyCreature = () => {
    const { t, language } = useLanguage();
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef(null);
    const user = JSON.parse(sessionStorage.getItem('user'));
    const API_BASE_URL = process.env.REACT_APP_API_URL;

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
                tempCtx.drawImage(img, x, y, partWidth, partHeight, 0, 0, partWidth, partHeight);
                quadrants.push(tempCanvas.toDataURL('image/png'));
            }
        }
        return quadrants;
    };

    useEffect(() => {
        const fetchAndProcessImage = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/get-creature/${user.username}`);
                if (response.data.success) {
                    const { image_url, selected_image_index } = response.data;
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = image_url;
                    img.onload = () => {
                        const quadrants = splitImageIntoQuadrants(img);
                        setSelectedImage(quadrants[selected_image_index]);
                        setLoading(false);
                    };
                }
            } catch (error) {
                console.error("Error fetching creature:", error);
                setLoading(false);
            }
        };

        fetchAndProcessImage();
    }, [user.username]);

    return (
        <div className="my-creature-container" style={{ paddingTop: '80px', textAlign: 'center' }}>
            <NavBar />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <h1>{t('myCreature')}</h1>
            <div style={{ marginTop: '30px' }}>
                {loading ? (
                    <div className="loading-screen"></div>
                ) : selectedImage ? (
                    <div className="avatar-display">
                        <div className="image-wrapper">
                            <img
                                src={selectedImage}
                                alt="Your Chosen Creature"
                                style={{
                                    maxWidth: '450px',
                                    borderRadius: '20px',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                                    border: '6px solid white'
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <p>{t('notFound')}</p>
                )}
            </div>
        </div>
    );
};

export default MyCreature;