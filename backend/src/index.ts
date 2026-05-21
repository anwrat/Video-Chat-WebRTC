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

const usersinRooms: Record<string,string[]> = {};

io.on('connection', (socket)=>{
    console.log(`Connected to socket ${socket.id}`);
    socket.on('join-room', (roomId: string)=>{
        console.log(`Socket ${socket.id} joining room ${roomId}`)
        console.log(`Current users in room:`, usersinRooms[roomId])
        if(usersinRooms[roomId]){
            const existingUsers = usersinRooms[roomId];
            console.log(`Sending all-users to ${socket.id}:`, existingUsers) 
            socket.emit('all-users', existingUsers);
            usersinRooms[roomId].push(socket.id);
        }else{
            usersinRooms[roomId] = [socket.id];
        }
        socket.join(roomId);
        console.log(`Joined room ${roomId}`);
        socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('sending-signal',(payload)=>{
        io.to(payload.userToSignal).emit('offer',{signal: payload.signal, callerId: payload.callerId});
    });

    socket.on('returning-signal', (payload)=>{
        io.to(payload.callerId).emit('answer',{signal: payload.signal, id: socket.id})
    });

    socket.on('disconnect',()=>{
        for(const roomId in usersinRooms){
            usersinRooms[roomId] = usersinRooms[roomId]!.filter(id=> id!== socket.id);
            io.to(roomId).emit('user-disconnected', socket.id);
        }
    });
});

server.listen(config.port,()=>{
    console.log(`Server is running on port ${config.port}`);
})