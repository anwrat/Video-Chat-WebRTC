import {useRef, useEffect} from 'react';
import Peer from 'simple-peer';

interface VideoProps{
    peer: Peer.Instance;
}

export default function Video({peer}: VideoProps){
    const videoRef = useRef<HTMLVideoElement>(null);
    console.log("From video component: ", peer);
    useEffect(()=>{
        const handleStream = (stream: MediaStream) =>{
            if(videoRef.current){
                videoRef.current.srcObject = stream;
            }
        }
        peer.on('stream', handleStream);
        return () =>{
            peer.off('stream', handleStream);
        }
    }, [peer]);

    return(
        <video playsInline autoPlay ref = {videoRef} className='w-3xl'/>
    );
}