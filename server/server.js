import express from "express"
import "dotenv/config"
import cors from "cors"
import http from "http"
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
// app.use(cors({
//   origin: "http://localhost:5173",
//   credentials: true
// }));

const app = express();
const server = http.createServer(app)

// Initialize socket.io server
// export const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     credentials: true
//   }
// });

export const io = new Server( server, {    // Passes server into the Server constructor so that Socket.IO can attach itself to the same HTTP server,
                                          // allowing both HTTP (REST APIs) and WebSocket (real-time) to use the same port.
    cors: {origin: "*"}
})

// Store online users
export const userSocketMap ={}; // { userId: socketId }

//Socket.io connection handler
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));  // Sends from server to client

    socket.on("disconnect", ()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
        
    })
})

// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());


//Routes Setup
app.use("/api/status", (req,res)=> res.send("Server is live"));
app.use("/api/auth",userRouter);
app.use("/api/messages", messageRouter)

//connect top MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log("Server is running on PORT "
    + PORT));