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

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const TTAPI_KEY = process.env.TTAPI_KEY || "be396f95-696d-c7f0-5066-07ad81b37cbb";
const TTAPI_BASE_URL = "https://api.ttapi.io/midjourney/v1";

const SAM_BACKGROUNDS = {
    "1": "extreme winter blizzard, HEAVY SNOWSTORM, DARK grey stormy sky, violent wind, nearly ZERO visibility, HARSH and BRUTAL cold",
    "2": "cold grey winter day, light snowfall, OVERCAST grey sky, bare frozen trees, quiet winter forest",
    "3": "late autumn, grey foggy morning, bare branches, dead brown leaves scattered on wet ground",
    "4": "mid autumn day, brown and orange leaves falling gently, half-bare trees, cool afternoon light",
    "5": "beautiful autumn forest, golden yellow and bright orange leaves on trees, warm sunlight",
    "6": "peak autumn beauty, vibrant red, orange, yellow and gold leaves, bright autumn sunshine",
    "7": "early spring emerging, bare branches with SMALL GREEN BUDS opening, GREEN GRASS patches",
    "8": "beautiful early spring day, trees covered with FRESH LIGHT GREEN leaves, cherry blossoms",
    "9": "ultimate spring paradise, BRILLIANT EMERALD GREEN grass meadow, EXPLOSION of colorful wildflowers, LUSH VIBRANT GREEN grass"
};

console.log('🔍 Environment Debug:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌');
console.log('TTAPI_KEY:', process.env.TTAPI_KEY ? 'Set ✅' : 'Not set ❌');
console.log('REPLICATE_API_TOKEN:', process.env.REPLICATE_API_TOKEN ? 'Set ✅' : 'Not set ❌');

const imageRequests = new Map();

// Middleware setup
const allowedOrigins = [
    'https://boggart-app-f6eueeftawdka3cu.israelcentral-01.azurewebsites.net',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("❌ CORS Blocked Origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.options('*', cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

/* Helper Functions */

// Polling mechanism to wait for Replicate AI prediction completion.
async function waitForReplicate(prediction) {
    let status = prediction;
    while (status.status !== "succeeded" && status.status !== "failed") {
        await new Promise(res => setTimeout(res, 3000));
        status = await replicate.predictions.get(prediction.id);
    }
    if (status.status === "failed") throw new Error("Replicate process failed");
    return status.output;
}

// The prompt engineering engine – converts form answers into a descriptive AI prompt.
function generatePainDescription(answers, intensityFromForm1) {
    try {
        console.log("🐍 Server - Generating prompt using Python logic");
        console.log("🔧 Server - intensityFromForm1 received:", intensityFromForm1);
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

        const intensityRaw = intensityFromForm1 || 5;
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
            `The creature is ${shapeDesc}, ${textureDesc}, ${borderDesc} and has ${feature}.` +
            `Clear, well-lit scene with sharp focus, simple uncluttered background, no fog, no haze, no heavy shadows.`;

        console.log("✅ Server - Final Python-style prompt:", description);
        return description;

    } catch (error) {
        console.error('❌ Server - Error generating Python-style prompt:', error);
        return "Animated creature in Pixar-art style that represents pain. It has red colors and rough texture.";
    }
}

let globalPool = null;

// Manages the secure connection pool to Azure SQL Database.
async function getDbConnection() {
    try {
        if (globalPool) {
            try {
                await globalPool.request().query('SELECT 1');
                return globalPool;
            } catch (e) {
                globalPool = null;
            }
        }
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set.');
        }

        const connectionString = process.env.DATABASE_URL;
        const params = {};
        connectionString.split(';').forEach(pair => {
            if (pair.trim()) {
                const [key, value] = pair.split('=');
                if (key && value) params[key.trim()] = value.trim();
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
            pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
        };

        globalPool = await sql.connect(config);
        console.log('✅ Connected to Azure SQL Server successfully!');
        return globalPool;

    } catch (error) {
        console.error('❌ Azure SQL connection error:', error.message);
        throw error;
    }
}

// Checks the status of a Midjourney job via TTAPI.
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

// Orchestrates the full image lifecycle: Generation, Polling, Azure Upload, and SQL Update.
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
                    const primaryUrl = statusData?.data?.discordImage;
                    const fallbackUrl = statusData?.data?.cdnImage || statusData?.data?.url;
                    const imageUrl = primaryUrl || fallbackUrl;

                    if (imageUrl) {
                        try {
                            const request = imageRequests.get(requestId);
                            if (request && request.form1Id === 'demo') {
                                console.log(`🎭 Demo Mode: Image generated for request ${requestId}. Skipping Azure & SQL.`);

                                imageRequests.set(requestId, {
                                    ...request,
                                    status: 'completed',
                                    completedAt: new Date(),
                                    imageUrl: imageUrl
                                });
                                return;
                            }

                            if (request && request.form1Id) {
                                console.log('📤 Uploading image to Azure Storage...');
                                let azureUrl;
                                try {
                                    azureUrl = await uploadImageFromUrl(primaryUrl || fallbackUrl);
                                } catch (uploadErr) {
                                    if (primaryUrl && fallbackUrl && primaryUrl !== fallbackUrl) {
                                        console.warn('⚠️ Primary image URL failed, trying fallback:', uploadErr.message);
                                        azureUrl = await uploadImageFromUrl(fallbackUrl);
                                    } else {
                                        throw uploadErr;
                                    }
                                }
                                console.log('✅ Azure URL:', azureUrl);

                                const pool = await getDbConnection();
                                await pool.request()
                                    .input('imageUrl', azureUrl)
                                    .input('originalTtapiUrl', imageUrl)
                                    .input('form1Id', request.form1Id)
                                    .query(`
                                        UPDATE [form2-Boggart] 
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

/* Questionnaire & Data Submission Endpoints */

// Saves the initial questionnaire (Pre-treatment) and creates a participant record.
app.post('/submit-form1', async (req, res) => {
    let pool;
    try {
        const { answers, introData } = req.body;
        console.log('📩 Form1 - Received answers:', Object.keys(answers).length, 'answers');
        console.log('📩 Form1 - Received introData:', introData);

        pool = await getDbConnection();

        if (answers[102] && typeof answers[102] === 'object') {
            answers[102] = JSON.stringify(answers[102]);
        }
        const values = [];
        for (let i = 0; i <= 116; i++) {
            const value = answers[i] ?? answers[i.toString()] ?? null;
            values.push(value);
        }

        const query = `
            INSERT INTO [form1-Questionnaire] (
                participant_name, participant_phone_number, participant_date,
                q_id_0, q_id_1, q_id_2, q_id_3, q_id_4, q_id_5, q_id_6, q_id_7, q_id_8, 
                q_id_9, q_id_10, q_id_11, q_id_12, q_id_13, q_id_14, q_id_15, 
                q_id_16, q_id_17, q_id_18, q_id_19, q_id_20, q_id_21, q_id_22, 
                q_id_23, q_id_24, q_id_25, q_id_26, q_id_27, q_id_28, q_id_29, 
                q_id_30, q_id_31, q_id_32, q_id_33, q_id_34, q_id_35, q_id_36,
                q_id_37, q_id_38, q_id_39, q_id_40, q_id_41, q_id_42, q_id_43, 
                q_id_44, q_id_45, q_id_46, q_id_47, q_id_48, q_id_49, q_id_50, 
                q_id_51, q_id_52, q_id_53, q_id_54, q_id_55, q_id_56, q_id_57, 
                q_id_58, q_id_59, q_id_60, q_id_61, q_id_62, q_id_63, q_id_64, q_id_65,
                q_id_66, q_id_67, q_id_68, q_id_69, q_id_70, q_id_71, q_id_72, q_id_73,
                q_id_74, q_id_75, q_id_76, q_id_77, q_id_78, q_id_79, q_id_80, q_id_81,
                q_id_82, q_id_83, q_id_84, q_id_85, q_id_86, q_id_87, q_id_88, q_id_89,
                q_id_90, q_id_91, q_id_92, q_id_93, q_id_94, q_id_95, q_id_96, q_id_97,
                q_id_98, q_id_99, q_id_100, q_id_101, q_id_102, q_id_103, q_id_104,
                q_id_105, q_id_106, q_id_107, q_id_108, q_id_109, q_id_110, q_id_111,
                q_id_112, q_id_113, q_id_114, q_id_115, q_id_116, [Before/After]
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

// Saves the "Boggart" creature description and triggers initial prompt generation.
app.post('/submit-form2', async (req, res) => {
    let pool;
    try {
        const { answers, form1Id, intensityFromForm1, isDemo } = req.body;
        console.log('📩 Form2 - Received answers. Demo Mode:', isDemo);
        const prompt = generatePainDescription(answers, intensityFromForm1);
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
            INSERT INTO [form2-Boggart] (
                q_id_117, q_id_118, q_id_119, q_id_120, q_id_121, q_id_122, 
                q_id_123, q_id_124, q_id_125, q_id_126, q_id_127, 
                q_id_128, q_id_129, q_id_130, q_id_131, q_id_132, 
                q_id_133, q_id_134, q_id_135, [Number_tested], prompt
            ) VALUES (
                @q117, @q118, @q119, @q120, @q121, @q122, @q123, @q124, @q125, @q126, @q127,
                @q128, @q129, @q130, @q131, @q132, @q133, @q134, @q135, @form1Id, @prompt
            )
        `;

        const request = pool.request();
        request.input('q117', Array.isArray(answers[117]) ? answers[117].join(', ') : answers[117]);
        request.input('q118', answers[118]);
        request.input('q119', answers[119]);
        request.input('q120', answers[120]);
        request.input('q121', answers[121]);
        request.input('q122', answers[122]);
        request.input('q123', answers[123]);
        request.input('q124', answers[124]);
        request.input('q125', answers[125]);
        request.input('q126', typeof answers[126] === 'object' ? JSON.stringify(answers[126]) : answers[126]);
        request.input('q127', answers[127]);
        request.input('q128', answers[128]);
        request.input('q129', answers[129]);
        request.input('q130', answers[130]);
        request.input('q131', answers[131]);
        request.input('q132', Array.isArray(answers[132]) ? answers[132].join(', ') : answers[132]);
        request.input('q133', answers[133]);
        request.input('q134', answers[134]);
        request.input('q135', answers[135]);
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

// Saves the personal details and demographics, and creates a user account for the participant.
app.post('/submit-personal-info', async (req, res) => {
    let pool;
    try {
        const { answers, form1Id } = req.body;
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

        await pool.request()
            .input('username', username)
            .input('password', password)
            .input('role', 'user')
            .input('form1Id', form1Id)
            .query(`INSERT INTO users (username, password, role, form1Id) 
                    VALUES (@username, @password, @role, @form1Id)`);

        const query = `
            INSERT INTO [form3-personal-info] (
                name, date, age, sex, religion,
                nationality, mother_tongue, socio_economic_status,
                education, employment, relationship,
                chronicPain, painDuration, painLocation,
                medication, medicationType, psychological,
                medicalFollowUp, existing_diagnosis, [Number_tested]
            ) VALUES (
                @name, @date, @age, @sex, @religion,
                @nationality, @mother_tongue, @socio_economic_status,
                @education, @employment, @relationship,
                @chronicPain, @painDuration, @painLocation,
                @medication, @medicationType, @psychological,
                @medicalFollowUp, @existingDiagnosis, @form1Id
            )
        `;

        const request = pool.request();
        request.input('name', answers[136] ?? null);
        request.input('date', answers[137] ?? null);
        request.input('age', answers[138] ?? null);
        request.input('sex', answers[139] ?? null);
        request.input('religion', answers[140] ?? null);
        request.input('nationality', answers[141] ?? null);
        request.input('mother_tongue', answers[142] ?? null);
        request.input('socio_economic_status', answers[143] ?? null);
        request.input('education', answers[144] ?? null);
        request.input('employment', answers[145] ?? null);
        request.input('relationship', answers[146] ?? null);
        request.input('chronicPain', answers[147] ?? null);
        request.input('painDuration', answers[148] ?? null);
        request.input('painLocation', answers[149] ?? null);
        request.input('medication', answers[150] ?? null);
        request.input('medicationType', answers[151] ?? null);
        request.input('psychological', answers[152] ?? null);
        request.input('medicalFollowUp', answers[153] ?? null);
        request.input('existingDiagnosis', answers[154] ?? null);
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

// Saves user reflections from the "Meet Your Pain" therapeutic stage.
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
                 pain_connection, pain_representation, pain_description, threatening_figure, [Number_tested]
            ) VALUES (@connect, @rep, @desc, @threatening, @form1Id)
        `;

        console.log('🔍 Query to execute:', query);
        const request = pool.request();
        request.input('connect', answers[155]);
        request.input('rep', answers[156]);
        request.input('desc', answers[157]);
        request.input('threatening', answers[158]);
        request.input('form1Id', form1Id);

        console.log('🔍 Parameters:', {
            connect: answers[155],
            rep: answers[156],
            desc: answers[157],
            threatening: answers[158],
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

// Saves the follow-up SAM questionnaire (Post-treatment) for improvement analysis.
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
        if (answers[102] && typeof answers[102] === 'object') {
            answers[102] = JSON.stringify(answers[102]);
        }
        const values = [];
        for (let i = 0; i <= 116; i++) {
            const value = answers[i] ?? answers[i.toString()] ?? null;
            values.push(value);
        }
        values.push('After');
        const query = `
            INSERT INTO [form1-Questionnaire] (
                q_id_0, q_id_1, q_id_2, q_id_3, q_id_4, q_id_5, q_id_6, q_id_7, q_id_8, 
                q_id_9, q_id_10, q_id_11, q_id_12, q_id_13, q_id_14, q_id_15, 
                q_id_16, q_id_17, q_id_18, q_id_19, q_id_20, q_id_21, q_id_22, 
                q_id_23, q_id_24, q_id_25, q_id_26, q_id_27, q_id_28, q_id_29, 
                q_id_30, q_id_31, q_id_32, q_id_33, q_id_34, q_id_35, q_id_36,
                q_id_37, q_id_38, q_id_39, q_id_40, q_id_41, q_id_42, q_id_43, 
                q_id_44, q_id_45, q_id_46, q_id_47, q_id_48, q_id_49, q_id_50, 
                q_id_51, q_id_52, q_id_53, q_id_54, q_id_55, q_id_56, q_id_57, 
                q_id_58, q_id_59, q_id_60, q_id_61, q_id_62, q_id_63, q_id_64, q_id_65,
                q_id_66, q_id_67, q_id_68, q_id_69, q_id_70, q_id_71, q_id_72, q_id_73,
                q_id_74, q_id_75, q_id_76, q_id_77, q_id_78, q_id_79, q_id_80, q_id_81,
                q_id_82, q_id_83, q_id_84, q_id_85, q_id_86, q_id_87, q_id_88, q_id_89,
                q_id_90, q_id_91, q_id_92, q_id_93, q_id_94, q_id_95, q_id_96, q_id_97,
                q_id_98, q_id_99, q_id_100, q_id_101, q_id_102, q_id_103, q_id_104,
                q_id_105, q_id_106, q_id_107, q_id_108, q_id_109, q_id_110, q_id_111,
                q_id_112, q_id_113, q_id_114, q_id_115,  q_id_116, [Before/After]
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
        // איפוס daily_question_index
        const userData = await pool.request()
            .input('form1Id', form1Id)
            .query('SELECT username FROM users WHERE form1Id = @form1Id');

        if (userData.recordset.length > 0) {
            const username = userData.recordset[0].username;
            await pool.request()
                .input('username', sql.NVarChar, username)
                .query(`
            UPDATE UserCreatureHistory 
            SET daily_question_index = 0
            WHERE username = @username
            AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
        `);
            console.log('✅ Reset daily_question_index for:', username);
        }

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

/* Image Generation & Midjourney Endpoints */

// Initializes a new image request, generates a UUID, and starts the AI process.
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

// Saves the user's choice (index 0-3) from the generated 2x2 Midjourney grid.
app.post('/api/save-selected-image', async (req, res) => {
    try {
        const { form1Id, selectedImageIndex } = req.body;

        // דילוג על שמירה ב-DB במצב דמו
        if (form1Id === 'demo') {
            console.log('🎭 Demo Mode: skipping save-selected-image DB update');
            return res.json({ success: true, demo: true });
        }

        const pool = await getDbConnection();
        await pool.request()
            .input('form1Id', form1Id)
            .input('selectedIndex', selectedImageIndex)
            .query(`
                UPDATE [form2-Boggart] 
                SET selected_image_index = @selectedIndex
                WHERE [Number_tested] = @form1Id
            `);

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving selected image:', error);
        res.status(500).json({ error: error.message });
    }
});

// Allows the frontend to poll for the status and URL of a specific image request.
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

// Proxy endpoints to bypass CORS issues when displaying external CDN images.
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

// Proxy endpoints to bypass CORS issues when displaying external CDN images.
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

// Retrieves the latest image status/URL for a specific Form1 ID.
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
                        FROM [form2-Boggart] 
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

/* Daily Avatar & Weather Management */

// Fetches today's processed avatar image for the user, if one exists.
app.get('/api/get-daily-character/:username', async (req, res) => {
    const { username } = req.params;
    let pool;
    try {
        pool = await getDbConnection();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT TOP 1 image_url, is_complete, sam_level, arousal_level, pain_level, energy_level
                FROM UserCreatureHistory 
                WHERE username = @username 
                AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
            `);

        if (result.recordset.length > 0) {
            const lastEntry = result.recordset[0];
            console.log(`✅ Found today's image for user: ${username}`);
            return res.json({
                success: true,
                imageUrl: lastEntry.image_url,
                isComplete: lastEntry.is_complete === true || lastEntry.is_complete === 1,
                samLevel: lastEntry.sam_level,
                arousalLevel: lastEntry.arousal_level,
                painLevel: lastEntry.pain_level,
                energyLevel: lastEntry.energy_level
            });
        }

        console.log(`ℹ️ No image found for today for user: ${username}`);
        res.json({ success: false });

    } catch (error) {
        console.error("❌ Database error in get-daily-character:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Returns the question index that SHOULD currently be displayed to the user.
app.get('/api/get-daily-question-index/:username', async (req, res) => {
    const pool = await getDbConnection();
    const TOTAL_QUESTIONS = 14;

    const userResult = await pool.request()
        .input('username', sql.NVarChar, req.params.username)
        .query('SELECT form1Id FROM users WHERE username = @username');

    const recentResult = await pool.request()
        .input('username', sql.NVarChar, req.params.username)
        .query(`
            SELECT TOP 2 daily_question_index, is_complete, created_at
            FROM UserCreatureHistory 
            WHERE username = @username 
            ORDER BY created_at DESC
        `);

    let index = 0;
    const rows = recentResult.recordset;

    if (rows.length === 0) {
        index = 0;
    } else if (rows.length === 1) {
        // Only one entry ever — use its stored index as-is
        const isComplete = rows[0].is_complete === true || rows[0].is_complete === 1;
        index = isComplete
            ? (rows[0].daily_question_index + 1) % TOTAL_QUESTIONS
            : (rows[0].daily_question_index ?? 0);
    } else {
        // Two or more entries: rows[0] is the latest (today), rows[1] is the previous one
        const latestIsComplete = rows[0].is_complete === true || rows[0].is_complete === 1;
        if (latestIsComplete) {
            // Today already finished — its stored index already points to the next question
            index = rows[0].daily_question_index ?? 0;
        } else {
            // Today not finished yet — base today's question on the previous completed entry
            index = ((rows[1].daily_question_index ?? -1) + 1) % TOTAL_QUESTIONS;
        }
    }

    res.json({
        index,
        form1Id: userResult.recordset[0]?.form1Id || null
    });
});

// Advanced workflow: Removes background, generates new SAM-based weather, and merges layers.
// עדכון מזג האוויר של האווטאר לפי מדד SAM (שליפה מה-DB, עיבוד תמונה והעלאה ל-Azure)
app.post('/api/update-avatar-weather', async (req, res) => {
    try {
        // פירוק הנתונים שהגיעו מגוף הבקשה 
        const {
            username,
            painLevel,
            samLevel,
            arousalLevel,
            energyLevel,
            feelingLevel,
            avatarDo,
            avatarNeed,
            avatarTells,
            dailyAnswer,
            isComplete
        } = req.body;

        const pool = await getDbConnection();

        // 1. שלב השליפה: קבלת קישור לתמונת המקור (הגריד) והאינדקס של היצור הנבחר מהדאטאבייס
        const userResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT b.image_url, b.selected_image_index 
                FROM [form2-Boggart] b 
                JOIN [users] u ON b.[Number_tested] = u.form1Id 
                WHERE u.username = @username
            `);

        const originalImage = userResult.recordset[0]?.image_url;
        const selectedIndex = userResult.recordset[0]?.selected_image_index || 0;

        // בדיקה אם קיימת תמונה למשתמש, אם לא - החזרת שגיאה 404
        if (!originalImage) return res.status(404).json({ message: "Creature not found" });

        // הגדרת גובה היצור (בפיקסלים) לפי רמת האנרגיה שהמשתמש דיווח
        const energySizes = { "1": 300, "2": 450, "3": 600, "4": 800, "5": 920 };
        const targetHeight = energySizes[energyLevel?.toString()] || 600;

        // בחירת תיאור הרקע המתאים מתוך אובייקט SAM_BACKGROUNDS לפי הציון שניתן
        const backgroundDesc = SAM_BACKGROUNDS[samLevel.toString()] || SAM_BACKGROUNDS["5"];

        // --- שלב 1: חיתוך הדמות הנכונה מהגריד (Grid) לפני שליחה ל-AI ---
        // הורדת תמונת הגריד המקורית והפיכתה ל-Buffer
        const bgResFetch = await axios.get(originalImage, { responseType: 'arraybuffer' });
        const originalBuf = Buffer.from(bgResFetch.data);
        const origMeta = await sharp(originalBuf).metadata();

        // חישוב מיקום החיתוך (רבע מהתמונה המקורית - Midjourney מייצר גריד של 2x2)
        const halfW = Math.floor(origMeta.width / 2);
        const halfH = Math.floor(origMeta.height / 2);
        const left = (selectedIndex % 2) * halfW;
        const top = Math.floor(selectedIndex / 2) * halfH;

        // ביצוע החיתוך בפועל כדי לקבל רק את היצור שנבחר
        const croppedForAI = await sharp(originalBuf)
            .extract({ left, top, width: halfW, height: halfH })
            .toBuffer();

        // --- שלב 2: הסרת רקע (Background Removal) באמצעות Replicate ---
        console.log("🚀 Step 1: Removing background...");
        const removeBgPred = await replicate.predictions.create({
            version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            input: { image: `data:image/png;base64,${croppedForAI.toString('base64')}` }
        });
        // המתנה לסיום התהליך וקבלת קישור לתמונה השקופה
        const transparentCharUrl = await waitForReplicate(removeBgPred);

        // השהיית המערכת ל-8 שניות כדי למנוע עומס על ה-API (Rate Limiting)
        console.log("⏳ Waiting for API cooldown...");
        await new Promise(resolve => setTimeout(resolve, 8000));

        // --- שלב 3: יצירת רקע חדש (Background Generation) לפי רמת ה-SAM ---
        console.log("🚀 Step 2: Generating new background...");
        const bgPred = await replicate.predictions.create({
            version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input: {
                prompt: `Cinematic wide shot: ${backgroundDesc}, depth of field, 8k quality`,
                negative_prompt: "character, person, face, text, blurry", // מניעת יצירת דמויות נוספות ברקע
                width: 1024, height: 1024
            }
        });
        const backgroundUrlRaw = await waitForReplicate(bgPred);
        const backgroundUrl = Array.isArray(backgroundUrlRaw) ? backgroundUrlRaw[0] : backgroundUrlRaw;

        // --- שלב 4: הרכבת התמונה הסופית ושילוב שכבות (Composition) ---
        console.log("🎨 Composing final image...");
        // הורדת שתי התמונות (הדמות השקופה והרקע החדש) במקביל
        const [subRes, bgRes] = await Promise.all([
            axios.get(transparentCharUrl, { responseType: 'arraybuffer' }),
            axios.get(backgroundUrl, { responseType: 'arraybuffer' })
        ]);

        const charBuf = Buffer.from(subRes.data);
        const bgBuf = Buffer.from(bgRes.data);

        // יצירת שכבת דמות שקופה בגודל 1024x1024 ומיקום הדמות עליה כדי למנוע חיתוך רגליים
        const charLayer = await sharp({
            create: {
                width: 1024, height: 1024, channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .composite([{
                input: await sharp(charBuf)
                    .ensureAlpha()
                    .trim({ threshold: 10 }) // הסרת שוליים שקופים מיותרים מסביב לדמות
                    .extend({
                        top: 20, bottom: 40, left: 20, right: 20, // הוספת שוליים לביטחון
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .resize({
                        height: targetHeight - 40, // שינוי גודל הדמות לפי רמת האנרגיה
                        width: 950,
                        fit: 'inside'
                    })
                    .toBuffer(),
                gravity: 'south' // הצמדת הדמות לחלק התחתון (על ה"קרקע")
            }])
            .png().toBuffer();

        // הדבקה סופית של שכבת הדמות על הרקע החדש שנוצר
        const finalImageBuffer = await sharp(bgBuf)
            .resize(1024, 1024)
            .composite([{ input: charLayer, top: 0, left: 0 }])
            .png().toBuffer();

        // --- שלב 5: העלאת התמונה המוכנה ל-Azure Storage ---
        const today = new Date().toISOString().split('T')[0]; // קבלת תאריך היום בפורמט YYYY-MM-DD
        const fileName = `${username}_${today}.png`;
        const azureUrl = await uploadImageFromUrl(`data:image/png;base64,${finalImageBuffer.toString('base64')}`, fileName);

        // עדכון index השאלה היומית רק כשמסיימים (isComplete = true)
        if (isComplete) {
            await pool.request()
                .input('username', sql.NVarChar, username)
                .query(`
                    UPDATE UserCreatureHistory 
                    SET daily_question_index = (daily_question_index + 1) % 14
                    WHERE username = @username
                `);
        }

        // --- שלב 6: שמירה או עדכון הנתונים בטבלת ההיסטוריה ב-SQL ---
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('url', sql.NVarChar, azureUrl)
            .input('pain', sql.Int, parseInt(painLevel))
            .input('sam', sql.Int, parseInt(samLevel))
            .input('arousal', sql.Int, parseInt(arousalLevel))
            .input('energy', sql.Int, parseInt(energyLevel))
            .input('feeling', sql.Int, parseInt(feelingLevel) || null)
            .input('do', sql.NVarChar, Array.isArray(avatarDo) ? avatarDo.join(', ') : (avatarDo || ""))
            .input('tells', sql.NVarChar, Array.isArray(avatarTells) ? avatarTells.join(', ') : (avatarTells || ""))
            .input('dailyAnswer', sql.NVarChar, dailyAnswer || "")
            .input('need', sql.NVarChar, avatarNeed || "")
            .input('today', sql.NVarChar, today)
            .input('isComplete', sql.Bit, isComplete)
            .query(`
               IF EXISTS (SELECT 1 FROM UserCreatureHistory WHERE username = @username AND CAST(created_at AS DATE) = @today)
                BEGIN
                    UPDATE UserCreatureHistory 
                    SET image_url = @url, pain_level = @pain, sam_level = @sam, arousal_level = @arousal, 
                        energy_level = @energy, feeling_level = @feeling, avatar_do = @do, avatar_need = @need,
                        avatar_tells = @tells, daily_answer = @dailyAnswer, is_complete = @isComplete,
                        created_at = GETDATE()
                    WHERE username = @username AND CAST(created_at AS DATE) = @today
                END
                ELSE
                BEGIN
                    INSERT INTO UserCreatureHistory 
                    (username, image_url, pain_level, sam_level, arousal_level, energy_level, 
                     feeling_level, avatar_do, avatar_need, avatar_tells, daily_answer, is_complete, created_at) 
                    VALUES (@username, @url, @pain, @sam, @arousal, @energy, 
                            @feeling, @do, @need, @tells, @dailyAnswer, @isComplete, GETDATE())
                END
            `);

        console.log(`✅ Success! Creature updated for ${username}`);
        // החזרת תשובה חיובית עם הקישור לתמונה החדשה ב-Azure
        res.json({ success: true, avatarUrl: azureUrl });

    } catch (error) {
        console.error("❌ Process Failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Fetches the most recent creature image from the previous day.
// Returns: { success: true, imageUrl: string } or { success: false }
app.get('/api/get-last-creature/:username', async (req, res) => {
    const pool = await getDbConnection();
    const result = await pool.request()
        .input('username', sql.NVarChar, req.params.username)
        .query(`
            SELECT TOP 1 image_url 
            FROM UserCreatureHistory 
            WHERE username = @username 
            AND CAST(created_at AS DATE) = CAST(DATEADD(day, -1, GETDATE()) AS DATE)
            ORDER BY created_at DESC
        `);

    if (result.recordset.length > 0) {
        res.json({ success: true, imageUrl: result.recordset[0].image_url });
    } else {
        res.json({ success: false });
    }
});

// Updates the post-avatar questionnaire fields (steps 4-8) without regenerating the image.
// Marks the daily entry as complete and advances the daily question index.
app.post('/api/update-avatar-data', async (req, res) => {
    const { username, feelingLevel, avatarDo, avatarNeed, avatarTells, dailyAnswer } = req.body;
    try {
        const pool = await getDbConnection();
        const today = new Date().toISOString().split('T')[0];
        const TOTAL_QUESTIONS = 14;

        const recentResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT TOP 2 daily_question_index, is_complete, created_at
                FROM UserCreatureHistory 
                WHERE username = @username 
                ORDER BY created_at DESC
            `);

        const rows = recentResult.recordset;
        let newIndex;

        if (rows.length === 0) {
            newIndex = 0;
        } else if (rows.length === 1) {
            const isComplete = rows[0].is_complete === true || rows[0].is_complete === 1;
            newIndex = isComplete
                ? (rows[0].daily_question_index + 1) % TOTAL_QUESTIONS
                : (rows[0].daily_question_index ?? 0);
        } else {
            const latestIsComplete = rows[0].is_complete === true || rows[0].is_complete === 1;
            if (latestIsComplete) {
                // Already completed earlier — keep the same index (don't advance twice)
                newIndex = rows[0].daily_question_index ?? 0;
            } else {
                // First completion today — advance from the previous completed entry
                newIndex = ((rows[1].daily_question_index ?? -1) + 1) % TOTAL_QUESTIONS;
            }
        }

        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('feeling', sql.Int, parseInt(feelingLevel) || null)
            .input('do', sql.NVarChar, Array.isArray(avatarDo) ? avatarDo.join(', ') : (avatarDo || ''))
            .input('need', sql.NVarChar, avatarNeed || '')
            .input('tells', sql.NVarChar, Array.isArray(avatarTells) ? avatarTells.join(', ') : (avatarTells || ''))
            .input('dailyAnswer', sql.NVarChar, dailyAnswer || '')
            .input('newIndex', sql.Int, newIndex)
            .input('today', sql.VarChar, today)
            .query(`
                UPDATE UserCreatureHistory 
                SET feeling_level = @feeling, avatar_do = @do, avatar_need = @need,
                    avatar_tells = @tells, daily_answer = @dailyAnswer, is_complete = 1,
                    daily_question_index = @newIndex
                WHERE username = @username AND CAST(created_at AS DATE) = @today
            `);

        console.log(`✅ Avatar data updated for ${username}, new index: ${newIndex}`);
        res.json({ success: true });

    } catch (error) {
        console.error("❌ update-avatar-data failed:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Retrieves historical creature data between dates for journals or charts
app.get('/api/creature-summary/:username', async (req, res) => {
    const { username } = req.params;
    const { startDate, endDate } = req.query;
    let pool;

    try {
        pool = await getDbConnection();
        const request = pool.request();
        request.input('username', sql.NVarChar, username);

        // שליפת כל השדות כדי שתוכלי להציג גם גרף וגם פירוט טקסטואלי
        let query = `
            SELECT 
                image_url, 
                created_at, 
                sam_level, 
                arousal_level, 
                pain_level,
                energy_level, 
                feeling_level,
                avatar_do,
                avatar_need,
                avatar_tells,
                daily_answer,
                daily_question_index 
            FROM UserCreatureHistory 
            WHERE username = @username`;

        // לוגיקת תאריכים חכמה:
        if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
            const sDate = new Date(startDate);
            const eDate = new Date(endDate);
            // הגדרת סוף היום ל-23:59 כדי לא לפספס עדכונים מהערב
            eDate.setHours(23, 59, 59, 999);

            if (!isNaN(sDate) && !isNaN(eDate)) {
                query += ` AND created_at BETWEEN @start AND @end`;
                request.input('start', sql.DateTime, sDate);
                request.input('end', sql.DateTime, eDate);
            }
        } else {
            // ברירת מחדל: אם לא נבחרו תאריכים, מציגים את 7 הימים האחרונים
            query += ` AND created_at >= DATEADD(day, -7, GETDATE())`;
        }

        // סידור לפי תאריך עולה (מומלץ עבור גרפים של התקדמות)
        query += ` ORDER BY created_at ASC`;

        const result = await request.query(query);

        console.log(`📊 Found ${result.recordset.length} records for ${username}`);
        res.json({ success: true, history: result.recordset });

    } catch (error) {
        console.error("❌ SQL Summary Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fetches the original Midjourney grid for a logged-in user.
app.get('/api/get-creature/:username', async (req, res) => {
    let pool;
    try {
        const { username } = req.params;
        pool = await getDbConnection();

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT b.image_url, b.selected_image_index 
                FROM [form2-Boggart] b
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

/* System, Auth & Debug Endpoints */

// Connectivity test for the Azure SQL server.
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = await getDbConnection();
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

// Basic server health check and status uptime.
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
    });
});

// Basic server health check and status uptime.
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

process.on('SIGINT', async () => {
    console.log('🔌 Closing Azure SQL connections...');
    await sql.close();
    process.exit(0);
});

// Validates user credentials and returns session/role info.
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
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
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

// Generates a prompt for testing purposes without DB or AI overhead.
app.post('/generate-prompt-demo', (req, res) => {
    try {
        const { answers, intensity } = req.body;
        const prompt = generatePainDescription(answers, intensity || 5);
        res.status(200).json({ prompt, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
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