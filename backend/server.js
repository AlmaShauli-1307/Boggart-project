require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors()); // Enables CORS to allow requests from the frontend
app.use(bodyParser.json()); // Parses JSON data from requests
// הוסף בקובץ server.js

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

// עדכון האנדפוינט הקיים של /submit
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

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
