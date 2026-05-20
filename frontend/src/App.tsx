import {io} from 'socket.io-client';
import {useRef, useEffect} from 'react';

const baseURL = import.meta.env.VITE_BACKEND_URL;
const socket = io(baseURL);

//Only one room for now
const ROOM_ID = "room-1";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(()=>{
    const start = async() =>{
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if(videoRef.current){
        videoRef.current.srcObject = stream;
      }
    }
    start()
  },[]);

  return (
    <>
      <video ref = {videoRef} autoPlay/>
    </>
  )
}

export default App
