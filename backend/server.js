require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// הגדרות TTAPI
const TTAPI_KEY = "be396f95-696d-c7f0-5066-07ad81b37cbb"; // החלף במפתח שלך
const TTAPI_BASE_URL = "https://api.ttapi.io/midjourney/v1";

// בסיס נתונים פשוט לשמירת בקשות ותמונות 
// (במקרה אמיתי עדיף להשתמש במסד נתונים)
const imageRequests = new Map();

// Middleware setup
app.use(cors()); // Enables CORS to allow requests from the frontend
app.use(bodyParser.json()); // Parses JSON data from requests

// פונקציה ליצירת פרומפט לפי תשובות המשתמש
function generatePainPrompt(answers) {
    try {
        // חילוץ הנתונים מהתשובות
        const bodyParts = answers[63] || [];
        const bodyPartsText = bodyParts.length > 0 ? bodyParts.join(", ") : "general";
        const color = answers[64] || "red";
        const intensity = answers[65] || 5;

        // מערך של מילות עוצמה
        const intensityWords = [
            "indifferent", "apathetic", "uninterested", "disinterested",
            "bored", "uneasy", "worried", "anxious", "agitated", "angry", "furious"
        ];
        const intensityWord = intensityWords[intensity] || "uninterested";

        return `Animated creature in Pixar-art style that is ${intensityWord} and has ${bodyPartsText} pain. It is short and gritty. ${color} colors and has Sandpaper texture.`;
    } catch (error) {
        console.error('Error generating prompt:', error);
        return "Animated creature in Pixar-art style that has pain. Red colors and Sandpaper texture.";
    }
}

// פונקציה לבדיקת סטטוס TTAPI
async function checkTTAPIStatus(ttapiJobId) {
    try {
        const response = await axios.post(`${TTAPI_BASE_URL}/fetch`, {
            jobId: ttapiJobId
        }, {
            headers: {
                "TT-API-KEY": TTAPI_KEY,
                "Content-Type": "application/json"
            },
            timeout: 30000 // 30 שניות timeout
        });

        return response.data;
    } catch (error) {
        console.error('Error checking TTAPI status:', error.response?.data || error.message);
        throw error;
    }
}

// פונקציה לניהול תהליך TTAPI
async function handleTTAPIProcess(requestId, prompt) {
    try {
        console.log(`🎨 Sending request to TTAPI for: ${requestId}`);

        // שליחת בקשה ל-TTAPI
        const ttapiResponse = await axios.post(`${TTAPI_BASE_URL}/imagine`, {
            prompt: `${prompt} --ar 1:1 --stylize 500`,
            mode: "fast",
            timeout: 300
        }, {
            headers: {
                "TT-API-KEY": TTAPI_KEY,
                "Content-Type": "application/json"
            },
            timeout: 60000 // 60 שניות timeout
        });

        const ttapiJobId = ttapiResponse.data?.data?.jobId || ttapiResponse.data?.jobId;

        if (!ttapiJobId) {
            throw new Error('No job ID received from TTAPI');
        }

        console.log(`✅ TTAPI job created: ${ttapiJobId} for request: ${requestId}`);

        // עדכון הבקשה עם job ID של TTAPI
        const currentRequest = imageRequests.get(requestId);
        if (currentRequest) {
            imageRequests.set(requestId, {
                ...currentRequest,
                ttapiJobId: ttapiJobId
            });
        }

        // פונקציה רקורסיבית לבדיקת סטטוס
        const checkStatusRecursively = async (attempt = 1, maxAttempts = 30) => {
            try {
                console.log(`🔍 Checking TTAPI status for ${requestId}, attempt ${attempt}/${maxAttempts}`);

                const statusData = await checkTTAPIStatus(ttapiJobId);
                const status = statusData?.status;

                if (status === "SUCCESS") {
                    // חילוץ URL של התמונה
                    const imageUrl = statusData?.data?.cdnImage ||
                        statusData?.data?.discordImage ||
                        statusData?.data?.url;

                    if (imageUrl) {
                        imageRequests.set(requestId, {
                            ...imageRequests.get(requestId),
                            status: 'completed',
                            completedAt: new Date(),
                            imageUrl: imageUrl
                        });
                        console.log(`✅ TTAPI request ${requestId} completed successfully with image: ${imageUrl}`);
                    } else {
                        throw new Error('Image URL not found in TTAPI response');
                    }

                } else if (status === "FAILED") {
                    throw new Error(`TTAPI generation failed: ${statusData?.message || 'Unknown error'}`);

                } else if (attempt >= maxAttempts) {
                    throw new Error(`TTAPI timeout: Max attempts (${maxAttempts}) reached`);

                } else {
                    // עדיין בעיבוד, בדוק שוב אחרי 10 שניות
                    console.log(`⏳ TTAPI still processing ${requestId}, status: ${status}`);
                    setTimeout(() => checkStatusRecursively(attempt + 1, maxAttempts), 10000);
                }

            } catch (error) {
                console.error(`❌ Error in TTAPI status check for ${requestId}:`, error.message);

                // עדכון הבקשה כנכשלת
                imageRequests.set(requestId, {
                    ...imageRequests.get(requestId),
                    status: 'failed',
                    error: error.message,
                    completedAt: new Date()
                });
            }
        };

        // התחל לבדוק סטטוס אחרי 15 שניות (זמן התחלתי ליצירת התמונה)
        setTimeout(() => checkStatusRecursively(), 15000);

    } catch (error) {
        console.error(`❌ Error in TTAPI process for ${requestId}:`, error.response?.data || error.message);

        // עדכון הבקשה כנכשלת
        imageRequests.set(requestId, {
            ...imageRequests.get(requestId),
            status: 'failed',
            error: `TTAPI Error: ${error.response?.data?.message || error.message}`,
            completedAt: new Date()
        });
    }
}

// === ENDPOINTS ===

// האנדפוינט הקיים של /submit
app.post('/submit', (req, res) => {
    try {
        const answers = req.body.answers;
        console.log('📩 Received answers:', answers);

        // יצירת פרומפט
        const prompt = generatePainPrompt(answers);

        // Here, you can store the answers in a database
        // For now, we'll just send a success response with the prompt
        res.status(200).json({
            message: 'Answers received successfully!',
            prompt: prompt
        });
    } catch (error) {
        console.error('❌ Error handling answers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// === TTAPI Endpoints ===

// 1. יצירת בקשת תמונה חדשה עם TTAPI אמיתי
app.post('/api/create-image', async (req, res) => {
    try {
        const { answers, prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                message: 'Prompt is required'
            });
        }

        // יצירת מזהה ייחודי לבקשה
        const requestId = uuidv4();

        // שמירת הבקשה במאגר עם סטטוס התחלתי
        imageRequests.set(requestId, {
            requestId,
            status: 'processing',
            createdAt: new Date(),
            prompt,
            answers
        });

        console.log(`📝 Created new image request: ${requestId} with prompt: "${prompt}"`);

        // שליחה ל-TTAPI באופן אסינכרוני (לא חוסמת את התגובה)
        handleTTAPIProcess(requestId, prompt);

        // החזרת תגובה מיידית ללקוח
        res.status(200).json({
            requestId,
            message: 'Image request created successfully',
            estimatedTime: '1-2 minutes'
        });

    } catch (error) {
        console.error('❌ Error creating image request:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
});

// 2. בדיקת סטטוס בקשה (ללא שינוי)
app.get('/api/check-status/:requestId', (req, res) => {
    try {
        const { requestId } = req.params;

        // חיפוש הבקשה במאגר
        const request = imageRequests.get(requestId);

        if (!request) {
            return res.status(404).json({
                message: 'Request not found'
            });
        }

        // שליחת הסטטוס הנוכחי
        res.status(200).json({
            requestId,
            status: request.status,
            createdAt: request.createdAt,
            completedAt: request.completedAt,
            imageUrl: request.imageUrl,
            error: request.error,
            ttapiJobId: request.ttapiJobId
        });

    } catch (error) {
        console.error(`❌ Error checking status for request:`, error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
});

// 3. אנדפוינט ל-proxy תמונות מ-TTAPI (פותר בעיות CORS)
app.get('/api/proxy-image/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;

        // מצא את הבקשה במאגר
        const request = imageRequests.get(requestId);

        if (!request || !request.imageUrl) {
            return res.status(404).json({
                message: 'Image not found or not ready'
            });
        }

        console.log(`🖼️ Proxying image for request ${requestId}: ${request.imageUrl}`);

        // שלוף את התמונה מ-TTAPI
        const imageResponse = await axios.get(request.imageUrl, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/*,*/*',
                'Referer': 'https://ttapi.io/'
            },
            timeout: 30000
        });

        // העבר את ה-headers הנכונים
        res.setHeader('Content-Type', imageResponse.headers['content-type'] || 'image/png');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // cache ליום

        // העבר את התמונה
        imageResponse.data.pipe(res);

    } catch (error) {
        console.error('❌ Error proxying image:', error.message);
        res.status(500).json({
            message: 'Error loading image',
            error: error.message
        });
    }
});

// 4. אנדפוינט ל-proxy תמונה לפי URL ישיר (אופציונלי)
app.get('/api/proxy-url', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ message: 'URL parameter is required' });
        }

        // ודא שזה URL של TTAPI או Midjourney
        if (!url.includes('ttapi.io') && !url.includes('cdn.midjourney.com') && !url.includes('mjcdn.ttapi.io')) {
            return res.status(403).json({ message: 'Only TTAPI/Midjourney URLs are allowed' });
        }

        console.log(`🖼️ Proxying direct URL: ${url}`);

        const imageResponse = await axios.get(url, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/*,*/*',
                'Referer': 'https://ttapi.io/'
            },
            timeout: 30000
        });

        res.setHeader('Content-Type', imageResponse.headers['content-type'] || 'image/png');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Cache-Control', 'public, max-age=86400');

        imageResponse.data.pipe(res);

    } catch (error) {
        console.error('❌ Error proxying URL:', error.message);
        res.status(500).json({
            message: 'Error loading image from URL',
            error: error.message
        });
    }
});

// 5. אנדפוינט לבדיקת חיבור TTAPI
app.get('/api/test-ttapi', async (req, res) => {
    try {
        // בדיקה פשוטה של חיבור TTAPI
        const testResponse = await axios.post(`${TTAPI_BASE_URL}/imagine`, {
            prompt: "test prompt --ar 1:1",
            mode: "fast"
        }, {
            headers: {
                "TT-API-KEY": TTAPI_KEY,
                "Content-Type": "application/json"
            },
            timeout: 30000
        });

        res.status(200).json({
            message: 'TTAPI connection successful',
            response: testResponse.data
        });

    } catch (error) {
        console.error('TTAPI Test Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'TTAPI connection failed',
            error: error.response?.data || error.message
        });
    }
});

// 6. אנדפוינט לקבלת כל הבקשות (לדיבאג)
app.get('/api/requests', (req, res) => {
    const allRequests = Array.from(imageRequests.values());
    res.json(allRequests);
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔑 Using TTAPI key: ${TTAPI_KEY.substring(0, 8)}...`);
    console.log(`🌐 TTAPI Base URL: ${TTAPI_BASE_URL}`);
});