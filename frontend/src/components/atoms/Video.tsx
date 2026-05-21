import {useRef, useEffect} from 'react';
import Peer from 'simple-peer';

interface VideoProps{
    peer: Peer.Instance;
}

export default function Video({peer}: VideoProps){
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(()=>{
        peer.on('stream', (stream)=>{
            if(videoRef.current){
                videoRef.current.srcObject = stream;
            }
        });
    }, [peer]);

    return(
        <video playsInline autoPlay ref = {videoRef} muted className='w-3xl'/>
    );
}