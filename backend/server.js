require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Replicate = require('replicate');
const sharp = require('sharp');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const { uploadImageFromUrl } = require('./utils/azureStorage');

const app = express();
const PORT = process.env.PORT || 5000;

// --- הגדרות שירותים חיצוניים ---

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const TTAPI_KEY = process.env.TTAPI_KEY || "be396f95-696d-c7f0-5066-07ad81b37cbb";
const TTAPI_BASE_URL = "https://api.ttapi.io/midjourney/v1";

// מילון הרקעים לפי רמות SAM
const SAM_BACKGROUNDS = {
    "0": "extreme winter blizzard, HEAVY SNOWSTORM, DARK grey stormy sky, violent wind, nearly ZERO visibility, HARSH and BRUTAL cold",
    "1": "cold grey winter day, light snowfall, OVERCAST grey sky, bare frozen trees, quiet winter forest",
    "2": "late autumn, grey foggy morning, bare branches, dead brown leaves scattered on wet ground",
    "3": "mid autumn day, brown and orange leaves falling gently, half-bare trees, cool afternoon light",
    "4": "beautiful autumn forest, golden yellow and bright orange leaves on trees, warm sunlight",
    "5": "peak autumn beauty, vibrant red, orange, yellow and gold leaves, bright autumn sunshine",
    "6": "late autumn transitioning to spring, small patches of FRESH GREEN GRASS emerging",
    "7": "early spring emerging, bare branches with SMALL GREEN BUDS opening, GREEN GRASS patches",
    "8": "beautiful early spring day, trees covered with FRESH LIGHT GREEN leaves, cherry blossoms",
    "9": "glorious spring in full bloom, LUSH VIBRANT GREEN grass, abundant white-pink blossoms",
    "10": "ultimate spring paradise, BRILLIANT EMERALD GREEN grass meadow, EXPLOSION of colorful wildflowers"
};

console.log('🔍 Environment Debug:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌');
console.log('TTAPI_KEY:', process.env.TTAPI_KEY ? 'Set ✅' : 'Not set ❌');
console.log('REPLICATE_API_TOKEN:', process.env.REPLICATE_API_TOKEN ? 'Set ✅' : 'Not set ❌');

// בסיס נתונים פשוט לשמירת בקשות ותמונות
const imageRequests = new Map();

// Middleware setup
const allowedOrigins = [
    'https://boggart-app-f6eueeftawdka3cu.israelcentral-01.azurewebsites.net',
    'http://localhost:3000',
    'http://localhost:5000/',
    'http://127.0.0.1:3000' // לפעמים הדפדפן משתמש ב-IP במקום במילה localhost
];

app.use(cors({
    origin: function (origin, callback) {
        // מאפשר בקשות ללא Origin (כמו מובייל או כלים מסוימים) או כאלה ברשימה
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("❌ CORS Blocked Origin:", origin); // זה ידפיס לנו בדיוק מה חסר ברשימה
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// app.use(cors({
//     origin: 'https://boggart-app-f6eueeftawdka3cu.israelcentral-01.azurewebsites.net',
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true
// }));
//app.use(bodyParser.json());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

async function waitForReplicate(prediction) {
    let status = prediction;
    while (status.status !== "succeeded" && status.status !== "failed") {
        await new Promise(res => setTimeout(res, 2000));
        status = await replicate.predictions.get(prediction.id);
    }
    if (status.status === "failed") throw new Error("Replicate process failed");
    return status.output;
}

// פונקציה ליצירת פרומפט מתקדם
function generatePainDescription(answers, intensityFromForm1) {
    try {
        console.log("🐍 Server - Generating prompt using Python logic");
        console.log("🔧 Server - intensityFromForm1 received:", intensityFromForm1);  // ← 🔍 הוסף לוג!
        console.log("🔧 Server - All received answers:", answers);

        const location = answers[63] || ["general body"];
        const locationText = Array.isArray(location) ? location.join(", ") : location;

        const duration = answers[66];
        const depth = answers[71];
        const colorAnswer = answers[72];
        let color = colorAnswer?.name || colorAnswer || "red";
        const shape = answers[73];
        const border = answers[74];
        const textureTouch = answers[75];
        const textureStroke = answers[76];
        const textureHold = answers[77];

        const intensityRaw = intensityFromForm1 || 5; // default 5 if missing
        const intensity = Math.min(10, Math.max(0, Math.round(intensityRaw)));

        console.log("🎨 Server - Extracted values:", {
            location: locationText, duration, depth, color, shape, border,
            textureTouch, textureStroke, textureHold, intensity
        });

        const painEntity = "creature";
        const intensityLevels = {
            0: "indifferent", 1: "apathetic", 2: "uninterested", 3: "disinterested",
            4: "bored", 5: "uneasy", 6: "worried", 7: "anxious", 8: "agitated",
            9: "angry", 10: "furious"
        };
        const intensityDesc = intensityLevels[intensity] || "unknown";
        const size = duration <= 5 ? "short" : "tall";
        const thickness = depth <= 5 ? "thin" : "thick";

        const shapes = {
            1: "rounded", 2: "soft", 3: "nothing", 4: "defined", 5: "sharp"
        };
        const shapeDesc = shapes[shape] || "undefined";
        const borderDesc = border >= 3 ? "" : "blurred into the background";

        const textureTypes = {
            "1,2": "watery", "3,4": "runny", "5,5": "syrupy",
            "4,5": "creamy with soft texture", "4,4": "bumpy slime"
        };
        const textureKey = `${textureTouch},${textureStroke}`;
        const textureDesc = textureTypes[textureKey] || "gritty";

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

        const description = `Animated ${painEntity} in Pixar-art style that is ${intensityDesc} and has ${locationText}. ` +
            `It is ${size} and ${thickness}. ${color} colors. ` +
            `The creature is ${shapeDesc}, ${textureDesc}, ${borderDesc} and has ${feature}.`;

        console.log("✅ Server - Final Python-style prompt:", description);
        return description;

    } catch (error) {
        console.error('❌ Server - Error generating Python-style prompt:', error);
        return "Animated creature in Pixar-art style that represents pain. It has red colors and rough texture.";
    }
}

// פונקציה להתחברות לדאטאבייס Azure SQL
async function getDbConnection() {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
        }

        // Parse connection string manually
        const connectionString = process.env.DATABASE_URL;
        const params = {};

        connectionString.split(';').forEach(pair => {
            if (pair.trim()) {
                const [key, value] = pair.split('=');
                if (key && value) {
                    params[key.trim()] = value.trim();
                }
            }
        });

        const config = {
            server: params.Server,
            database: params['Initial Catalog'] || params.Database,
            user: params['User ID'] || params['User Id'],
            password: params.Password,
            options: {
                encrypt: true,
                trustServerCertificate: false,
                connectionTimeout: 30000,
                requestTimeout: 30000,
                enableArithAbort: true
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };

        console.log('🔗 Connecting to Azure SQL...');
        console.log('🔍 Server:', config.server);
        console.log('🔍 Database:', config.database);
        console.log('🔍 User:', config.user);

        await sql.close();

        const pool = await sql.connect(config);
        console.log('✅ Connected to Azure SQL Server successfully!');
        return pool;
    } catch (error) {
        console.error('❌ Azure SQL connection error:', error.message);
        console.error('💡 Check your DATABASE_URL in .env file');
        throw error;
    }
}

// === ENDPOINTS ===

app.post('/submit-form1', async (req, res) => {
    let pool;
    try {
        const { answers, introData } = req.body;
        console.log('📩 Form1 - Received answers:', Object.keys(answers).length, 'answers');
        console.log('📩 Form1 - Received introData:', introData);

        pool = await getDbConnection();

        const values = [];
        for (let i = 3; i <= 62; i++) {
            const value = answers[i] ?? answers[i.toString()] ?? null;
            values.push(value);
        }

        const query = `
            INSERT INTO [form1-Questionnaire] (
                participant_name, participant_phone_number, participant_date,
                q_id_3, q_id_4, q_id_5, q_id_6, q_id_7, q_id_8, 
                q_id_9, q_id_10, q_id_11, q_id_12, q_id_13, q_id_14, q_id_15, 
                q_id_16, q_id_17, q_id_18, q_id_19, q_id_20, q_id_21, q_id_22, 
                q_id_23, q_id_24, q_id_25, q_id_26, q_id_27, q_id_28, q_id_29, 
                q_id_30, q_id_31, q_id_32, q_id_33, q_id_34, q_id_35, q_id_36,
                q_id_37, q_id_38, q_id_39, q_id_40, q_id_41, q_id_42, q_id_43, 
                q_id_44, q_id_45, q_id_46, q_id_47, q_id_48, q_id_49, q_id_50, 
                q_id_51, q_id_52, q_id_53, q_id_54, q_id_55, q_id_56, q_id_57, 
                q_id_58, q_id_59, q_id_60, q_id_61, q_id_62, [Before/After]
            ) VALUES (
                @participantName, @participantPhoneNumber, @participantDate,
                ${values.map((_, i) => `@param${i}`).join(', ')}, @beforeAfter
            );
            SELECT SCOPE_IDENTITY() as id;
        `;

        const request = pool.request();
        request.input('participantName', introData?.fullName || null);
        request.input('participantPhoneNumber', introData?.phoneNumber || null);
        request.input('participantDate', introData?.date || null);

        values.forEach((value, index) => {
            request.input(`param${index}`, value);
        });

        request.input('beforeAfter', 'Before');

        const result = await request.query(query);
        const form1Id = result.recordset[0].id;

        await pool.request()
            .input('form1Id', form1Id)
            .query('UPDATE [form1-Questionnaire] SET [Number_tested] = @form1Id WHERE id = @form1Id');

        console.log('✅ Form1 - Created record with ID:', form1Id);

        res.status(200).json({
            message: 'Form 1 questionnaire saved successfully to Azure SQL!',
            form1Id: form1Id,
            success: true
        });

    } catch (error) {
        console.error('❌ Form1 Database Error:', error.message);
        res.status(500).json({
            message: 'Error saving Form 1 questionnaire to Azure SQL',
            error: error.message,
            success: false
        });
    }
});

app.post('/submit-form2', async (req, res) => {
    let pool;
    try {
        const { answers, form1Id, intensityFromForm1, isDemo } = req.body;

        console.log('📩 Form2 - Received answers. Demo Mode:', isDemo);

        // יצירת הפרומפט 
        const prompt = generatePainDescription(answers, intensityFromForm1);

        // --- בדיקת סימולציה ---
        if (isDemo || form1Id === 'demo') {
            console.log('🎭 Demo Mode: skipping SQL insert');
            return res.status(200).json({
                message: 'Demo mode: Prompt generated, no DB save.',
                form1Id: form1Id,
                prompt: prompt,
                success: true
            });
        }

        console.log('📩 Form2 - Received answers for form1Id:', form1Id);
        console.log('📩 Form2 - Received intensityFromForm1:', intensityFromForm1);
        console.log('📩 Form2 - Type:', typeof intensityFromForm1);

        if (!form1Id) {
            return res.status(400).json({
                message: 'form1Id is required for Form2 submission',
                success: false
            });
        }

        pool = await getDbConnection();

        const query = `
            INSERT INTO [form2-Bogart] (
                q_id_63, q_id_64, q_id_65, q_id_66, q_id_67, 
                q_id_68, q_id_69, q_id_70, q_id_71, q_id_72, 
                q_id_73, q_id_74, q_id_75, q_id_76, q_id_77, 
                q_id_78, q_id_79, q_id_80, q_id_81, [Number_tested], prompt
            ) VALUES (
                @q63, @q64, @q65, @q66, @q67, @q68, @q69, @q70, @q71, @q72,
                @q73, @q74, @q75, @q76, @q77, @q78, @q79, @q80, @q81, @form1Id, @prompt
            )
        `;

        const request = pool.request();
        request.input('q63', Array.isArray(answers[63]) ? answers[63].join(', ') : answers[63]);
        request.input('q64', answers[64]);
        request.input('q65', answers[65]);
        request.input('q66', answers[66]);
        request.input('q67', answers[67]);
        request.input('q68', answers[68]);
        request.input('q69', answers[69]);
        request.input('q70', answers[70]);
        request.input('q71', answers[71]);
        request.input('q72', typeof answers[72] === 'object' ? JSON.stringify(answers[72]) : answers[72]);
        request.input('q73', answers[73]);
        request.input('q74', answers[74]);
        request.input('q75', answers[75]);
        request.input('q76', answers[76]);
        request.input('q77', answers[77]);
        request.input('q78', Array.isArray(answers[78]) ? answers[78].join(', ') : answers[78]);
        request.input('q79', answers[79]);
        request.input('q80', answers[80]);
        request.input('q81', answers[81]);
        request.input('form1Id', form1Id);
        request.input('prompt', prompt);

        await request.query(query);
        console.log('✅ Form2 - Saved successfully for form1Id:', form1Id);

        res.status(200).json({
            message: 'Form 2 answers saved successfully to Azure SQL!',
            form1Id: form1Id,
            prompt: prompt,
            success: true
        });

    } catch (error) {
        console.error('❌ Form2 Database Error:', error.message);
        res.status(500).json({
            message: 'Error saving Form 2 answers to Azure SQL',
            error: error.message,
            success: false
        });
    }
});

app.post('/submit-personal-info', async (req, res) => {
    let pool;
    try {
        const { answers, form1Id } = req.body;

        // שליפת הנתונים מהאובייקט שנשלח
        const username = answers['username'];
        const password = answers['password'];

        console.log('📩 Personal Info - Received for form1Id:', form1Id);

        if (!form1Id) {
            return res.status(400).json({
                message: 'form1Id is required for Personal Info submission',
                success: false
            });
        }

        pool = await getDbConnection();

        // בדיקה אם שם המשתמש או הסיסמה כבר קיימים
        const checkUser = await pool.request()
            .input('username', username)
            .input('pwd', password)
            .query('SELECT username, password FROM users WHERE username = @username OR password = @pwd');

        if (checkUser.recordset.length > 0) {
            const found = checkUser.recordset[0];
            if (found.username === username) {
                return res.status(400).json({ error: "USERNAME_TAKEN" });
            }
            if (found.password === password) {
                return res.status(400).json({ error: "PASSWORD_TAKEN" });
            }
        }

        //שמירה בטבלת המשתמשים (הטבלה החדשה)
        await pool.request()
            .input('username', username)
            .input('password', password)
            .input('role', 'user')
            .input('form1Id', form1Id)
            .query(`INSERT INTO users (username, password, role, form1Id) 
                    VALUES (@username, @password, @role, @form1Id)`);

        // שמירה בטבלת הפרטים האישיים 
        const query = `
            INSERT INTO [form3-personal-info] (
                name, date, age, gender, religion, 
                nationality, mother_tongue, socio_economic_status, 
                education, existing_diagnosis, [Number_tested]
            ) VALUES (
                @name, @date, @age, @gender, @religion, @nationality, 
                @mother_tongue, @socio_economic_status, @education, 
                @existing_diagnosis, @form1Id
            )
        `;

        const request = pool.request();
        request.input('name', answers[82]);
        request.input('date', answers[83]);
        request.input('age', answers[84]);
        request.input('gender', answers[85]);
        request.input('religion', answers[86]);
        request.input('nationality', answers[87]);
        request.input('mother_tongue', answers[88]);
        request.input('socio_economic_status', answers[89]);
        request.input('education', answers[90]);
        request.input('existing_diagnosis', answers[91]);
        request.input('form1Id', form1Id);

        await request.query(query);

        console.log('✅ Personal Info - Saved successfully for form1Id:', form1Id);

        res.status(200).json({
            message: 'Personal info saved successfully to Azure SQL!',
            form1Id: form1Id,
            success: true
        });

    } catch (error) {
        console.error('❌ Personal Info Database Error:', error.message);
        res.status(500).json({
            message: 'Error saving personal info to Azure SQL',
            error: error.message,
            success: false
        });
    }
});

app.post('/submit-meet-your-pain', async (req, res) => {
    let pool;
    try {
        const { answers, form1Id } = req.body;
        console.log('📩 Meet Your Pain - Received answers:', answers);
        console.log('📩 Meet Your Pain - Received form1Id:', form1Id);

        if (!form1Id) {
            return res.status(400).json({
                message: 'form1Id is required for Meet Your Pain submission',
                success: false
            });
        }

        pool = await getDbConnection();
        console.log('✅ Database connection successful');
        const query = `
            INSERT INTO [meetYourPain] (
                 pain_connection, pain_representation, pain_description, [Number_tested]
            ) VALUES (@connect, @rep, @desc, @form1Id)
        `;

        console.log('🔍 Query to execute:', query);
        const request = pool.request();
        request.input('connect', answers[0]);
        request.input('rep', answers[1]);
        request.input('desc', answers[2]);
        request.input('form1Id', form1Id);

        console.log('🔍 Parameters:', {
            connect: answers[0],
            rep: answers[1],
            desc: answers[2],
            form1Id: form1Id
        });

        await request.query(query);

        console.log('✅ Meet Your Pain - Saved successfully for form1Id:', form1Id);

        res.status(200).json({
            message: 'Meet Your Pain answers saved successfully to Azure SQL!',
            form1Id: form1Id,
            success: true
        });

    } catch (error) {
        console.error('❌ Meet Your Pain Database Error:', error.message);
        console.error('❌ Full error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            message: 'Error saving Meet Your Pain answers to Azure SQL',
            error: error.message,
            success: false
        });
    }
});

app.post('/submit-form3', async (req, res) => {
    let pool;
    try {
        const { answers, form1Id } = req.body;
        console.log('📩 Form3 - Received answers:', Object.keys(answers).length, 'answers');
        console.log('📩 Form3 - Received form1Id:', form1Id);

        if (!form1Id) {
            return res.status(400).json({
                message: 'form1Id is required for Form3 submission',
                success: false
            });
        }

        pool = await getDbConnection();

        const values = [];
        for (let i = 3; i <= 62; i++) {
            const value = answers[i] ?? answers[i.toString()] ?? null;
            values.push(value);
        }
        values.push('After'); // זה ההבדל - במקום "Before"

        const query = `
            INSERT INTO [form1-Questionnaire] (
                q_id_3, q_id_4, q_id_5, q_id_6, q_id_7, q_id_8, 
                q_id_9, q_id_10, q_id_11, q_id_12, q_id_13, q_id_14, q_id_15, 
                q_id_16, q_id_17, q_id_18, q_id_19, q_id_20, q_id_21, q_id_22, 
                q_id_23, q_id_24, q_id_25, q_id_26, q_id_27, q_id_28, q_id_29, 
                q_id_30, q_id_31, q_id_32, q_id_33, q_id_34, q_id_35, q_id_36,
                q_id_37, q_id_38, q_id_39, q_id_40, q_id_41, q_id_42, q_id_43, 
                q_id_44, q_id_45, q_id_46, q_id_47, q_id_48, q_id_49, q_id_50, 
                q_id_51, q_id_52, q_id_53, q_id_54, q_id_55, q_id_56, q_id_57, 
                q_id_58, q_id_59, q_id_60, q_id_61, q_id_62, [Before/After]
            ) VALUES (
                ${values.map((_, i) => `@param${i}`).join(', ')}
            );
            SELECT SCOPE_IDENTITY() as id;
        `;

        const request = pool.request();
        values.forEach((value, index) => {
            request.input(`param${index}`, value);
        });

        const result = await request.query(query);
        const newRecordId = result.recordset[0].id;

        await pool.request()
            .input('originalForm1Id', form1Id)
            .input('newRecordId', newRecordId)
            .query('UPDATE [form1-Questionnaire] SET [Number_tested] = @originalForm1Id WHERE id = @newRecordId');

        console.log('✅ Form3 - Saved to same table with ID:', newRecordId, 'linked to form1Id:', form1Id);

        res.status(200).json({
            message: 'Form3 answers saved successfully to Azure SQL!',
            form1Id: form1Id,
            newRecordId: newRecordId,
            success: true
        });

    } catch (error) {
        console.error('❌ Form3 Database Error:', error.message);
        res.status(500).json({
            message: 'Error saving Form3 answers to Azure SQL',
            error: error.message,
            success: false
        });
    }
});

async function checkTTAPIStatus(ttapiJobId) {
    try {
        const response = await axios.post(`${TTAPI_BASE_URL}/fetch`, {
            jobId: ttapiJobId
        }, {
            headers: {
                "TT-API-KEY": TTAPI_KEY,
                "Content-Type": "application/json"
            },
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        console.error('Error checking TTAPI status:', error.response?.data || error.message);
        throw error;
    }
}

async function handleTTAPIProcess(requestId, prompt) {
    try {
        console.log(`🎨 Sending request to TTAPI for: ${requestId}`);

        const ttapiResponse = await axios.post(`${TTAPI_BASE_URL}/imagine`, {
            prompt: `${prompt} --ar 1:1 --stylize 500`,
            mode: "fast",
            timeout: 300
        }, {
            headers: {
                "TT-API-KEY": TTAPI_KEY,
                "Content-Type": "application/json"
            },
            timeout: 60000
        });

        const ttapiJobId = ttapiResponse.data?.data?.jobId || ttapiResponse.data?.jobId;

        if (!ttapiJobId) {
            throw new Error('No job ID received from TTAPI');
        }

        console.log(`✅ TTAPI job created: ${ttapiJobId} for request: ${requestId}`);

        if (imageRequests.has(requestId)) {
            imageRequests.set(requestId, {
                ...imageRequests.get(requestId),
                ttapiJobId: ttapiJobId
            });
        }

        const checkStatusRecursively = async (attempt = 1, maxAttempts = 30) => {
            try {
                console.log(`🔍 Checking TTAPI status for ${requestId}, attempt ${attempt}/${maxAttempts}`);

                const statusData = await checkTTAPIStatus(ttapiJobId);
                const status = statusData?.status;

                if (status === "SUCCESS") {
                    const imageUrl = statusData?.data?.cdnImage ||
                        statusData?.data?.discordImage ||
                        statusData?.data?.url;

                    if (imageUrl) {
                        try {
                            const request = imageRequests.get(requestId);

                            // --- מנגנון חסימה למצב דמו (סימולציה) ---
                            if (request && request.form1Id === 'demo') {
                                console.log(`🎭 Demo Mode: Image generated for request ${requestId}. Skipping Azure & SQL.`);

                                imageRequests.set(requestId, {
                                    ...request,
                                    status: 'completed',
                                    completedAt: new Date(),
                                    imageUrl: imageUrl // המשתמש יראה את התמונה ישירות מה-CDN של TTAPI
                                });
                                return; // עוצר כאן ולא ממשיך לשמירה ב-DB
                            }

                            // --- קוד רגיל למשתמשים אמיתיים ---
                            if (request && request.form1Id) {
                                console.log('📤 Uploading image to Azure Storage...');
                                const azureUrl = await uploadImageFromUrl(imageUrl);
                                console.log('✅ Azure URL:', azureUrl);

                                const pool = await getDbConnection();
                                await pool.request()
                                    .input('imageUrl', azureUrl)
                                    .input('originalTtapiUrl', imageUrl)
                                    .input('form1Id', request.form1Id)
                                    .query(`
                                        UPDATE [form2-Bogart] 
                                        SET image_url = @imageUrl, 
                                            original_ttapi_url = @originalTtapiUrl
                                        WHERE [Number_tested] = @form1Id
                                    `);

                                console.log(`✅ Database updated for form1Id: ${request.form1Id}`);

                                imageRequests.set(requestId, {
                                    ...request,
                                    status: 'completed',
                                    completedAt: new Date(),
                                    imageUrl: imageUrl,
                                    azureUrl: azureUrl
                                });
                            }
                        } catch (dbError) {
                            console.error('❌ Error in completion process:', dbError);
                        }
                    } else {
                        throw new Error('Image URL not found in TTAPI response');
                    }
                } else if (status === "FAILED") {
                    throw new Error(`TTAPI generation failed`);
                } else if (attempt >= maxAttempts) {
                    throw new Error(`TTAPI timeout`);
                } else {
                    setTimeout(() => checkStatusRecursively(attempt + 1, maxAttempts), 10000);
                }
            } catch (error) {
                console.error(`❌ Error in TTAPI check:`, error.message);
                imageRequests.set(requestId, {
                    ...imageRequests.get(requestId),
                    status: 'failed',
                    error: error.message,
                    completedAt: new Date()
                });
            }
        };

        setTimeout(() => checkStatusRecursively(), 15000);

    } catch (error) {
        console.error(`❌ Error in TTAPI process:`, error.message);
        imageRequests.set(requestId, {
            ...imageRequests.get(requestId),
            status: 'failed',
            error: error.message,
            completedAt: new Date()
        });
    }
}

// TTAPI endpoints
app.post('/api/create-image', async (req, res) => {
    try {
        const { answers, prompt, form1Id } = req.body;

        if (!prompt || !form1Id) {
            return res.status(400).json({
                message: 'Prompt is required',
                success: false
            });
        }

        const requestId = uuidv4();

        imageRequests.set(requestId, {
            requestId,
            status: 'processing',
            createdAt: new Date(),
            prompt,
            answers,
            form1Id
        });

        console.log(`📝 Created new image request: ${requestId}`);
        handleTTAPIProcess(requestId, prompt);

        res.status(200).json({
            requestId,
            message: 'Image request created successfully',
            estimatedTime: '1-2 minutes',
            success: true
        });

    } catch (error) {
        console.error('❌ Error creating image request:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            success: false
        });
    }
});

app.post('/api/save-selected-image', async (req, res) => {
    try {
        const { form1Id, selectedImageIndex } = req.body;

        const pool = await getDbConnection();
        await pool.request()
            .input('form1Id', form1Id)
            .input('selectedIndex', selectedImageIndex)
            .query(`
                UPDATE [form2-Bogart] 
                SET selected_image_index = @selectedIndex
                WHERE [Number_tested] = @form1Id
            `);

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving selected image:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/check-status/:requestId', (req, res) => {
    try {
        const { requestId } = req.params;
        const request = imageRequests.get(requestId);

        if (!request) {
            return res.status(404).json({
                message: 'Request not found',
                success: false
            });
        }

        res.status(200).json({
            requestId,
            status: request.status,
            createdAt: request.createdAt,
            completedAt: request.completedAt,
            imageUrl: request.imageUrl,
            error: request.error,
            ttapiJobId: request.ttapiJobId,
            success: true
        });

    } catch (error) {
        console.error(`❌ Error checking status:`, error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            success: false
        });
    }
});

app.get('/api/proxy-image/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = imageRequests.get(requestId);

        if (!request || !request.imageUrl) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const response = await axios.get(request.imageUrl, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
        res.setHeader('Access-Control-Allow-Origin', '*');
        response.data.pipe(res);

    } catch (error) {
        console.error('Error proxying image:', error);
        res.status(500).json({ error: 'Failed to load image' });
    }
});

app.get('/api/proxy-url', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL parameter required' });
        }

        const response = await axios.get(url, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
        res.setHeader('Access-Control-Allow-Origin', '*');
        response.data.pipe(res);

    } catch (error) {
        console.error('Error proxying URL:', error);
        res.status(500).json({ error: 'Failed to load image' });
    }
});

app.get('/api/image-status-by-form/:form1Id', async (req, res) => {
    try {
        const { form1Id } = req.params;
        console.log(`🔍 Checking image status for form1Id: ${form1Id}`);

        let foundRequest = null;
        for (const [requestId, request] of imageRequests.entries()) {
            if (request.form1Id && request.form1Id.toString() === form1Id.toString()) {
                foundRequest = request;
                break;
            }
        }

        if (foundRequest) {
            console.log(`✅ Found request in memory with status: ${foundRequest.status}`);
            res.status(200).json({
                status: foundRequest.status,
                imageUrl: foundRequest.imageUrl,
                error: foundRequest.error,
                createdAt: foundRequest.createdAt,
                completedAt: foundRequest.completedAt,
                success: true
            });
        } else {
            console.log(`🔍 Request not found in memory, checking database...`);

            try {
                const pool = await getDbConnection();
                const result = await pool.request()
                    .input('form1Id', form1Id)
                    .query(`
                        SELECT image_url, selected_image_index 
                        FROM [form2-Bogart] 
                        WHERE [Number_tested] = @form1Id
                    `);

                if (result.recordset.length > 0 && result.recordset[0].image_url) {
                    console.log(`✅ Found completed image in database`);
                    res.status(200).json({
                        status: 'completed',
                        imageUrl: result.recordset[0].image_url,
                        success: true
                    });
                } else {
                    console.log(`❌ No image found for form1Id: ${form1Id}`);
                    res.status(200).json({
                        status: 'not_found',
                        message: 'No image generation found for this form',
                        success: true
                    });
                }
            } catch (dbError) {
                console.error('❌ Database error:', dbError);
                res.status(200).json({
                    status: 'not_found',
                    message: 'Unable to check database',
                    success: true
                });
            }
        }

    } catch (error) {
        console.error(`❌ Error checking image status for form1Id ${req.params.form1Id}:`, error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            success: false
        });
    }
});

// בדיקת חיבור לדאטאבייס
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = await getDbConnection();

        // בדיקה פשוטה - ספירת רשומות בטבלה הראשונה
        const result = await pool.request().query('SELECT COUNT(*) as count FROM [form1-Questionnaire]');

        res.json({
            message: 'Azure SQL connection successful!',
            recordsCount: result.recordset[0].count,
            success: true
        });
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        res.status(500).json({
            message: 'Azure SQL connection failed',
            error: error.message,
            success: false
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Terrific Forgiveness API is running with Azure SQL! 🚀',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: [
            'POST /submit-form1',
            'POST /submit-form2',
            'POST /submit-personal-info',
            'POST /api/create-image',
            'GET /api/check-status/:requestId',
            'GET /api/test-db',
            'GET /health'
        ]
    });
});

// טיפול בסגירת השרת
process.on('SIGINT', async () => {
    console.log('🔌 Closing Azure SQL connections...');
    await sql.close();
    process.exit(0);
});

// LOGIN
app.post('/login', async (req, res) => {
    let pool;
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required',
                success: false
            });
        }

        pool = await getDbConnection();

        const result = await pool.request()
            .input('username', username)
            .input('password', password)
            .query(`
                SELECT id, username, role, form1Id 
                FROM [users] 
                WHERE username = @username AND password = @password
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                message: 'שם משתמש או סיסמה שגויים',
                success: false
            });
        }

        const user = result.recordset[0];

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                form1Id: user.form1Id
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({
            message: 'שגיאה בהתחברות',
            success: false
        });
    }
});

app.post('/generate-prompt-demo', (req, res) => {
    try {
        const { answers, intensity } = req.body;
        const prompt = generatePainDescription(answers, intensity || 5);
        res.status(200).json({ prompt, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

app.get('/api/get-creature/:username', async (req, res) => {
    let pool;
    try {
        const { username } = req.params;
        pool = await getDbConnection();

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT b.image_url, b.selected_image_index 
                FROM [form2-Bogart] b
                JOIN [users] u ON b.[Number_tested] = u.form1Id
                WHERE u.username = @username
            `);

        if (result.recordset.length > 0 && result.recordset[0].image_url) {
            res.status(200).json({
                success: true,
                image_url: result.recordset[0].image_url,
                selected_image_index: result.recordset[0].selected_image_index
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'לא נמצאה תמונה ליצור זה'
            });
        }
    } catch (error) {
        console.error('❌ Error fetching creature:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 1. עדכון מזג אוויר לפי SAM (שליפה מה-DB והעלאה ל-Azure)
app.post('/api/update-avatar-weather', async (req, res) => {
    try {
        const { samLevel, arousalLevel, username } = req.body;
        const pool = await getDbConnection();

        // 1. שליפת המקור מה-DB - הוספנו את ה-index לשאילתה
        const userResult = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT b.image_url, b.selected_image_index 
                FROM [form2-Bogart] b 
                JOIN [users] u ON b.[Number_tested] = u.form1Id 
                WHERE u.username = @username
            `);

        const originalImage = userResult.recordset[0]?.image_url;
        const selectedIndex = userResult.recordset[0]?.selected_image_index || 0; 

        if (!originalImage) return res.status(404).json({ message: "Creature not found" });

        const backgroundDesc = SAM_BACKGROUNDS[samLevel.toString()] || SAM_BACKGROUNDS["5"];

        // --- שלב 1: הסרת רקע ---
        console.log("🚀 Step 1: Removing background...");
        const removeBgPred = await replicate.predictions.create({
            version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            input: { image: originalImage }
        });
        const subjectUrl = await waitForReplicate(removeBgPred);

        console.log("⏳ Waiting for API cooldown...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // --- שלב 2: יצירת רקע חדש ---
        console.log("🚀 Step 2: Generating new background...");
        const bgPred = await replicate.predictions.create({
            version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input: {
                prompt: `Cinematic wide shot: ${backgroundDesc}, depth of field, 8k quality`,
                negative_prompt: "character, person, face, text, blurry",
                width: 1024, height: 1024
            }
        });
        const backgroundUrlRaw = await waitForReplicate(bgPred);
        const backgroundUrl = Array.isArray(backgroundUrlRaw) ? backgroundUrlRaw[0] : backgroundUrlRaw;

        // 3. עיבוד ושילוב התמונות עם Sharp
        console.log("🎨 Composing final image...");
        const [subRes, bgRes] = await Promise.all([
            axios.get(subjectUrl, { responseType: 'arraybuffer' }),
            axios.get(backgroundUrl, { responseType: 'arraybuffer' })
        ]);

        const subjectBuf = Buffer.from(subRes.data);
        const bgBuf = Buffer.from(bgRes.data);

        // --- חיתוך הדמות הנכונה מתוך ה-Grid ---
        const meta = await sharp(subjectBuf).metadata();
        const halfWidth = Math.floor(meta.width / 2);
        const halfHeight = Math.floor(meta.height / 2);

        // חישוב המיקום לפי האינדקס ששלפנו
        const left = (selectedIndex % 2) * halfWidth;
        const top = Math.floor(selectedIndex / 2) * halfHeight;

        const croppedSubject = await sharp(subjectBuf)
            .extract({ left, top, width: halfWidth, height: halfHeight })
            .resize({ height: 700 })
            .toBuffer();

        const subMeta = await sharp(croppedSubject).metadata();
        const processedBg = await sharp(bgBuf).resize(1024, 1024).blur(2).toBuffer();

        const finalImageBuffer = await sharp(processedBg)
            .composite([{
                input: croppedSubject,
                top: 1024 - subMeta.height - 50,
                left: Math.floor((1024 - subMeta.width) / 2)
            }])
            .png().toBuffer();

        // 4. העלאה ל-Azure (שם קובץ לפי תאריך כדי שידרוס אם מעדכנים באותו יום)
        const today = new Date().toISOString().split('T')[0];
        const fileName = `${username}_${today}.png`;
        const azureUrl = await uploadImageFromUrl(`data:image/png;base64,${finalImageBuffer.toString('base64')}`, fileName);

        // 5. שמירה/עדכון ב-SQL
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('url', sql.VarChar, azureUrl)
            .input('sam', sql.Int, parseInt(samLevel))
            .input('arousal', sql.Int, arousalLevel ? parseInt(arousalLevel) : 5)
            .input('today', sql.VarChar, today)
            .query(`
                IF EXISTS (SELECT 1 FROM UserCreatureHistory WHERE username = @username AND CAST(created_at AS DATE) = @today)
                BEGIN
                    UPDATE UserCreatureHistory 
                    SET image_url = @url, sam_level = @sam, arousal_level = @arousal, created_at = GETDATE()
                    WHERE username = @username AND CAST(created_at AS DATE) = @today
                END
                ELSE
                BEGIN
                    INSERT INTO UserCreatureHistory (username, image_url, sam_level, arousal_level, created_at) 
                    VALUES (@username, @url, @sam, @arousal, GETDATE())
                END
            `);

        console.log(`✅ Success! Creature updated for ${username}`);
        res.json({ success: true, avatarUrl: azureUrl });

    } catch (error) {
        console.error("❌ Process Failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/get-daily-character/:username', async (req, res) => {
    const { username } = req.params;
    let pool;
    try {
        pool = await getDbConnection();
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT TOP 1 image_url, created_at 
                FROM UserCreatureHistory 
                WHERE username = @username 
                ORDER BY created_at DESC
            `);

        if (result.recordset.length > 0) {
            const lastEntry = result.recordset[0];
            const lastUpdateDate = new Date(lastEntry.created_at).setHours(0, 0, 0, 0);
            const today = new Date().setHours(0, 0, 0, 0);

            if (lastUpdateDate === today) {
                console.log(`✅ Found today's image for user: ${username}`);
                return res.json({
                    success: true,
                    imageUrl: lastEntry.image_url
                });
            }
        }
        console.log(`ℹ️ No image found for today for user: ${username}`);
        res.json({ success: false });

    } catch (error) {
        console.error("❌ Database error in get-daily-character:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/creature-summary/:username', async (req, res) => {
    const { username } = req.params;
    const { startDate, endDate } = req.query;
    let pool;

    try {
        pool = await getDbConnection();

        // 1. הגדרת הבקשה פעם אחת בלבד
        const request = pool.request();
        request.input('username', sql.VarChar, username);

        let query = `SELECT image_url, created_at, sam_level, arousal_level 
                     FROM UserCreatureHistory 
                     WHERE username = @username`;

        // 2. טיפול בתאריכים
        if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
            const sDate = new Date(startDate);
            const eDate = new Date(endDate);
            eDate.setHours(23, 59, 59, 999);
            if (!isNaN(sDate) && !isNaN(eDate)) {
                query += ` AND created_at BETWEEN @start AND @end`;
                request.input('start', sql.DateTime, sDate);
                request.input('end', sql.DateTime, eDate);
            }
        } else {
            query += ` AND created_at >= DATEADD(day, -7, GETDATE())`;
        }

        query += ` ORDER BY created_at ASC`;

        // 3. הרצת השאילתה
        const result = await request.query(query);

        console.log(`Found ${result.recordset.length} rows for ${username}`); // בדיקה בטרמינל
        console.log("-----------------------");
        console.log("Results from DB:", result.recordset);
        console.log("Count:", result.recordset?.length);
        console.log("-----------------------");
        res.json({ success: true, history: result.recordset });

    } catch (error) {
        console.error("SQL Error Details:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 Using TTAPI key: ${TTAPI_KEY.substring(0, 8)}...`);
    console.log(`🌐 TTAPI Base URL: ${TTAPI_BASE_URL}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Database test: http://localhost:${PORT}/api/test-db`);
});