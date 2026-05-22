import SimplePeer from 'simple-peer/simplepeer.min.js';
import { type Socket } from 'socket.io-client';

export function createPeer(socket: Socket,userToSignal: string, callerId: string, stream: MediaStream){
    const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
        // config:{
        //     iceServers:[
        //         {
        //             urls: "stun:stun.l.google.com:19302",
        //         }
        //     ]
        // }
    });

    peer.on('signal', (signal)=>{
        socket.emit('sending-signal',{
            userToSignal,
            callerId,
            signal,
        });
    });
    return peer;
}

export function addPeer(socket: Socket, incomingSignal: SimplePeer.SignalData, callerId: string, stream: MediaStream){
    const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream,
        // config:{
        //     iceServers:[
        //         {
        //             urls: "stun:stun.l.google.com:19302",
        //         }
        //     ]
        // }
    });

    peer.on('signal', (signal)=>{
        socket.emit('returning-signal',{
            signal,
            callerId,
        });
    });
    // peer.signal(incomingSignal);
    return peer;
}