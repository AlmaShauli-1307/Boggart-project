require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors()); // Enables CORS to allow requests from the frontend
app.use(bodyParser.json()); // Parses JSON data from requests

// Route to receive questionnaire responses
app.post('/submit', (req, res) => {
    try {
        const answers = req.body.answers;
        console.log('📩 Received answers:', answers);

        // Here, you can store the answers in a database
        // For now, we'll just send a success response
        res.status(200).json({ message: 'Answers received successfully!' });
    } catch (error) {
        console.error('❌ Error handling answers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
