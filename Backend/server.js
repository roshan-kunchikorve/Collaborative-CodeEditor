import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import {YSocketIO} from 'y-socket.io/dist/server';

import path from "path";
import { fileURLToPath } from "url";

const app = express();

//Resolve the Backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Serve frontend build files from Backend/public
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

//Create HTTP server
const httpServer = createServer(app); 

// Create Socket.IO server
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

//Initialize Yjs Socket.IO server
const ysocketio = new YSocketIO(io)
ysocketio.initialize()

// app.get("/", (req, res) => {
//     res.status(200).json({
//         message: "Hello World!",
//         success: true
//     })
// })

app.get('/health', (req, res) => {
    res.status(200).json({
        message: "ok",
        success: true
    })
})


httpServer.listen(3000, () => {
    console.log("Server is running on port 3000")
})

