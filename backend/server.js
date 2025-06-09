require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = process.env.PORT || 5000;

// הגדרות TTAPI
const TTAPI_KEY = "a72ab7e5-b9fe-7872-a4fa-9fcdd223bc5e"; // החלף במפתח שלך
const TTAPI_BASE_URL = "https://api.ttapi.io/midjourney/v1";

// בסיס נתונים פשוט לשמירת בקשות ותמונות 
// (במקרה אמיתי עדיף להשתמש במסד נתונים)
const imageRequests = new Map();

// Middleware setup
app.use(cors()); // Enables CORS to allow requests from the frontend
app.use(bodyParser.json()); // Parses JSON data from requests

// פונקציה ליצירת פרומפט מתקדם לפי הלוגיקה של create_prompt.py
function generatePainDescription(answers) {
    try {
        console.log("🐍 Server - Generating prompt using Python logic");
        console.log("🔧 Server - All received answers:", answers);

        // חילוץ הנתונים מהתשובות בהתאם ל-CSV ו-Python
        const location = answers[63] || ["general body"]; // מערך של חלקי גוף
        const locationText = Array.isArray(location) ? location.join(", ") : location;

        const duration = answers[66];
        const depth = answers[71];

        // צבע - question_ID 72
        const colorAnswer = answers[72];
        let color = colorAnswer.name;

        const shape = answers[73];
        const border = answers[74];
        const textureTouch = answers[75];
        const textureStroke = answers[76];
        const textureHold = answers[77];

        // חישוב intensity מממוצע של כמה שאלות (במקום שאלה אחת)
        const intensityRaw = answers[65];
        const intensity = Math.min(10, Math.max(0, Math.round(intensityRaw)));

        console.log("🎨 Server - Extracted values:", {
            location: locationText,
            duration,
            depth,
            color,
            shape,
            border,
            textureTouch,
            textureStroke,
            textureHold,
            intensity
        });

        // לוגיקה מ-Python - pain entity
        const painEntity = "creature"; // תמיד creature (אלא אם כן תוסיף שאלה על physical vs emotional)

        // Intensity description מ-Python
        const intensityLevels = {
            0: "indifferent",
            1: "apathetic",
            2: "uninterested",
            3: "disinterested",
            4: "bored",
            5: "uneasy",
            6: "worried",
            7: "anxious",
            8: "agitated",
            9: "angry",
            10: "furious"
        };
        const intensityDesc = intensityLevels[intensity] || "unknown";

        // Short or tall לפי duration
        const size = duration <= 5 ? "short" : "tall";

        // Thin or thick לפי depth
        const thickness = depth <= 5 ? "thin" : "thick";

        // Shape mapping
        const shapes = {
            1: "rounded",
            2: "soft",
            3: "nothing",
            4: "defined",
            5: "sharp"
        };
        const shapeDesc = shapes[shape] || "undefined";

        // Border description
        const borderDesc = border >= 3 ? "" : "blurred into the background";

        // Texture mapping מ-Python
        const textureTypes = {
            "1,2": "watery",
            "3,4": "runny",
            "5,5": "syrupy",
            "4,5": "creamy with soft texture",
            "4,4": "bumpy slime",
            "4,5": "glossy",
            "4,4": "gritty"
        };
        const textureKey = `${textureTouch},${textureStroke}`;
        const textureDesc = textureTypes[textureKey] || textureTypes["4,4"] || "gritty";

        // Additional features לפי combinations
        let feature = "no distinct feature";

        if (thickness === "thin" && textureTouch <= 2 && textureStroke <= 2) {
            feature = "runny/watery/bloby";
        } else if (thickness === "thin" && textureTouch >= 4 && textureStroke >= 4) {
            feature = "brittle scales";
        } else if (thickness === "thick" && textureTouch <= 2 && textureStroke <= 2) {
            feature = "creamy with soft texture";
        } else if (thickness === "thick" && textureTouch >= 4 && textureStroke >= 4) {
            feature = "bumpy slime";
        }

        // Build the sentence בדיוק כמו ב-Python
        const description =
            `Animated ${painEntity} in Pixar-art style that is ${intensityDesc} and has ${locationText}. ` +
            `It is ${size} and ${thickness}. ${color} colors. ` +
            `The creature is ${shapeDesc}, ${textureDesc}, ${borderDesc} and has ${feature}.`;

        console.log("✅ Server - Final Python-style prompt:", description);
        return description;

    } catch (error) {
        console.error('❌ Server - Error generating Python-style prompt:', error);
        return "Animated creature in Pixar-art style that represents pain. It has red colors and rough texture.";
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

function appendToCSV(filePath, data) {
    const fileExists = fs.existsSync(filePath);
    const headers = Object.keys(data).map(key => ({ id: key, title: key }));

    // נוודא שכל ערך הוא string
    const stringData = {};
    for (const key in data) {
        if (typeof data[key] === 'object' && data[key] !== null) {
            stringData[key] = JSON.stringify(data[key]);
        } else {
            stringData[key] = String(data[key]);
        }
    }

    const csvWriter = createCsvWriter({
        path: filePath,
        header: headers,
        append: fileExists
    });

    // אם הקובץ לא קיים, יתווספו כותרות; אם קיים – רק שורה חדשה
    return csvWriter.writeRecords([data]);
}

// === ENDPOINTS ===

app.post('/submit-form1', async (req, res) => {
    try {
        const answers = req.body.answers;
        console.log('📩 Received answers:', answers);
        // אפשר לעבד את התשובות כאן אם צריך
        await appendToCSV(path.join(__dirname, 'form1.csv'), answers);

        res.status(200).json({ message: 'Form 1 answers saved!' });
    } catch (error) {
        console.error('❌ Error handling answers:', error);
        res.status(500).json({ message: 'Error saving Form 1 answers', error: error.message });
    }
});
const { Client } = require('pg');
app.post('/submit-form2', async (req, res) => {
    try {
        const answers = req.body.answers;
        const client = new Client();
        await client.connect();

        // הכנה של רשימת הערכים לפי הסדר של העמודות
        await client.query(
            `INSERT INTO form2-bogart (
                q_id_63, q_id_64, q_id_65, q_id_66, q_id_67, q_id_68, q_id_69, q_id_70, q_id_71, q_id_72, 
                q_id_73, q_id_74, q_id_75, q_id_76, q_id_77, q_id_78, q_id_79, q_id_80, q_id_81
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            )`,
            [
                answers.q_id_63,
                answers.q_id_64,
                answers.q_id_65,
                answers.q_id_66,
                answers.q_id_67,
                answers.q_id_68,
                answers.q_id_69,
                answers.q_id_70,
                answers.q_id_71,
                answers.q_id_72,
                answers.q_id_73,
                answers.q_id_74,
                answers.q_id_75,
                answers.q_id_76,
                answers.q_id_77,
                answers.q_id_78,
                answers.q_id_79,
                answers.q_id_80,
                answers.q_id_81
            ]
        );
        await client.end();
        console.log('📩 Received answers:', answers);

        const prompt = generatePainDescription(answers);
        res.status(200).json({
            message: 'Form 2 answers saved!',
            prompt: prompt
        });
    } catch (error) {
        console.error('❌ Error handling answers:', error);
        res.status(500).json({
            message: 'Error saving Form 2 answers', error: error.message
        });
    }
});

app.post('/submit-personal-info', async (req, res) => {
    try {
        const answers = req.body.answers;
        console.log('📩 Received answers:', answers);
        // אפשר לעבד את התשובות כאן אם צריך
        await appendToCSV(path.join(__dirname, 'form2.csv'), answers);
        res.status(200).json({ message: 'Form 2 answers saved!' });
    } catch (error) {
        console.error('❌ Error handling answers:', error);
        res.status(500).json({ message: 'Error saving Form 2 answers', error: error.message });
    }
});

app.post('/submit-form3', async (req, res) => {
    try {
        const answers = req.body.answers;
        console.log('📩 Received answers:', answers);
        // אפשר לעבד את התשובות כאן אם צריך
        await appendToCSV(path.join(__dirname, 'form2.csv'), answers);
        res.status(200).json({ message: 'Form 2 answers saved!' });
    } catch (error) {
        console.error('❌ Error handling answers:', error);
        res.status(500).json({ message: 'Error saving Form 2 answers', error: error.message });
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