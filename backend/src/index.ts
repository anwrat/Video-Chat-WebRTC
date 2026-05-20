import config from './config/dotenv.config.js';
import app from './app.js';
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';

const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin: '*',
    }
});

io.on('connection', (socket)=>{
    console.log(`Connected to socket ${socket.id}`)
});

server.listen(config.port,()=>{
    console.log(`Server is running on port ${config.port}`);
})