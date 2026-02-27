const { AccessToken } = require("livekit-server-sdk");

/**
 * Generate a token for a user to join a LiveKit room
 */
const getToken = async (req, res) => {
    try {
        const { room, username } = req.query;

        if (!room || !username) {
            return res.status(400).json({ error: "Missing room or username" });
        }

        const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
        const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

        if (!apiKey || !apiSecret) {
            return res.status(500).json({ error: "LiveKit credentials not configured" });
        }

        const at = new AccessToken(apiKey, apiSecret, {
            identity: username,
        });

        at.addGrant({
            roomJoin: true,
            room: room,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const token = await at.toJwt();
        res.json({ token });
    } catch (error) {
        console.error("Error generating LiveKit token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getToken,
};
