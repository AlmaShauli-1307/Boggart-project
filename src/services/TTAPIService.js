// src/services/TTAPIService.js
import axios from 'axios';

const TTAPI_ENDPOINT = 'http://localhost:5000/api'; // או כתובת אחרת של השרת שלך

class TTAPIService {
    constructor() {
        this.baseURL = TTAPI_ENDPOINT;
        this.axios = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 שניות timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * שולח בקשה ליצירת תמונה ומחזיר את מזהה הבקשה
     * @param {Object} answers - תשובות המשתמש מהשאלון
     * @param {String} prompt - הפרומפט ליצירת התמונה
     * @returns {Promise<Object>} - מחזיר את התשובה מהשרת כולל requestId
     */
    async createImageRequest(answers, prompt) {
        try {
            const response = await this.axios.post('/create-image', {
                answers,
                prompt
            });

            console.log('✅ Image request created:', response.data);
            return response.data; // אמור לכלול requestId
        } catch (error) {
            console.error('❌ Error creating image request:', error);
            throw error;
        }
    }

    /**
     * בודק את סטטוס הבקשה לפי מזהה
     * @param {String} requestId - מזהה הבקשה
     * @returns {Promise<Object>} - מחזיר את סטטוס הבקשה והקישור לתמונה אם היא מוכנה
     */
    async checkImageStatus(requestId) {
        try {
            const response = await this.axios.get(`/check-status/${requestId}`);
            console.log('✅ Image status checked:', response.data);
            return response.data; // צפוי להכיל status ו-imageUrl אם מוכן
        } catch (error) {
            console.error('❌ Error checking image status:', error);
            throw error;
        }
    }

    /**
     * מחזיר את התמונה המוכנה אם קיימת
     * @param {String} requestId - מזהה הבקשה
     * @returns {Promise<String>} - מחזיר את כתובת ה-URL של התמונה אם היא מוכנה
     */
    async getImageIfReady(requestId) {
        try {
            const statusResponse = await this.checkImageStatus(requestId);

            if (statusResponse.status === 'completed') {
                return statusResponse.imageUrl;
            } else if (statusResponse.status === 'processing') {
                return null; // עדיין בעיבוד
            } else {
                throw new Error(`Unexpected status: ${statusResponse.status}`);
            }
        } catch (error) {
            console.error('❌ Error getting ready image:', error);
            throw error;
        }
    }

    /**
     * פונקציה שממתינה לתמונה עד שהיא מוכנה או עד timeout
     * @param {String} requestId - מזהה הבקשה
     * @param {Number} maxAttempts - מספר נסיונות מקסימלי (ברירת מחדל: 20)
     * @param {Number} interval - מרווח זמן בין בדיקות במילישניות (ברירת מחדל: 3000 - 3 שניות)
     * @returns {Promise<String>} - מחזיר את כתובת ה-URL של התמונה כשהיא מוכנה
     */
    async waitForImage(requestId, maxAttempts = 20, interval = 3000) {
        return new Promise((resolve, reject) => {
            let attempts = 0;

            const checkStatus = async () => {
                try {
                    attempts++;
                    console.log(`Checking image status (attempt ${attempts}/${maxAttempts})...`);

                    const statusResponse = await this.checkImageStatus(requestId);

                    if (statusResponse.status === 'completed') {
                        console.log('✅ Image is ready!');
                        resolve(statusResponse.imageUrl);
                        return;
                    } else if (statusResponse.status === 'failed') {
                        reject(new Error('Image generation failed'));
                        return;
                    } else if (attempts >= maxAttempts) {
                        reject(new Error('Max attempts reached waiting for image'));
                        return;
                    }

                    // עדיין בעיבוד, המשך לבדוק
                    setTimeout(checkStatus, interval);
                } catch (error) {
                    reject(error);
                }
            };

            // התחל לבדוק
            checkStatus();
        });
    }
}

export default new TTAPIService();