import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import NavBar from '../NavBar';

const MyCreature = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef(null);
    const user = JSON.parse(sessionStorage.getItem('user'));

    // הפונקציה ששלחת - חותכת את התמונה ל-4 חלקים
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
                // 1. שליפת הנתונים מהשרת
                const response = await axios.get(`http://localhost:5000/api/get-creature/${user.username}`);

                if (response.data.success) {
                    const { image_url, selected_image_index } = response.data;

                    // 2. טעינת התמונה לתוך אובייקט Image כדי שה-Canvas יוכל לעבוד עליה
                    const img = new Image();
                    img.crossOrigin = "anonymous"; // חשוב מאוד כדי למנוע שגיאות אבטחה (CORS) עם Azure
                    img.src = image_url;

                    img.onload = () => {
                        // 3. חיתוך התמונה ל-4
                        const quadrants = splitImageIntoQuadrants(img);
                        // 4. בחירת התמונה הנכונה לפי האינדקס (0-3)
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

            <h1>היצור שלי</h1>

            <div style={{ marginTop: '30px' }}>
                {loading ? (
                    /* הגלגל השחור הגדול - ללא כתוביות */
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
                                    border: '6px solid white' // תוספת קטנה שתואמת לעמוד הבית
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <p>לא נמצא יצור במערכת.</p>
                )}
            </div>
        </div>
    );
};

export default MyCreature;