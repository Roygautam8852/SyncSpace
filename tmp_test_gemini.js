const axios = require('axios');
require('dotenv').config({ path: './whiteboard-app/backend/.env' });

const apiKey = "AIzaSyCtaJQOgwRmQbp-adeBmeqtz49oSWZo-A0";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

async function test() {
    try {
        console.log("Testing Gemini API...");
        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: "Say hello" }]
            }]
        });
        console.log("Response status:", response.status);
        console.log("Response text:", response.data.candidates[0].content.parts[0].text);
    } catch (err) {
        console.error("Error status:", err.response?.status);
        console.error("Error data:", JSON.stringify(err.response?.data, null, 2));
    }
}

test();
