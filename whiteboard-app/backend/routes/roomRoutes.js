const express = require("express");
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getRoom,
  getUserRooms,
  saveCanvas,
  leaveRoom,
  uploadFile,
  deleteRoom,
} = require("../controllers/roomController");
const verifyToken = require("../middleware/verifyToken");
const multer = require("multer");
const path = require("path");

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// All routes are protected
router.use(verifyToken);

router.post("/create", createRoom);
router.post("/join", joinRoom);
router.get("/", getUserRooms);
router.get("/:roomId", getRoom);
router.put("/:roomId/canvas", saveCanvas);
router.post("/:roomId/leave", leaveRoom);
router.post("/:roomId/upload", upload.single("file"), uploadFile);
router.delete("/:roomId", deleteRoom);

module.exports = router;
