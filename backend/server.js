require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
//const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = process.env.PORT || 5000;
console.log('🔍 Environment Debug:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL);
console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
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

// === ENDPOINTS ===

const { Client } = require('pg');

app.post('/submit-form1', async (req, res) => {
    let client;
    try {
        const answers = req.body.answers;
        console.log('📩 Form1 - Received answers:', answers);
        console.log('🔍 Form1 - Answers keys:', Object.keys(answers));

        const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

        if (!databaseUrl) {
            throw new Error('No database URL found');
        }

        client = new Client({
            connectionString: databaseUrl,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        console.log('✅ Form1 - Connected to Railway PostgreSQL');

        // 🎯 פתרון חכם - נתמודד עם keys שהם strings או numbers
        const values = [];
        for (let i = 3; i <= 61; i++) {
            const value = answers[i] ?? answers[i.toString()] ?? null;
            values.push(value);
        }

        // Add the Before/After value
        values.push('Before');

        const insertQuery = `
            INSERT INTO "form1-Questionnaire" (
                q_id_3, q_id_4, q_id_5, q_id_6, q_id_7, q_id_8, 
                q_id_9, q_id_10, q_id_11, q_id_12, q_id_13, q_id_14, q_id_15, 
                q_id_16, q_id_17, q_id_18, q_id_19, q_id_20, q_id_21, q_id_22, 
                q_id_23, q_id_24, q_id_25, q_id_26, q_id_27, q_id_28, q_id_29, 
                q_id_30, q_id_31, q_id_32, q_id_33, q_id_34, q_id_35, q_id_36,
                q_id_37, q_id_38, q_id_39, q_id_40, q_id_41, q_id_42, q_id_43, 
                q_id_44, q_id_45, q_id_46, q_id_47, q_id_48, q_id_49, q_id_50, 
                q_id_51, q_id_52, q_id_53, q_id_54, q_id_55, q_id_56, q_id_57, 
                q_id_58, q_id_59, q_id_60, q_id_61,
                created_at, "Before/After"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
                $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
                $51, $52, $53, $54, $55, $56, $57, $58, $59,
                NOW(), $60
            ) RETURNING id;
        `;

        const result = await client.query(insertQuery, values);
        const form1Id = result.rows[0].id;

        console.log('✅ Form1 - Created record with ID:', form1Id);

        // === שלב 2: עדכן את עמודת Number tested עם אותו ID ===
        const updateQuery = `
            UPDATE "form1-Questionnaire" 
            SET "Number tested" = $1 
            WHERE id = $2`;

        await client.query(updateQuery, [form1Id, form1Id]);

        console.log('✅ Form1 - Updated Number tested column to:', form1Id);

        res.status(200).json({
            message: 'Form 1 questionnaire saved successfully!',
            form1Id: form1Id,
            rowsAffected: result.rowCount
        });

    } catch (error) {
        console.error('❌ Form1 Database Error:', error);
        res.status(500).json({
            message: 'Error saving Form 1 questionnaire',
            error: error.message
        });
    } finally {
        if (client) {
            try {
                await client.end();
            } catch (endError) {
                console.error('Error closing Form1 connection:', endError);
            }
        }
    }
});

app.post('/submit-form2', async (req, res) => {
    let client;
    try {
        const { answers, form1Id } = req.body; // 🎯 קבלת form1Id מהלקוח
        console.log('📩 Form2 - Received answers:', answers);
        console.log('🔗 Form2 - Received form1Id:', form1Id);
        console.log('🔄 Starting database connection process...');
        if (!form1Id) {
            return res.status(400).json({
                message: 'form1Id is required for Form2 submission'
            })
        }
        // Railway חיבור - חכם לכל סביבה
        const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

        if (!databaseUrl) {
            throw new Error('No database URL found. Set DATABASE_URL or DATABASE_PUBLIC_URL');
        }

        client = new Client({
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false // Railway דורש SSL
            }
        });

        console.log('🔗 Using database URL:', databaseUrl.substring(0, 20) + '...');

        await client.connect();
        console.log('✅ Connected to Railway PostgreSQL');

        // בדיקה אם הטבלה קיימת (עם גרשיים בגלל המקף)
        const insertQuery = `
            INSERT INTO "form2-Bogart" (
                q_id_63, q_id_64, q_id_65, q_id_66, q_id_67, 
                q_id_68, q_id_69, q_id_70, q_id_71, q_id_72, 
                q_id_73, q_id_74, q_id_75, q_id_76, q_id_77, 
                q_id_78, q_id_79, q_id_80, q_id_81, "Number tested"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
        `;

        // הכנה של הערכים
        const values = [
            Array.isArray(answers[63]) ? answers[63].join(', ') : answers[63],
            answers[64],
            answers[65],
            answers[66],
            answers[67],
            answers[68],
            answers[69],
            answers[70],
            answers[71],
            // אם 72 הוא אובייקט צבע, שמור אותו כ-JSON
            typeof answers[72] === 'object' ? JSON.stringify(answers[72]) : answers[72],
            answers[73],
            answers[74],
            answers[75],
            answers[76],
            answers[77],
            Array.isArray(answers[78]) ? answers[78].join(', ') : answers[78],
            answers[79],
            answers[80],
            answers[81],
            form1Id // 🎯 שמירת form1Id בשדה number_tested
        ];

        console.log('💾 Inserting values:', values);

        let result;
        try {
            result = await client.query(insertQuery, values);
            console.log('✅ Insert successful:', result.rowCount, 'rows affected');
        } catch (queryError) {
            console.error('❌ Query failed:', queryError.message);
            console.error('❌ Query code:', queryError.code);
            console.error('❌ Query detail:', queryError.detail);
            throw queryError;
        }

        // יצירת פרומפט
        const prompt = generatePainDescription(answers);

        res.status(200).json({
            message: 'Form 2 answers saved successfully to Railway!',
            form1Id: form1Id,
            prompt: prompt,
            rowsAffected: result.rowCount
        });

    } catch (error) {
        console.error('❌ Railway Database Error:', error);

        // שגיאות נפוצות ב-Railway
        if (error.code === '42P01') {
            console.error('🚨 Table does not exist! Create it first.');
        } else if (error.code === '42703') {
            console.error('🚨 Column does not exist! Check your table schema.');
        }

        res.status(500).json({
            message: 'Error saving to Railway database',
            error: error.message,
            code: error.code,
            hint: error.hint
        });
    } finally {
        if (client) {
            try {
                await client.end();
                console.log('🔌 Railway connection closed');
            } catch (endError) {
                console.error('Error closing Railway connection:', endError);
            }
        }
    }
});

app.post('/submit-personal-info', async (req, res) => {
    let client;
    try {
        const { answers, form1Id } = req.body; // 🎯 קבלת form1Id מהלקוח
        console.log('📩 Form3 - Received answers:', answers);
        console.log('🔗 Form3 - Received form1Id:', form1Id);
        console.log('🔄 Starting database connection process...');
        if (!form1Id) {
            return res.status(400).json({
                message: 'form1Id is required for Form3 submission'
            });
        }
        // Railway חיבור - חכם לכל סביבה
        const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

        if (!databaseUrl) {
            throw new Error('No database URL found. Set DATABASE_URL or DATABASE_PUBLIC_URL');
        }

        client = new Client({
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false // Railway דורש SSL
            }
        });

        console.log('🔗 Using database URL:', databaseUrl.substring(0, 20) + '...');

        await client.connect();
        console.log('✅ Connected to Railway PostgreSQL');

        const insertQuery = `
            INSERT INTO "form3-personal-info" (
                name, date, age, gender, religion, 
                nationality, mother_tongue, socio_economic_status, education, existing_diagnosis, "Number tested"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )
        `;

        // הכנה של הערכים
        const values = [
            answers[82],
            answers[83],
            answers[84],
            answers[85],
            answers[86],
            answers[87],
            answers[88],
            answers[89],
            answers[90],
            answers[91],
            form1Id // 🎯 שמירת form1Id בשדה number_tested
        ];

        console.log('💾 Inserting values:', values);

        let result;
        try {
            result = await client.query(insertQuery, values);
            console.log('✅ Insert successful:', result.rowCount, 'rows affected');
        } catch (queryError) {
            console.error('❌ Query failed:', queryError.message);
            console.error('❌ Query code:', queryError.code);
            console.error('❌ Query detail:', queryError.detail);
            throw queryError;
        }

        res.status(200).json({
            message: 'Form personal info answers saved successfully to Railway!',
            form1Id: form1Id,
            rowsAffected: result.rowCount
        });

    } catch (error) {
        console.error('❌ Railway Database Error:', error);

        // שגיאות נפוצות ב-Railway
        if (error.code === '42P01') {
            console.error('🚨 Table does not exist! Create it first.');
        } else if (error.code === '42703') {
            console.error('🚨 Column does not exist! Check your table schema.');
        }

        res.status(500).json({
            message: 'Error saving to Railway database',
            error: error.message,
            code: error.code,
            hint: error.hint
        });
    } finally {
        if (client) {
            try {
                await client.end();
                console.log('🔌 Railway connection closed');
            } catch (endError) {
                console.error('Error closing Railway connection:', endError);
            }
        }
    }
});

app.post('/submit-meet_your_pain', async (req, res) => {
    let client;
    try {
        const { answers, form1Id } = req.body; // 🎯 קבלת form1Id מהלקוח
        console.log('📩 Form-meet - Received answers:', answers);
        console.log('🔗 Form-meet - Received form1Id:', form1Id);
        console.log('🔄 Starting database connection process...');
        if (!form1Id) {
            return res.status(400).json({
                message: 'form1Id is required for Form-meet submission'
            });
        }
        // Railway חיבור - חכם לכל סביבה
        const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

        if (!databaseUrl) {
            throw new Error('No database URL found. Set DATABASE_URL or DATABASE_PUBLIC_URL');
        }

        client = new Client({
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false // Railway דורש SSL
            }
        });

        console.log('🔗 Using database URL:', databaseUrl.substring(0, 20) + '...');

        await client.connect();
        console.log('✅ Connected to Railway PostgreSQL');

        const insertQuery = `
        INSERT INTO meet_your_pain (
            " describing_your_pain", 
            "representation_your_pain", 
            "Number tested"
        ) VALUES ($1, $2, $3)
    `;

        // הכנה של הערכים
        const values = [
            answers[0],
            answers[1],
            form1Id // 🎯 שמירת form1Id בשדה number_tested
        ];

        console.log('💾 Inserting values:', values);

        let result;
        try {
            result = await client.query(insertQuery, values);
            console.log('✅ Insert successful:', result.rowCount, 'rows affected');
        } catch (queryError) {
            console.error('❌ Query failed:', queryError.message);
            console.error('❌ Query code:', queryError.code);
            console.error('❌ Query detail:', queryError.detail);
            throw queryError;
        }

        res.status(200).json({
            message: 'Form meet your pain answers saved successfully to Railway!',
            form1Id: form1Id,
            rowsAffected: result.rowCount
        });

    } catch (error) {
        console.error('❌ Railway Database Error:', error);

        // שגיאות נפוצות ב-Railway
        if (error.code === '42P01') {
            console.error('🚨 Table does not exist! Create it first.');
        } else if (error.code === '42703') {
            console.error('🚨 Column does not exist! Check your table schema.');
        }

        res.status(500).json({
            message: 'Error saving to Railway database',
            error: error.message,
            code: error.code,
            hint: error.hint
        });
    } finally {
        if (client) {
            try {
                await client.end();
                console.log('🔌 Railway connection closed');
            } catch (endError) {
                console.error('Error closing Railway connection:', endError);
            }
        }
    }
});

app.post('/submit-form3', async (req, res) => {
    let client;
    try {
        const { answers, form1Id } = req.body; // 🎯 קבלת form1Id מהלקוח
        console.log('📩 Form4 - Received answers:', answers);
        console.log('🔍 Form4 - Answers keys:', Object.keys(answers));
        console.log('🔄 Starting database connection process...');
        if (!form1Id) {
            return res.status(400).json({
                message: 'form1Id is required for Form-meet submission'
            });
        }

        const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

        if (!databaseUrl) {
            throw new Error('No database URL found');
        }

        client = new Client({
            connectionString: databaseUrl,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        console.log('✅ Form4 - Connected to Railway PostgreSQL');

        // 🎯 פתרון חכם - נתמודד עם keys שהם strings או numbers
        const values = [];
        // עבור שאלות 3-22: הוסף -1 או null (בחר אחד)
        for (let i = 3; i <= 22; i++) {
            values.push(-1); // או values.push(null) אם אתה מעדיף null
        }
        for (let i = 23; i <= 61; i++) {
            const value = answers[i] ?? answers[i.toString()] ?? null;
            values.push(value);
        }

        // Add the Before/After value
        values.push('After');
        values.push(form1Id);

        const insertQuery = `
            INSERT INTO "form1-Questionnaire" (
                q_id_3, q_id_4, q_id_5, q_id_6, q_id_7, q_id_8, 
                q_id_9, q_id_10, q_id_11, q_id_12, q_id_13, q_id_14, q_id_15, 
                q_id_16, q_id_17, q_id_18, q_id_19, q_id_20, q_id_21, q_id_22, 
                q_id_23, q_id_24, q_id_25, q_id_26, q_id_27, q_id_28, q_id_29, 
                q_id_30, q_id_31, q_id_32, q_id_33, q_id_34, q_id_35, q_id_36,
                q_id_37, q_id_38, q_id_39, q_id_40, q_id_41, q_id_42, q_id_43, 
                q_id_44, q_id_45, q_id_46, q_id_47, q_id_48, q_id_49, q_id_50, 
                q_id_51, q_id_52, q_id_53, q_id_54, q_id_55, q_id_56, q_id_57, 
                q_id_58, q_id_59, q_id_60, q_id_61,
                created_at, "Before/After", "Number tested"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
                $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
                $51, $52, $53, $54, $55, $56, $57, $58, $59,
                NOW(), $60, $61
            )
        `;

        const result = await client.query(insertQuery, values);

        console.log('✅ Form4 - Insert successful, ID:', form1Id);

        res.status(200).json({
            message: 'Form 4 questionnaire saved successfully!',
            form1Id: form1Id,
            rowsAffected: result.rowCount,
        });

    } catch (error) {
        console.error('❌ Form4 - Railway Database Error:', error);
        res.status(500).json({
            message: 'Error saving Form 4 questionnaire',
            error: error.message,
            code: error.code
        });
    } finally {
        if (client) {
            try {
                await client.end();
                console.log('🔌 Form4 - Railway connection closed');
            } catch (endError) {
                console.error('Error closing Form4 Railway connection:', endError);
            }
        }
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
                'Accept': 'image/*,*/* ',
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