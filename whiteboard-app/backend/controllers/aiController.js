const axios = require("axios");
const { HfInference } = require("@huggingface/inference");
const OpenAI = require("openai");

const getHf = () => {
    if (!process.env.HUGGINGFACE_API_KEY) return null;
    return new HfInference(process.env.HUGGINGFACE_API_KEY);
};

const getOpenAI = () => {
    if (!process.env.OPENAI_API_KEY) return null;
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const GEMINI_MODELS = [
    "gemini-1.5-flash-latest",
    "gemini-flash-latest",
    "gemini-2.0-flash-lite",
];

// 12x12 Pixel Art Sprite logic has been removed as per user request.

exports.generateImage = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: "Prompt required" });

    const openai = getOpenAI();
    const hf = getHf();
    let imageUrl = null;
    let imageSource = null;
    let errorChain = [];

    // 1. Try OpenAI gpt-image-1 (Primary)
    if (openai) {
        try {
            console.log(`[AI] Step 1: Requesting gpt-image-1 for: ${prompt}`);
            const response = await openai.images.generate({
                model: "gpt-image-1",
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            });
            imageUrl = response.data[0].url || response.data[0].b64_json;
            imageSource = "GPT-IMAGE-1";

            if (imageUrl && imageUrl.startsWith('data:')) {
                return res.json({ success: true, imageUrl, source: imageSource });
            }
        } catch (err) {
            console.warn(`[AI] OpenAI failed: ${err.message}`);
            errorChain.push(`OpenAI: ${err.message}`);
        }
    }

    // 2. Try Hugging Face SDXL (Secondary - High Quality HD Fallback)
    if (!imageUrl && hf) {
        try {
            console.log(`[AI] Step 2: Requesting Hugging Face SDXL for: ${prompt}`);
            // Stable Diffusion XL is very reliable for HD images
            const result = await hf.textToImage({
                model: "stabilityai/stable-diffusion-xl-base-1.0",
                inputs: prompt,
                parameters: { negative_prompt: "blurry, low quality, distorted" }
            });

            // Convert binary blob to base64 directly
            const buffer = Buffer.from(await result.arrayBuffer());
            imageUrl = `data:image/png;base64,${buffer.toString("base64")}`;
            imageSource = "Rescue Engine (HF)";
            console.log(`DEBUG: Image generated via HF SDXL!`);
            return res.json({ success: true, imageUrl, source: imageSource });
        } catch (err) {
            console.warn(`[AI] HF SDXL failed: ${err.message}`);
            errorChain.push(`HF: ${err.message}`);
        }
    }

    // 3. Last Resort: Pollinations (Tries to fetch internally first)
    if (!imageUrl) {
        try {
            console.log(`[AI] Step 3: Requesting Pollinations for: ${prompt}`);
            const encodedPrompt = encodeURIComponent(prompt.trim());
            imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
            imageSource = "Rescue Engine (Lite)";
        } catch (err) {
            errorChain.push(`Pollinations: ${err.message}`);
        }
    }

    // FINAL STEP: Process URL to Base64 (Mostly for Pollinations)
    try {
        if (!imageUrl) throw new Error("All image generators failed");

        console.log(`[AI] Finalizing image data from ${imageSource}...`);
        const imageRes = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            },
            timeout: 12000
        });

        const base64 = Buffer.from(imageRes.data, 'binary').toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;

        console.log(`DEBUG: SUCCESS via ${imageSource}!`);
        return res.json({
            success: true,
            imageUrl: dataUrl,
            source: imageSource,
            note: errorChain.length > 0 ? errorChain.join(" | ") : null
        });
    } catch (finalErr) {
        console.error("Critical Image Failure:", finalErr.message);

        // Final Bridge
        if (imageUrl && !imageUrl.startsWith('data:')) {
            return res.json({
                success: true,
                imageUrl: imageUrl,
                source: imageSource,
                warning: "Sent via direct bridge"
            });
        }
        return res.status(500).json({ error: "Image processing failed", details: errorChain.join(" -> ") });
    }
};

exports.processAgentAction = async (req, res) => {
    const { message, context } = req.body;

    const openai = getOpenAI();
    if (openai) {
        try {
            console.log(`[Chat] Trying OpenAI (GPT-4o-mini)...`);
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are the AI Assistant for SyncSpace (a real-time collaborative whiteboard). Help users with brainstorming and organizing their ideas. Context: " + (context || "General") },
                    { role: "user", content: message }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            });

            return res.json({
                success: true,
                reply: completion.choices[0].message.content,
                agent: "GPT-4o-mini"
            });
        } catch (err) {
            console.error("OpenAI Chat Error:", err.message);
        }
    }

    const hf = getHf();
    if (!hf) return res.status(500).json({ error: "No AI service available (Keys missing)" });

    try {
        const response = await hf.chatCompletion({
            model: "meta-llama/Llama-3.1-8B-Instruct",
            messages: [
                { role: "system", content: "You are the AI Assistant for SyncSpace. Context: " + (context || "General") },
                { role: "user", content: message }
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

        res.json({ success: true, reply: response.choices[0].message.content, agent: "Llama-3.1" });
    } catch (error) {
        res.status(500).json({ error: "Agent Error", details: error.message });
    }
};
