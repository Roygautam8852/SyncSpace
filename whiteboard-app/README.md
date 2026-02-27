# CollabBoard - Real-Time Collaborative Whiteboard

A professional MERN stack application designed for real-time collaboration. This project feature a shared whiteboard, live chat, file sharing, and screen sharing capabilities.

## 🚀 Features

- **JWT Authentication:** Secure Register/Login system.
- **Real-Time Whiteboard:** Collaborative drawing using Socket.io (Pencil, Eraser, Clear).
- **Tool Customization:** Adjustable brush size and color picker.
- **Undo/Redo:** Undo and redo drawing strokes seamlessly.
- **Room Management:** Create or join rooms using unique Room IDs.
- **Live Chat:** Real-time messaging with room-based chat history.
- **File Sharing:** Securely share files with room participants using Multer.
- **Screen Sharing:** Share your screen live within the whiteboard room.
- **Export Board:** Download your whiteboard session as a PNG image.
- **Role-Based Permissions:** Only room hosts can clear the board for everyone.

## 🛠️ Technology Stack

- **Frontend:** React.js, React Router, Socket.io-client, Axios, CSS3 (Modern Glossmorphism).
- **Backend:** Node.js, Express.js, MongoDB (Mongoose).
- **Real-Time:** Socket.io.
- **File Storage:** Multer (Local storage implementation).

## 📁 Project Structure

```text
whiteboard-app/
├── backend/
│   ├── config/         # DB Connection
│   ├── controllers/    # Auth and Room logic
│   ├── middleware/     # Auth and Upload middleware
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   ├── socket/         # Socket.io event handlers
│   ├── uploads/        # Shared files directory
│   └── server.js       # Entry point
└── frontend/
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── context/    # Auth and Socket state
    │   ├── pages/      # Main application pages
    │   ├── services/   # API service calls
    │   └── App.js      # Root routing
    └── public/         # Static assets
```

## ⚙️ Setup Instructions

### Prerequisites
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
