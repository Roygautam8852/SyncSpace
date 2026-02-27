const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const fileSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

const pageSchema = new mongoose.Schema({
  pageId: { type: String, required: true },
  pageName: { type: String, default: "Page 1" },
  strokes: { type: Array, default: [] },
  canvasData: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        role: { type: String, enum: ["host", "participant"], default: "participant" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    // Legacy fields kept for backward compatibility
    canvasData: {
      type: String,
      default: "",
    },
    strokes: {
      type: Array,
      default: [],
    },
    // Multi-page support
    pages: [pageSchema],
    activePageId: {
      type: String,
      default: "",
    },
    chatHistory: [messageSchema],
    sharedFiles: [fileSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    maxParticipants: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
