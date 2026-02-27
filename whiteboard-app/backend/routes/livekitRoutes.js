const express = require("express");
const router = express.Router();
const { getToken } = require("../controllers/livekitController");

// Token generation route
router.get("/token", getToken);

module.exports = router;
