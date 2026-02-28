const express = require("express");
const router = express.Router();
const { generateImage, processAgentAction } = require("../controllers/aiController");
const verifyToken = require("../middleware/verifyToken");

// POST /api/ai/generate-image (DALL-E 3)
router.post("/generate-image", verifyToken, generateImage);

// POST /api/ai/agent-action (NEW: Hugging Face Agent)
router.post("/agent-action", verifyToken, processAgentAction);

module.exports = router;
