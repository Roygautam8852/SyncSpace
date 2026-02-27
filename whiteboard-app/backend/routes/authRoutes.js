const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile, googleLogin } = require("../controllers/authController");
const verifyToken = require("../middleware/verifyToken");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

// Protected routes
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

module.exports = router;
