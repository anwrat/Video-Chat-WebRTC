import {io} from 'socket.io-client';
import {useRef, useEffect, useState} from 'react';
import SimplePeer from 'simple-peer/simplepeer.min.js';
import {createPeer, addPeer} from '../../utils/peer';
import Video from '../../components/atoms/Video'; 
import {Mic, MicOff, VideoIcon, VideoOff, PhoneOff} from 'lucide-react';
import Button from '../../components/atoms/Button';
import {useNavigate} from 'react-router';

interface PeerRef{
  peerId: string;
  peer: SimplePeer.Instance;
}

const baseURL = import.meta.env.VITE_BACKEND_URL;
const socket = io(baseURL);
console.log(SimplePeer);

//Only one room for now
const ROOM_ID = "room-1";

export default function VideoRoom() {
  let navigate = useNavigate();
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
    <div className="min-h-screen bg-gray-950 flex flex-col p-4 gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-white">Room: {ROOM_ID}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-black/60 rounded-md px-2 py-1 flex items-center gap-1">
                    <Mic className="w-3 h-3 text-white" />
                    <span className="text-xs text-white font-medium">You</span>
                </div>
            </div>

            {peers.map((peerObj) => (
                <div key={peerObj.peerId} className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
                    <Video peer={peerObj.peer} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/60 rounded-md px-2 py-1">
                        <span className="text-xs text-white font-medium">Participant</span>
                    </div>
                </div>
            ))}

        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 py-2">
            <Button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition
                    ${audioState
                        ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                        : 'bg-red-600 border-red-500 text-white hover:bg-red-500'
                    }`}
                aria-label={audioState ? 'Mute' : 'Unmute'}
            >
                {audioState ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition
                    ${videoState
                        ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                        : 'bg-red-600 border-red-500 text-white hover:bg-red-500'
                    }`}
                aria-label={videoState ? 'Video Off' : 'Video On'}
            >
                {videoState ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            {/* Leave call button */}
            <Button
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition"
                aria-label="Leave call"
                onClick = {() => navigate('/')}
            >
                <PhoneOff className="w-5 h-5 text-white" />
            </Button>
        </div>
    </div>
  )
}
