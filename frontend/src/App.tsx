import {io} from 'socket.io-client';
import {useRef, useEffect, useState} from 'react';
import SimplePeer from 'simple-peer/simplepeer.min.js';
import {createPeer, addPeer} from './utils/peer';
import Video from './components/atoms/Video'; 

interface PeerRef{
  peerId: string;
  peer: SimplePeer.Instance;
}

const baseURL = import.meta.env.VITE_BACKEND_URL;
const socket = io(baseURL);
console.log(SimplePeer);

//Only one room for now
const ROOM_ID = "room-1";

function App() {
  const [peers, setPeers] = useState<PeerRef[]>([]);
  const [audioState, setAudioState] = useState(true);
  const [videoState, setVideoState] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<PeerRef[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(()=>{
    const start = async() =>{
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
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
        const existingPeerList = users.map((userId: string)=>{
          peerId: userId
        })
        console.log("Peers: ", existingPeerList);
      });

      socket.on('user-joined', (userId: string) => {
        console.log('User joined: ', userId);
        // const existingPeer = peersRef.current.find(p=>p.peerId === userId);
        // if(existingPeer) return;
        // const peer = createPeer(socket, userId, socket.id!, stream);
        // const newPeerObj = {peerId: userId, peer};
        // peersRef.current.push(newPeerObj);
        // setPeers((prevUsers) => [...prevUsers, newPeerObj]);
      });

      socket.on('offer', (payload)=>{
        console.log("Received offer from: ", payload.callerId);
        const existingPeer = peersRef.current.find(
          (p) => p.peerId === payload.callerId
        );

        if (existingPeer) return;
        const peer = addPeer(socket, payload.signal, payload.callerId, stream);
        const newPeerObj = {peerId: payload.callerId, peer};
        peersRef.current.push(newPeerObj);
        setPeers((prevUsers)=>{
          if(prevUsers.some(p=>p.peerId === payload.callerId)){
            return prevUsers;
          }
          return [...prevUsers, newPeerObj];
        });
        setTimeout(()=>{
          peer.signal(payload.signal);
        }, 50);
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
      if(localStreamRef.current){
        localStreamRef.current.getTracks().forEach((track)=>{
          track.stop();
        });
        localStreamRef.current = null;
      }
    }
  },[]);

  const toggleAudio = () =>{
    if(localStreamRef.current){
      localStreamRef.current.getAudioTracks().forEach((track)=>{
        track.enabled = !track.enabled;
        setAudioState(track.enabled);
      })
    }
  }

  const toggleVideo = () =>{
    if(localStreamRef.current){
      localStreamRef.current.getVideoTracks().forEach((track)=>{
        track.enabled = !track.enabled;
        setVideoState(track.enabled);
      })
    }
  }

  return (
    <>
      <p>Room: {ROOM_ID}</p>
      {/* Local Video */}
      <p>Your Video</p>
      <video ref={videoRef} autoPlay playsInline className = 'w-3xl'/>
      <p onClick={toggleAudio}>{audioState? "Mute": "Unmute"}</p>
      <p onClick={toggleVideo}>{videoState? "Video Off": "Video On"}</p>
      <p>Other Participants</p>
      {peers.map((peerObj)=>(
        <Video key = {peerObj.peerId} peer={peerObj.peer}/>
      ))}
    </>
  )
}

export default App
