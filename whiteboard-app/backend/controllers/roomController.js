const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid");


// @desc    Create a new room
// @route   POST /api/rooms/create
// @access  Private
const createRoom = async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({ message: "Room name is required" });
    }

    const roomId = uuidv4().slice(0, 8).toUpperCase();

    // Create first page
    const firstPageId = uuidv4().slice(0, 8);
    const room = await Room.create({
      roomId,
      roomName,
      host: req.user._id,
      participants: [
        {
          user: req.user._id,
          name: req.user.name,
          role: "host",
        },
      ],
      pages: [
        {
          pageId: firstPageId,
          pageName: "Page 1",
          strokes: [],
          canvasData: "",
        },
      ],
      activePageId: firstPageId,
    });

    res.status(201).json({
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error("Create Room Error:", error);
    res.status(500).json({ message: "Server error creating room" });
  }
};

// @desc    Join an existing room
// @route   POST /api/rooms/join
// @access  Private
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const room = await Room.findOne({ roomId, isActive: true });

    if (!room) {
      return res.status(404).json({ message: "Room not found or inactive" });
    }

    // Check if user is already in the room
    const alreadyJoined = room.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.json({ message: "Already in the room", room });
    }

    // Check max participants
    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ message: "Room is full" });
    }

    // Add participant
    room.participants.push({
      user: req.user._id,
      name: req.user.name,
      role: "participant",
    });

    await room.save();

    res.json({ message: "Joined room successfully", room });
  } catch (error) {
    console.error("Join Room Error:", error);
    res.status(500).json({ message: "Server error joining room" });
  }
};

// @desc    Get room details
// @route   GET /api/rooms/:roomId
// @access  Private
const getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).populate(
      "participants.user",
      "name email avatar"
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ room });
  } catch (error) {
    console.error("Get Room Error:", error);
    res.status(500).json({ message: "Server error fetching room" });
  }
};

// @desc    Get all rooms for the user
// @route   GET /api/rooms
// @access  Private
const getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      "participants.user": req.user._id,
      isActive: true,
    }).sort({ updatedAt: -1 });

    res.json({ rooms });
  } catch (error) {
    console.error("Get User Rooms Error:", error);
    res.status(500).json({ message: "Server error fetching rooms" });
  }
};

// @desc    Save canvas data
// @route   PUT /api/rooms/:roomId/canvas
// @access  Private
const saveCanvas = async (req, res) => {
  try {
    const { canvasData, strokes, pageId } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (pageId && room.pages) {
      const page = room.pages.find((p) => p.pageId === pageId);
      if (page) {
        if (strokes) page.strokes = strokes;
        if (canvasData) page.canvasData = canvasData;
        page.updatedAt = new Date();
      }
    } else {
      // Legacy fallback
      room.canvasData = canvasData;
      if (strokes) room.strokes = strokes;
    }
    await room.save();

    res.json({ message: "Canvas saved successfully" });
  } catch (error) {
    console.error("Save Canvas Error:", error);
    res.status(500).json({ message: "Server error saving canvas" });
  }
};

// @desc    Leave room
// @route   POST /api/rooms/:roomId/leave
// @access  Private
const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Remove participant
    room.participants = room.participants.filter(
      (p) => p.user.toString() !== req.user._id.toString()
    );

    // If host leaves and no participants, deactivate room
    if (room.host.toString() === req.user._id.toString()) {
      if (room.participants.length > 0) {
        // Transfer host role
        room.host = room.participants[0].user;
        room.participants[0].role = "host";
      } else {
        room.isActive = false;
      }
    }

    await room.save();

    res.json({ message: "Left room successfully" });
  } catch (error) {
    console.error("Leave Room Error:", error);
    res.status(500).json({ message: "Server error leaving room" });
  }
};

// @desc    Upload file to room
// @route   POST /api/rooms/:roomId/upload
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const fileData = {
      sender: req.user._id,
      senderName: req.user.name,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
    };

    room.sharedFiles.push(fileData);
    await room.save();

    res.status(201).json({
      message: "File uploaded successfully",
      file: fileData,
    });
  } catch (error) {
    console.error("Upload File Error:", error);
    res.status(500).json({ message: "Server error uploading file" });
  }
};

// @desc    Delete a room (host only)
// @route   DELETE /api/rooms/:roomId
// @access  Private
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Only host can delete
    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the host can delete this board" });
    }

    await Room.findOneAndDelete({ roomId: req.params.roomId });

    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Delete Room Error:", error);
    res.status(500).json({ message: "Server error deleting room" });
  }
};

module.exports = { createRoom, joinRoom, getRoom, getUserRooms, saveCanvas, leaveRoom, uploadFile, deleteRoom };
