// src/services/TTAPIService.js
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL;
const TTAPI_ENDPOINT = `${API_BASE_URL}/api`;

class TTAPIService {
    constructor() {
        this.baseURL = TTAPI_ENDPOINT;
        this.axios = axios.create({
            baseURL: this.baseURL,
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * @param {Object} answers - תשובות המשתמש מהשאלון
     * @param {String} prompt - הפרומפט ליצירת התמונה
     * @returns {Promise<Object>} - מחזיר את התשובה מהשרת כולל requestId
     */
    async createImageRequest(answers, prompt, form1Id) {
        try {
            console.log('🚀 Sending TTAPI request:', { prompt, answers, form1Id });

            const response = await this.axios.post('/create-image', {
                answers,
                prompt,
                form1Id
            });

            console.log('✅ TTAPI response:', response.data);
            return response.data;
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
            console.log('✅ Status check:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error checking image status:', error);
            throw error;
        }
    }

    /**
     * פונקציה שממתינה לתמונה עד שהיא מוכנה או עד timeout
     * @param {String} requestId - מזהה הבקשה
     * @param {Number} maxAttempts - מספר נסיונות מקסימלי (ברירת מחדל: 30)
     * @param {Number} interval - מרווח זמן בין בדיקות במילישניות (ברירת מחדל: 5000 - 5 שניות)
     * @returns {Promise<String>} - מחזיר את כתובת ה-URL של התמונה כשהיא מוכנה
     */

    async waitForImageByFormId(form1Id, maxAttempts = 30, interval = 5000) {
        return new Promise((resolve, reject) => {
            let attempts = 0;

            const checkStatus = async () => {
                try {
                    attempts++;
                    console.log(`🔍 Checking image status for form ${form1Id} (attempt ${attempts}/${maxAttempts})...`);
                    const statusResponse = await fetch(`${this.baseURL}/image-status-by-form/${form1Id}`);
                    const data = await statusResponse.json();

                    if (data.status === 'completed') {
                        console.log('✅ Image is ready!', data.imageUrl);
                        resolve(data.imageUrl);
                        return;
                    } else if (data.status === 'failed') {
                        reject(new Error('Image generation failed'));
                        return;
                    } else if (data.status === 'not_found') {
                        reject(new Error('No image found for this form'));
                        return;
                    } else if (attempts >= maxAttempts) {
                        reject(new Error('Max attempts reached waiting for image'));
                        return;
                    }

                    console.log(`⏳ Still processing... (${data.status})`);
                    setTimeout(checkStatus, interval);
                } catch (error) {
                    console.error('❌ Error in status check:', error);
                    reject(error);
                }
            };

            checkStatus();
        });
    }
}
export default new TTAPIService();