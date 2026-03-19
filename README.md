# Syncspace - Real-Time Collaborative Whiteboard Application

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-green.svg)
![React](https://img.shields.io/badge/React-18.2.0-blue.svg)

A professional **MERN stack** (MongoDB, Express.js, React.js, Node.js) application designed for seamless real-time collaboration. CollabBoard enables teams to work together on digital whiteboards with live chat, file sharing, screen sharing, and AI-powered drawing assistance.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Installation](#️-installation-instructions)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [WebSocket Events](#-websocket-events)
- [Key Components](#-key-components)
- [Features in Detail](#-features-in-detail)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Features

### Core Features
- **JWT Authentication:** Secure Register/Login system with email validation
- **Google OAuth Integration:** One-click login with Google accounts
- **Real-Time Whiteboard:** Live collaborative drawing using Socket.io
  - Pencil tool for precision drawing
  - Eraser tool for cleanup
  - Clear canvas functionality
  - Multi-user concurrent drawing support
  
### Drawing & Tools
- **Tool Customization:** 
  - Adjustable brush sizes (fine to thick strokes)
  - Full color picker with hex support
  - Real-time color preview
- **Undo/Redo:** Seamless undo and redo for drawing strokes
- **Canvas Persistence:** Auto-save canvas data to database
- **Export Board:** Download whiteboard sessions as PNG images
- **Multiple Pages:** Create and switch between multiple whiteboard pages within a room

### Collaboration Features
- **Room Management:** 
  - Create unique rooms with custom names
  - Generate shareable room IDs
  - Join existing rooms
  - Manage room participants
- **Live Chat:** 
  - Real-time messaging within rooms
  - Message history stored in database
  - User identifiers for each message
- **File Sharing:** 
  - Securely share files with room participants
  - Multer integration for file upload
  - File download links for participants
  - File metadata tracking (size, timestamp, sender)
- **Screen Sharing:** 
  - Share screen content with all participants
  - WebRTC integration for reliable screen sharing
  - Video feed alongside whiteboard
- **Video Conferencing:** 
  - LiveKit integration for HD video calls
  - Multiple participant support
  - WebRTC fallback for video sharing

### Advanced Features
- **AI Image Generation:** 
  - DALL-E 3 integration for AI-powered image generation
  - Generate images based on text prompts
  - Insert generated images directly into whiteboard
- **AI Agent Actions:** 
  - Hugging Face Agent integration
  - Automated AI-powered drawing suggestions
- **Role-Based Permissions:** 
  - Host and participant roles
  - Only room hosts can clear the board for everyone
  - Host can manage participant access
- **Presence Tracking:** 
  - Real-time online user list per room
  - User join/leave notifications
  - Typing indicators for chat

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React.js** (v18.2.0) | UI framework and component-based architecture |
| **React Router DOM** (v6.21.1) | Client-side routing and navigation |
| **Socket.io-client** (v4.7.2) | Real-time bidirectional communication |
| **Axios** (v1.6.2) | HTTP client for API requests |
| **TailwindCSS** (v3.4.19) | Utility-first CSS framework for styling |
| **React Hot Toast** (v2.4.1) | Toast notifications for user feedback |
| **Lucide React** | Icon library for UI components |
| **LiveKit Client** (v2.17.2) | HD video conferencing |
| **@livekit/components-react** (v2.9.20) | Pre-built LiveKit UI components |
| **@react-oauth/google** (v0.13.4) | Google OAuth authentication |
| **PostgreSQL** | Database for video session info |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** (v4.18.2) | Web server and API framework |
| **Socket.io** (v4.7.2) | Real-time communication server |
| **MongoDB** (v8.0.3) | NoSQL database with Mongoose ODM |
| **Mongoose** (v8.0.3) | MongoDB object modeling |
| **JWT** (jsonwebtoken v9.0.2) | Token-based authentication |
| **bcryptjs** (v2.4.3) | Password hashing and encryption |
| **Multer** (v1.4.5) | File upload middleware |
| **CORS** (v2.8.5) | Cross-Origin Resource Sharing |
| **Axios** (v1.13.5) | HTTP client for API calls |
| **OpenAI** (v6.25.0) | DALL-E 3 image generation |
| **@huggingface/inference** (v4.13.13) | Hugging Face AI models |
| **livekit-server-sdk** (v2.15.0) | LiveKit server-side integration |
| **google-auth-library** (v10.6.1) | Google authentication verification |
| **UUID** (v13.0.0) | Unique identifier generation |
| **Nodemon** (dev) | Auto-restart server during development |

---

## 🏗️ Architecture Overview

### System Architecture Flow

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT SIDE (React)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Components  │  │   Pages      │  │  Context API │  │
│  │              │  │              │  │ (Auth/Socket)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│            │              │                    │         │
└────────────┼──────────────┼────────────────────┼─────────┘
             │              │                    │
      ┌──────┴──────────────┴────────────────────┴──────┐
      │        Socket.io + REST API (Axios)             │
      └──────┬──────────────┬────────────────────┬───────┘
             │              │                    │
┌────────────┼──────────────┼────────────────────┼────────────┐
│                    SERVER SIDE (Node.js/Express)          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │   Routes    │  │ Controllers  │  │  Socket.io     │   │
│  │  (API)      │  │  (Business   │  │  (Real-time)   │   │
│  │             │  │   Logic)     │  │                │   │
│  └─────────────┘  └──────────────┘  └────────────────┘   │
│            │              │                    │          │
│  ┌─────────┴──────────────┴────────────────────┴──────┐   │
│  │           Middleware (Auth, Upload)                │   │
│  └──────────────────────────────────────────────────┘   │
│            │                                            │
│  ┌─────────┴────────────────────────────────────┐     │
│  │         Models (Mongoose Schemas)            │     │
│  │  - User  - Room  - Messages  - Files         │     │
│  └──────────────────────────────────────────────┘     │
└──────────┬──────────────────────────────────┬──────────┘
           │                                  │
      ┌────┴──────┐                    ┌─────┴────────┐
      │ MongoDB   │                    │ LiveKit      │
      │ Database  │                    │ Server       │
      └───────────┘                    └──────────────┘
```

### Data Flow

1. **User Authentication:** Register/Login → JWT Token → Stored in Context → Sent with API requests
2. **Room Operations:** Create/Join room → Emit socket event → Update participants → Broadcast updates
3. **Real-time Drawing:** Canvas changes → Emit socket event → Broadcast to all users → Store in DB
4. **File Sharing:** Upload file → Multer processes → Store locally → Share URL with participants
5. **Video Conferencing:** Generate token → Connect to LiveKit → Stream video/audio

---

## 📁 Project Structure

```text
whiteboard-app/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection configuration
│   │
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic (register, login, OAuth)
│   │   ├── roomController.js        # Room management logic
│   │   ├── livekitController.js     # Video conference token generation
│   │   └── aiController.js          # AI features (image generation, agent)
│   │
│   ├── middleware/
│   │   └── verifyToken.js           # JWT token verification middleware
│   │
│   ├── models/
│   │   ├── User.js                  # User schema (name, email, password)
│   │   └── Room.js                  # Room schema (participants, messages, files, pages)
│   │
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth endpoints
│   │   ├── roomRoutes.js            # /api/rooms endpoints
│   │   ├── livekitRoutes.js         # /api/livekit endpoints
│   │   └── aiRoutes.js              # /api/ai endpoints
│   │
│   ├── socket/
│   │   └── socketHandler.js         # Socket.io event handlers for real-time features
│   │
│   ├── uploads/                     # Directory for uploaded files
│   │
│   ├── server.js                    # Express server setup and initialization
│   └── package.json                 # Backend dependencies
│
├── frontend/
│   ├── public/
│   │   └── index.html               # Main HTML file
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Toolbar.js           # Drawing tools (pencil, eraser, colors)
│   │   │   ├── StylingPanel.js      # Brush size and color customization
│   │   │   ├── Chat.js              # Live chat component
│   │   │   ├── AiDrawingModal.js    # AI image generation modal
│   │   │   └── video/
│   │   │       ├── LiveKitMeeting.js       # LiveKit video integration
│   │   │       ├── MeetingConference.js    # Conference layout
│   │   │       ├── ParticipantTile.js      # Individual participant video
│   │   │       ├── VideoControls.js        # Video call controls
│   │   │       └── WebRTCMeeting.js        # WebRTC fallback implementation
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.js       # Authentication state (user, token)
│   │   │   └── SocketContext.js     # Socket.io connection state
│   │   │
│   │   ├── pages/
│   │   │   ├── LandingPage.js       # Landing/home page
│   │   │   ├── Login.js             # Login page
│   │   │   ├── Register.js          # User registration page
│   │   │   ├── Dashboard.js         # User dashboard with rooms list
│   │   │   ├── Profile.js           # User profile management
│   │   │   └── WhiteboardRoom.js    # Main whiteboard application
│   │   │
│   │   ├── services/
│   │   │   └── api.js               # Axios API service with all endpoints
│   │   │
│   │   ├── App.js                   # Root component with routing
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Global styles
│   │
│   ├── package.json                 # Frontend dependencies
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   └── postcss.config.js            # PostCSS configuration
│
└── README.md                        # This file
```

---

## ⚙️ Installation Instructions

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v6.0.0 or higher) - Comes with Node.js
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas (cloud)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd whiteboard-app
```

### Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in backend directory:
```bash
touch .env
```

4. Add environment variables (see [Environment Variables](#-environment-variables) section below)

5. Verify MongoDB is running:
```bash
# If using local MongoDB
mongod

# Or verify MongoDB Atlas connection string is correct
```

### Step 3: Frontend Setup

1. Navigate to frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in frontend directory:
```bash
touch .env
```

4. Add environment variables (see [Environment Variables](#-environment-variables) section below)

---

## 🔐 Environment Variables

### Backend Environment Variables (`.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/whiteboard
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whiteboard

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI (for DALL-E 3 image generation)
OPENAI_API_KEY=sk-your_openai_api_key

# Hugging Face (for AI Agent)
HUGGINGFACE_API_KEY=hf_your_huggingface_api_key

# LiveKit (for video conferencing)
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=ws://your_livekit_server:7880

# File Upload
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=uploads
```

### Frontend Environment Variables (`.env`)

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Environment
REACT_APP_ENV=development
```

### How to Get API Keys

**Google OAuth:**
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs
6. Copy Client ID and Secret

**OpenAI API Key:**
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or login
3. Go to API keys section
4. Create new API key
5. Copy and save securely

**Hugging Face API Key:**
1. Visit [Hugging Face](https://huggingface.co/)
2. Create an account
3. Go to settings → Access Tokens
4. Create new token
5. Copy and save

**LiveKit:**
1. Visit [LiveKit Cloud](https://cloud.livekit.io/)
2. Create account
3. Create a new project
4. Get API Key, Secret, and Server URL
5. Copy and save

---

## 🚀 Running the Application

### Development Mode

#### Terminal 1 - Start Backend Server

```bash
cd backend
npm install  # If not already done
npm start    # or npm run dev (with nodemon auto-reload)
```

Expected output:
```
Server running on port 5000
Socket.io ready for connections
```

#### Terminal 2 - Start Frontend Development Server

```bash
cd frontend
npm install  # If not already done
npm start
```

Expected output:
```
Compiled successfully!
You can now view whiteboard-frontend in the browser.
  Local:            http://localhost:3000
```

#### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### Production Build

#### Build Frontend

```bash
cd frontend
npm run build
```

This creates an optimized build in `frontend/build/`

#### Deploy Backend

```bash
cd backend
# Ensure NODE_ENV=production in .env
npm start
```

The backend will automatically serve the frontend build when `NODE_ENV=production`.

---

## 📡 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": ""
  }
}
```

#### POST `/api/auth/login`
Login with email and password

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": ""
  }
}
```

#### POST `/api/auth/google`
Google OAuth login

**Request:**
```json
{
  "googleToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEy..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "email": "jane@gmail.com",
    "googleId": "1234567890",
    "avatar": "https://..."
  }
}
```

#### GET `/api/auth/profile`
Get current user profile (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### PUT `/api/auth/profile`
Update user profile (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "John Smith",
  "avatar": "https://..."
}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Smith",
  "email": "john@example.com",
  "avatar": "https://...",
  "updatedAt": "2024-01-20T14:22:00.000Z"
}
```

---

### Room Endpoints

#### POST `/api/rooms/create`
Create a new whiteboard room (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "roomName": "Project Design Discussion"
}
```

**Response (201):**
```json
{
  "_id": "507f2a88bcf86cd799439020",
  "roomId": "ROOM_abc123xyz",
  "roomName": "Project Design Discussion",
  "host": "507f1f77bcf86cd799439011",
  "participants": [
    {
      "user": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "role": "host"
    }
  ],
  "messages": [],
  "files": [],
  "pages": [
    {
      "pageId": "page_1",
      "pageName": "Page 1",
      "strokes": [],
      "canvasData": ""
    }
  ],
  "createdAt": "2024-01-20T10:00:00.000Z"
}
```

#### POST `/api/rooms/join`
Join an existing room (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "roomId": "ROOM_abc123xyz"
}
```

**Response (200):**
```json
{
  "_id": "507f2a88bcf86cd799439020",
  "roomId": "ROOM_abc123xyz",
  "roomName": "Project Design Discussion",
  "host": {
    "_id": "507f1f77bcf86cd799439010",
    "name": "Alice Johnson"
  },
  "participants": [
    {
      "user": "507f1f77bcf86cd799439010",
      "name": "Alice Johnson",
      "role": "host"
    },
    {
      "user": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "role": "participant"
    }
  ],
  "messages": [...],
  "files": [...],
  "pages": [...]
}
```

#### GET `/api/rooms`
Get all rooms for current user (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "507f2a88bcf86cd799439020",
    "roomId": "ROOM_abc123xyz",
    "roomName": "Project Design Discussion",
    "participants": [...]
  },
  {
    "_id": "507f2a88bcf86cd799439021",
    "roomId": "ROOM_def456uvw",
    "roomName": "Team Meeting",
    "participants": [...]
  }
]
```

#### GET `/api/rooms/:roomId`
Get specific room details (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "507f2a88bcf86cd799439020",
  "roomId": "ROOM_abc123xyz",
  "roomName": "Project Design Discussion",
  "host": {...},
  "participants": [...],
  "messages": [...],
  "files": [...],
  "pages": [...]
}
```

#### PUT `/api/rooms/:roomId/canvas`
Save canvas data (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "pageId": "page_1",
  "strokes": [...],
  "canvasData": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Response (200):**
```json
{
  "message": "Canvas saved successfully",
  "room": {...}
}
```

#### POST `/api/rooms/:roomId/upload`
Upload file to room (Protected)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Binary file data

**Response (201):**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "_id": "507f3b99bcf86cd799439030",
    "sender": "507f1f77bcf86cd799439011",
    "senderName": "John Doe",
    "fileName": "design.pdf",
    "fileUrl": "/uploads/1705752000000-design.pdf",
    "fileSize": 2048576,
    "timestamp": "2024-01-20T10:00:00.000Z"
  }
}
```

#### POST `/api/rooms/:roomId/leave`
Leave a room (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Left room successfully"
}
```

#### DELETE `/api/rooms/:roomId`
Delete a room (Only host can delete) (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Room deleted successfully"
}
```

---

### AI Endpoints

#### POST `/api/ai/generate-image`
Generate image using DALL-E 3 (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "prompt": "A serene landscape with mountains and a lake at sunset"
}
```

**Response (200):**
```json
{
  "imageUrl": "https://cdn.openai.com/API/...",
  "altText": "A serene landscape with mountains and a lake at sunset"
}
```

#### POST `/api/ai/agent-action`
Process AI agent action using Hugging Face (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "action": "drawing_suggestion",
  "context": "draw a tree"
}
```

**Response (200):**
```json
{
  "suggestion": "I suggest drawing a tree with a brown trunk and green foliage",
  "actionData": {...}
}
```

---

### LiveKit Endpoints

#### POST `/api/livekit/token`
Generate LiveKit token for video conference (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "roomName": "ROOM_abc123xyz",
  "userName": "John Doe"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 💾 Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (hashed, required if not Google user),
  googleId: String (optional, for Google OAuth users),
  avatar: String (optional, profile picture URL),
  createdAt: Date,
  updatedAt: Date
}
```

### Room Model

```javascript
{
  _id: ObjectId,
  roomId: String (required, unique),
  roomName: String (required),
  host: ObjectId (ref: User),
  participants: [
    {
      user: ObjectId (ref: User),
      name: String,
      role: String (enum: ['host', 'participant']),
      joinedAt: Date
    }
  ],
  messages: [
    {
      sender: ObjectId (ref: User),
      senderName: String,
      text: String,
      timestamp: Date
    }
  ],
  files: [
    {
      sender: ObjectId (ref: User),
      senderName: String,
      fileName: String,
      fileUrl: String,
      fileSize: Number,
      timestamp: Date
    }
  ],
  pages: [
    {
      pageId: String (unique within room),
      pageName: String,
      strokes: Array,
      canvasData: String (base64 encoded image),
      createdAt: Date,
      updatedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 WebSocket Events

WebSocket events enable real-time communication between clients and server via Socket.io.

### Client → Server Events (emit)

#### Room Events

```javascript
// Join a whiteboard room
socket.emit('join-room', {
  roomId: 'ROOM_abc123xyz',
  userId: '507f1f77bcf86cd799439011',
  userName: 'John Doe'
});

// Leave a room
socket.emit('leave-room', {
  roomId: 'ROOM_abc123xyz'
});
```

#### Drawing Events

```javascript
// Send drawing stroke
socket.emit('draw', {
  roomId: 'ROOM_abc123xyz',
  pageId: 'page_1',
  stroke: {
    x0: 100,
    y0: 150,
    x1: 110,
    y1: 160,
    color: '#FF5733',
    size: 5,
    isEraser: false
  }
});

// Clear canvas
socket.emit('clear-canvas', {
  roomId: 'ROOM_abc123xyz',
  pageId: 'page_1',
  clearedBy: 'John Doe'
});

// Undo stroke
socket.emit('undo-stroke', {
  roomId: 'ROOM_abc123xyz',
  pageId: 'page_1'
});

// Redo stroke
socket.emit('redo-stroke', {
  roomId: 'ROOM_abc123xyz',
  pageId: 'page_1'
});
```

#### Chat Events

```javascript
// Send message
socket.emit('send-message', {
  roomId: 'ROOM_abc123xyz',
  text: 'Hello everyone!',
  senderName: 'John Doe'
});

// Typing indicator
socket.emit('typing', {
  roomId: 'ROOM_abc123xyz',
  userName: 'John Doe'
});

// Stop typing
socket.emit('stop-typing', {
  roomId: 'ROOM_abc123xyz'
});
```

#### Video Call Events

```javascript
// Initiate call
socket.emit('initiate-call', {
  roomId: 'ROOM_abc123xyz',
  initiator: {
    userId: '507f1f77bcf86cd799439011',
    userName: 'John Doe'
  }
});

// Answer call
socket.emit('answer-call', {
  roomId: 'ROOM_abc123xyz',
  answerer: {
    userId: '507f1f77bcf86cd799439012',
    userName: 'Jane Smith'
  }
});

// End call
socket.emit('end-call', {
  roomId: 'ROOM_abc123xyz',
  endedBy: 'John Doe'
});

// Send ICE candidate
socket.emit('ice-candidate', {
  roomId: 'ROOM_abc123xyz',
  to: 'userId',
  candidate: {...}
});

// Send SDP offer
socket.emit('send-offer', {
  roomId: 'ROOM_abc123xyz',
  to: 'userId',
  offer: {...}
});

// Send SDP answer
socket.emit('send-answer', {
  roomId: 'ROOM_abc123xyz',
  to: 'userId',
  answer: {...}
});
```

#### Screen Sharing Events

```javascript
// Start screen share
socket.emit('start-screen-share', {
  roomId: 'ROOM_abc123xyz',
  userName: 'John Doe'
});

// Stop screen share
socket.emit('stop-screen-share', {
  roomId: 'ROOM_abc123xyz',
  userName: 'John Doe'
});

// Stream screen frame
socket.emit('screen-frame', {
  roomId: 'ROOM_abc123xyz',
  frame: 'data:image/png;base64,...',
  timestamp: Date.now()
});
```

### Server → Client Events (listen/on)

#### Room Events

```javascript
// User joined the room
socket.on('user-joined', ({
  userId,
  userName,
  socketId
}) => {
  // Add user to online list
});

// User left the room
socket.on('user-left', ({
  userId,
  userName
}) => {
  // Remove user from online list
});

// Online users list
socket.on('online-users', (users) => {
  // Update online users: Array of {userId, userName, socketId}
});
```

#### Drawing Events

```javascript
// Receive drawing stroke
socket.on('draw', (stroke) => {
  // Draw the stroke on canvas
});

// Canvas cleared
socket.on('canvas-cleared', ({
  pageId,
  clearedBy
}) => {
  // Clear canvas and show notification
});

// Stroke undone
socket.on('stroke-undone', ({
  pageId
}) => {
  // Remove last stroke
});

// Stroke redone
socket.on('stroke-redone', ({
  pageId,
  stroke
}) => {
  // Add back the stroke
});
```

#### Chat Events

```javascript
// Receive message
socket.on('receive-message', ({
  senderName,
  text,
  timestamp,
  senderId
}) => {
  // Display message in chat
});

// User typing
socket.on('user-typing', ({
  userName
}) => {
  // Show typing indicator
});

// User stopped typing
socket.on('user-stopped-typing', ({
  userName
}) => {
  // Hide typing indicator
});
```

#### Video Call Events

```javascript
// Incoming call
socket.on('incoming-call', ({
  initiator,
  roomId
}) => {
  // Show call notification
});

// Call answered
socket.on('call-answered', ({
  answerer,
  roomId
}) => {
  // Start video stream
});

// Call ended
socket.on('call-ended', ({
  endedBy,
  reason
}) => {
  // Stop video stream and show notification
});

// ICE candidate
socket.on('ice-candidate', ({
  candidate,
  from
}) => {
  // Add ICE candidate to peer connection
});

// Receive offer
socket.on('receive-offer', ({
  offer,
  from
}) => {
  // Set remote description
});

// Receive answer
socket.on('receive-answer', ({
  answer,
  from
}) => {
  // Set remote description
});
```

#### Screen Sharing Events

```javascript
// Screen share started
socket.on('screen-share-started', ({
  userName
}) => {
  // Show screen share container
});

// Screen share stopped
socket.on('screen-share-stopped', ({
  userName
}) => {
  // Hide screen share
});

// Screen frame received
socket.on('screen-frame', ({
  frame,
  userName
}) => {
  // Display screen frame
});
```

---

## 🎨 Key Components

### Frontend Components

#### WhiteboardRoom.js
**Purpose:** Main whiteboard application container
**Features:**
- Canvas rendering for drawing
- Toolbar integration
- Chat sidebar
- Video sidebar
- Real-time sync with Socket.io
- Page management (create, switch pages)

**Props:** None (uses Context)

**State:**
- Canvas reference
- Drawing mode
- Current page
- Online users
- Messages

#### Toolbar.js
**Purpose:** Drawing tools interface
**Features:**
- Pencil tool selection
- Eraser tool selection
- Color picker
- Clear canvas button
- Undo/Redo buttons
- Download as PNG

**Props:**
- `onDraw`: Callback for draw events
- `onClear`: Callback for clear events
- `onUndo`: Callback for undo events
- `onRedo`: Callback for redo events

#### StylingPanel.js
**Purpose:** Brush customization
**Features:**
- Brush size slider (1-50px)
- Color picker with hex input
- Color preview
- Real-time preview on canvas

**Props:**
- `onColorChange`: Callback for color changes
- `onSizeChange`: Callback for size changes

#### Chat.js
**Purpose:** Real-time chat interface
**Features:**
- Message display
- Message input
- Typing indicators
- User avatars
- Timestamp display
- Scroll to latest
- Message history

**Props:**
- `roomId`: Current room ID
- `messages`: Array of messages

#### AiDrawingModal.js
**Purpose:** AI image generation interface
**Features:**
- Text prompt input
- Generate button
- Image preview
- Insert to canvas button
- Loading states

**Props:**
- `onInsert`: Callback to insert image to canvas

#### LiveKitMeeting.js
**Purpose:** Video conference integration
**Features:**
- HD video streaming
- Multiple participants
- Audio control
- Video control
- Screen sharing
- Connection quality indicators

**Props:**
- `token`: LiveKit access token
- `roomName`: Video room name

#### WebRTCMeeting.js
**Purpose:** WebRTC video fallback
**Features:**
- Peer-to-peer video
- Audio streaming
- Simple interface
- Fallback when LiveKit unavailable

**Props:**
- `roomId`: Room ID for signaling

---

## 🔧 Features in Detail

### Real-Time Collaborative Drawing

The whiteboard uses Canvas API for drawing and Socket.io for real-time synchronization:

1. **Drawing Pipeline:**
   - User draws on HTML5 Canvas
   - Stroke data captured (coordinates, color, size)
   - Emitted via Socket.io to server
   - Server broadcasts to all room participants
   - All clients render same stroke

2. **Undo/Redo:**
   - Strokes stored in memory stack
   - Undo removes last stroke and re-renders canvas
   - Redo restores removed strokes
   - Changes broadcast to other users

3. **Persistence:**
   - Canvas data converted to base64 image
   - Saved to Database when user leaves or manually saves
   - Can be restored when room reopened

### File Sharing

1. **Upload Process:**
   - User selects file via input
   - Sent to backend via Multer
   - Stored in `uploads/` directory
   - File metadata saved to database
   - Download link shared with all room participants

2. **File Access:**
   - Static file serving via Express
   - Participants click link to download
   - File history maintained in room

### Video Conferencing (LiveKit)

1. **Token Generation:**
   - Backend generates JWT token using LiveKit SDK
   - Token includes user identity and room name
   - Token sent to frontend

2. **Connection Flow:**
   - Frontend receives token
   - Connects to LiveKit server
   - Establishes WebRTC connection
   - Streams audio/video to room

3. **Features:**
   - HD video quality
   - Auto-adaptive bitrate
   - Multiple participants
   - Built-in screen sharing
   - Recording capability

### AI Image Generation

1. **DALL-E Integration:**
   - User enters text prompt
   - Backend sends to OpenAI API
   - Receives generated image URL
   - Frontend displays preview
   - User can insert to canvas

2. **Custom Drawing Suggestions:**
   - Uses Hugging Face Agent
   - Analyzes current canvas
   - Suggests improvements or completions
   - User can accept/reject suggestions

---

## 📊 Database Details

### Indexes for Performance

```javascript
// User model
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ googleId: 1 }, { sparse: true });

// Room model
db.rooms.createIndex({ roomId: 1 }, { unique: true });
db.rooms.createIndex({ host: 1 });
db.rooms.createIndex({ 'participants.user': 1 });
db.rooms.createIndex({ createdAt: -1 });
```

### Backup & Recovery

**MongoDB Backup:**
```bash
mongodump --uri "mongodb://localhost:27017/whiteboard" --out ./backup

# Restore
mongorestore --uri "mongodb://localhost:27017/whiteboard" ./backup
```

---

## 🚀 Performance Optimization

### Frontend
- React code splitting and lazy loading
- TailwindCSS for optimized CSS
- Image optimization for generated images
- Canvas rendering optimization (requestAnimationFrame)
- Socket.io connection pooling

### Backend
- MongoDB indexing for frequent queries
- Connection pooling for database
- Compression middleware for API responses
- File size limits for uploads
- JWT token caching

### Network
- Socket.io binary data compression
- Base64 image optimization
- Lazy loading of components
- Progressive image loading

---

## 📱 Browser Support

- **Chrome** (latest 2 versions)
- **Firefox** (latest 2 versions)
- **Safari** (latest 2 versions)
- **Edge** (latest 2 versions)

**Note:** WebRTC and Canvas require modern browser support.

---

## 🤝 Contributing

### How to Contribute

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards

- Use consistent naming conventions
- Add comments for complex logic
- Test features before submitting
- Follow existing code structure
- Update README for new features

---

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Verify MongoDB is running: `mongod`
2. Check `MONGODB_URI` in `.env`
3. For MongoDB Atlas, verify IP whitelist includes your IP
4. Check network connectivity

#### Socket.io Connection Error
```
Error: WebSocket connection to failed
```

**Solution:**
1. Verify backend is running on correct port
2. Check `REACT_APP_SOCKET_URL` in frontend `.env`
3. Ensure CORS is enabled in backend
4. Check firewall settings

#### Google OAuth Not Working
```
Error: Invalid Client ID or Redirect URI mismatch
```

**Solution:**
1. Verify Google Client ID in `.env`
2. Add `localhost:3000` to Authorized redirect URIs
3. Ensure `@react-oauth/google` is properly installed
4. Hard refresh browser cache

#### File Upload Fails
```
Error: File too large or upload directory not found
```

**Solution:**
1. Check `uploads/` directory exists in backend
2. Verify `MAX_FILE_SIZE` limit in `.env`
3. Check disk space available
4. Verify Multer configuration

#### LiveKit Video Not Working
```
Error: Failed to connect to signal server
```

**Solution:**
1. Verify LiveKit server is running
2. Check `LIVEKIT_URL` in `.env`
3. Verify API keys are correct
4. Check network connectivity to LiveKit server
5. Ensure firewall allows WebSocket connections

#### Blank Canvas or Not Drawing
```
Canvas not responding to drawing
```

**Solution:**
1. Check browser console for JavaScript errors
2. Verify Socket.io is connected (check DevTools)
3. Ensure `<canvas>` element has proper size
4. Clear browser cache and refresh

#### JWT Token Expired
```
Error: Token expired or invalid
```

**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Login again to get new token
3. Check `JWT_EXPIRE` setting in backend `.env`
4. Verify `JWT_SECRET` is same in `.env`

---

## 📞 Support

For issues and questions:
- Check existing GitHub Issues
- Review documentation above
- Check browser console for errors
- Verify all environment variables are set
- Check backend server logs

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👥 Authors & Contributors

- **Project Lead:** [Your Team Name]
- **Frontend Developer:** [Name]
- **Backend Developer:** [Name]
- **DevOps & Infrastructure:** [Name]

---

## 🗺️ Future Enhancements

- [ ] Dark mode support
- [ ] Offline mode with sync
- [ ] Real-time collaboration cursors
- [ ] Shape tools (rectangle, circle, line)
- [ ] Text tool for annotations
- [ ] Drawing templates and starters
- [ ] Advanced permission system
- [ ] Room access logging
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] WebGL canvas for better performance
- [ ] Collaborative video whiteboarding
- [ ] Advanced AI features (object detection, style transfer)
- [ ] Integration with other tools (Slack, Teams, etc.)

---

## 📝 Changelog

### Version 1.0.0 (Current)
- Initial release
- Core whiteboard functionality
- Real-time collaboration
- JWT authentication
- Google OAuth support
- File sharing
- Live chat
- Video conferencing with LiveKit
- AI image generation
- Role-based access control

---

## ⚠️ Security Notes

1. **Environment Variables:** Never commit `.env` files to repository
2. **API Keys:** Rotate API keys regularly
3. **Passwords:** Passwords are hashed with bcrypt (12 rounds)
4. **JWT:** Use strong secret key (min 32 characters)
5. **HTTPS:** Use HTTPS in production
6. **File Uploads:** Validate file types and sizes
7. **CORS:** Configure CORS for your domain only
8. **Rate Limiting:** Consider adding rate limiting for APIs
9. **Input Validation:** All inputs validated on backend
10. **SQL Injection:** MongoDB prevents injection attacks

---

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [LiveKit Documentation](https://docs.livekit.io/)
- [OpenAI API Reference](https://platform.openai.com/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

---

**Last Updated:** January 20, 2024
**Project Status:** Active Development
- Node.js (v14+)
- MongoDB (Local or Atlas)

### Backend Setup
1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file with the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   CLIENT_URL=http://localhost:3000
   ```
4. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```
4. Start the app: `npm start`

## 🎨 UI Preview
- **Dashboard:** Modern room management layout.
- **Whiteboard:** Premium dark theme with intuitive toolbar on the left and chat/files on the right.

## 📝 License
This project is part of the Capstone Assessment for Real-Time Collaborative Whiteboard.
