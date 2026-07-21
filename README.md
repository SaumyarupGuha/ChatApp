# Chat Application

A real-time full-stack chat application built with the MERN stack, Socket.io, and Google Gemini AI.

## Tech Stack

**Frontend:** React.js, Tailwind CSS, Socket.io-client, Axios, React Router  
**Backend:** Node.js, Express.js, Socket.io, MongoDB, Mongoose  
**Services:** Cloudinary (media uploads), Google Gemini API (AI features), JWT (authentication)

---

## Features

### Messaging
- Real-time instant messaging using Socket.io
- Image sharing via Cloudinary
- Persistent chat history stored in MongoDB
- Unseen message count per conversation
- Online presence indicator (green dot)

### Chat Requests & Safety
- First message to a new user is sent as a **chat request**
- Receiver can **accept** or **block** the request
- Full **block/unblock** functionality — blocked users cannot send messages
- Blocked-by detection — UI shows when you've been blocked

### Authentication
- JWT-based authentication with token stored in localStorage
- Protected routes via middleware on all private endpoints
- Signup, login, logout with profile picture, bio, and username support

### AI Features (Google Gemini)
- **AI Reply Suggestions** — suggests a reply based on last 10 messages with 4 tone modes: Friendly, Professional, Funny, Romantic
- **Regenerate** button to get a new suggestion
- **AI Auto-Reply Bot** — opt-in feature; when you're offline, Gemini automatically replies on your behalf after 2 minutes using conversation context. Replies are labeled 🤖 Auto-reply

### Scheduled Messages
- Schedule any message to be delivered at a future date and time
- Sender sees scheduled messages immediately with ⏳ label
- Receiver only sees the message after the scheduled time via Socket.io
- Backend scheduler checks every 10 seconds for due messages

### Profile
- Update name, username, bio, and profile picture
- Toggle AI Auto-Reply on/off from profile settings

---

## Project Structure

```
chat-app/
├── client/                   # React frontend
│   ├── context/
│   │   ├── AuthContext.jsx   # Auth state, socket connection, login/logout
│   │   └── ChatContext.jsx   # Messages, users, socket listeners
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatContainer.jsx   # Main chat UI, input, AI suggest, schedule
│   │   │   ├── Sidebar.jsx         # User list, search, unseen counts
│   │   │   └── RightSidebar.jsx    # Selected user info
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Main layout
│   │   │   ├── LoginPage.jsx       # Login & signup
│   │   │   └── ProfilePage.jsx     # Profile update + auto-reply toggle
│   │   └── lib/
│   │       └── utils.js            # Time formatting helpers
│   └── public/
│
└── server/                   # Node.js backend
    ├── controllers/
    │   ├── messageController.js    # Send, get, schedule, auto-reply logic
    │   ├── userController.js       # Auth, profile, toggle auto-reply
    │   └── aiController.js         # Gemini suggest endpoint
    ├── models/
    │   ├── User.js                 # User schema
    │   └── Message.js              # Message schema
    ├── routes/
    │   ├── userRoutes.js
    │   ├── messageRoutes.js
    │   └── aiRoutes.js
    ├── middleware/
    │   └── auth.js                 # JWT protectRoute middleware
    ├── lib/
    │   ├── db.js                   # MongoDB connection
    │   ├── cloudinary.js           # Cloudinary config
    │   ├── gemini.js               # Gemini model init
    │   └── utils.js                # JWT token generator
    └── server.js                   # Express + Socket.io + scheduler setup
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account
- Google Gemini API key

### Installation

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd chat-app
```

**2. Setup the server**
```bash
cd server
npm install
```

Create a `.env` file in the `server/` folder:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
```

**3. Setup the client**
```bash
cd ../client
npm install
```

Create a `.env` file in the `client/` folder:
```
VITE_BACKEND_URL=http://localhost:5000
```

### Running Locally

**Start the server:**
```bash
cd server
npm run server
```

**Start the client:**
```bash
cd client
npm run dev
```

Client runs on `http://localhost:5173`  
Server runs on `http://localhost:5000`

---

## API Routes

### Auth (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Login user |
| GET | `/check` | Verify JWT and return user |
| PUT | `/update-profile` | Update name, bio, username, profile pic |
| PUT | `/toggle-auto-reply` | Toggle AI auto-reply on/off |

### Messages (`/api/messages`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/users` | Get sidebar users with unseen counts |
| GET | `/:id` | Get messages with a specific user |
| POST | `/send/:id` | Send a message |
| POST | `/schedule/:id` | Schedule a message |
| GET | `/scheduled` | Get pending scheduled messages |
| PUT | `/mark/:id` | Mark message as seen |
| PUT | `/accept/:id` | Accept a chat request |
| PUT | `/block/:id` | Block a user |
| PUT | `/unblock/:id` | Unblock a user |

### AI (`/api/ai`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/suggest` | Get Gemini reply suggestion |

---

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | Client → Server | User connects, registers in userSocketMap |
| `disconnect` | Client → Server | User disconnects, removed from userSocketMap |
| `getOnlineUsers` | Server → All Clients | Broadcasts updated online user list |
| `newMessage` | Server → Client | Delivers a new message in real-time |

---

## Deployment

The app is configured for deployment on **Vercel** (client) and any Node.js host (server).

- `client/vercel.json` handles SPA routing redirects
- Server uses `node server.js` as the start command
