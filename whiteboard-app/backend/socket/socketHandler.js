const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid");

// Track online users per room: Map<roomId, Map<socketId, userInfo>>
const roomUsers = new Map();
// Track typing users per room: Map<roomId, Set<socketId>>
const typingUsers = new Map();
// Track active calls per room: Map<roomId, Map<socketId, { username }>>
const activeCalls = new Map();
// Track who created/started each call: Map<roomId, socketId>
const callCreators = new Map();

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ─── JOIN ROOM ───
    socket.on("join-room", async ({ roomId, userId, userName }) => {
      // Leave any previous rooms this socket was in (prevents duplicates)
      const rooms = Array.from(socket.rooms);
      rooms.forEach((r) => {
        if (r !== socket.id && r !== roomId) {
          socket.leave(r);
          if (roomUsers.has(r)) {
            roomUsers.get(r).delete(socket.id);
            if (roomUsers.get(r).size === 0) roomUsers.delete(r);
          }
        }
      });

      socket.join(roomId);

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      roomUsers.get(roomId).set(socket.id, { userId, userName, socketId: socket.id });

      socket.to(roomId).emit("user-joined", {
        userId,
        userName,
        socketId: socket.id,
      });

      const onlineUsers = Array.from(roomUsers.get(roomId).values());
      io.to(roomId).emit("online-users", onlineUsers);

      // If there's an active call in this room, inform the new user
      if (activeCalls.has(roomId) && activeCalls.get(roomId).size > 0) {
        const callParticipants = Array.from(activeCalls.get(roomId).entries()).map(
          ([sid, info]) => ({ socketId: sid, username: info.username })
        );
        socket.emit("call:active", {
          active: true,
          participants: callParticipants,
        });
      }

      // Send existing canvas/chat state
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          if (room.pages && room.pages.length > 0) {
            const activePageId = room.activePageId || room.pages[0].pageId;
            const activePage = room.pages.find((p) => p.pageId === activePageId) || room.pages[0];
            socket.emit("canvas-state", {
              strokes: activePage.strokes || [],
              image: "",
              pageId: activePage.pageId,
              pages: room.pages.map((p) => ({ pageId: p.pageId, pageName: p.pageName })),
            });
          } else {
            const pageId = uuidv4().slice(0, 8);
            const newPage = {
              pageId,
              pageName: "Page 1",
              strokes: room.strokes || [],
              canvasData: room.canvasData || "",
            };
            room.pages = [newPage];
            room.activePageId = pageId;
            await room.save();

            socket.emit("canvas-state", {
              strokes: newPage.strokes,
              image: "",
              pageId,
              pages: [{ pageId, pageName: "Page 1" }],
            });
          }

          if (room.chatHistory && room.chatHistory.length > 0) {
            socket.emit("chat-history", room.chatHistory);
          }
        }
      } catch (err) {
        console.error("Error loading room data:", err);
      }

      console.log(`${userName} (socket: ${socket.id}) joined room: ${roomId}`);
    });

    // ─── DRAWING ───
    socket.on("drawing", ({ roomId, drawingData }) => {
      socket.to(roomId).emit("drawing", drawingData);
    });

    // ─── NEW STROKE ───
    socket.on("new-stroke", async ({ roomId, stroke, pageId }) => {
      socket.to(roomId).emit("new-stroke", stroke);
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          const targetPageId = pageId || room.activePageId;
          const page = room.pages.find((p) => p.pageId === targetPageId);
          if (page) {
            page.strokes.push(stroke);
            page.updatedAt = new Date();
            await room.save();
          }
        }
      } catch (err) {
        console.error("Error saving new stroke:", err);
      }
    });

    // ─── UPDATE BOARD STATE ───
    socket.on("update-board-state", async ({ roomId, strokes, pageId }) => {
      socket.to(roomId).emit("board-state-updated", strokes);
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          const targetPageId = pageId || room.activePageId;
          const page = room.pages.find((p) => p.pageId === targetPageId);
          if (page) {
            page.strokes = strokes;
            page.updatedAt = new Date();
            page.canvasData = "";
            await room.save();
          }
        }
      } catch (err) {
        console.error("Error updating board state:", err);
      }
    });

    // ─── SAVE CANVAS (legacy — no-op) ───
    socket.on("save-canvas", async () => { });

    // ─── CLEAR BOARD ───
    socket.on("clear-board", async ({ roomId, userId, pageId }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (room && room.host.toString() === userId) {
          const targetPageId = pageId || room.activePageId;
          const page = room.pages.find((p) => p.pageId === targetPageId);
          if (page) {
            page.strokes = [];
            page.canvasData = "";
            page.updatedAt = new Date();
            await room.save();
          }
          io.to(roomId).emit("board-cleared");
        } else {
          socket.emit("error-message", "Only the host can clear the board");
        }
      } catch (err) {
        console.error("Clear board error:", err);
      }
    });

    // ─── PAGE MANAGEMENT ───
    socket.on("save-board", async ({ roomId, pageId }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          const page = room.pages.find((p) => p.pageId === pageId);
          if (page) {
            page.updatedAt = new Date();
            await room.save();
          }
          socket.emit("board-saved", { pageId });
        }
      } catch (err) {
        console.error("Save board error:", err);
      }
    });

    socket.on("new-page", async ({ roomId, userId }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          const pageId = uuidv4().slice(0, 8);
          const pageName = `Page ${room.pages.length + 1}`;
          const newPage = { pageId, pageName, strokes: [], canvasData: "" };
          room.pages.push(newPage);
          room.activePageId = pageId;
          await room.save();
          io.to(roomId).emit("page-added", {
            pageId,
            pageName,
            pages: room.pages.map((p) => ({ pageId: p.pageId, pageName: p.pageName })),
          });
        }
      } catch (err) {
        console.error("New page error:", err);
      }
    });

    socket.on("switch-page", async ({ roomId, pageId }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          room.activePageId = pageId;
          await room.save();

          const page = room.pages.find((p) => p.pageId === pageId);
          if (page) {
            io.to(roomId).emit("page-switched", {
              pageId,
              strokes: page.strokes || [],
            });
          }
        }
      } catch (err) {
        console.error("Switch page error:", err);
      }
    });

    socket.on("delete-page", async ({ roomId, pageId, userId }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          if (room.pages.length <= 1) {
            return socket.emit("error-message", "Cannot delete the last page");
          }

          const pageIndex = room.pages.findIndex((p) => p.pageId === pageId);
          if (pageIndex !== -1) {
            room.pages.splice(pageIndex, 1);

            if (room.activePageId === pageId) {
              const newActivePageIndex = Math.max(0, pageIndex - 1);
              room.activePageId = room.pages[newActivePageIndex].pageId;
            }

            await room.save();

            const activePage = room.pages.find(p => p.pageId === room.activePageId);

            io.to(roomId).emit("page-deleted", {
              pageId,
              activePageId: room.activePageId,
              strokes: activePage.strokes || [],
              pages: room.pages.map((p) => ({ pageId: p.pageId, pageName: p.pageName })),
            });
          }
        }
      } catch (err) {
        console.error("Delete page error:", err);
      }
    });

    // ─── CHAT MESSAGE ───
    socket.on("chat-message", async ({ roomId, message, userId, userName }) => {
      const chatMsg = {
        sender: userId,
        senderName: userName,
        text: message,
        timestamp: new Date(),
      };

      try {
        await Room.findOneAndUpdate(
          { roomId },
          { $push: { chatHistory: chatMsg } }
        );
      } catch (err) {
        console.error("Save chat error:", err);
      }

      io.to(roomId).emit("chat-message", chatMsg);
    });

    // ─── TYPING INDICATOR ───
    socket.on("typing-start", ({ roomId, userName }) => {
      socket.to(roomId).emit("typing-start", { userName, socketId: socket.id });
    });

    socket.on("typing-stop", ({ roomId }) => {
      socket.to(roomId).emit("typing-stop", { socketId: socket.id });
    });

    // ─── FILE SHARED ───
    socket.on("file-shared", ({ roomId, file }) => {
      socket.to(roomId).emit("new-file", file);
    });

    // ─── UNDO / REDO ───
    socket.on("undo", ({ roomId, canvasState }) => {
      socket.to(roomId).emit("undo", canvasState);
    });

    socket.on("redo", ({ roomId, canvasState }) => {
      socket.to(roomId).emit("redo", canvasState);
    });

    // ─── SCREEN SHARING ───
    socket.on("screen-share-started", ({ roomId, userId, userName }) => {
      socket.to(roomId).emit("screen-share-started", { userId, userName });
    });

    socket.on("screen-share-stopped", ({ roomId }) => {
      socket.to(roomId).emit("screen-share-stopped");
    });

    // ═══════════════════════════════════════════════════════════
    //  MESH VIDEO CALL — Room-level group call (Zoom-like)
    // ═══════════════════════════════════════════════════════════

    // User joins the call
    socket.on("mesh:join", ({ roomId, username }) => {
      if (!activeCalls.has(roomId)) {
        activeCalls.set(roomId, new Map());
      }

      const callMap = activeCalls.get(roomId);
      const wasAlreadyInCall = callMap.has(socket.id);

      // Send existing call participants — ALWAYS filter out the requester's own socketId
      const existing = Array.from(callMap.entries())
        .filter(([sid]) => sid !== socket.id)
        .map(([sid, info]) => ({ socketId: sid, username: info.username }));
      socket.emit("mesh:existing-peers", { peers: existing });

      // Add/update the user in the active call map
      callMap.set(socket.id, { username });

      // If this is the first participant, they are the call creator
      if (!callCreators.has(roomId)) {
        callCreators.set(roomId, socket.id);
        console.log(`[Mesh] ${username} (${socket.id}) is the CREATOR of call in room ${roomId}`);
      }

      // Only notify others if this is a NEW join (not a re-join from the same socket)
      if (!wasAlreadyInCall) {
        socket.to(roomId).emit("mesh:new-peer", { socketId: socket.id, username });
      }

      broadcastCallStatus(io, roomId);
      console.log(`[Mesh] ${username} (${socket.id}) joined call in room ${roomId}. Total: ${callMap.size}`);
    });

    // WebRTC signaling: offer
    socket.on("mesh:offer", ({ roomId, to, offer }) => {
      const callInfo = activeCalls.get(roomId)?.get(socket.id);
      io.to(to).emit("mesh:offer", { from: socket.id, offer, username: callInfo?.username || "" });
    });

    // WebRTC signaling: answer
    socket.on("mesh:answer", ({ roomId, to, answer }) => {
      io.to(to).emit("mesh:answer", { from: socket.id, answer });
    });

    // WebRTC signaling: ICE candidate
    socket.on("mesh:candidate", ({ roomId, to, candidate }) => {
      io.to(to).emit("mesh:candidate", { from: socket.id, candidate });
    });

    // Media state broadcast (mic/cam toggles)
    socket.on("mesh:media-state", ({ roomId, mic, cam }) => {
      socket.to(roomId).emit("mesh:media-state", { from: socket.id, mic, cam });
    });

    // User leaves the call (but stays in the room)
    socket.on("mesh:leave", ({ roomId }) => {
      if (activeCalls.has(roomId)) {
        const isCreator = callCreators.get(roomId) === socket.id;

        if (isCreator) {
          // Creator is leaving → END the call for everyone
          console.log(`[Mesh] CREATOR (${socket.id}) left — ending call for all in room ${roomId}`);
          io.to(roomId).emit("mesh:call-ended", { reason: "creator-left" });

          // Clean up all call state
          activeCalls.delete(roomId);
          callCreators.delete(roomId);
        } else {
          // Regular participant leaving — just remove them
          activeCalls.get(roomId).delete(socket.id);
          socket.to(roomId).emit("mesh:peer-left", { socketId: socket.id });

          // If call is now empty, clean up
          if (activeCalls.get(roomId).size === 0) {
            activeCalls.delete(roomId);
            callCreators.delete(roomId);
          }
        }

        broadcastCallStatus(io, roomId);
        console.log(`[Mesh] ${socket.id} left call in room ${roomId}`);
      }
    });

    // ─── LEGACY P2P SIGNALING (keep for backward compat) ───
    socket.on("call:start", ({ roomId, userName }) => {
      socket.to(roomId).emit("call:ringing", { userName, from: socket.id });
    });
    socket.on("call:accept", ({ roomId, to }) => {
      io.to(to).emit("call:accepted", { from: socket.id });
    });
    socket.on("call:reject", ({ roomId, to }) => {
      io.to(to).emit("call:rejected", { from: socket.id });
    });
    socket.on("call:cancel", ({ roomId }) => {
      socket.to(roomId).emit("call:cancelled", { from: socket.id });
    });
    socket.on("call:offer", ({ roomId, to, offer }) => {
      io.to(to).emit("call:offer", { from: socket.id, offer });
    });
    socket.on("call:answer", ({ roomId, to, answer }) => {
      io.to(to).emit("call:answer", { from: socket.id, answer });
    });
    socket.on("call:candidate", ({ roomId, to, candidate }) => {
      io.to(to).emit("call:candidate", { from: socket.id, candidate });
    });
    socket.on("call:end", ({ roomId, to }) => {
      if (to) {
        io.to(to).emit("call:ended", { from: socket.id });
      } else {
        socket.to(roomId).emit("call:ended", { from: socket.id });
      }
    });

    // ─── CURSOR POSITION ───
    socket.on("cursor-move", ({ roomId, cursorData }) => {
      socket.to(roomId).emit("cursor-move", {
        ...cursorData,
        socketId: socket.id,
      });
    });

    // ─── ERASE ───
    socket.on("erase", ({ roomId, eraseData }) => {
      socket.to(roomId).emit("erase", eraseData);
    });

    // ─── DISCONNECT ───
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      // Clean up from roomUsers
      roomUsers.forEach((users, roomId) => {
        if (users.has(socket.id)) {
          const user = users.get(socket.id);
          users.delete(socket.id);

          io.to(roomId).emit("user-left", {
            userId: user.userId,
            userName: user.userName,
            socketId: socket.id,
          });

          const onlineUsers = Array.from(users.values());
          io.to(roomId).emit("online-users", onlineUsers);
          io.to(roomId).emit("typing-stop", { socketId: socket.id });

          if (users.size === 0) {
            roomUsers.delete(roomId);
          }
        }
      });

      // Clean up from activeCalls
      activeCalls.forEach((callMap, roomId) => {
        if (callMap.has(socket.id)) {
          const isCreator = callCreators.get(roomId) === socket.id;

          if (isCreator) {
            // Creator disconnected → end call for everyone
            console.log(`[Mesh] CREATOR (${socket.id}) disconnected — ending call for all in room ${roomId}`);
            io.to(roomId).emit("mesh:call-ended", { reason: "creator-disconnected" });
            activeCalls.delete(roomId);
            callCreators.delete(roomId);
          } else {
            callMap.delete(socket.id);
            io.to(roomId).emit("mesh:peer-left", { socketId: socket.id });

            if (callMap.size === 0) {
              activeCalls.delete(roomId);
              callCreators.delete(roomId);
            }
          }
          broadcastCallStatus(io, roomId);
        }
      });
    });

    // ─── LEAVE ROOM ───
    socket.on("leave-room", ({ roomId, userId, userName }) => {
      socket.leave(roomId);

      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);

        socket.to(roomId).emit("user-left", { userId, userName, socketId: socket.id });

        const onlineUsers = Array.from(roomUsers.get(roomId).values());
        io.to(roomId).emit("online-users", onlineUsers);

        if (roomUsers.get(roomId).size === 0) {
          roomUsers.delete(roomId);
        }
      }

      // Also leave the call if in one
      if (activeCalls.has(roomId) && activeCalls.get(roomId).has(socket.id)) {
        const isCreator = callCreators.get(roomId) === socket.id;

        if (isCreator) {
          console.log(`[Mesh] CREATOR (${socket.id}) left room — ending call for all in room ${roomId}`);
          io.to(roomId).emit("mesh:call-ended", { reason: "creator-left" });
          activeCalls.delete(roomId);
          callCreators.delete(roomId);
        } else {
          activeCalls.get(roomId).delete(socket.id);
          socket.to(roomId).emit("mesh:peer-left", { socketId: socket.id });
          if (activeCalls.get(roomId).size === 0) {
            activeCalls.delete(roomId);
            callCreators.delete(roomId);
          }
        }
        broadcastCallStatus(io, roomId);
      }
    });
  });
};

// Broadcast whether a call is active in the room (to all room members)
function broadcastCallStatus(io, roomId) {
  const callMap = activeCalls.get(roomId);
  if (callMap && callMap.size > 0) {
    const participants = Array.from(callMap.entries()).map(
      ([sid, info]) => ({ socketId: sid, username: info.username })
    );
    io.to(roomId).emit("call:active", { active: true, participants });
  } else {
    io.to(roomId).emit("call:active", { active: false, participants: [] });
  }
}

module.exports = setupSocket;
