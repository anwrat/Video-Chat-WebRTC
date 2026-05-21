import {io} from 'socket.io-client';
import {useRef, useEffect, useState} from 'react';
import Peer from 'simple-peer';
import {createPeer, addPeer} from './utils/peer';
import Video from './components/atoms/Video'; 

interface PeerRef{
  peerId: string;
  peer: Peer.Instance;
}

const baseURL = import.meta.env.VITE_BACKEND_URL;
const socket = io(baseURL);
console.log(Peer);

//Only one room for now
const ROOM_ID = "room-1";

function App() {
  const [peers, setPeers] = useState<PeerRef[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<PeerRef[]>([]);
  useEffect(()=>{
    const start = async() =>{
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if(videoRef.current){
        videoRef.current.srcObject = stream;
      }
      socket.emit('join-room',ROOM_ID);
      socket.on('all-users',(users)=>{
        console.log("Existing users: ",users);
        const newPeers: PeerRef[] = [];
        users.forEach((userId: string)=>{
          const peer = createPeer(socket, userId, socket.id!, stream);
          peersRef.current.push({peerId: userId, peer});
          newPeers.push({peerId: userId, peer});
        });
        setPeers(newPeers);
      });

      socket.on('user-joined',(userId)=>{
        console.log("New user joined: ",userId);
      });

      socket.on('offer', (payload)=>{
        const existingPeer = peersRef.current.find(
          (p) => p.peerId === payload.callerId
        );

        if (existingPeer) return;
        const peer = addPeer(socket, payload.signal, payload.callerId, stream);
        peersRef.current.push({peerId: payload.callerId, peer});
        setPeers((users)=>[...users, {peerId: payload.callerId, peer}])
      });

      socket.on('answer',(payload)=>{
        const item = peersRef.current.find((p) => p.peerId === payload.id);
        if(item){
          item.peer.signal(payload.signal);
        }
      });

      socket.on('user-disconnected', (userId)=>{
        const peerObj = peersRef.current.find((p) => p.peerId === userId);
        if(peerObj){
          peerObj.peer.destroy();
        }
        const updatedPeers = peersRef.current.filter((p) => p.peerId !== userId);
        peersRef.current = updatedPeers;
        setPeers(updatedPeers);
      });
    }
    start();
    return () =>{
      socket.off('all-users');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('user-disconnected');
    }
  },[]);

  return (
    <>
      <p>Room: {ROOM_ID}</p>
      {/* Local Video */}
      <p>Your Video</p>
      <video ref={videoRef} autoPlay playsInline muted className = 'w-3xl'/>
      <p>Other Participants</p>
      {peers.map((peerObj)=>(
        <Video key = {peerObj.peerId} peer={peerObj.peer}/>
      ))}
    </>
  )
}

export default App
