const axios = require("axios");

const apiKey = "AIzaSyCtaJQOgwRmQbp-adeBmeqtz49oSWZo-A0";

async function listModels() {
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log("Available Models:");
        response.data.models.forEach(m => {
            console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(", ")})`);
        });
    } catch (err) {
        console.error("Error listing models:", err.response?.data || err.message);
    }
}

listModels();
